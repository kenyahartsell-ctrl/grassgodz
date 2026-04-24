import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { provider_profile_id, return_url } = await req.json();

    // Fetch the provider profile
    const profiles = await base44.entities.ProviderProfile.filter({ user_email: user.email });
    const profile = profiles[0];

    if (!profile) {
      return Response.json({ error: 'Provider profile not found' }, { status: 404 });
    }

    let accountId = profile.stripe_connect_account_id;

    // Create Stripe Connect account if not already created
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        individual: {
          email: user.email,
          first_name: profile.name?.split(' ')[0] || '',
          last_name: profile.name?.split(' ').slice(1).join(' ') || '',
          phone: profile.phone || undefined,
        },
        metadata: {
          grassgodz_provider_id: profile.id,
          grassgodz_user_email: user.email,
        },
      });

      accountId = account.id;

      // Save account ID to profile
      await base44.entities.ProviderProfile.update(profile.id, {
        stripe_connect_account_id: accountId,
      });
    }

    // Generate onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: return_url || `${req.headers.get('origin')}/provider`,
      return_url: return_url || `${req.headers.get('origin')}/provider`,
      type: 'account_onboarding',
    });

    return Response.json({ url: accountLink.url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});