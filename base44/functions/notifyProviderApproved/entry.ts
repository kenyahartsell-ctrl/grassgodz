import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { createMimeMessage } from 'npm:mimetext@3.0.18';

const FROM_EMAIL = 'kenyahartsell@gmail.com';
const FROM_NAME = 'Grassgodz';
const APP_URL = 'https://grassgodz.com';

async function sendGmail(accessToken, to, subject, htmlBody) {
  const msg = createMimeMessage();
  msg.setSender({ name: FROM_NAME, addr: FROM_EMAIL });
  msg.setRecipient(to);
  msg.setSubject(subject);
  msg.addMessage({ contentType: 'text/html', data: htmlBody });

  const raw = msg.asEncoded();
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
    const { provider_id } = await req.json();

    if (!provider_id) {
      return Response.json({ error: 'provider_id required' }, { status: 400 });
    }

    const providers = await base44.asServiceRole.entities.ProviderProfile.filter({ id: provider_id });
    const provider = providers[0];
    if (!provider) {
      return Response.json({ error: 'Provider not found' }, { status: 404 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    await sendGmail(
      accessToken,
      provider.user_email,
      '🎉 You\'re approved! Welcome to Grassgodz',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2D6A2D;">Congratulations, ${provider.name || 'there'}!</h2>
          <p>Great news — your Grassgodz provider application has been <strong>approved</strong>. You're officially part of the team! 🌿</p>
          <p>You can now sign in to your provider portal to start browsing available jobs in your area, submit quotes, and earn weekly payouts.</p>
          <div style="margin: 24px 0;">
            <a href="${APP_URL}" style="background-color: #2D6A2D; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Sign In to Your Portal →
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">If you haven't set up your password yet, click "Forgot Password" on the sign-in page and use the email address you applied with: <strong>${provider.user_email}</strong></p>
          <p style="color: #666; font-size: 14px;">Questions? Reply to this email or reach us at <a href="mailto:pros@grassgodz.com">pros@grassgodz.com</a></p>
          <br/>
          <p>— The Grassgodz Team</p>
        </div>
      `
    );

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});