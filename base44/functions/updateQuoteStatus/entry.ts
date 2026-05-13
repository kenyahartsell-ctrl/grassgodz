import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { quote_id, status } = await req.json();
    if (!quote_id || !status) return Response.json({ error: 'quote_id and status required' }, { status: 400 });

    // Fetch the quote
    const quotes = await base44.asServiceRole.entities.Quote.filter({ id: quote_id });
    const quote = quotes[0];
    if (!quote) return Response.json({ error: 'Quote not found' }, { status: 404 });

    // Verify this customer owns the job — match by customer_email OR customer_id
    const jobs = await base44.asServiceRole.entities.Job.filter({ id: quote.job_id });
    const job = jobs[0];
    if (!job) return Response.json({ error: 'Job not found' }, { status: 404 });

    const ownsJob =
      (job.customer_email && job.customer_email === user.email) ||
      (job.customer_id && (job.customer_id === user.id || job.customer_id === user.email));

    if (!ownsJob) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await base44.asServiceRole.entities.Quote.update(quote_id, { status });
    return Response.json({ quote: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});