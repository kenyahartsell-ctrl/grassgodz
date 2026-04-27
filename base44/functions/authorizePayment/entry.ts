import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@16.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { job_id, payment_method_id } = await req.json();
    if (!job_id || !payment_method_id) {
      return Response.json({ error: 'job_id and payment_method_id required' }, { status: 400 });
    }

    // Load job
    const jobs = await base44.asServiceRole.entities.Job.filter({ id: job_id });
    const job = jobs[0];
    if (!job) return Response.json({ error: 'Job not found' }, { status: 404 });
    if (job.customer_email !== user.email) return Response.json({ error: 'Forbidden' }, { status: 403 });
    if (!job.quoted_price) return Response.json({ error: 'Job has no quoted price' }, { status: 400 });

    // Load customer profile
    const customerProfiles = await base44.entities.CustomerProfile.filter({ user_email: user.email });
    const customerProfile = customerProfiles[0];
    if (!customerProfile?.stripe_customer_id) {
      return Response.json({ error: 'No Stripe customer on file. Please add a payment method first.' }, { status: 400 });
    }

    // Load provider profile
    const providerProfiles = await base44.asServiceRole.entities.ProviderProfile.filter({ id: job.provider_id });
    const providerProfile = providerProfiles[0];
    if (!providerProfile?.stripe_connect_account_id) {
      return Response.json({ error: 'Provider has not completed Stripe onboarding yet.' }, { status: 400 });
    }

    const amountCents = Math.round(job.quoted_price * 100);
    const applicationFeeCents = Math.round(amountCents * 0.25);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      capture_method: 'manual',
      confirm: true,
      customer: customerProfile.stripe_customer_id,
      payment_method: payment_method_id,
      application_fee_amount: applicationFeeCents,
      transfer_data: { destination: providerProfile.stripe_connect_account_id },
      metadata: {
        job_id: job.id,
        customer_id: customerProfile.id,
        provider_id: providerProfile.id,
      },
    });

    // Save Payment record
    await base44.asServiceRole.entities.Payment.create({
      job_id: job.id,
      customer_id: customerProfile.id,
      provider_id: providerProfile.id,
      stripe_payment_intent_id: paymentIntent.id,
      amount: job.quoted_price,
      platform_fee: job.quoted_price * 0.25,
      payout_amount: job.quoted_price * 0.75,
      status: 'authorized',
    });

    // Update job status
    await base44.asServiceRole.entities.Job.update(job.id, { status: 'accepted' });

    return Response.json({ success: true, payment_intent_id: paymentIntent.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});