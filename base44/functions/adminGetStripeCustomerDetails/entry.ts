import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@16.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { stripe_customer_id } = await req.json();
    if (!stripe_customer_id) return Response.json({ error: 'stripe_customer_id required' }, { status: 400 });

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

    const [customer, setupIntents, paymentMethods] = await Promise.all([
      stripe.customers.retrieve(stripe_customer_id),
      stripe.setupIntents.list({ customer: stripe_customer_id, limit: 10 }),
      stripe.paymentMethods.list({ customer: stripe_customer_id, type: 'card', limit: 10 }),
    ]);

    return Response.json({ customer, setupIntents: setupIntents.data, paymentMethods: paymentMethods.data });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});