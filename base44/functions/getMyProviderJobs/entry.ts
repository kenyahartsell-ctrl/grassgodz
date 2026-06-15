import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ jobs: [] }, { status: 401 });

    // Normalize email to lowercase
    const email = user.email.toLowerCase();

    // Get this provider's profile via service role
    const profiles = await base44.asServiceRole.entities.ProviderProfile.filter({ user_email: email });
    const profile = profiles[0] || null;

    if (!profile) return Response.json({ jobs: [], profile: null });

    // Fetch all jobs assigned to this provider by both id and email (deduplicated)
    // Use large limit to avoid default 50-record cap
    const [byId, byEmail] = await Promise.all([
      base44.asServiceRole.entities.Job.filter({ provider_id: profile.id }, '-created_date', 500),
      base44.asServiceRole.entities.Job.filter({ provider_email: email }, '-created_date', 500),
    ]);

    const seen = new Set();
    const jobs = [];
    for (const j of [...byId, ...byEmail]) {
      if (!seen.has(j.id)) { seen.add(j.id); jobs.push(j); }
    }

    return Response.json({ jobs, profile });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});