import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import * as base64 from 'npm:base64-js@1.5.1';

function buildMimeMessage({ to, subject, htmlBody, fromName = 'Grassgodz' }) {
  const boundary = 'boundary_' + Math.random().toString(36).slice(2);
  const encodedSubject = `=?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const raw = [
    `From: ${fromName} <me>`,
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: quoted-printable`,
    ``,
    htmlBody,
    ``,
    `--${boundary}--`,
  ].join('\r\n');

  // URL-safe base64
  return btoa(unescape(encodeURIComponent(raw)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { data } = body;

    // Only act on new pending quotes
    if (!data || data.status !== 'pending') {
      return Response.json({ skipped: true, reason: 'Quote is not pending' });
    }

    const { job_id, provider_name, price, message } = data;

    if (!job_id) {
      return Response.json({ error: 'No job_id on quote' }, { status: 400 });
    }

    // Fetch the related job to get customer contact info
    const job = await base44.asServiceRole.entities.Job.get(job_id);
    if (!job || !job.customer_email) {
      return Response.json({ error: 'Job or customer email not found' }, { status: 404 });
    }

    // Get Gmail access token
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    const authHeader = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    const sendGmail = async (to, subject, htmlBody) => {
      const raw = buildMimeMessage({ to, subject, htmlBody });
      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({ raw }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Gmail send failed: ${err}`);
      }
      return res.json();
    };

    const customerHtml = `
<p>Hi ${job.customer_name || 'there'},</p>
<p>You have a new quote for your <strong>${job.service_name}</strong> request!</p>
<p><strong>Quote Details:</strong></p>
<ul>
  <li><strong>Provider:</strong> ${provider_name}</li>
  <li><strong>Price:</strong> $${price}</li>
  ${message ? `<li><strong>Message:</strong> "${message}"</li>` : ''}
</ul>
<p>Log in to your Grassgodz account to review and accept this quote. Quotes are time-sensitive — don't wait too long!</p>
<p>Thanks,<br/>The Grassgodz Team</p>
    `.trim();

    await sendGmail(
      job.customer_email,
      `New quote received for your ${job.service_name} request 💬`,
      customerHtml
    );

    // Also notify admin
    const adminUsers = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
    for (const admin of adminUsers) {
      if (admin.email) {
        const adminHtml = `
<p><strong>New quote submitted</strong></p>
<p><strong>Job:</strong> ${job.service_name}<br/>
<strong>Customer:</strong> ${job.customer_name || job.customer_email}<br/>
<strong>Provider:</strong> ${provider_name}<br/>
<strong>Price:</strong> $${price}<br/>
${message ? `<strong>Message:</strong> "${message}"<br/>` : ''}
<strong>Job ID:</strong> ${job_id}</p>
        `.trim();

        await sendGmail(
          admin.email,
          `[Admin] New quote submitted — ${job.service_name} for ${job.customer_name || job.customer_email}`,
          adminHtml
        );
      }
    }

    return Response.json({ success: true, sent_to: job.customer_email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});