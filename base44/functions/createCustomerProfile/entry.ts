import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@16.0.0';

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

    // Create Stripe customer immediately so all customers have one on file
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const stripeCustomer = await stripe.customers.create({
      email: user.email,
      name: user.full_name || profileData.name || undefined,
      phone: profileData.phone || undefined,
      metadata: {
        grassgodz_user_email: user.email,
      },
    });

    const profile = await base44.asServiceRole.entities.CustomerProfile.create({
      ...profileData,
      user_email: user.email,
      stripe_customer_id: stripeCustomer.id,
    });

    return Response.json({ profile, created: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});