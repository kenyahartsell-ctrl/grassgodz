import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { data, event } = body;

    const email = data?.user_email;
    const name = data?.name || 'there';
    const isProvider = event?.entity_name === 'ProviderProfile';

    if (!email) {
      return Response.json({ skipped: true, reason: 'No email found' });
    }

    const subject = isProvider
      ? 'Welcome to Grassgodz — Your application is under review!'
      : 'Welcome to Grassgodz — Book your first service!';

    const body_html = isProvider
      ? `
        <p>Hi ${name},</p>
        <p>Thanks for applying to join Grassgodz as a service provider! 🌿</p>
        <p>Our team will review your application and get back to you within 1–2 business days. Once approved, you'll be able to start accepting jobs in your area and earning weekly payouts.</p>
        <p>In the meantime, if you have any questions, reply to this email and we'll be happy to help.</p>
        <br/>
        <p>— The Grassgodz Team</p>
      `
      : `
        <p>Hi ${name},</p>
        <p>Welcome to Grassgodz! 🌱</p>
        <p>You're one step away from a beautifully maintained lawn. Here's how it works:</p>
        <ol>
          <li><strong>Request a service</strong> — pick what you need and describe your yard.</li>
          <li><strong>Get quotes</strong> — local vetted pros send you competitive offers.</li>
          <li><strong>Pay after completion</strong> — your card is only charged once the job is done.</li>
        </ol>
        <p>Log in now to book your first service and enjoy a hassle-free lawn care experience.</p>
        <br/>
        <p>— The Grassgodz Team</p>
      `;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: email,
      subject,
      body: body_html,
    });

    return Response.json({ success: true, sent_to: email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});