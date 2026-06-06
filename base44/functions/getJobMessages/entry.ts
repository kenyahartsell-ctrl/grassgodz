import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { job_id } = await req.json();
    if (!job_id) return Response.json({ error: 'job_id required' }, { status: 400 });

    // Verify requester is customer or provider on this job
    const jobs = await base44.asServiceRole.entities.Job.filter({ id: job_id });
    const job = jobs[0];
    if (!job) return Response.json({ error: 'Job not found' }, { status: 404 });

    if (job.customer_email !== user.email && job.provider_email !== user.email) {
      return Response.json({ error: 'Not authorized to view messages for this job' }, { status: 403 });
    }

    // Fetch ALL messages for this job bypassing RLS
    const messages = await base44.asServiceRole.entities.Message.filter({ job_id });
    const sorted = messages.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

    return Response.json({ messages: sorted });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
