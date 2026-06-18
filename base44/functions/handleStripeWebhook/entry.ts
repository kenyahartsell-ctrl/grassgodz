import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@16.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

Deno.serve(async (req) => {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const base44 = createClientFromRequest(req);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        // Fired when a customer pays via a Payment Link or Checkout Session
        const session = event.data.object;
        const jobId = session.metadata?.job_id;
        const quoteId = session.metadata?.quote_id;
        const invoiceId = session.metadata?.invoice_id;
        
        if (invoiceId) {
          await base44.asServiceRole.entities.Invoice.update(invoiceId, { status: 'paid' });
        }

        if (jobId) {
          // Fetch job
          const jobs = await base44.asServiceRole.entities.Job.filter({ id: jobId });
          const job = jobs[0];
          if (!job) break;

          const amount = job.quoted_price || 0;
          const platformFee = amount * 0.10;
          const payout = amount * 0.90;

          // Check if a payment record already exists (e.g. charged card on file path)
          const existingPayments = await base44.asServiceRole.entities.Payment.filter({ job_id: jobId });
          if (existingPayments.length > 0) {
            await base44.asServiceRole.entities.Payment.update(existingPayments[0].id, {
              status: 'captured',
              stripe_payment_intent_id: session.payment_intent || '',
            });
          } else {
            // Create payment record from checkout session
            await base44.asServiceRole.entities.Payment.create({
              job_id: jobId,
              stripe_payment_intent_id: session.payment_intent || '',
              amount,
              platform_fee: platformFee,
              payout_amount: payout,
              status: 'captured',
            });
          }

          // Move job to accepted/confirmed
          await base44.asServiceRole.entities.Job.update(jobId, { status: 'accepted' });

          // Mark quote as accepted if quoteId present
          if (quoteId) {
            await base44.asServiceRole.entities.Quote.update(quoteId, { status: 'accepted' });
          }

          // Notify provider
          if (job.provider_email) {
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: job.provider_email,
              subject: `Job confirmed — payment received for ${job.service_name}`,
              body: `
<p>Hi ${job.provider_name || 'there'},</p>
<p>Great news! The customer has completed payment and your <strong>${job.service_name}</strong> job is now confirmed.</p>
<ul>
  <li>Service: ${job.service_name}</li>
  <li>Customer: ${job.customer_name}</li>
  <li>Address: ${job.address}</li>
  <li>Total Charged: $${amount.toFixed(2)}</li>
  <li>Your Payout: $${payout.toFixed(2)}</li>
</ul>
<p>Your payout will be deposited on your next weekly pay cycle.</p>
<p>The Grassgodz Team</p>
              `.trim(),
            });
          }

          // Notify customer
          if (job.customer_email) {
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: job.customer_email,
              subject: `Your ${job.service_name} job is confirmed!`,
              body: `
<p>Hi ${job.customer_name || 'there'},</p>
<p>Your payment was received and your job is now <strong>confirmed</strong>.</p>
<ul>
  <li>Service: ${job.service_name}</li>
  <li>Provider: ${job.provider_name}</li>
  <li>Address: ${job.address}</li>
  <li>Amount Paid: $${amount.toFixed(2)}</li>
</ul>
<p>We'll keep you updated as your job progresses.</p>
<p>The Grassgodz Team</p>
              `.trim(),
            });
          }
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const pi = event.data.object;
        const jobId = pi.metadata?.job_id;
        if (jobId) {
          const payments = await base44.asServiceRole.entities.Payment.filter({ job_id: jobId });
          if (payments[0]) {
            await base44.asServiceRole.entities.Payment.update(payments[0].id, { status: 'captured' });
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object;
        const jobId = pi.metadata?.job_id;
        if (jobId) {
          const payments = await base44.asServiceRole.entities.Payment.filter({ job_id: jobId });
          if (payments[0]) {
            await base44.asServiceRole.entities.Payment.update(payments[0].id, { status: 'failed' });
          }
          await base44.asServiceRole.entities.Job.update(jobId, { status: 'requested' });
        }
        break;
      }

      case 'payment_intent.canceled': {
        const pi = event.data.object;
        const jobId = pi.metadata?.job_id;
        if (jobId) {
          const payments = await base44.asServiceRole.entities.Payment.filter({ job_id: jobId });
          if (payments[0]) {
            await base44.asServiceRole.entities.Payment.update(payments[0].id, { status: 'failed' });
          }
        }
        break;
      }

      case 'account.updated': {
        const account = event.data.object;
        const providerGodId = account.metadata?.grassgodz_provider_id;
        if (providerGodId) {
          const complete = account.charges_enabled && account.payouts_enabled && account.details_submitted;
          if (complete) {
            await base44.asServiceRole.entities.ProviderProfile.update(providerGodId, {
              onboarding_complete: true,
            });
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return Response.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});