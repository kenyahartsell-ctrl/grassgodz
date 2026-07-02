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

    const chargedPrice = final_price || job.quoted_price || job.final_price;
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
        const stripeCustomerId = customerProfile?.stripe_customer_id;
        const defaultPaymentMethodId = customerProfile?.default_payment_method_id;

        let chargedViaCard = false;
        let paymentLink = null;

        if (stripeCustomerId && defaultPaymentMethodId) {
          // Attempt off-session charge
          try {
            const offSessionIntent = await stripe.paymentIntents.create({
              amount: Math.round(chargedPrice * 100),
              currency: 'usd',
              customer: stripeCustomerId,
              payment_method: defaultPaymentMethodId,
              confirm: true,
              off_session: true,
              description: `Grassgodz — ${job.service_name || 'Lawn Service'} at ${job.address}`,
            });
            if (offSessionIntent.status === 'succeeded') {
              chargedViaCard = true;
              await base44.asServiceRole.entities.Payment.create({
                job_id,
                customer_id: customerProfile?.id || job.customer_id,
                provider_id: providerProfile?.id || job.provider_id,
                stripe_payment_intent_id: offSessionIntent.id,
                amount: chargedPrice,
                platform_fee: platformFee,
                payout_amount: providerPayout,
                status: 'captured',
              });
            }
          } catch (offSessionErr) {
            console.error('Off-session charge failed:', offSessionErr.message);
          }
        }

        if (!chargedViaCard) {
          // Create Stripe Checkout Session for payment link
          try {
            const session = await stripe.checkout.sessions.create({
              mode: 'payment',
              customer_email: job.customer_email,
              line_items: [{
                price_data: {
                  currency: 'usd',
                  product_data: { name: job.service_name || 'Lawn Service', description: job.address },
                  unit_amount: Math.round(chargedPrice * 100),
                },
                quantity: 1,
              }],
              success_url: 'https://grassgodz.com/customer',
              cancel_url: 'https://grassgodz.com/customer',
            });
            paymentLink = session.url;
          } catch (sessionErr) {
            console.error('Checkout session error:', sessionErr.message);
          }
        }

        // Create Invoice entity record
        try {
          await base44.asServiceRole.entities.Invoice.create({
            job_id,
            customer_name: job.customer_name || '',
            customer_email: job.customer_email,
            service_address: job.address || '',
            service_description: job.service_name || 'Lawn Service',
            line_items: [{ description: job.service_name || 'Lawn Service', type: 'labor', quantity: 1, unit_price: chargedPrice, line_total: chargedPrice }],
            labor_subtotal: chargedPrice,
            supplies_subtotal: 0,
            subtotal: chargedPrice,
            tax_rate: 0,
            tax_amount: 0,
            total: chargedPrice,
            stripe_payment_link: paymentLink || null,
            status: chargedViaCard ? 'paid' : (paymentLink ? 'sent' : 'draft'),
            created_by_admin: false,
          });
        } catch (invoiceErr) {
          console.error('Invoice create error:', invoiceErr.message);
        }

        // Send email
        try {
          if (chargedViaCard) {
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: job.customer_email,
              subject: 'Payment received — Grassgodz service complete 🌿',
              body: `<p>Hi ${job.customer_name || 'there'},</p><p>Your Grassgodz lawn service has been completed and <strong>$${chargedPrice.toFixed(2)}</strong> has been charged to your card on file. Thank you for choosing Grassgodz!</p>`,
            });
          } else if (paymentLink) {
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: job.customer_email,
              subject: 'Your lawn service is complete — invoice enclosed 🌿',
              body: `<p>Hi ${job.customer_name || 'there'},</p><p>Your Grassgodz lawn service at <strong>${job.address}</strong> has been completed.</p><p>Please pay your invoice of <strong>$${chargedPrice.toFixed(2)}</strong> using the button below:</p><p style="margin:24px 0;"><a href="${paymentLink}" style="background:#16a34a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Pay Now — $${chargedPrice.toFixed(2)}</a></p><p>Thank you for choosing Grassgodz!</p>`,
            });
          } else {
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: job.customer_email,
              subject: 'Your lawn service is complete 🌿',
              body: `<p>Hi ${job.customer_name || 'there'},</p><p>Your Grassgodz lawn service has been completed. Amount due: <strong>$${chargedPrice.toFixed(2)}</strong>. Our team will be in touch regarding payment.</p>`,
            });
          }
        } catch (emailErr) {
          console.error('Email send error:', emailErr.message);
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