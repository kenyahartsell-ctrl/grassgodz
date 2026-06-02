import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { invoice_id } = await req.json();

    const invoices = await base44.asServiceRole.entities.Invoice.filter({ id: invoice_id });
    if (!invoices || invoices.length === 0) {
      return Response.json({ error: 'Invoice not found' }, { status: 404 });
    }
    const inv = invoices[0];

    if (!inv.stripe_payment_link) {
      return Response.json({ error: 'Generate a payment link before sending.' }, { status: 400 });
    }

    if (!inv.customer_email) {
      return Response.json({ error: 'No customer email on file. Copy the link and send it manually.' }, { status: 400 });
    }

    const formatCurrency = (n) => `$${(n || 0).toFixed(2)}`;

    const lineItemsHtml = (inv.line_items || []).map(item => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;">${item.description}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.type === 'labor' ? 'Labor' : 'Supply'}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatCurrency(item.unit_price)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatCurrency(item.line_total)}</td>
      </tr>
    `).join('');

    const body = `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
        <div style="background:#166534;padding:24px 32px;">
          <h1 style="color:#fff;margin:0;font-size:22px;">Invoice from GrassGodz</h1>
        </div>
        <div style="padding:24px 32px;">
          <p style="color:#374151;">Hi ${inv.customer_name || inv.customer_email},</p>
          <p style="color:#374151;">Please find your invoice details below.</p>
          ${inv.service_description ? `<p style="color:#6b7280;font-size:14px;"><strong>Service:</strong> ${inv.service_description}</p>` : ''}
          ${inv.service_address ? `<p style="color:#6b7280;font-size:14px;"><strong>Address:</strong> ${inv.service_address}</p>` : ''}

          <table style="width:100%;border-collapse:collapse;margin-top:16px;">
            <thead>
              <tr style="background:#f9fafb;">
                <th style="padding:8px;text-align:left;font-size:12px;color:#6b7280;border-bottom:2px solid #e5e7eb;">Description</th>
                <th style="padding:8px;text-align:center;font-size:12px;color:#6b7280;border-bottom:2px solid #e5e7eb;">Type</th>
                <th style="padding:8px;text-align:center;font-size:12px;color:#6b7280;border-bottom:2px solid #e5e7eb;">Qty</th>
                <th style="padding:8px;text-align:right;font-size:12px;color:#6b7280;border-bottom:2px solid #e5e7eb;">Unit Price</th>
                <th style="padding:8px;text-align:right;font-size:12px;color:#6b7280;border-bottom:2px solid #e5e7eb;">Total</th>
              </tr>
            </thead>
            <tbody>${lineItemsHtml}</tbody>
          </table>

          <div style="margin-top:16px;border-top:1px solid #e5e7eb;padding-top:12px;">
            <div style="display:flex;justify-content:space-between;padding:4px 0;color:#6b7280;font-size:14px;">
              <span>Labor Subtotal</span><span>${formatCurrency(inv.labor_subtotal)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:4px 0;color:#6b7280;font-size:14px;">
              <span>Supplies Subtotal</span><span>${formatCurrency(inv.supplies_subtotal)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:4px 0;color:#374151;font-size:14px;">
              <span>Subtotal</span><span>${formatCurrency(inv.subtotal)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:4px 0;color:#6b7280;font-size:14px;">
              <span>DC Sales Tax (6%)</span><span>${formatCurrency(inv.tax_amount)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;font-weight:700;font-size:16px;color:#166534;border-top:2px solid #e5e7eb;margin-top:4px;">
              <span>Total Due</span><span>${formatCurrency(inv.total)}</span>
            </div>
          </div>

          ${inv.notes ? `<div style="margin-top:16px;background:#f9fafb;border-radius:8px;padding:12px;color:#374151;font-size:14px;"><strong>Notes:</strong> ${inv.notes}</div>` : ''}

          <div style="margin-top:24px;text-align:center;">
            <a href="${inv.stripe_payment_link}" style="background:#166534;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block;">
              Pay Now — ${formatCurrency(inv.total)}
            </a>
          </div>
          <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:16px;">GrassGodz · Washington DC Lawn Care</p>
        </div>
      </div>
    `;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: inv.customer_email,
      subject: `Invoice from GrassGodz — ${formatCurrency(inv.total)} Due`,
      body,
    });

    await base44.asServiceRole.entities.Invoice.update(inv.id, { status: 'sent' });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});