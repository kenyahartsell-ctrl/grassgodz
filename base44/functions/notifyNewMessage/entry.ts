import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { message, job } = await req.json();

    if (!message || !job) {
      return Response.json({ error: 'message and job required' }, { status: 400 });
    }

    const recipientEmail = message.sender_role === 'customer'
      ? job.provider_email
      : job.customer_email;

    const recipientName = message.sender_role === 'customer'
      ? job.provider_name
      : job.customer_name;

    const senderName = message.sender_role === 'customer'
      ? job.customer_name
      : job.provider_name;

    if (!recipientEmail) {
      return Response.json({ skipped: true, reason: 'No recipient email' });
    }

    const preview = message.body.length > 100
      ? message.body.substring(0, 100) + '...'
      : message.body;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: recipientEmail,
      subject: `New message from ${senderName} about ${job.service_name}`,
      body: `
        <p>Hi ${recipientName || 'there'},</p>
        <p>You have a new message about your <strong>${job.service_name}</strong> job:</p>
        <div style="background: #f5f5f5; border-left: 4px solid #2d6a2d; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #333; font-size: 14px;">"${preview}"</p>
        </div>
        <p>
          <a href="https://grassgodz.com/jobs/${job.id}"
             style="display: inline-block; background: #2d6a2d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            View Message &amp; Reply
          </a>
        </p>
        <p style="color: #666; font-size: 13px;">
          Tip: Stay in touch with your ${message.sender_role === 'customer' ? 'customer' : 'provider'} through Grassgodz messaging for the best experience.
        </p>
        <br/>
        <p>— The Grassgodz Team</p>
      `.trim(),
    });

    return Response.json({ success: true, sent_to: recipientEmail });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});