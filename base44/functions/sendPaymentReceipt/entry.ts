import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function buildEmailBody(payment, job, customerEmail, customerName) {
  const amount = payment.amount?.toFixed(2) || '0.00';
  const platformFee = payment.platform_fee?.toFixed(2) || '0.00';
  const payoutAmount = payment.payout_amount?.toFixed(2) || '0.00';
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f5f5f0; margin: 0; padding: 0; }
    .wrapper { max-width: 560px; margin: 32px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #2d6a2d; padding: 32px 40px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 22px; margin: 0; font-weight: 700; letter-spacing: -0.3px; }
    .header p { color: rgba(255,255,255,0.75); font-size: 13px; margin: 6px 0 0; }
    .body { padding: 32px 40px; }
    .greeting { font-size: 15px; color: #1a1a1a; margin-bottom: 20px; }
    .amount-box { background: #f0f7f0; border: 1px solid #c8e0c8; border-radius: 10px; padding: 20px 24px; text-align: center; margin-bottom: 24px; }
    .amount-box .label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    .amount-box .amount { font-size: 40px; font-weight: 800; color: #2d6a2d; margin: 4px 0 0; }
    .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #9ca3af; margin-bottom: 10px; }
    .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
    .detail-row:last-child { border-bottom: none; }
    .detail-row .key { color: #6b7280; }
    .detail-row .val { font-weight: 600; color: #111827; }
    .badge { display: inline-block; background: #d1fae5; color: #065f46; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; }
    .footer { background: #f9fafb; padding: 20px 40px; text-align: center; border-top: 1px solid #f3f4f6; }
    .footer p { font-size: 12px; color: #9ca3af; margin: 0; line-height: 1.6; }
    .footer a { color: #2d6a2d; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🌿 Grassgodz</h1>
      <p>Payment Receipt</p>
    </div>
    <div class="body">
      <p class="greeting">Hi ${customerName || 'there'},<br/>Thank you for your payment! Here's your receipt for the service below.</p>

      <div class="amount-box">
        <div class="label">Amount Paid</div>
        <div class="amount">$${amount}</div>
      </div>

      <p class="section-title">Service Details</p>
      <div class="detail-row"><span class="key">Service</span><span class="val">${job?.service_name || '—'}</span></div>
      <div class="detail-row"><span class="key">Address</span><span class="val">${job?.address || '—'}</span></div>
      <div class="detail-row"><span class="key">Provider</span><span class="val">${job?.provider_name || '—'}</span></div>
      <div class="detail-row"><span class="key">Date</span><span class="val">${date}</span></div>
      <div class="detail-row"><span class="key">Status</span><span class="val"><span class="badge">✓ Paid</span></span></div>

      <br/>
      <p style="font-size:13px; color:#6b7280; line-height:1.6;">
        If you have any questions about this charge, please contact us at 
        <a href="mailto:support@grassgodz.com" style="color:#2d6a2d;">support@grassgodz.com</a>.
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Grassgodz LLC · All rights reserved<br/>
      <a href="mailto:support@grassgodz.com">support@grassgodz.com</a></p>
    </div>
  </div>
</body>
</html>`;
}

function buildMimeMessage(to, subject, htmlBody) {
  const boundary = 'boundary_grassgodz_' + Date.now();
  const raw = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    btoa(unescape(encodeURIComponent(htmlBody))),
    `--${boundary}--`,
  ].join('\r\n');

  return btoa(unescape(encodeURIComponent(raw)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Triggered by entity automation on Payment create
    const { data: payment } = body;

    if (!payment?.job_id) {
      return Response.json({ skipped: true, reason: 'No job_id on payment' });
    }

    // Fetch the related job to get customer info
    const jobs = await base44.asServiceRole.entities.Job.filter({ id: payment.job_id });
    const job = jobs[0];

    const customerEmail = job?.customer_email || payment.customer_id;
    const customerName = job?.customer_name || 'Valued Customer';

    if (!customerEmail || !customerEmail.includes('@')) {
      return Response.json({ skipped: true, reason: 'No valid customer email found' });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    const subject = `Your Grassgodz Receipt — $${payment.amount?.toFixed(2)}`;
    const htmlBody = buildEmailBody(payment, job, customerEmail, customerName);
    const encodedMessage = buildMimeMessage(customerEmail, subject, htmlBody);

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encodedMessage }),
    });

    if (!res.ok) {
      const err = await res.text();
      return Response.json({ error: err }, { status: 500 });
    }

    return Response.json({ success: true, sent_to: customerEmail });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});