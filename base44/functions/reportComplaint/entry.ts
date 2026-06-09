import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { job_id, provider_id, provider_name, reason, description } = await req.json();
    if (!job_id || !provider_id || !reason) {
      return Response.json({ error: 'job_id, provider_id, and reason are required' }, { status: 400 });
    }

    const jobs = await base44.asServiceRole.entities.Job.filter({ id: job_id });
    const job = jobs[0];
    if (!job || job.customer_email !== user.email) {
      return Response.json({ error: 'Job not found or access denied' }, { status: 403 });
    }

    const existing = await base44.asServiceRole.entities.Complaint.filter({ job_id, customer_email: user.email });
    if (existing && existing.length > 0) {
      return Response.json({ error: 'You have already submitted a complaint for this job.' }, { status: 409 });
    }

    await base44.asServiceRole.entities.Complaint.create({
      job_id,
      customer_email: user.email,
      customer_name: user.full_name || user.email,
      provider_id,
      provider_name: provider_name || '',
      service_name: job.service_name || '',
      reason,
      description: description || '',
      status: 'open',
    });

    const profiles = await base44.asServiceRole.entities.ProviderProfile.filter({ id: provider_id });
    const profile = profiles[0];
    if (profile) {
      const newCount = (profile.complaint_count || 0) + 1;
      const updates = { complaint_count: newCount };
      if (newCount >= 3 && !profile.warning_issued) {
        updates.warning_issued = true;
        updates.warning_count = (profile.warning_count || 0) + 1;
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: 'kenyahartsell@gmail.com',
            subject: '⚠️ Provider Warning Triggered — ' + (provider_name || provider_id),
            body: 'Provider ' + (provider_name || provider_id) + ' has reached ' + newCount + ' complaints and has been automatically flagged.\n\nLatest complaint from: ' + user.email + '\nReason: ' + reason + '\nDescription: ' + (description || 'N/A') + '\n\nLog in to the admin portal to review.',
          });
        } catch (emailErr) {
          console.warn('[reportComplaint] Admin alert email failed:', emailErr.message);
        }
      }
      await base44.asServiceRole.entities.ProviderProfile.update(profile.id, updates);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('[reportComplaint] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
