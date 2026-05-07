import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { createMimeMessage } from 'npm:mimetext@3.0.18';

const ADMIN_EMAIL = 'kenyahartsell@gmail.com';
const FROM_EMAIL = 'kenyahartsell@gmail.com';
const FROM_NAME = 'Grassgodz';

async function sendGmail(accessToken, to, subject, htmlBody) {
  const msg = createMimeMessage();
  msg.setSender({ name: FROM_NAME, addr: FROM_EMAIL });
  msg.setRecipient(to);
  msg.setSubject(subject);
  msg.addMessage({ contentType: 'text/html', data: htmlBody });

  const raw = msg.asEncoded(); // base64url encoded
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gmail send failed: ${err}`);
  }
  return res.json();
}

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

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    if (isProvider) {
      // Notify admin
      await sendGmail(accessToken, ADMIN_EMAIL, `New Provider Application — ${name}`, `
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
        <br/><p>— Grassgodz Platform</p>
      `);

      // Confirm to applicant
      await sendGmail(accessToken, applicantEmail, 'Your Grassgodz application is under review!', `
        <p>Hi ${name},</p>
        <p>Thanks for applying to join Grassgodz as a service provider! 🌿</p>
        <p>Our team will review your application and get back to you within 1–2 business days. Once approved, you'll be able to start accepting jobs in your area and earning weekly payouts.</p>
        <p>If you have any questions, feel free to reach out to us at <a href="mailto:pros@grassgodz.com">pros@grassgodz.com</a>.</p>
        <br/><p>— The Grassgodz Team</p>
      `);

    } else {
      // Customer welcome
      await sendGmail(accessToken, applicantEmail, 'Welcome to Grassgodz — Book your first service!', `
        <p>Hi ${name},</p>
        <p>Welcome to Grassgodz! 🌱</p>
        <p>You're one step away from a beautifully maintained lawn. Here's how it works:</p>
        <ol>
          <li><strong>Request a service</strong> — pick what you need and describe your yard.</li>
          <li><strong>Get quotes</strong> — local vetted pros send you competitive offers.</li>
          <li><strong>Pay after completion</strong> — your card is only charged once the job is done.</li>
        </ol>
        <p>Log in now to book your first service!</p>
        <br/><p>— The Grassgodz Team</p>
      `);

      // Notify admin of new customer
      await sendGmail(accessToken, ADMIN_EMAIL, `New Customer Signup — ${name}`, `
        <p>A new customer just created a profile on Grassgodz:</p>
        <ul>
          <li><strong>Name:</strong> ${name}</li>
          <li><strong>Email:</strong> ${applicantEmail}</li>
          <li><strong>ZIP:</strong> ${data?.zip_code || '—'}</li>
          <li><strong>Address:</strong> ${data?.service_address || '—'}</li>
        </ul>
        <br/><p>— Grassgodz Platform</p>
      `);
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});