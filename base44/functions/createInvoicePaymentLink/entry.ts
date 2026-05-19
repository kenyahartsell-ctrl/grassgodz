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

    // Create a Stripe Price on the fly
    const price = await stripe.prices.create({
      currency: 'usd',
      unit_amount: totalCents,
      product_data: {
        name: invoice.service_description || `Invoice for ${invoice.customer_name || invoice.customer_email}`,
      },
    });

    // Create a Payment Link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      metadata: { invoice_id: invoice.id },
    });

    // Save payment link URL to invoice
    await base44.asServiceRole.entities.Invoice.update(invoice.id, {
      stripe_payment_link: paymentLink.url,
    });

    return Response.json({ payment_link: paymentLink.url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});