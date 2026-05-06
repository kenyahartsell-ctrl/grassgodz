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
        // Fired when a customer pays via a Payment Link
        const session = event.data.object;
        const jobId = session.metadata?.job_id;
        if (jobId) {
          const payments = await base44.asServiceRole.entities.Payment.filter({ job_id: jobId });
          const payment = payments[0];
          if (payment) {
            await base44.asServiceRole.entities.Payment.update(payment.id, {
              status: 'captured',
              stripe_payment_intent_id: session.payment_intent || '',
            });
          }

          // Fetch job to get provider info
          const jobs = await base44.asServiceRole.entities.Job.filter({ id: jobId });
          const job = jobs[0];
          if (job?.provider_email) {
            const amount = payment?.amount || job.final_price || job.quoted_price || 0;
            const payout = amount * 0.75;
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: job.provider_email,
              subject: `Payment received — your payout of $${payout.toFixed(2)} is being processed`,
              body: `
<p>Hi ${job.provider_name || 'there'},</p>

<p>Great news! The customer has completed payment for your <strong>${job.service_name}</strong> job.</p>

<p><strong>Job Summary:</strong></p>
<ul>
  <li>Service: ${job.service_name}</li>
  <li>Customer: ${job.customer_name}</li>
  <li>Total Charged: $${amount.toFixed(2)}</li>
  <li>Your Payout: $${payout.toFixed(2)}</li>
</ul>

<p>Your payout is being processed and will be deposited to your bank account on your next weekly pay cycle.</p>

<p>Thank you for being a Grassgodz pro!</p>
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