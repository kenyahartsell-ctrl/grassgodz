import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Price floors for inlining (no local imports allowed in functions)
const PRICE_FLOORS = {
  'lawn mowing':    { small: 45,  medium: 65,  large: 95,  xl: 140, commercial_small: 220, commercial_large: 400 },
  'leaf removal':   { small: 150, medium: 250, large: 375, xl: 500, commercial_small: 700, commercial_large: 1200 },
  'core aeration':  { small: 85,  medium: 120, large: 165, xl: 220, commercial_small: 350, commercial_large: 600 },
  'hedge trimming': { small: 75,  medium: 120, large: 175, xl: 250, commercial_small: 400, commercial_large: 700 },
  'fertilization':  { small: 75,  medium: 100, large: 150, xl: 200, commercial_small: 325, commercial_large: 550 },
  'snow removal':   { small: 60,  medium: 90,  large: 130, xl: 180, commercial_small: 275, commercial_large: 500 },
};

function getMinimumPrice(serviceName, yardSize) {
  if (!serviceName || !yardSize) return null;
  const key = Object.keys(PRICE_FLOORS).find(k => serviceName.toLowerCase().includes(k));
  if (!key) return null;
  return PRICE_FLOORS[key][yardSize] ?? null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // This is a scheduled/admin function — verify admin or service context
    const now = new Date();
    const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

    // Get all pending quotes older than 24 hours
    const allQuotes = await base44.asServiceRole.entities.Quote.filter({ status: 'pending' });
    const staleQuotes = allQuotes.filter(q => {
      const created = new Date(q.created_date);
      return created < cutoff;
    });

    if (staleQuotes.length === 0) {
      return Response.json({ message: 'No stale quotes found', nudged: 0 });
    }

    // Get unique job IDs from stale quotes
    const jobIds = [...new Set(staleQuotes.map(q => q.job_id))];

    let nudgedCount = 0;
    const errors = [];

    for (const jobId of jobIds) {
      try {
        const jobs = await base44.asServiceRole.entities.Job.filter({ id: jobId });
        const job = jobs[0];
        if (!job) continue;

        // Only nudge jobs that are in 'quoted' status (have pending quotes) and haven't been nudged yet
        if (!['quoted', 'requested'].includes(job.status)) continue;
        if (job.quote_nudge_sent_at) {
          // Already nudged — skip
          continue;
        }

        const customerEmail = job.customer_email;
        if (!customerEmail) continue;

        const minPrice = getMinimumPrice(job.service_name, job.yard_size);
        const depositNote = minPrice && minPrice > 200
          ? ' A 50% deposit will be required once you accept.'
          : '';

        // Send email nudge (only works for users registered in the app)
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: customerEmail,
          subject: 'You have a pending quote on your Grassgodz job',
          body: `Hi${job.customer_name ? ' ' + job.customer_name : ''},\n\nYou have a pending quote on your Grassgodz job for ${job.service_name || 'your service'} at ${job.address || 'your address'}.\n\nLog in to review and accept it before it expires: https://grassgodz.com${depositNote}\n\nThe Grassgodz Team`,
        });

        // If customer has SMS opted in, look up their profile
        try {
          const profiles = await base44.asServiceRole.entities.CustomerProfile.filter({ user_email: customerEmail });
          const profile = profiles[0];
          if (profile?.sms_opt_in && profile?.phone) {
            // SMS via LLM-powered send — log only (actual SMS would require Twilio or similar)
            console.log(`[nudgePendingQuotes] SMS opt-in detected for ${customerEmail} — would send SMS to ${profile.phone}`);
          }
        } catch (smsErr) {
          console.warn('[nudgePendingQuotes] Could not check SMS opt-in:', smsErr.message);
        }

        // Mark job as nudged so we don't send again (even if email failed for unregistered users)
        await base44.asServiceRole.entities.Job.update(jobId, {
          quote_nudge_sent_at: now.toISOString(),
        });

        nudgedCount++;
        console.log(`[nudgePendingQuotes] Nudged customer ${customerEmail} for job ${jobId}`);
      } catch (jobErr) {
        // Log but don't fail the whole run — still mark nudged to avoid repeat attempts
        errors.push({ jobId, error: jobErr.message });
        console.warn(`[nudgePendingQuotes] Could not send nudge for job ${jobId}: ${jobErr.message}`);
        try {
          await base44.asServiceRole.entities.Job.update(jobId, {
            quote_nudge_sent_at: now.toISOString(),
          });
        } catch (_) { /* ignore update error */ }
      }
    }

    return Response.json({
      message: `Nudge complete. Sent ${nudgedCount} notification(s).`,
      nudged: nudgedCount,
      errors,
    });
  } catch (error) {
    console.error('[nudgePendingQuotes] Fatal error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});