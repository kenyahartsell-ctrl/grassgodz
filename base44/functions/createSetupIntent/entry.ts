import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@16.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { customer_id } = await req.json();

    const profiles = await base44.entities.CustomerProfile.filter({ user_email: user.email });
    const profile = profiles[0];
    if (!profile) return Response.json({ error: 'Customer profile not found' }, { status: 404 });
    if (profile.id !== customer_id) return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Ensure Stripe customer exists
    let stripeCustomerId = profile.stripe_customer_id;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name || profile.name || undefined,
        metadata: { grassgodz_customer_id: profile.id },
      });
      stripeCustomerId = customer.id;
      await base44.entities.CustomerProfile.update(profile.id, { stripe_customer_id: stripeCustomerId });
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      usage: 'off_session',
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
    });

    return Response.json({ client_secret: setupIntent.client_secret });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});