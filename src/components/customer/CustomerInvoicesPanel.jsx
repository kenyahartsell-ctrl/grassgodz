import { useState, useEffect } from 'react';
import { FileText, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const STATUS_CONFIG = {
  draft:     { label: 'Draft',     cls: 'bg-gray-100 text-gray-600' },
  sent:      { label: 'Unpaid',    cls: 'bg-amber-100 text-amber-800' },
  paid:      { label: 'Paid',      cls: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', cls: 'bg-red-100 text-red-800' },
};

function InvoiceCard({ invoice }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.sent;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <FileText size={16} className="text-muted-foreground flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground">{invoice.service_description || 'Invoice'}</p>
          {invoice.service_address && (
            <p className="text-xs text-muted-foreground truncate">{invoice.service_address}</p>
          )}
        </div>
        <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
          <p className="font-bold text-sm text-foreground">${(invoice.total || 0).toFixed(2)}</p>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.cls}`}>{cfg.label}</span>
        </div>
        {expanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
      </div>

      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
          {/* Line Items */}
          {(invoice.line_items || []).length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b border-border">
                    <th className="text-left pb-1 font-medium">Description</th>
                    <th className="text-center pb-1 font-medium">Type</th>
                    <th className="text-center pb-1 font-medium">Qty</th>
                    <th className="text-right pb-1 font-medium">Unit</th>
                    <th className="text-right pb-1 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.line_items.map((item, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-1.5 pr-2">{item.description}</td>
                      <td className="py-1.5 text-center capitalize">{item.type}</td>
                      <td className="py-1.5 text-center">{item.quantity}</td>
                      <td className="py-1.5 text-right">${(item.unit_price || 0).toFixed(2)}</td>
                      <td className="py-1.5 text-right font-medium">${(item.line_total || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals Breakdown */}
          <div className="bg-muted/30 rounded-lg p-3 space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Labor Subtotal</span><span>${(invoice.labor_subtotal || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Supplies Subtotal</span><span>${(invoice.supplies_subtotal || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-foreground">
              <span>Subtotal</span><span>${(invoice.subtotal || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>DC Sales Tax (6%)</span><span>${(invoice.tax_amount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-primary border-t border-border pt-2 mt-1">
              <span>Total Due</span><span>${(invoice.total || 0).toFixed(2)}</span>
            </div>
          </div>

          {invoice.notes && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-800">
              <strong>Note:</strong> {invoice.notes}
            </div>
          )}

          {/* Pay Now button */}
          {invoice.status !== 'paid' && invoice.status !== 'cancelled' && invoice.stripe_payment_link && (
            <a
              href={invoice.stripe_payment_link}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition-colors text-sm"
            >
              <ExternalLink size={14} />
              Pay Now — ${(invoice.total || 0).toFixed(2)}
            </a>
          )}

          {invoice.status === 'paid' && (
            <div className="text-center text-xs font-semibold text-green-700 bg-green-50 rounded-lg py-2">
              ✓ Payment received — thank you!
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CustomerInvoicesPanel({ userEmail }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userEmail) return;
    base44.entities.Invoice.filter({ customer_email: userEmail })
      .then(data => {
        setInvoices(data.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
        setLoading(false);
      });
  }, [userEmail]);

  if (loading) return (
    <div className="text-center py-12 text-muted-foreground text-sm">Loading invoices...</div>
  );

  if (invoices.length === 0) return (
    <div className="text-center py-16">
      <FileText className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
      <p className="text-muted-foreground font-medium">No invoices yet</p>
      <p className="text-sm text-muted-foreground mt-1">Invoices from GrassGodz will appear here.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {invoices.map(inv => <InvoiceCard key={inv.id} invoice={inv} />)}
    </div>
  );
}