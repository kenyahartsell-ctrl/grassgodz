import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ jobs: [] }, { status: 401 });

    // Check provider profile status — only active providers can see jobs
    const profiles = await base44.asServiceRole.entities.ProviderProfile.filter({ user_email: user.email });
    const profile = profiles?.[0];
    if (!profile || profile.status !== 'active') {
      return Response.json({ jobs: [] });
    }

    // Use service role to reliably fetch all requested, unassigned jobs (including cash/manual jobs)
    const jobs = await base44.asServiceRole.entities.Job.filter({ status: 'requested' });
    const unassigned = jobs.filter(j => !j.provider_id);

    return Response.json({ jobs: unassigned });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});