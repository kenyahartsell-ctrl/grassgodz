import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    // Use service role only — no user auth required (public signup endpoint)
    const base44 = createClientFromRequest(req);
    const profileData = await req.json();

    if (!profileData.user_email) {
      return Response.json({ error: 'user_email is required' }, { status: 400 });
    }

    // Check if profile already exists
    const existing = await base44.asServiceRole.entities.ProviderProfile.filter({ user_email: profileData.user_email });
    if (existing && existing.length > 0) {
      return Response.json({ profile: existing[0], created: false });
    }

    const profile = await base44.asServiceRole.entities.ProviderProfile.create(profileData);

    return Response.json({ profile, created: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});