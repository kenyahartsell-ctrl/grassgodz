import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@16.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { profile_id, email, name, phone } = await req.json();
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

    const customer = await stripe.customers.create({
      email,
      name: name || undefined,
      phone: phone || undefined,
      metadata: { grassgodz_customer_id: profile_id, grassgodz_user_email: email },
    });

    await base44.asServiceRole.entities.CustomerProfile.update(profile_id, {
      stripe_customer_id: customer.id,
    });

    return Response.json({ success: true, stripe_customer_id: customer.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});