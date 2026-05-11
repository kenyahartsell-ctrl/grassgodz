import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ jobs: [] }, { status: 401 });

    // Use service role to reliably fetch all requested, unassigned jobs
    const jobs = await base44.asServiceRole.entities.Job.filter({ status: 'requested' });
    const unassigned = jobs.filter(j => !j.provider_id);

    return Response.json({ jobs: unassigned });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});