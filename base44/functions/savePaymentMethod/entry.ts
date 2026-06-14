import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { profile_id, payment_method_id } = await req.json();
    if (!profile_id || !payment_method_id) {
      return Response.json({ error: 'profile_id and payment_method_id required' }, { status: 400 });
    }

    // Verify the profile belongs to this user before updating
    const profiles = await base44.asServiceRole.entities.CustomerProfile.filter({ id: profile_id });
    const profile = profiles[0];
    if (!profile) return Response.json({ error: 'Profile not found' }, { status: 404 });
    if (profile.user_email !== user.email) return Response.json({ error: 'Forbidden' }, { status: 403 });

    await base44.asServiceRole.entities.CustomerProfile.update(profile_id, {
      default_payment_method_id: payment_method_id,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});