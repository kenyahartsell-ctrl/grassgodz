import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ADMIN_EMAIL = 'kenyahartsell@gmail.com';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { data, event } = body;

    const applicantEmail = data?.user_email;
    const name = data?.name || 'Someone';
    const isProvider = event?.entity_name === 'ProviderProfile';

    if (!applicantEmail) {
      return Response.json({ skipped: true, reason: 'No email found' });
    }

    if (isProvider) {
      // Notify admin of new provider application
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: ADMIN_EMAIL,
        subject: `New Provider Application — ${name}`,
        body: `
          <p>Hi Kenya,</p>
          <p>A new provider just submitted an application on Grassgodz:</p>
          <ul>
            <li><strong>Name:</strong> ${name}</li>
            <li><strong>Email:</strong> ${applicantEmail}</li>
            <li><strong>Business:</strong> ${data?.business_name || '—'}</li>
            <li><strong>Experience:</strong> ${data?.years_experience || '—'} years</li>
            <li><strong>Service ZIPs:</strong> ${(data?.service_zip_codes || []).join(', ') || '—'}</li>
            <li><strong>Bio:</strong> ${data?.bio || '—'}</li>
          </ul>
          <p>Log in to the admin portal to review and approve or reject this application.</p>
          <br/>
          <p>— Grassgodz Platform</p>
        `,
      });

      // Try to send welcome email to the applicant (only works if they're a registered user)
      try {
        const users = await base44.asServiceRole.entities.User.filter({ email: applicantEmail });
        if (users && users.length > 0) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: applicantEmail,
            subject: 'Your Grassgodz application is under review!',
            body: `
              <p>Hi ${name},</p>
              <p>Thanks for applying to join Grassgodz as a service provider! 🌿</p>
              <p>Our team will review your application and get back to you within 1–2 business days. Once approved, you'll be able to start accepting jobs in your area and earning weekly payouts.</p>
              <p>If you have any questions, feel free to reach out to us.</p>
              <br/>
              <p>— The Grassgodz Team</p>
            `,
          });
        }
      } catch (_) {
        // Applicant not yet a registered user — admin notification already sent above
      }

    } else {
      // Customer welcome — only send if they're a registered user
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: applicantEmail,
          subject: 'Welcome to Grassgodz — Book your first service!',
          body: `
            <p>Hi ${name},</p>
            <p>Welcome to Grassgodz! 🌱</p>
            <p>You're one step away from a beautifully maintained lawn. Here's how it works:</p>
            <ol>
              <li><strong>Request a service</strong> — pick what you need and describe your yard.</li>
              <li><strong>Get quotes</strong> — local vetted pros send you competitive offers.</li>
              <li><strong>Pay after completion</strong> — your card is only charged once the job is done.</li>
            </ol>
            <p>Log in now to book your first service!</p>
            <br/>
            <p>— The Grassgodz Team</p>
          `,
        });
      } catch (_) {
        // Not a registered user yet, skip
      }

      // Also notify admin of new customer signup
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: ADMIN_EMAIL,
        subject: `New Customer Signup — ${name}`,
        body: `
          <p>A new customer just created a profile on Grassgodz:</p>
          <ul>
            <li><strong>Name:</strong> ${name}</li>
            <li><strong>Email:</strong> ${applicantEmail}</li>
            <li><strong>ZIP:</strong> ${data?.zip_code || '—'}</li>
            <li><strong>Address:</strong> ${data?.service_address || '—'}</li>
          </ul>
          <br/>
          <p>— Grassgodz Platform</p>
        `,
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});