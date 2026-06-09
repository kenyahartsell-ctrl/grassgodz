import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Scheduled daily — sends payment reminders for unpaid invoices.
// First reminder: 3+ days after invoice sent (reminder_count = 0)
// Second (final) reminder: 7+ days after invoice sent (reminder_count = 1)
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // All unpaid sent invoices
    const sentInvoices = await base44.asServiceRole.entities.Invoice.filter({ status: 'sent' });

    if (!sentInvoices || sentInvoices.length === 0) {
      return Response.json({ message: 'No unpaid invoices', reminded: 0 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    let reminded = 0;
    const errors = [];

    for (const inv of sentInvoices) {
      try {
        const createdAt = new Date(inv.created_date);
        const reminderCount = inv.invoice_reminder_count || 0;

        const needsFirst  = reminderCount === 0 && createdAt <= threeDaysAgo;
        const needsFinal  = reminderCount === 1 && createdAt <= sevenDaysAgo;

        if (!needsFirst && !needsFinal) continue;
        if (!inv.customer_email || !inv.stripe_payment_link) continue;

        const isFinal = needsFinal;
        const subject = isFinal
          ? `Final reminder: Invoice from GrassGodz — $${(inv.total || 0).toFixed(2)} Due`
          : `Friendly reminder: Invoice from GrassGodz — $${(inv.total || 0).toFixed(2)} Due`;

        const urgencyHtml = isFinal
          ? `<p style="color:#dc2626;font-weight:600;margin-bottom:12px;">This is a final reminder. Please settle this invoice at your earliest convenience.</p>`
          : `<p style="color:#374151;margin-bottom:12px;">Just a friendly nudge — your invoice is still outstanding.</p>`;

        const htmlBody = `
<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
  <div style="background:#166534;padding:24px 32px;">
    <h1 style="color:#fff;margin:0;font-size:22px;">${isFinal ? 'Final Payment Reminder' : 'Payment Reminder'} — GrassGodz</h1>
  </div>
  <div style="padding:24px 32px;">
    <p style="color:#374151;">Hi ${inv.customer_name || inv.customer_email},</p>
    ${urgencyHtml}
    ${inv.service_description ? `<p style="color:#6b7280;font-size:14px;margin-bottom:4px;"><strong>Service:</strong> ${inv.service_description}</p>` : ''}
    ${inv.service_address   ? `<p style="color:#6b7280;font-size:14px;margin-bottom:16px;"><strong>Address:</strong> ${inv.service_address}</p>` : ''}
    <div style="border-top:1px solid #e5e7eb;padding-top:12px;margin-top:8px;">
      <div style="display:flex;justify-content:space-between;font-weight:700;font-size:18px;color:#166534;padding:8px 0;">
        <span>Total Due</span><span>$${(inv.total || 0).toFixed(2)}</span>
      </div>
    </div>
    <div style="margin-top:24px;text-align:center;">
      <a href="${inv.stripe_payment_link}" style="background:#166534;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block;">
        Pay Now — $${(inv.total || 0).toFixed(2)}
      </a>
    </div>
    <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:16px;">GrassGodz · Washington DC Lawn Care</p>
  </div>
</div>`;

        const raw = [
          `To: ${inv.customer_email}`,
          `Subject: ${subject}`,
          'MIME-Version: 1.0',
          'Content-Type: text/html; charset=utf-8',
          '',
          htmlBody,
        ].join('\r\n');

        const encoded = btoa(unescape(encodeURIComponent(raw)))
          .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

        const gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ raw: encoded }),
        });

        if (!gmailRes.ok) {
          const err = await gmailRes.text();
          errors.push({ id: inv.id, error: `Gmail: ${err}` });
          continue;
        }

        await base44.asServiceRole.entities.Invoice.update(inv.id, {
          invoice_reminder_count: reminderCount + 1,
          invoice_reminder_sent_at: now.toISOString(),
        });

        reminded++;
        console.log(`[sendInvoiceReminders] Sent reminder #${reminderCount + 1} to ${inv.customer_email} (invoice ${inv.id})`);
      } catch (e) {
        errors.push({ id: inv.id, error: e.message });
        console.warn(`[sendInvoiceReminders] Skipped invoice ${inv.id}: ${e.message}`);
      }
    }

    return Response.json({ success: true, reminded, errors });
  } catch (error) {
    console.error('[sendInvoiceReminders] Fatal:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
