import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { customerEmail, customerName, customerPhone, address, total, frequency, breakdown } = await req.json();

    const breakdownHtml = breakdown.map(line =>
      `<tr>
        <td style="padding:4px 0;color:${line.green ? '#16a34a' : '#6b7280'}">${line.label}</td>
        <td style="padding:4px 0;text-align:right;font-weight:600;color:${line.green ? '#16a34a' : '#111'}">
          ${line.amount < 0 ? '-$' + Math.abs(line.amount) : '$' + line.amount}
        </td>
      </tr>`
    ).join('');

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: customerEmail,
      subject: 'Your Grassgodz Booking is Confirmed! 🌿',
      body: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
          <div style="background:#14532d;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
            <h1 style="color:#fff;margin:0;font-size:22px">Booking Confirmed!</h1>
            <p style="color:rgba(255,255,255,0.75);margin:8px 0 0">Your lawn care service has been scheduled.</p>
          </div>

          <p style="color:#374151">Hi <strong>${customerName}</strong>,</p>
          <p style="color:#374151">Thank you for booking with Grassgodz! Here's a summary of your order:</p>

          <div style="background:#f9fafb;border-radius:12px;padding:20px;margin:20px 0">
            <table style="width:100%;border-collapse:collapse">
              ${breakdownHtml}
              <tr style="border-top:1px solid #e5e7eb;margin-top:8px">
                <td style="padding:12px 0 4px;font-weight:700;font-size:16px">Total Charged</td>
                <td style="padding:12px 0 4px;text-align:right;font-weight:700;font-size:18px;color:#14532d">$${total}</td>
              </tr>
            </table>
          </div>

          <div style="background:#f0fdf4;border-radius:12px;padding:16px;margin-bottom:20px">
            <p style="margin:0 0 6px;font-weight:600;color:#14532d">Service Address</p>
            <p style="margin:0;color:#374151">${address}</p>
          </div>

          <p style="color:#374151">A local pro will be in touch at <strong>${customerPhone}</strong> to confirm the exact time. If you have any questions, reply to this email.</p>

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