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

    const profiles = await base44.entities.ProviderProfile.filter({ user_email: user.email });
    const profile = profiles[0];

    if (!profile || !profile.stripe_connect_account_id) {
      return Response.json({ onboarding_complete: false });
    }

    // Check with Stripe if the account has completed onboarding
    const account = await stripe.accounts.retrieve(profile.stripe_connect_account_id);
    const isComplete = account.details_submitted && account.charges_enabled;

    if (isComplete && !profile.onboarding_complete) {
      await base44.entities.ProviderProfile.update(profile.id, { onboarding_complete: true });
    }

    return Response.json({ onboarding_complete: isComplete, charges_enabled: account.charges_enabled });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});