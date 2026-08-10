import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@16.0.0';

const MIN_PHOTO_COUNT = 4;

Deno.serve(async (req) => {
  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { job_id, skip_photos, final_price } = body;
    if (!job_id) return Response.json({ error: 'job_id required' }, { status: 400 });

    // Validate the caller is the provider on this job
    const providerProfiles = await base44.entities.ProviderProfile.filter({ user_email: user.email });
    const providerProfile = providerProfiles[0];

    const job = await base44.asServiceRole.entities.Job.get(job_id);
    if (!job) return Response.json({ error: 'Job not found' }, { status: 404 });

    const isProvider =
      (job.provider_email && job.provider_email === user.email) ||
      (providerProfile && job.provider_id === providerProfile.id);

    if (!isProvider) return Response.json({ error: 'Forbidden — not the assigned provider' }, { status: 403 });

    // Photo check — photos are stored as fields on the Job record (completion_photos object)
    if (!skip_photos) {
      const photoCount = Object.values(job.completion_photos || {}).filter(url => typeof url === 'string' && url.trim().length > 0).length;
      if (photoCount < MIN_PHOTO_COUNT) {
        return Response.json({
          error: `At least ${MIN_PHOTO_COUNT} completion photos are required`,
          photo_count: photoCount,
          required: MIN_PHOTO_COUNT,
        }, { status: 400 });
      }
    }

    const basePrice = final_price || job.quoted_price || job.final_price || 0;
    const additionalFee = job.additional_fee || 0;
    const chargedPrice = basePrice + additionalFee;
    const providerPayout = chargedPrice * 0.90;
    const platformFee = chargedPrice * 0.10;

    // --- Capture the Stripe authorization hold if one exists ---
    // Fix: Job schema uses final_payment_intent_id (or deposit_payment_intent_id for deposits).
    // Look up the payment intent ID from the Payment record, which is the canonical source.
    let stripeResult = null;
    const existingPayments = await base44.asServiceRole.entities.Payment.filter({ job_id });
    const existingPayment = existingPayments[0];
    const paymentIntentId = existingPayment?.stripe_payment_intent_id ||
      job.final_payment_intent_id ||
      job.deposit_payment_intent_id;

    if (paymentIntentId) {
      try {
        const amountToCapture = Math.round(chargedPrice * 100);
        stripeResult = await stripe.paymentIntents.capture(paymentIntentId, {
          amount_to_capture: amountToCapture,
        });

        if (existingPayment) {
          await base44.asServiceRole.entities.Payment.update(existingPayment.id, {
            status: 'captured',
            amount: chargedPrice,
            payout_amount: providerPayout,
            platform_fee: platformFee,
          });
        }
      } catch (stripeErr) {
        console.error('Stripe capture error:', stripeErr.message);
        // Don't block completion if capture fails — admin will need to manually capture
      }
    }

    // Mark job completed
    await base44.asServiceRole.entities.Job.update(job_id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      final_price: chargedPrice,
      provider_payout: providerPayout,
      platform_fee: platformFee,
    });

    // Post-completion: handle payment if no Stripe auth was captured
    if (!stripeResult && job.customer_email) {
      try {
        const customerProfiles = await base44.asServiceRole.entities.CustomerProfile.filter({ user_email: job.customer_email });
        const customerProfile = customerProfiles[0];
        let stripeCustomerId = customerProfile?.stripe_customer_id;
        const defaultPaymentMethodId = customerProfile?.default_payment_method_id;

        if (!stripeCustomerId) {
          const newCustomer = await stripe.customers.create({
            email: job.customer_email,
            name: job.customer_name || undefined,
          });
          stripeCustomerId = newCustomer.id;
          if (customerProfile) {
            await base44.asServiceRole.entities.CustomerProfile.update(customerProfile.id, { stripe_customer_id: stripeCustomerId });
          }
        }

        let chargedViaCard = false;
        let paymentLink = null;

        // Create Invoice entity record first
        let invoiceEntityId = null;
        try {
          const lineItems = [
            { description: job.service_name || 'Lawn Service', type: 'labor', quantity: 1, unit_price: basePrice, line_total: basePrice }
          ];
          if (additionalFee > 0) {
            lineItems.push({
              description: job.additional_fee_reason || 'Additional Fee',
              type: 'labor', quantity: 1, unit_price: additionalFee, line_total: additionalFee
            });
          }
          const newInvoice = await base44.asServiceRole.entities.Invoice.create({
            job_id,
            customer_name: job.customer_name || '',
            customer_email: job.customer_email,
            service_address: job.address || '',
            service_description: job.service_name || 'Lawn Service',
            line_items: lineItems,
            labor_subtotal: chargedPrice,
            supplies_subtotal: 0,
            subtotal: chargedPrice,
            tax_rate: 0,
            tax_amount: 0,
            total: chargedPrice,
            status: 'draft',
            created_by_admin: false,
          });
          invoiceEntityId = newInvoice.id;
        } catch (invoiceErr) {
          console.error('Invoice create error:', invoiceErr.message);
        }

        // Create Stripe Invoice
        if (stripeCustomerId) {
          try {
            await stripe.invoiceItems.create({
              customer: stripeCustomerId,
              amount: Math.round(basePrice * 100),
              currency: 'usd',
              description: job.service_name || 'Lawn Service',
            });
            if (additionalFee > 0) {
              await stripe.invoiceItems.create({
                customer: stripeCustomerId,
                amount: Math.round(additionalFee * 100),
                currency: 'usd',
                description: job.additional_fee_reason || 'Additional Fee',
              });
            }

            const stripeInvoice = await stripe.invoices.create({
              customer: stripeCustomerId,
              collection_method: (stripeCustomerId && defaultPaymentMethodId) ? 'charge_automatically' : 'send_invoice',
              days_until_due: (stripeCustomerId && defaultPaymentMethodId) ? undefined : 0,
              metadata: { job_id, invoice_id: invoiceEntityId },
              description: `Grassgodz — ${job.service_name || 'Lawn Service'} at ${job.address}`,
            });

            if (stripeCustomerId && defaultPaymentMethodId) {
               try {
                 const finalized = await stripe.invoices.pay(stripeInvoice.id);
                 if (finalized.status === 'paid') {
                   chargedViaCard = true;
                   paymentLink = finalized.hosted_invoice_url;
                   await base44.asServiceRole.entities.Payment.create({
                     job_id,
                     customer_id: customerProfile?.id || job.customer_id,
                     provider_id: providerProfile?.id || job.provider_id,
                     stripe_payment_intent_id: finalized.payment_intent,
                     amount: chargedPrice,
                     platform_fee: platformFee,
                     payout_amount: providerPayout,
                     status: 'captured',
                   });
                   if (invoiceEntityId) {
                     await base44.asServiceRole.entities.Invoice.update(invoiceEntityId, {
                       status: 'paid',
                       stripe_payment_link: paymentLink,
                     });
                   }
                 }
               } catch (payErr) {
                 console.error('Auto payment failed, falling back to send_invoice:', payErr.message);
                 const updatedInvoice = await stripe.invoices.update(stripeInvoice.id, {
                   collection_method: 'send_invoice',
                   days_until_due: 0,
                 });
                 const finalized = await stripe.invoices.finalizeInvoice(updatedInvoice.id);
                 paymentLink = finalized.hosted_invoice_url;
                 if (invoiceEntityId) {
                   await base44.asServiceRole.entities.Invoice.update(invoiceEntityId, {
                     status: 'sent',
                     stripe_payment_link: paymentLink,
                   });
                 }
               }
            } else {
               const finalized = await stripe.invoices.finalizeInvoice(stripeInvoice.id);
               paymentLink = finalized.hosted_invoice_url;
               if (invoiceEntityId) {
                 await base44.asServiceRole.entities.Invoice.update(invoiceEntityId, {
                   status: 'sent',
                   stripe_payment_link: paymentLink,
                 });
               }
            }
          } catch (stripeErr) {
            console.error('Stripe invoice error:', stripeErr.message);
          }
        }
      } catch (postPaymentErr) {
        console.error('Post-completion payment flow error:', postPaymentErr.message);
      }
    } else if (stripeResult && job.customer_email) {
      // Card was already captured — send simple receipt
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: job.customer_email,
          subject: 'Your lawn service is complete! 🌿',
          body: `<p>Hi ${job.customer_name || 'there'},</p><p>Your Grassgodz service has been completed and <strong>$${chargedPrice.toFixed(2)}</strong> has been charged. Thank you for choosing Grassgodz!</p>`,
        });
      } catch (emailErr) {
        console.error('Receipt email error:', emailErr.message);
      }
    }

    return Response.json({
      success: true,
      payout: providerPayout,
      final_price: chargedPrice,
      stripe_captured: !!stripeResult,
    });
  } catch (error) {
    console.error('capturePayment error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});