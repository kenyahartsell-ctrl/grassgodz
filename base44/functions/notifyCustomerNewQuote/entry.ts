import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

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

    const emailBody = `
Hi ${job.customer_name || 'there'},

You have a new quote for your <strong>${job.service_name}</strong> request!

<strong>Quote Details:</strong>
<ul>
  <li><strong>Provider:</strong> ${provider_name}</li>
  <li><strong>Price:</strong> $${price}</li>
  ${message ? `<li><strong>Message:</strong> "${message}"</li>` : ''}
</ul>

Log in to your Grassgodz account to review and accept this quote. Quotes are time-sensitive — don't wait too long!

Thanks,<br/>
The Grassgodz Team
    `.trim();

    // Notify the customer
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: job.customer_email,
      subject: `New quote received for your ${job.service_name} request 💬`,
      body: emailBody,
    });

    // Also notify admin
    const adminUsers = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
    for (const admin of adminUsers) {
      if (admin.email) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: admin.email,
          subject: `[Admin] New quote submitted — ${job.service_name} for ${job.customer_name || job.customer_email}`,
          body: `
<strong>New quote submitted</strong><br/><br/>
<strong>Job:</strong> ${job.service_name}<br/>
<strong>Customer:</strong> ${job.customer_name || job.customer_email}<br/>
<strong>Provider:</strong> ${provider_name}<br/>
<strong>Price:</strong> $${price}<br/>
${message ? `<strong>Message:</strong> "${message}"<br/>` : ''}
<strong>Job ID:</strong> ${job_id}
          `.trim(),
        });
      }
    }

    return Response.json({ success: true, sent_to: job.customer_email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});