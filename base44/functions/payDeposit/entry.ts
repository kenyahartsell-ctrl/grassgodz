import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@16.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { job_id, payment_method_id } = await req.json();
    if (!job_id || !payment_method_id) {
      return Response.json({ error: 'job_id and payment_method_id required' }, { status: 400 });
    }

    const jobs = await base44.asServiceRole.entities.Job.filter({ id: job_id });
    const job = jobs[0];
    if (!job) return Response.json({ error: 'Job not found' }, { status: 404 });
    if (job.customer_email !== user.email) return Response.json({ error: 'Forbidden' }, { status: 403 });
    if (!job.deposit_required) return Response.json({ error: 'No deposit required for this job' }, { status: 400 });
    if (job.deposit_paid) return Response.json({ error: 'Deposit already paid' }, { status: 400 });

    const customerProfiles = await base44.entities.CustomerProfile.filter({ user_email: user.email });
    const customerProfile = customerProfiles[0];
    if (!customerProfile?.stripe_customer_id) {
      return Response.json({ error: 'No Stripe customer on file. Please add a payment method first.' }, { status: 400 });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

    const depositCents = Math.round(job.deposit_amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: depositCents,
      currency: 'usd',
      capture_method: 'automatic',
      confirm: true,
      off_session: true,
      customer: customerProfile.stripe_customer_id,
      payment_method: payment_method_id,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
      metadata: {
        job_id: job.id,
        customer_id: customerProfile.id,
        type: 'deposit',
      },
    });

    // Mark deposit as paid and open job to providers
    const remaining = job.quoted_price - job.deposit_amount;
    await base44.asServiceRole.entities.Job.update(job.id, {
      deposit_paid: true,
      deposit_payment_intent_id: paymentIntent.id,
      remaining_balance: remaining,
      status: 'requested', // now visible to providers
    });

    return Response.json({ success: true, payment_intent_id: paymentIntent.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});