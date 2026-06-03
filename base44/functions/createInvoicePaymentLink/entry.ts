import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { invoice_id } = await req.json();
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

    const invoices = await base44.asServiceRole.entities.Invoice.filter({ id: invoice_id });
    if (!invoices || invoices.length === 0) {
      return Response.json({ error: 'Invoice not found' }, { status: 404 });
    }
    const invoice = invoices[0];

    const totalCents = Math.round((invoice.total || 0) * 100);
    if (totalCents <= 0) {
      return Response.json({ error: 'Invoice total must be greater than 0' }, { status: 400 });
    }

    const description = invoice.service_description || `Invoice for ${invoice.customer_name || invoice.customer_email}`;

    // Try to find the customer's saved card on file
    let stripeCustomerId = null;
    let defaultPaymentMethodId = null;

    if (invoice.customer_email) {
      const profiles = await base44.asServiceRole.entities.CustomerProfile.filter({ user_email: invoice.customer_email });
      if (profiles && profiles.length > 0) {
        stripeCustomerId = profiles[0].stripe_customer_id || null;
        defaultPaymentMethodId = profiles[0].default_payment_method_id || null;
      }
    }

    // If customer has a card on file, charge it directly via PaymentIntent
    if (stripeCustomerId && defaultPaymentMethodId) {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: totalCents,
        currency: 'usd',
        customer: stripeCustomerId,
        payment_method: defaultPaymentMethodId,
        description,
        receipt_email: invoice.customer_email,
        confirm: true,
        off_session: true,
        metadata: { invoice_id: invoice.id },
      });

      if (paymentIntent.status === 'succeeded') {
        await base44.asServiceRole.entities.Invoice.update(invoice.id, {
          status: 'paid',
          stripe_payment_link: `https://dashboard.stripe.com/payments/${paymentIntent.id}`,
        });
        return Response.json({
          charged_card_on_file: true,
          payment_intent_id: paymentIntent.id,
          status: paymentIntent.status,
          payment_link: null,
        });
      }
    }

    // Fallback: create a Stripe Checkout Session (works with restricted keys)
    const origin = req.headers.get('origin') || 'https://grassgodz.com';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: totalCents,
            product_data: { name: description },
          },
          quantity: 1,
        },
      ],
      customer_email: invoice.customer_email || undefined,
      success_url: `${origin}/customer?payment=success`,
      cancel_url: `${origin}/customer?payment=cancelled`,
      metadata: { invoice_id: invoice.id },
    });

    await base44.asServiceRole.entities.Invoice.update(invoice.id, {
      stripe_payment_link: session.url,
      status: 'sent',
    });

    return Response.json({
      charged_card_on_file: false,
      payment_link: session.url,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});