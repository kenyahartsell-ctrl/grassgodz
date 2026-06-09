import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@16.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const profileData = await req.json();

    // Guard 1: Check by user_email with service role (most common case)
    const existingByEmail = await base44.asServiceRole.entities.CustomerProfile.filter({ user_email: user.email });
    if (existingByEmail && existingByEmail.length > 0) {
      return Response.json({ profile: existingByEmail[0], created: false });
    }

    // Guard 2: Check for an auto-created blank profile owned by this user.
    // base44 may auto-create an empty CustomerProfile row when a user registers,
    // with user_email null/empty — causing a duplicate when we then create a second one.
    const ownedProfiles = await base44.entities.CustomerProfile.filter({});
    if (ownedProfiles && ownedProfiles.length > 0) {
      const blankProfile = ownedProfiles[0];
      // Create Stripe customer for the blank profile
      const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
      const stripeCustomer = await stripe.customers.create({
        email: user.email,
        name: user.full_name || profileData.name || undefined,
        phone: profileData.phone || undefined,
        metadata: { grassgodz_user_email: user.email },
      });
      // Update the blank auto-created profile with actual data
      const updated = await base44.asServiceRole.entities.CustomerProfile.update(blankProfile.id, {
        ...profileData,
        user_email: user.email,
        stripe_customer_id: stripeCustomer.id,
      });
      return Response.json({ profile: updated || blankProfile, created: true });
    }

    // No profile at all — create fresh
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const stripeCustomer = await stripe.customers.create({
      email: user.email,
      name: user.full_name || profileData.name || undefined,
      phone: profileData.phone || undefined,
      metadata: { grassgodz_user_email: user.email },
    });

    let profile;
    try {
      profile = await base44.asServiceRole.entities.CustomerProfile.create({
        ...profileData,
        user_email: user.email,
        stripe_customer_id: stripeCustomer.id,
      });
    } catch (createErr) {
      // Race condition: another call created the profile simultaneously — return existing
      const retry = await base44.asServiceRole.entities.CustomerProfile.filter({ user_email: user.email });
      if (retry && retry.length > 0) {
        return Response.json({ profile: retry[0], created: false });
      }
      throw createErr;
    }

    return Response.json({ profile, created: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
