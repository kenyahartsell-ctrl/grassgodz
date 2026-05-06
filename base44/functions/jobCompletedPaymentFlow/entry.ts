import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@16.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { job_id } = await req.json();

    if (!job_id) return Response.json({ error: 'job_id required' }, { status: 400 });

    const jobs = await base44.asServiceRole.entities.Job.filter({ id: job_id });
    const job = jobs[0];
    if (!job) return Response.json({ error: 'Job not found' }, { status: 404 });

    const price = job.final_price || job.quoted_price;
    if (!price) return Response.json({ error: 'No price on job' }, { status: 400 });

    const amountCents = Math.round(price * 100);
    const platformFee = price * 0.25;
    const providerPayout = price * 0.75;

    // 1. Create a Stripe Price + Payment Link
    const stripePrice = await stripe.prices.create({
      currency: 'usd',
      unit_amount: amountCents,
      product_data: {
        name: job.service_name || 'Lawn Care Service',
      },
    });

    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: stripePrice.id, quantity: 1 }],
      after_completion: {
        type: 'redirect',
        redirect: { url: 'https://grassgodz.com/payment-success' },
      },
      metadata: {
        job_id: job.id,
        customer_id: job.customer_id,
        provider_id: job.provider_id,
      },
    });

    // 2. Create Payment record (status: authorized, no payment_intent yet)
    const existingPayments = await base44.asServiceRole.entities.Payment.filter({ job_id });
    if (existingPayments.length === 0) {
      await base44.asServiceRole.entities.Payment.create({
        job_id: job.id,
        customer_id: job.customer_id,
        provider_id: job.provider_id,
        amount: price,
        platform_fee: platformFee,
        payout_amount: providerPayout,
        stripe_payment_intent_id: '',
        status: 'authorized',
      });
    }

    // 3. Send payment link to customer via email
    if (job.customer_email) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: job.customer_email,
        subject: `Your ${job.service_name || 'Lawn Service'} is Complete — Payment Required`,
        body: `
<p>Hi ${job.customer_name || 'there'},</p>

<p>Your lawn service has been completed! Please click the link below to complete your payment:</p>

<p><a href="${paymentLink.url}" style="background:#2d6a2d;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">Complete Payment — $${price.toFixed(2)}</a></p>

<p>Or copy this link: <a href="${paymentLink.url}">${paymentLink.url}</a></p>

<p>Thank you for choosing Grassgodz.</p>

<p>The Grassgodz Team</p>
        `.trim(),
      });
    }

    return Response.json({ success: true, payment_link: paymentLink.url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});