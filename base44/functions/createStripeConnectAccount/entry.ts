import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@16.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { provider_id, return_url } = await req.json();

    const profiles = await base44.entities.ProviderProfile.filter({ user_email: user.email });
    const profile = profiles[0];
    if (!profile) return Response.json({ error: 'Provider profile not found' }, { status: 404 });
    if (profile.id !== provider_id) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const hasBusinessName = !!profile.business_name;
    const firstName = profile.name?.split(' ')[0] || '';
    const lastName  = profile.name?.split(' ').slice(1).join(' ') || '';
    const phone     = profile.phone || undefined;
    const firstZip  = profile.service_zip_codes?.[0];
    const siteUrl   = profile.website ? profile.website : 'https://grassgodz.com';

    // Data pre-filled into Stripe — reduces provider friction
    const prefill = {
      business_profile: {
        url: siteUrl,
        name: profile.business_name || profile.name || undefined,
        product_description: 'Professional lawn care and landscaping services provided through the Grassgodz platform.',
        mcc: '0780', // Landscape and Horticultural Services
      },
      settings: {
        payouts: {
          schedule: { interval: 'weekly', weekly_anchor: 'friday' },
        },
      },
    };

    if (hasBusinessName) {
      prefill.business_type = 'company';
      prefill.company = {
        name: profile.business_name,
        ...(phone ? { phone } : {}),
      };
    } else {
      prefill.business_type = 'individual';
      prefill.individual = {
        email: user.email,
        first_name: firstName,
        last_name: lastName,
        ...(phone ? { phone } : {}),
        ...(firstZip ? { address: { postal_code: firstZip, country: 'US' } } : {}),
      };
    }

    let accountId = profile.stripe_connect_account_id;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: {
          grassgodz_provider_id: profile.id,
          grassgodz_user_email: user.email,
        },
        ...prefill,
      });
      accountId = account.id;
      await base44.entities.ProviderProfile.update(profile.id, {
        stripe_connect_account_id: accountId,
      });
    } else {
      // Refresh pre-filled data on the existing account (non-blocking)
      stripe.accounts.update(accountId, prefill).catch(() => {});
    }

    const origin = return_url || req.headers.get('origin') + '/provider';
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: origin,
      return_url: origin,
      type: 'account_onboarding',
    });

    return Response.json({ url: accountLink.url, account_id: accountId });
  } catch (error) {
    console.error('Stripe connect error:', error.message, error.code);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
