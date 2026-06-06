import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@16.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { quote_id } = await req.json();
    if (!quote_id) return Response.json({ error: 'quote_id required' }, { status: 400 });

    const quotes = await base44.asServiceRole.entities.Quote.filter({ id: quote_id });
    const quote = quotes[0];
    if (!quote) return Response.json({ error: 'Quote not found' }, { status: 404 });
    if (quote.status !== 'pending') {
      return Response.json({ error: 'Quote is no longer pending' }, { status: 400 });
    }

    const jobs = await base44.asServiceRole.entities.Job.filter({ id: quote.job_id });
    const job = jobs[0];
    if (!job) return Response.json({ error: 'Job not found' }, { status: 404 });

    const ownsJob =
      (job.customer_email && job.customer_email === user.email) ||
      (job.customer_id && (job.customer_id === user.id || job.customer_id === user.email));

    if (!ownsJob) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const [providerProfiles, customerProfiles] = await Promise.all([
      base44.asServiceRole.entities.ProviderProfile.filter({ id: quote.provider_id }),
      base44.asServiceRole.entities.CustomerProfile.filter({ user_email: user.email }),
    ]);
    const providerProfile = providerProfiles[0];
    const customerProfile = customerProfiles[0];

    const price = quote.price;
    if (!price || price <= 0) return Response.json({ error: 'Quote

