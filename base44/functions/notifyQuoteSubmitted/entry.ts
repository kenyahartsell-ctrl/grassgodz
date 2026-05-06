import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { job_id, customer_email, customer_name, service_name } = await req.json();

    if (!customer_email) {
      return Response.json({ skipped: true, reason: 'No customer email' });
    }

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: customer_email,
      subject: `Your quote request was received — ${service_name || 'Lawn Care'}`,
      body: `
        <p>Hi ${customer_name || 'there'},</p>
        <p>Great news — your quote request for <strong>${service_name || 'lawn care'}</strong> has been received by Grassgodz! 🌿</p>
        <p>Local lawn care professionals in your area are reviewing your request. You'll hear back with availability and pricing soon.</p>
        <p><em>Please note: This quote is not a guaranteed price. It allows lawn care professionals in your area to review your request and respond with their availability and final pricing.</em></p>
        <p>You can track your quotes and manage your jobs anytime by logging into your account.</p>
        <br/>
        <p>— The Grassgodz Team</p>
      `,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});