import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ profile: null });

    // Check by email first, then fall back to user id
    let profiles = await base44.asServiceRole.entities.ProviderProfile.filter({ user_email: user.email });
    if (!profiles || profiles.length === 0) {
      profiles = await base44.asServiceRole.entities.ProviderProfile.filter({ created_by: user.email });
    }
    return Response.json({ profile: profiles[0] || null });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});