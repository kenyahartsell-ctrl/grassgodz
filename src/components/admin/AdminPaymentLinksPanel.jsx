import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Plus, ExternalLink, Send, CheckCircle2, Clock, XCircle, Link as LinkIcon, Copy, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import AdminInvoiceBuilder from './AdminInvoiceBuilder';

const STATUS_CONFIG = {
  draft:     { label: 'Draft',     color: 'bg-gray-100 text-gray-600',    icon: Clock },
  sent:      { label: 'Sent',      color: 'bg-blue-100 text-blue-800',    icon: Send },
  paid:      { label: 'Paid',      color: 'bg-green-100 text-green-800',  icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800',      icon: XCircle },
};

function PaymentLinkRow({ invoice, onRefresh }) {
  const [sending, setSending] = useState(false);
  const [marking, setMarking] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`Delete invoice for ${invoice.customer_name || invoice.customer_email}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await base44.entities.Invoice.delete(invoice.id);
      toast.success('Invoice deleted.');
      onRefresh();
    } catch {
      toast.error('Failed to delete invoice.');
    } finally {
      setDeleting(false);
    }
  };

  const cfg = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.draft;
  const Icon = cfg.icon;

  const handleGenerateLink = async () => {
    setGeneratingLink(true);
    try {
      const res = await base44.functions.invoke('createInvoicePaymentLink', { invoice_id: invoice.id });
      if (res.data?.error) {
        toast.error(res.data.error);
      } else if (res.data?.charged_card_on_file) {
        toast.success('Card on file charged! Invoice marked as paid.');
        onRefresh();
      } else if (res.data?.payment_link) {
        toast.success('Payment link generated! (No card on file — link ready to share)');
        onRefresh();
      } else {
        toast.error('Failed to generate link.');
      }
    } catch {
      toast.error('Error generating link.');
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleResend = async () => {
    setSending(true);
    try {
      const res = await base44.functions.invoke('sendInvoiceEmail', { invoice_id: invoice.id });
      if (res.data?.success) {
        toast.success('Invoice resent!');
        onRefresh();
      } else {
        toast.error(res.data?.error || 'Failed to send.');
      }
    } catch {
      toast.error('Error sending invoice.');
    } finally {
      setSending(false);
    }
  };

  const handleMarkPaid = async () => {
    setMarking(true);
    try {
      await base44.entities.Invoice.update(invoice.id, { status: 'paid' });
      if (invoice.job_id) {
        await base44.entities.Job.update(invoice.job_id, { status: 'scheduled' });
      }
      toast.success('Marked as paid.');
      onRefresh();
    } catch {
      toast.error('Failed to mark as paid.');
    } finally {
      setMarking(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(invoice.stripe_payment_link);
    toast.success('Link copied!');
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        {/* Left: customer & description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm text-foreground">{invoice.customer_name || invoice.customer_email}</p>
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
              <Icon size={10} />
              {cfg.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{invoice.service_description || invoice.service_address || '—'}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{invoice.customer_email}</p>
          <p className="text-xs text-muted-foreground">{format(new Date(invoice.created_date), 'MMM d, yyyy')}</p>
        </div>

        {/* Right: amount */}
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-base text-foreground">${(invoice.total || 0).toFixed(2)}</p>
          {invoice.stripe_payment_link ? (
            <span className="text-xs text-green-600 flex items-center gap-1 justify-end mt-0.5">
              <LinkIcon size={10} /> Link ready
            </span>
          ) : (
            <span className="text-xs text-muted-foreground mt-0.5 block">No link yet</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mt-3">
        {!invoice.stripe_payment_link && invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
          <button
            onClick={handleGenerateLink}
            disabled={generatingLink}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-muted rounded-lg hover:bg-muted/80 transition-colors disabled:opacity-50"
          >
            <LinkIcon size={11} /> {generatingLink ? 'Generating...' : 'Generate Link'}
          </button>
        )}
        {invoice.stripe_payment_link && (
          <>
            <a
              href={invoice.stripe_payment_link}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <ExternalLink size={11} /> Open Link
            </a>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-muted rounded-lg hover:bg-muted/80 transition-colors"
            >
              <Copy size={11} /> Copy Link
            </button>
          </>
        )}
        {invoice.status !== 'paid' && invoice.status !== 'cancelled' && invoice.stripe_payment_link && invoice.customer_email && (
          <button
            onClick={handleResend}
            disabled={sending}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Send size={11} /> {sending ? 'Sending...' : 'Resend Email'}
          </button>
        )}
        {invoice.stripe_payment_link && !invoice.customer_email && (
          <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
            No email — copy link to send manually
          </span>
        )}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 ml-auto"
          title="Delete invoice"
        >
          <Trash2 size={11} /> {deleting ? 'Deleting...' : 'Delete'}
        </button>
        {invoice.status === 'sent' && (
          <button
            onClick={handleMarkPaid}
            disabled={marking}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
          >
            <CheckCircle2 size={11} /> {marking ? 'Saving...' : 'Mark as Paid'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminPaymentLinksPanel({ allJobs }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showNewInvoice, setShowNewInvoice] = useState(false);

  const loadInvoices = async () => {
    const data = await base44.entities.Invoice.list('-created_date');
    setInvoices(data);
    setLoading(false);
  };

  useEffect(() => { loadInvoices(); }, []);

  const filtered = filter === 'all' ? invoices : invoices.filter(i => i.status === filter);

  const counts = {
    all: invoices.length,
    draft: invoices.filter(i => i.status === 'draft').length,
    sent: invoices.filter(i => i.status === 'sent').length,
    paid: invoices.filter(i => i.status === 'paid').length,
  };

  if (showNewInvoice) {
    return (
      <AdminInvoiceBuilder allJobs={allJobs} />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Payment Links</h2>
          <p className="text-sm text-muted-foreground">Track invoice status and see who has paid</p>
        </div>
        <Button size="sm" onClick={() => setShowNewInvoice(true)} className="flex items-center gap-2">
          <Plus size={14} /> New Invoice
        </Button>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { key: 'all', label: 'All', color: 'bg-muted text-foreground' },
          { key: 'sent', label: 'Sent', color: 'bg-blue-50 text-blue-700 border border-blue-200' },
          { key: 'paid', label: 'Paid', color: 'bg-green-50 text-green-700 border border-green-200' },
          { key: 'draft', label: 'Draft', color: 'bg-gray-50 text-gray-600 border border-gray-200' },
        ].map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-xl p-3 text-center transition-all ${color} ${filter === key ? 'ring-2 ring-primary' : ''}`}
          >
            <p className="text-lg font-bold">{counts[key] ?? 0}</p>
            <p className="text-xs font-medium">{label}</p>
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-10">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-14 bg-card border border-dashed border-border rounded-xl">
          <LinkIcon className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-muted-foreground font-medium">No invoices{filter !== 'all' ? ` with status "${filter}"` : ''}</p>
          <p className="text-sm text-muted-foreground mt-1">Create one using the button above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(inv => (
            <PaymentLinkRow key={inv.id} invoice={inv} onRefresh={loadInvoices} />
          ))}
        </div>
      )}
    </div>
  );
}