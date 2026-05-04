import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const profileData = await req.json();

    // Check if profile already exists (service role bypasses RLS)
    const existing = await base44.asServiceRole.entities.CustomerProfile.filter({ user_email: user.email });
    if (existing && existing.length > 0) {
      return Response.json({ profile: existing[0], created: false });
    }

    const profile = await base44.asServiceRole.entities.CustomerProfile.create({
      ...profileData,
      user_email: user.email,
    });

    return Response.json({ profile, created: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});