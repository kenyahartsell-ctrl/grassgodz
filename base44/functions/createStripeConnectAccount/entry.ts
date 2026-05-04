import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@16.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  console.log('KEY:',
  Deno.env.get('STRIPE_SECRET_KEY')?.
  substring(0,15));

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
    console.error('ERROR:',error.message,error.code,error.type);
    return Response.json({error:error.message},{status:500});

    return Response.json({ error: error.message }, { status: 500 });
  }
});