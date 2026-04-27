import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@16.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { provider_id } = await req.json();

    const profiles = await base44.entities.ProviderProfile.filter({ user_email: user.email });
    const profile = profiles[0];
    if (!profile) return Response.json({ error: 'Provider profile not found' }, { status: 404 });
    if (profile.id !== provider_id) return Response.json({ error: 'Forbidden' }, { status: 403 });

    if (!profile.stripe_connect_account_id) {
      return Response.json({ onboarding_complete: false, reason: 'No Stripe account yet' });
    }

    const account = await stripe.accounts.retrieve(profile.stripe_connect_account_id);
    const complete = account.charges_enabled && account.payouts_enabled && account.details_submitted;

    if (complete && !profile.onboarding_complete) {
      await base44.entities.ProviderProfile.update(profile.id, { onboarding_complete: true });
    }

    return Response.json({
      onboarding_complete: complete,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});