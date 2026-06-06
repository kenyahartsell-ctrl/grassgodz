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

    // ── 1. Load & validate quote ──────────────────────────────────────────────
    const quotes = await base44.asServiceRole.entities.Quote.filter({ id: quote_id });
    const quote = quotes[0];
    if (!quote) return Response.json({ error: 'Quote not found' }, { status: 404 });
    if (quote.status !== 'pending') {
      return Response.json({ error: 'Quote is no longer pending' }, { status: 400 });
    }

    // ── 2. Load & validate job (verify customer ownership) ───────────────────
    const jobs = await base44.asServiceRole.entities.Job.filter({ id: quote.job_id });
    const job = jobs[0];
    if (!job) return Response.json({ error: 'Job not found' }, { status: 404 });

    const ownsJob =
      (job.customer_email && job.customer_email === user.email) ||
      (job.customer_id && (job.customer_id === user.id || job.customer_id === user.email));

    if (!ownsJob) return Response.json({ error: 'Forbidden' }, { status: 403 });

    // ── 3. Load provider + customer profiles ──────────────────────────────────
    const [providerProfiles, customerProfiles] = await Promise.all([
      base44.asServiceRole.entities.ProviderProfile.filter({ id: quote.provider_id }),
      base44.asServiceRole.entities.CustomerProfile.filter({ user_email: user.email }),
    ]);
    const providerProfile = providerProfiles[0];
    const customerProfile = customerProfiles[0];

    const price = quote.price;
    if (!price || price <= 0) return Response.json({ error: 'Quote has no valid price' }, { status: 400 });

    const platformFee = price * 0.10;
    const providerPayout = price * 0.90;

    // ── 4. Accept this quote, decline all others for the same job ─────────────
    const allQuotes = await base44.asServiceRole.entities.Quote.filter({ job_id: job.id });
    await Promise.all([
      base44.asServiceRole.entities.Quote.update(quote_id, { status: 'accepted' }),
      ...allQuotes
        .filter(q => q.id !== quote_id && q.status === 'pending')
        .map(q => base44.asServiceRole.entities.Quote.update(q.id, { status: 'declined' })),
    ]);

    // ── 5. Base job update (provider assignment + pricing) ────────────────────
    const baseJobUpdate = {
      provider_id: quote.provider_id,
      provider_name: quote.provider_name,
      provider_email: quote.provider_email,
      quoted_price: price,
      final_price: price,
      platform_fee: platformFee,
      provider_payout: providerPayout,
      accepted_at: new Date().toISOString(),
    };

    // ── 6. Cash job — no Stripe needed ────────────────────────────────────────
    if (job.is_cash_job || job.payment_method === 'cash') {
      await base44.asServiceRole.entities.Job.update(job.id, { ...baseJobUpdate, status: 'scheduled' });

      if (quote.provider_email) {
        base44.asServiceRole.integrations.Core.SendEmail({
          to: quote.provider_email,
          subject: `Job confirmed — ${job.service_name} 🌿`,
          body: `Hi ${quote.provider_name || 'there'},<br/><br/>
Your quote of <strong>$${price.toFixed(2)}</strong> for <strong>${job.service_name}</strong> was accepted.<br/><br/>
<strong>Date:</strong> ${job.scheduled_date || 'TBD'}<br/>
<strong>Address:</strong> ${job.address}<br/>
<strong>Payment:</strong> Cash — collected on site<br/><br/>
Log in to your Grassgodz portal to view this job.<br/><br/>
The Grassgodz Team`,
        }).catch(() => {});
      }

      return Response.json({ success: true, cash_job: true });
    }

    // ── 7. Stripe path — card on file + provider has Connect account ──────────
    const hasCard = !!(customerProfile?.stripe_customer_id && customerProfile?.default_payment_method_id);
    const providerHasStripe = !!providerProfile?.stripe_connect_account_id;

    if (hasCard && providerHasStripe) {
      const amountCents = Math.round(price * 100);
      const applicationFeeCents = Math.round(amountCents * 0.10);

      const daysUntilJob = job.scheduled_date
        ? Math.ceil((new Date(job.scheduled_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 0;
      // Stripe auth holds expire after 7 days — capture immediately if job is far out
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
        automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
        metadata: {
          job_id: job.id,
          quote_id: quote_id,
          customer_id: customerProfile?.id || '',
          provider_id: providerProfile?.id || '',
        },
      });

      await Promise.all([
        base44.asServiceRole.entities.Payment.create({
          job_id: job.id,
          customer_id: customerProfile?.id || user.id,
          provider_id: quote.provider_id,
          stripe_payment_intent_id: paymentIntent.id,
          amount: price,
          platform_fee: platformFee,
          payout_amount: providerPayout,
          status: captureMethod === 'automatic' ? 'captured' : 'authorized',
        }),
        base44.asServiceRole.entities.Job.update(job.id, {
          ...baseJobUpdate,
          status: 'scheduled',
          final_payment_intent_id: paymentIntent.id,
        }),
      ]);

      if (quote.provider_email) {
        base44.asServiceRole.integrations.Core.SendEmail({
          to: quote.provider_email,
          subject: `Job confirmed — ${job.service_name} 🌿`,
          body: `Hi ${quote.provider_name || 'there'},<br/><br/>
Your quote of <strong>$${price.toFixed(2)}</strong> for <strong>${job.service_name}</strong> was accepted. Payment is authorized.<br/><br/>
<strong>Date:</strong> ${job.scheduled_date || 'TBD'}<br/>
<strong>Address:</strong> ${job.address}<br/>
<strong>Your payout:</strong> $${providerPayout.toFixed(2)} after job completion<br/><br/>
Log in to your Grassgodz portal to view this job.<br/><br/>
The Grassgodz Team`,
        }).catch(() => {});
      }

      return Response.json({ success: true, charged_card_on_file: true, payment_intent_id: paymentIntent.id });
    }

    // ── 8. No card on file or provider not on Stripe — generate Checkout link ─
    await base44.asServiceRole.entities.Job.update(job.id, { ...baseJobUpdate, status: 'accepted' });

    const origin = req.headers.get('origin') || 'https://grassgodz.com';
    const amountCents = Math.round(price * 100);

    const sessionConfig = {
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: amountCents,
            product_data: {
              name: `${job.service_name} — ${job.address}`,
              description: `Scheduled: ${job.scheduled_date || 'TBD'} · Provider: ${quote.provider_name}`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/customer?payment=success`,
      cancel_url: `${origin}/customer?payment=cancelled`,
      metadata: {
        job_id: job.id,
        quote_id: quote_id,
        provider_id: quote.provider_id,
      },
      ...(customerProfile?.user_email ? { customer_email: customerProfile.user_email } : {}),
      ...(providerHasStripe ? {
        payment_intent_data: {
          application_fee_amount: Math.round(amountCents * 0.10),
          transfer_data: { destination: providerProfile.stripe_connect_account_id },
        },
      } : {}),
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);

    await base44.asServiceRole.entities.Job.update(job.id, { pending_payment_link: session.url });

    return Response.json({
      success: true,
      charged_card_on_file: false,
      payment_link: session.url,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

