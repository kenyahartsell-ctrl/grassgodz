import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ALLOWED_FIELDS = [
  'name', 'phone', 'bio', 'service_zip_codes', 'services_offered',
  'profile_image_url', 'years_experience', 'equipment',
  'business_name', 'has_vehicle', 'has_equipment',
  'hauling_fees_apply', 'hauling_fee_type', 'hauling_fee_value',
  'notify_new_booking', 'notify_job_updates', 'notify_payment_received',
  'notify_promotions', 'sms_opt_in',
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { profile_id, ...rawUpdates } = await req.json();
    if (!profile_id) return Response.json({ error: 'profile_id is required' }, { status: 400 });

    // Strip any fields not in the allowlist (prevents self-escalation of status, role, etc.)
    const updates = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in rawUpdates) updates[key] = rawUpdates[key];
    }

    if (Object.keys(updates).length === 0) {
      return Response.json({ error: 'No valid fields to update' }, { status: 400 });
    }

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