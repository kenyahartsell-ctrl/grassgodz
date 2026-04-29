import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { account_type } = await req.json();

    if (account_type === 'customer') {
      // Delete customer profile
      const profiles = await base44.entities.CustomerProfile.filter({ user_email: user.email });
      for (const p of profiles) {
        await base44.asServiceRole.entities.CustomerProfile.delete(p.id);
      }
    } else if (account_type === 'provider') {
      // Delete provider profile
      const profiles = await base44.entities.ProviderProfile.filter({ user_email: user.email });
      for (const p of profiles) {
        await base44.asServiceRole.entities.ProviderProfile.delete(p.id);
      }
    } else {
      return Response.json({ error: 'Invalid account_type' }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});