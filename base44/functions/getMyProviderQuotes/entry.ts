import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const email = user.email.toLowerCase();

    // Get the provider's profile to verify identity
    const profiles = await base44.asServiceRole.entities.ProviderProfile.filter({ user_email: email });
    const profile = profiles[0];
    if (!profile) return Response.json({ quotes: [] });

    // Fetch quotes by provider_id or provider_email (handles legacy records)
    const [byId, byEmail] = await Promise.all([
      base44.asServiceRole.entities.Quote.filter({ provider_id: profile.id }, '-created_date', 200),
      base44.asServiceRole.entities.Quote.filter({ provider_email: user.email }, '-created_date', 200),
    ]);

    // Deduplicate
    const seen = new Set();
    const quotes = [];
    for (const q of [...byId, ...byEmail]) {
      if (!seen.has(q.id)) { seen.add(q.id); quotes.push(q); }
    }

    return Response.json({ quotes });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});