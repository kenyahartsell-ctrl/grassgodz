import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { data } = await req.json();

    // Only act when payment status is 'captured'
    if (!data || data.status !== 'captured') {
      return Response.json({ skipped: true });
    }

    // Fetch the related job to get customer info
    const job = await base44.asServiceRole.entities.Job.get(data.job_id);
    if (!job || !job.customer_email) {
      return Response.json({ error: 'Job or customer email not found' }, { status: 404 });
    }

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: job.customer_email,
      subject: `Payment Confirmed — ${job.service_name} Complete`,
      body: `
Hi ${job.customer_name || 'there'},

Your payment of <strong>$${data.amount?.toFixed(2)}</strong> for your <strong>${job.service_name}</strong> has been successfully processed. Your job is now complete!

<strong>Job Summary:</strong>
- Service: ${job.service_name}
- Provider: ${job.provider_name || 'Your Grassgodz Pro'}
- Amount Charged: $${data.amount?.toFixed(2)}

Thank you for using Grassgodz. We hope you love the results — don't forget to leave a review for your pro!

The Grassgodz Team
      `.trim(),
    });

    return Response.json({ success: true, sent_to: job.customer_email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});