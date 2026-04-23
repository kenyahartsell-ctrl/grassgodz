import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    // Only act on new quotes with status 'pending'
    if (!data || data.status !== 'pending') {
      return Response.json({ skipped: true });
    }

    // Fetch the related job to get customer info
    const job = await base44.asServiceRole.entities.Job.get(data.job_id);
    if (!job || !job.customer_email) {
      return Response.json({ error: 'Job or customer email not found' }, { status: 404 });
    }

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: job.customer_email,
      subject: `New Quote Received for Your ${job.service_name} Request`,
      body: `
Hi ${job.customer_name || 'there'},

Great news! <strong>${data.provider_name}</strong> has submitted a quote for your <strong>${job.service_name}</strong> request.

<strong>Quote Details:</strong>
- Price: $${data.price}
- Provider: ${data.provider_name}
${data.message ? `- Message: "${data.message}"` : ''}

Log in to your Grassgodz account to review and accept this quote.

Thanks,
The Grassgodz Team
      `.trim(),
    });

    return Response.json({ success: true, sent_to: job.customer_email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});