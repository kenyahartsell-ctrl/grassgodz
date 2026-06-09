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

    let accountId = profile.stripe_connect_account_id;

    if (!accountId) {
      // Parse name into first/last
      const nameParts = (profile.name || user.full_name || '').trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Normalize phone to E.164 (strip non-digits, add +1 for US)
      const rawPhone = (profile.phone || '').replace(/\D/g, '');
      const e164Phone = rawPhone.length === 10 ? '+1' + rawPhone : rawPhone.length === 11 && rawPhone.startsWith('1') ? '+' + rawPhone : undefined;

      // Always use individual — most providers are sole proprietors.
      // business_profile.name lets them still brand themselves without triggering
      // Stripe's full company verification flow.
      const accountPayload = {
        type: 'express',
        email: user.email,
        business_type: 'individual',
        individual: {
          email: user.email,
          first_name: firstName,
          last_name: lastName,
          ...(e164Phone && { phone: e164Phone }),
        },
        business_profile: {
          // Pre-fill their business name so Stripe doesn't ask for it
          name: profile.business_name || (firstName + (lastName ? ' ' + lastName : '') + ' Lawn Care'),
          // Pre-fill website so they don't have to look it up
          url: 'https://grassgodz.com',
          // Lawn care / landscaping MCC
          mcc: '0780',
          product_description: 'Residential lawn care and landscaping services provided through the Grassgodz marketplace.',
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: {
          grassgodz_provider_id: profile.id,
          grassgodz_user_email: user.email,
        },
      };

      const account = await stripe.accounts.create(accountPayload);
      accountId = account.id;
      await base44.entities.ProviderProfile.update(profile.id, {
        stripe_connect_account_id: accountId,
      });
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
    console.error('createStripeConnectAccount error:', error.message, error.code, error.type);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
