import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@16.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

const REQUIRED_PHOTO_KEYS = [
  'front_before', 'front_after',
  'back_before', 'back_after',
  'left_before', 'left_after',
  'right_before', 'right_after',
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { job_id, skip_photos } = body;
    if (!job_id) return Response.json({ error: 'job_id required' }, { status: 400 });

    // Provider must own this job
    const providerProfiles = await base44.entities.ProviderProfile.filter({ user_email: user.email });
    const providerProfile = providerProfiles[0];
    if (!providerProfile) return Response.json({ error: 'Provider profile not found' }, { status: 404 });

    const jobs = await base44.asServiceRole.entities.Job.filter({ id: job_id });
    const job = jobs[0];
    if (!job) return Response.json({ error: 'Job not found' }, { status: 404 });
    if (job.provider_id !== providerProfile.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
    if (job.status !== 'in_progress') return Response.json({ error: 'Job must be in_progress to capture payment' }, { status: 400 });

    // Verify all 8 photos present (skip_photos=true bypasses for testing)
    if (!skip_photos) {
      const photos = job.completion_photos || {};
      const missingPhotos = REQUIRED_PHOTO_KEYS.filter(k => !photos[k]);
      if (missingPhotos.length > 0) {
        return Response.json({ error: `Missing photos: ${missingPhotos.join(', ')}` }, { status: 400 });
      }
    }

    // Find payment record
    const payments = await base44.asServiceRole.entities.Payment.filter({ job_id });
    const payment = payments[0];
    if (!payment?.stripe_payment_intent_id) {
      return Response.json({ error: 'No authorized payment found for this job' }, { status: 404 });
    }

    // Capture the PaymentIntent
    await stripe.paymentIntents.capture(payment.stripe_payment_intent_id);

    const now = new Date().toISOString();
    const providerPayout = job.quoted_price * 0.75;
    const platformFee = job.quoted_price * 0.25;

    await Promise.all([
      base44.asServiceRole.entities.Payment.update(payment.id, { status: 'captured' }),
      base44.asServiceRole.entities.Job.update(job.id, {
        status: 'completed',
        completed_at: now,
        final_price: job.quoted_price,
        provider_payout: providerPayout,
        platform_fee: platformFee,
      }),
    ]);

    return Response.json({ success: true, payout: providerPayout });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});