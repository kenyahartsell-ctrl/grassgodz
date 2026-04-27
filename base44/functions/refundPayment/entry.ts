import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@16.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });

    const { job_id, amount_cents, reason } = await req.json();
    if (!job_id) return Response.json({ error: 'job_id required' }, { status: 400 });

    const payments = await base44.asServiceRole.entities.Payment.filter({ job_id });
    const payment = payments[0];
    if (!payment?.stripe_payment_intent_id) {
      return Response.json({ error: 'No payment found for this job' }, { status: 404 });
    }

    const refundParams = {
      payment_intent: payment.stripe_payment_intent_id,
      reason: reason || 'requested_by_customer',
    };
    if (amount_cents) refundParams.amount = amount_cents;

    const refund = await stripe.refunds.create(refundParams);

    const isPartial = amount_cents && amount_cents < Math.round(payment.amount * 100);
    await base44.asServiceRole.entities.Payment.update(payment.id, {
      status: isPartial ? 'refunded' : 'refunded',
    });

    return Response.json({ success: true, refund_id: refund.id, amount_refunded: refund.amount });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});