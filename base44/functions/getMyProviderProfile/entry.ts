import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ profile: null });

    // Always use lowercase email to avoid case mismatch
    const email = user.email.toLowerCase();
    let profiles = await base44.asServiceRole.entities.ProviderProfile.filter({ user_email: email });
    if (!profiles || profiles.length === 0) {
      profiles = await base44.asServiceRole.entities.ProviderProfile.filter({ created_by: email });
    }
    return Response.json({ profile: profiles[0] || null });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});