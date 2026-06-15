import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@16.0.0';

const MIN_PHOTO_COUNT = 4;

Deno.serve(async (req) => {
  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { job_id, skip_photos, final_price } = body;
    if (!job_id) return Response.json({ error: 'job_id required' }, { status: 400 });

    // Validate the caller is the provider on this job
    const providerProfiles = await base44.entities.ProviderProfile.filter({ user_email: user.email });
    const providerProfile = providerProfiles[0];

    const jobs = await base44.asServiceRole.entities.Job.filter({ id: job_id });
    const job = jobs[0];
    if (!job) return Response.json({ error: 'Job not found' }, { status: 404 });

    const isProvider =
      (job.provider_email && job.provider_email === user.email) ||
      (providerProfile && job.provider_id === providerProfile.id);

    if (!isProvider) return Response.json({ error: 'Forbidden — not the assigned provider' }, { status: 403 });

    // Photo check — photos are stored as fields on the Job record (completion_photos object)
    if (!skip_photos) {
      const photoCount = Object.keys(job.completion_photos || {}).length;
      if (photoCount < MIN_PHOTO_COUNT) {
        return Response.json({
          error: `At least ${MIN_PHOTO_COUNT} completion photos are required`,
          photo_count: photoCount,
          required: MIN_PHOTO_COUNT,
        }, { status: 400 });
      }
    }

    const chargedPrice = final_price || job.quoted_price || job.final_price;
    const providerPayout = chargedPrice * 0.90;
    const platformFee = chargedPrice * 0.10;

    // --- Capture the Stripe authorization hold if one exists ---
    // Fix: Job schema uses final_payment_intent_id (or deposit_payment_intent_id for deposits).
    // Look up the payment intent ID from the Payment record, which is the canonical source.
    let stripeResult = null;
    const existingPayments = await base44.asServiceRole.entities.Payment.filter({ job_id });
    const existingPayment = existingPayments[0];
    const paymentIntentId = existingPayment?.stripe_payment_intent_id ||
      job.final_payment_intent_id ||
      job.deposit_payment_intent_id;

    if (paymentIntentId) {
      try {
        const amountToCapture = Math.round(chargedPrice * 100);
        stripeResult = await stripe.paymentIntents.capture(paymentIntentId, {
          amount_to_capture: amountToCapture,
        });

        if (existingPayment) {
          await base44.asServiceRole.entities.Payment.update(existingPayment.id, {
            status: 'captured',
            amount: chargedPrice,
            payout_amount: providerPayout,
            platform_fee: platformFee,
          });
        }
      } catch (stripeErr) {
        console.error('Stripe capture error:', stripeErr.message);
        // Don't block completion if capture fails — admin will need to manually capture
      }
    }

    // Mark job completed
    await base44.asServiceRole.entities.Job.update(job_id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      final_price: chargedPrice,
      provider_payout: providerPayout,
      platform_fee: platformFee,
    });

    // Send completion email to customer
    try {
      if (job.customer_email) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: job.customer_email,
          subject: 'Your lawn service is complete! 🌿',
          body: `<p>Hi ${job.customer_name || 'there'},</p><p>Your Grassgodz service has been completed. Final charge: $${chargedPrice.toFixed(2)}. Thank you for choosing Grassgodz!</p>`,
        });
      }
    } catch (emailErr) {
      console.error('Email send error:', emailErr.message);
    }

    return Response.json({
      success: true,
      payout: providerPayout,
      final_price: chargedPrice,
      stripe_captured: !!stripeResult,
    });
  } catch (error) {
    console.error('capturePayment error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});