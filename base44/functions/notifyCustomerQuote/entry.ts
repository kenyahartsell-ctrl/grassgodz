import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { createMimeMessage } from 'npm:mimetext@3.0.19';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    // Only act on new quotes with status 'pending'
    if (!data || data.status !== 'pending') {
      return Response.json({ skipped: true });
    }

    // Fetch the related job to get customer info
    if (!data.job_id) return Response.json({ skipped: true, reason: 'no job_id on quote' });
    let job;
    try {
      job = await base44.asServiceRole.entities.Job.get(data.job_id);
    } catch (_) {
      return Response.json({ skipped: true, reason: 'job lookup failed' });
    }
    if (!job || !job.customer_email) {
      return Response.json({ skipped: true, reason: 'job or customer email not found' });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    const msg = createMimeMessage();
    msg.setSender({ name: 'Grassgodz', addr: 'noreply@grassgodz.com' });
    msg.setRecipient(job.customer_email);
    msg.setSubject(`New Quote Received for Your ${job.service_name} Request`);
    msg.addMessage({
      contentType: 'text/html',
      data: `
<p>Hi ${job.customer_name || 'there'},</p>
<p>Great news! <strong>${data.provider_name}</strong> has submitted a quote for your <strong>${job.service_name}</strong> request.</p>
<p><strong>Quote Details:</strong><br/>
Price: $${data.price}<br/>
Provider: ${data.provider_name}${data.message ? `<br/>Message: "${data.message}"` : ''}</p>
<p>Log in to your Grassgodz account to review and accept this quote.</p>
<p>Thanks,<br/>The Grassgodz Team</p>
      `.trim(),
    });

    const rawMessage = msg.asEncoded();
    const gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: rawMessage }),
    });

    if (!gmailRes.ok) {
      const err = await gmailRes.text();
      return Response.json({ error: `Gmail send failed: ${err}` }, { status: 500 });
    }

    return Response.json({ success: true, sent_to: job.customer_email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});