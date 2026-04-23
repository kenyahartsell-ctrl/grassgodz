import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { data } = await req.json();

    if (!data || !data.customer_email) {
      return Response.json({ skipped: true });
    }

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: data.customer_email,
      subject: `Your ${data.service_name} Job Has Been Completed!`,
      body: `
Hi ${data.customer_name || 'there'},

Your <strong>${data.service_name}</strong> job has been marked as <strong>completed</strong> by <strong>${data.provider_name || 'your provider'}</strong>.

${data.final_price ? `<strong>Total Charged:</strong> $${data.final_price}` : ''}

We hope everything looks great! If you're happy with the service, please take a moment to leave a review on your Grassgodz account.

Thanks for choosing Grassgodz!
The Grassgodz Team
      `.trim(),
    });

    return Response.json({ success: true, sent_to: data.customer_email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});