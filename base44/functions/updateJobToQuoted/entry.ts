import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { job_id, quoted_price, provider_email, provider_id, provider_name } = await req.json();
    if (!job_id) return Response.json({ error: 'job_id required' }, { status: 400 });

    // Only update if currently 'requested' — don't override accepted/scheduled/etc.
    const jobs = await base44.asServiceRole.entities.Job.filter({ id: job_id });
    const job = jobs[0];
    if (!job) return Response.json({ error: 'Job not found' }, { status: 404 });

    if (job.status === 'requested') {
      const updates = { status: 'quoted' };

      if (quoted_price !== undefined && quoted_price !== null) {
        updates.quoted_price = quoted_price;
      }

      if (provider_email) updates.provider_email = provider_email;
      if (provider_id)    updates.provider_id    = provider_id;
      if (provider_name)  updates.provider_name  = provider_name;

      await base44.asServiceRole.entities.Job.update(job_id, updates);
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});