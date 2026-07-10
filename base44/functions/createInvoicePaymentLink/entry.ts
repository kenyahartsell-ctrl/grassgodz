import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invoice_id } = await req.json();
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

    const invoices = await base44.asServiceRole.entities.Invoice.filter({ id: invoice_id });
    if (!invoices || invoices.length === 0) {
      return Response.json({ error: 'Invoice not found' }, { status: 404 });
    }
    const invoice = invoices[0];
    
    if (user.role !== 'admin' && invoice.customer_email !== user.email) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

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

    if (!stripeCustomerId && (invoice.customer_email || invoice.customer_name)) {
      const newCustomer = await stripe.customers.create({
        email: invoice.customer_email || undefined,
        name: invoice.customer_name || undefined,
      });
      stripeCustomerId = newCustomer.id;
    }

    if (!stripeCustomerId) {
      return Response.json({ error: 'Customer email or name is required to create a Stripe invoice.' }, { status: 400 });
    }

    // Create invoice items in Stripe
    if (invoice.line_items && invoice.line_items.length > 0) {
      for (const item of invoice.line_items) {
        if (item.line_total > 0) {
          await stripe.invoiceItems.create({
            customer: stripeCustomerId,
            amount: Math.round(item.line_total * 100),
            currency: 'usd',
            description: item.description || 'Line Item',
          });
        }
      }
      if (invoice.tax_amount > 0) {
        await stripe.invoiceItems.create({
          customer: stripeCustomerId,
          amount: Math.round(invoice.tax_amount * 100),
          currency: 'usd',
          description: 'Tax',
        });
      }
    } else {
      await stripe.invoiceItems.create({
        customer: stripeCustomerId,
        amount: totalCents,
        currency: 'usd',
        description: description,
      });
    }

    const stripeInvoice = await stripe.invoices.create({
      customer: stripeCustomerId,
      collection_method: (stripeCustomerId && defaultPaymentMethodId) ? 'charge_automatically' : 'send_invoice',
      days_until_due: (stripeCustomerId && defaultPaymentMethodId) ? undefined : 0,
      metadata: { invoice_id: invoice.id },
      description: invoice.notes || undefined,
    });

    if (stripeCustomerId && defaultPaymentMethodId) {
      try {
        const finalized = await stripe.invoices.pay(stripeInvoice.id);
        if (finalized.status === 'paid') {
          await base44.asServiceRole.entities.Invoice.update(invoice.id, {
            status: 'paid',
            stripe_payment_link: finalized.hosted_invoice_url,
          });
          return Response.json({
            charged_card_on_file: true,
            payment_intent_id: finalized.payment_intent,
            status: finalized.status,
            payment_link: finalized.hosted_invoice_url,
          });
        }
      } catch (e) {
        // If automatic payment fails, fallback to sending the invoice
        console.error('Auto payment failed:', e);
      }
    }

    const finalized = await stripe.invoices.finalizeInvoice(stripeInvoice.id);

    await base44.asServiceRole.entities.Invoice.update(invoice.id, {
      stripe_payment_link: finalized.hosted_invoice_url,
      status: 'sent',
    });

    return Response.json({
      charged_card_on_file: false,
      payment_link: finalized.hosted_invoice_url,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});