import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { job_id, quoted_price } = await req.json();
    if (!job_id || quoted_price == null) {
      return Response.json({ error: 'job_id and quoted_price are required' }, { status: 400 });
    }

    const updated = await base44.asServiceRole.entities.Job.update(job_id, { quoted_price: Number(quoted_price) });
    return Response.json({ job: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});