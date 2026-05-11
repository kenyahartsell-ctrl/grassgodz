import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { profile_id, ...updates } = await req.json();

    if (!profile_id) return Response.json({ error: 'profile_id is required' }, { status: 400 });

    // Verify the profile belongs to this user before updating
    const profiles = await base44.asServiceRole.entities.ProviderProfile.filter({ user_email: user.email });
    const profile = profiles.find(p => p.id === profile_id);
    if (!profile) return Response.json({ error: 'Profile not found or access denied' }, { status: 403 });

    const updated = await base44.asServiceRole.entities.ProviderProfile.update(profile_id, updates);
    return Response.json({ profile: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});