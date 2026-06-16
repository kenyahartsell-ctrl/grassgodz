import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
    try {
          const base44 = createClientFromRequest(req);
          const user = await base44.auth.me();
          if (!user) return Response.json({ jobs: [] }, { status: 401 });

      // Only active providers can see available jobs
      const profiles = await base44.asServiceRole.entities.ProviderProfile.filter({ user_email: user.email });
          const profile = profiles?.[0];
          if (!profile || profile.status !== 'active') {
                  return Response.json({ jobs: [] });
          }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString().split('T')[0];
      const cutoff = new Date(today);
      cutoff.setDate(cutoff.getDate() + 7);
      const cutoffISO = cutoff.toISOString().split('T')[0];

      // Fetch all unassigned requested jobs (available to claim)
      const requestedJobs = await base44.asServiceRole.entities.Job.filter({ status: 'requested' }, '-created_date', 500);
      const unassigned = requestedJobs.filter(j => !j.provider_id);

      const availableJobs = unassigned.filter(j => {
        if (j.scheduled_date && j.scheduled_date > cutoffISO) return false;
        if (Array.isArray(j.declined_by) && j.declined_by.includes(profile.id)) return false;
        return true;
      });

      // Count completed card-paying jobs for this provider
      const completedCardJobs = await base44.asServiceRole.entities.Job.filter({
              provider_id: profile.id,
              status: 'completed',
      });
      const cardCutCount = completedCardJobs.filter(j => !j.is_cash_job && j.payment_method !== 'cash').length;

      // Hide cash jobs until provider has at least 5 completed card-paying cuts
      const claimableJobs = cardCutCount >= 5
              ? availableJobs
              : availableJobs.filter(j => !j.is_cash_job && j.payment_method !== 'cash');

      // Also fetch all active (non-completed, non-cancelled) jobs scheduled TODAY for the map view
      // These are already assigned jobs shown so providers see the full day's workload on the map
      const allTodayJobs = await base44.asServiceRole.entities.Job.filter({}, '-created_date', 500);
      const todayMapJobs = allTodayJobs.filter(j => {
        if (j.scheduled_date !== todayISO) return false;
        if (['completed', 'cancelled'].includes(j.status)) return false;
        // Don't double-count jobs already in claimableJobs
        if (claimableJobs.find(cj => cj.id === j.id)) return false;
        return true;
      });

      return Response.json({ jobs: claimableJobs, map_jobs: todayMapJobs });
    } catch (error) {
          return Response.json({ error: error.message }, { status: 500 });
    }
});