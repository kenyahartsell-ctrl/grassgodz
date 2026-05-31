import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { job_id, customer_email, customer_name, service_name } = await req.json();

    if (!customer_email) {
      return Response.json({ skipped: true, reason: 'No customer email' });
    }

    const portalUrl = `https://grassgodz.base44.app/customer`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: customer_email,
      subject: `✅ Quote request received — ${service_name || 'Lawn Care'} | Grassgodz`,
      body: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
          <div style="background:#14532d;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
            <h1 style="color:#fff;margin:0;font-size:22px">Request Received! 🌿</h1>
            <p style="color:rgba(255,255,255,0.8);margin:8px 0 0">Providers are reviewing your request now</p>
          </div>

          <p style="color:#374151">Hi <strong>${customer_name || 'there'}</strong>,</p>
          <p style="color:#374151">Your quote request for <strong>${service_name || 'lawn care'}</strong> has been submitted to Grassgodz. Local professionals in your area are reviewing it and will respond with their availability and pricing shortly.</p>

          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin:20px 0;text-align:center">
            <p style="margin:0 0 12px;font-weight:600;color:#14532d;font-size:15px">View your quotes in your portal</p>
            <p style="margin:0 0 16px;color:#374151;font-size:13px">Once a provider responds, you'll see their quote and can accept or decline directly from your dashboard.</p>
            <a href="${portalUrl}" style="display:inline-block;background:#14532d;color:#fff;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:15px">
              View My Quotes →
            </a>
          </div>

          <p style="color:#6b7280;font-size:13px;margin-top:20px">
            <em>Note: This is not a confirmed booking. A provider must respond with a quote before your service is scheduled.</em>
          </p>

          <p style="color:#374151;margin-top:24px">Thanks for choosing Grassgodz!<br/><strong>The Grassgodz Team</strong></p>

          <p style="font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:16px;margin-top:24px">
            Grassgodz · Your trusted lawn care marketplace
          </p>
        </div>
      `,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});