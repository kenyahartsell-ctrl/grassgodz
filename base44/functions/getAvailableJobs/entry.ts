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

      // Fetch all unassigned requested jobs
      const jobs = await base44.asServiceRole.entities.Job.filter({ status: 'requested' });
          const unassigned = jobs.filter(j => !j.provider_id);

      // Only hide far-future pre-created recurring instances (more than 7 days out).
      // Past-due or current jobs remain visible until completed/assigned.
      const today = new Date();
          today.setHours(0, 0, 0, 0);
          const cutoff = new Date(today);
          cutoff.setDate(cutoff.getDate() + 7);
          const cutoffISO = cutoff.toISOString().split('T')[0];

      const visible = unassigned.filter(j => {
        if (j.scheduled_date && j.scheduled_date > cutoffISO) return false;
        // Hide jobs this provider has already declined
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
      const filtered = cardCutCount >= 5
              ? visible
              : visible.filter(j => !j.is_cash_job && j.payment_method !== 'cash');

      return Response.json({ jobs: filtered });
    } catch (error) {
          return Response.json({ error: error.message }, { status: 500 });
    }
});