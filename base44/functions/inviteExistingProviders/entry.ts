import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// One-time function to send invite emails to existing providers
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const providers = await base44.asServiceRole.entities.ProviderProfile.list();

    // Filter to real providers (exclude obvious demo/sample emails)
    const demoEmails = ['provider@demo.com', 'mike@greenthumbpro.com', 'carlos@acelawn.com', 'jenny@syw.com'];
    const realProviders = providers.filter(p => p.user_email && !demoEmails.includes(p.user_email));

    // Deduplicate by email
    const seen = new Set();
    const unique = realProviders.filter(p => {
      if (seen.has(p.user_email)) return false;
      seen.add(p.user_email);
      return true;
    });

    const results = [];

    for (const provider of unique) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: provider.user_email,
          subject: 'Welcome to Grassgodz — Set up your account',
          body: `
            <p>Hi ${provider.name || 'there'},</p>
            <p>Welcome to <strong>Grassgodz</strong>! 🌿</p>
            <p>Your provider profile has been created. To complete your setup and start accepting jobs, you'll need to log in to your account and connect your bank account for weekly payouts.</p>
            <p><strong>Next steps:</strong></p>
            <ol>
              <li>Click the link in your invite email to create your password and log in</li>
              <li>Complete Stripe onboarding to receive payments</li>
              <li>Once approved, start accepting jobs in your area!</li>
            </ol>
            <p>If you have any questions, email us at <a href="mailto:pros@grassgodz.com">pros@grassgodz.com</a></p>
            <br/>
            <p>— The Grassgodz Team</p>
          `,
        });
        results.push({ email: provider.user_email, status: 'sent' });
      } catch (err) {
        results.push({ email: provider.user_email, status: 'failed', error: err.message });
      }
    }

    return Response.json({ sent: results.length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});