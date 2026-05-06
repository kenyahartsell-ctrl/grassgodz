import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const MIN_PHOTO_COUNT = 4;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { job_id, skip_photos, final_price } = body;
    if (!job_id) return Response.json({ error: 'job_id required' }, { status: 400 });

    // Provider must own this job
    const providerProfiles = await base44.entities.ProviderProfile.filter({ user_email: user.email });
    const providerProfile = providerProfiles[0];
    if (!providerProfile) return Response.json({ error: 'Provider profile not found' }, { status: 404 });

    const jobs = await base44.asServiceRole.entities.Job.filter({ id: job_id });
    const job = jobs[0];
    if (!job) return Response.json({ error: 'Job not found' }, { status: 404 });
    if (job.provider_id !== providerProfile.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
    if (job.status !== 'in_progress') return Response.json({ error: 'Job must be in_progress to complete' }, { status: 400 });

    // Verify minimum 4 photos present (skip_photos=true bypasses for testing)
    if (!skip_photos) {
      const photos = job.completion_photos || {};
      const uploadedCount = Object.values(photos).filter(Boolean).length;
      if (uploadedCount < MIN_PHOTO_COUNT) {
        return Response.json({ error: `At least ${MIN_PHOTO_COUNT} photos required. Only ${uploadedCount} uploaded.` }, { status: 400 });
      }
    }

    const price = final_price || job.quoted_price;
    const now = new Date().toISOString();
    const providerPayout = price ? price * 0.75 : 0;
    const platformFee = price ? price * 0.25 : 0;

    // Mark job as completed
    await base44.asServiceRole.entities.Job.update(job.id, {
      status: 'completed',
      completed_at: now,
      final_price: price || 0,
      provider_payout: providerPayout,
      platform_fee: platformFee,
    });

    // Trigger payment link flow: creates Payment record + sends customer email
    await base44.asServiceRole.functions.invoke('jobCompletedPaymentFlow', { job_id });

    return Response.json({ success: true, payout: providerPayout });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});