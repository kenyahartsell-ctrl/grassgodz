import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [customers, providers] = await Promise.all([
      base44.asServiceRole.entities.CustomerProfile.list(),
      base44.asServiceRole.entities.ProviderProfile.list(),
    ]);

    const customerProfiles = customers.map(c => ({
      id: c.id,
      name: c.name,
      user_email: c.user_email,
      address: c.billing_address || c.service_address || null,
    }));

    const providerProfiles = providers.map(p => ({
      id: p.id,
      name: p.name,
      user_email: p.user_email,
    }));

    return Response.json({ customerProfiles, providerProfiles });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});