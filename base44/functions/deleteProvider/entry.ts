import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { provider_id } = await req.json();
    if (!provider_id) {
      return Response.json({ error: 'Missing provider_id' }, { status: 400 });
    }

    await base44.asServiceRole.entities.ProviderProfile.delete(provider_id);

    return Response.json({ success: true, message: 'Provider deleted' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});