import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Runs every 5 minutes via scheduled automation.
// 1. Flags jobs where provider accepted > 2 hours ago and job is still "accepted"/"scheduled" with no action.
// 2. For jobs with a scheduled_time, flags if the 30-minute buffer has passed without going in_progress.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date();

    // Fetch all accepted/scheduled jobs that haven't been flagged yet
    const jobs = await base44.asServiceRole.entities.Job.filter({ status: 'accepted' });
    const scheduledJobs = await base44.asServiceRole.entities.Job.filter({ status: 'scheduled' });
    const allActiveJobs = [...jobs, ...scheduledJobs].filter(j => !j.acceptance_timer_flagged);

    const flagged = [];

    for (const job of allActiveJobs) {
      let shouldFlag = false;
      let reason = '';

      const hasScheduledTime = job.scheduled_date && job.scheduled_time;

      if (hasScheduledTime) {
        // Scheduled job: flag if scheduled time + 30 min has passed
        const [hours, minutes] = job.scheduled_time.split(':').map(Number);
        const scheduledStart = new Date(job.scheduled_date);
        scheduledStart.setHours(hours, minutes, 0, 0);
        const cutoff = new Date(scheduledStart.getTime() + 30 * 60 * 1000);
        if (now > cutoff) {
          shouldFlag = true;
          reason = 'Scheduled start time + 30-minute buffer has passed with no action.';
        }
      } else if (job.accepted_at) {
        // Immediate job: flag if accepted > 2 hours ago
        const acceptedAt = new Date(job.accepted_at);
        const cutoff = new Date(acceptedAt.getTime() + 2 * 60 * 60 * 1000);
        if (now > cutoff) {
          shouldFlag = true;
          reason = 'Provider accepted job 2+ hours ago with no action (not started, not cancelled).';
        }
      }

      if (shouldFlag) {
        await base44.asServiceRole.entities.Job.update(job.id, {
          acceptance_timer_flagged: true,
          acceptance_timer_flagged_at: now.toISOString(),
          provider_notes: (job.provider_notes ? job.provider_notes + '\n' : '') + `[AUTO-FLAG] ${reason}`,
        });

        // Notify customer of delay
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: job.customer_email,
            subject: 'Update on Your Grassgodz Job',
            body: `Hi ${job.customer_name || 'there'},\n\nWe wanted to let you know that your provider has not yet started your job (${job.service_name}) scheduled for ${job.scheduled_date}. Our team has been notified and will follow up shortly to ensure everything is on track.\n\nThank you for your patience.\n\n— The Grassgodz Team`,
          });
        } catch (_emailErr) {
          // Don't fail the whole run if email fails
        }

        flagged.push(job.id);
      }
    }

    return Response.json({ flagged_count: flagged.length, flagged_job_ids: flagged });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});