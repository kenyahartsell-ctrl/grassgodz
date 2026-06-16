import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@16.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { quote_id } = await req.json();
    if (!quote_id) return Response.json({ error: 'quote_id required' }, { status: 400 });

    const quotes = await base44.asServiceRole.entities.Quote.filter({ id: quote_id });
    const quote = quotes[0];
    if (!quote) return Response.json({ error: 'Quote not found' }, { status: 404 });
    if (quote.status !== 'pending') {
      return Response.json({ error: 'Quote is no longer pending' }, { status: 400 });
    }

    const jobs = await base44.asServiceRole.entities.Job.filter({ id: quote.job_id });
    const job = jobs[0];
    if (!job) return Response.json({ error: 'Job not found' }, { status: 404 });

    const ownsJob =
      (job.customer_email && job.customer_email === user.email) ||
      (job.customer_id && (job.customer_id === user.id || job.customer_id === user.email));

    if (!ownsJob) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const [providerProfiles, customerProfiles] = await Promise.all([
      base44.asServiceRole.entities.ProviderProfile.filter({ id: quote.provider_id }),
      base44.asServiceRole.entities.CustomerProfile.filter({ user_email: user.email }),
    ]);
    const providerProfile = providerProfiles[0];
    const customerProfile = customerProfiles[0];

    const price = quote.price;
    if (!price || price <= 0) return Response.json({ error: 'Quote has no valid price' }, { status: 400 });

    const amountCents = Math.round(price * 100);
    const applicationFeeCents = Math.round(amountCents * 0.10);

    // Mark all other quotes for this job as rejected
    const allQuotes = await base44.asServiceRole.entities.Quote.filter({ job_id: job.id });
    for (const q of allQuotes) {
      if (q.id !== quote_id && q.status === 'pending') {
        await base44.asServiceRole.entities.Quote.update(q.id, { status: 'rejected' });
      }
    }

    // Mark this quote as accepted
    await base44.asServiceRole.entities.Quote.update(quote_id, { status: 'accepted' });

    // --- Path A: Customer has a saved payment method — place authorization hold ---
    if (customerProfile?.stripe_customer_id && customerProfile?.default_payment_method_id && providerProfile?.stripe_connect_account_id) {
      try {
        // Determine capture strategy: if job is >5 days out, capture immediately
        // (Stripe authorization holds expire after 7 days)
        const daysUntilJob = job.scheduled_date
          ? Math.ceil((new Date(job.scheduled_date) - new Date()) / (1000 * 60 * 60 * 24))
          : 0;
        const captureMethod = daysUntilJob > 5 ? 'automatic' : 'manual';

        const paymentIntent = await stripe.paymentIntents.create({
          amount: amountCents,
          currency: 'usd',
          capture_method: captureMethod,
          confirm: true,
          customer: customerProfile.stripe_customer_id,
          payment_method: customerProfile.default_payment_method_id,
          application_fee_amount: applicationFeeCents,
          transfer_data: { destination: providerProfile.stripe_connect_account_id },
          automatic_payment_methods: {
            enabled: true,
            allow_redirects: 'never',
          },
          metadata: {
            job_id: job.id,
            quote_id: quote_id,
            customer_email: user.email,
            capture_method: captureMethod,
          },
        });

        // Save Payment record
        await base44.asServiceRole.entities.Payment.create({
          job_id: job.id,
          customer_id: customerProfile.id,
          provider_id: providerProfile.id,
          stripe_payment_intent_id: paymentIntent.id,
          amount: price,
          platform_fee: price * 0.10,
          payout_amount: price * 0.90,
          status: captureMethod === 'automatic' ? 'captured' : 'authorized',
        });

        // Update job: accepted, stamp accepted_at, store payment intent id
        await base44.asServiceRole.entities.Job.update(job.id, {
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          provider_id: quote.provider_id,
          quoted_price: price,
          payment_intent_id: paymentIntent.id,
        });

        return Response.json({ success: true, authorized: true, payment_intent_id: paymentIntent.id });
      } catch (stripeErr) {
        // Stripe failed (e.g. deleted Connect account) — fall through to Path B
        console.error('Stripe PaymentIntent error, falling back to payment link:', stripeErr.message);
      }
    }

    // --- Path B: No card on file — generate a Stripe payment link ---
    // Update job to scheduled so CardRequiredBanner shows
    await base44.asServiceRole.entities.Job.update(job.id, {
      status: 'scheduled',
      provider_id: quote.provider_id,
      quoted_price: price,
    });

    if (!providerProfile?.stripe_connect_account_id) {
      // No Stripe Connect for provider — just update status and return
      return Response.json({ success: true, requires_card: true });
    }

    let paymentLink = null;
    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: { name: 'Lawn Care Service - GrassGodz' },
            unit_amount: amountCents,
          },
          quantity: 1,
        }],
        payment_intent_data: {
          capture_method: 'manual',
          application_fee_amount: applicationFeeCents,
          transfer_data: { destination: providerProfile.stripe_connect_account_id },
          metadata: { job_id: job.id, quote_id: quote_id },
        },
        customer_email: user.email,
        success_url: `https://app.base44.com/apps/69e949497e5928c679297ebf/?payment=success&job_id=${job.id}`,
        cancel_url: `https://app.base44.com/apps/69e949497e5928c679297ebf/?payment=cancelled&job_id=${job.id}`,
      });
      paymentLink = session.url;
    } catch (stripeErr) {
      console.error('Stripe session error:', stripeErr.message);
    }

    return Response.json({ success: true, requires_card: true, payment_link: paymentLink });
  } catch (error) {
    console.error('acceptQuoteAndGeneratePaymentLink error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});