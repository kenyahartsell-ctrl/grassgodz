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