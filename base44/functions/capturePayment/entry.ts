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

    // Check provider ownership via email OR id (since updateJobToQuoted may set either)
    const isOwner = job.provider_id === providerProfile.id || job.provider_email === user.email;
    if (!isOwner) return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Allow completing from in_progress, accepted, or scheduled statuses
    const completableStatuses = ['in_progress', 'accepted', 'scheduled'];
    if (!completableStatuses.includes(job.status)) {
      return Response.json({ error: `Job cannot be completed from status: ${job.status}` }, { status: 400 });
    }

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
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: job.customer_email,
        subject: `Your ${job.service_name || 'Lawn Service'} is Complete — Payment Required`,
        body: `
<p>Hi ${job.customer_name || 'there'},</p>

<p>Great news! Your lawn service has been completed by ${job.provider_name || 'your provider'}.</p>

<p>Your quoted price: <strong>$${(price || 0).toFixed(2)}</strong></p>

<p>Please log in to your Grassgodz account to review and process payment.</p>

<p><a href="https://grassgodz.com/customer" style="background:#2d6a2d;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">View My Jobs</a></p>

<p>Thank you for choosing Grassgodz!</p>

<p>The Grassgodz Team</p>
        `.trim(),
      });
    } catch (emailErr) {
      console.warn('Email notification failed:', emailErr.message);
    }

    return Response.json({ success: true, payout: providerPayout });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});