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

      // Only show jobs scheduled within the next 7 days (or with no scheduled date).
      // This prevents future pre-created recurring instances from flooding the list.
      const today = new Date();
          today.setHours(0, 0, 0, 0);
          const cutoff = new Date(today);
          cutoff.setDate(cutoff.getDate() + 7);
          const todayISO = today.toISOString().split('T')[0];
          const cutoffISO = cutoff.toISOString().split('T')[0];

      const visible = unassigned.filter(j => {
              if (!j.scheduled_date) return true;
              if (j.scheduled_date < todayISO) return false;
              return j.scheduled_date <= cutoffISO;
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