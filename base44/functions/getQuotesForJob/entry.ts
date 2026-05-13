import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { job_id } = await req.json();
    if (!job_id) return Response.json({ error: 'job_id required' }, { status: 400 });

    // Verify the customer owns this job — match by customer_email OR customer_id
    const jobs = await base44.asServiceRole.entities.Job.filter({ id: job_id });
    const job = jobs[0];
    if (!job) return Response.json({ error: 'Job not found' }, { status: 404 });

    const ownsJob =
      (job.customer_email && job.customer_email === user.email) ||
      (job.customer_id && (job.customer_id === user.id || job.customer_id === user.email));

    if (!ownsJob) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const quotes = await base44.asServiceRole.entities.Quote.filter({ job_id });
    return Response.json({ quotes });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});