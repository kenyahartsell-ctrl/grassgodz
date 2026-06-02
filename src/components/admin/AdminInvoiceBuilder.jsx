import { useState, useEffect } from 'react';
import { Plus, Trash2, Link, Send, FileText, ChevronDown, ChevronUp, Save, ExternalLink } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const TAX_RATE = 0.06;

const EMPTY_LINE = { description: '', type: 'labor', quantity: 1, unit_price: 0, line_total: 0 };

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

function calcTotals(lineItems, applyTax = true) {
  const labor = lineItems.filter(l => l.type === 'labor').reduce((s, l) => s + (l.line_total || 0), 0);
  const supplies = lineItems.filter(l => l.type === 'supply').reduce((s, l) => s + (l.line_total || 0), 0);
  const subtotal = labor + supplies;
  const tax = applyTax ? subtotal * TAX_RATE : 0;
  return { labor_subtotal: labor, supplies_subtotal: supplies, subtotal, tax_amount: tax, total: subtotal + tax };
}

function LineItemRow({ item, index, onChange, onRemove }) {
  const update = (field, val) => {
    const updated = { ...item, [field]: val };
    if (field === 'quantity' || field === 'unit_price') {
      updated.line_total = (Number(updated.quantity) || 0) * (Number(updated.unit_price) || 0);
    }
    onChange(index, updated);
  };

  return (
    <div className="grid grid-cols-12 gap-2 items-center">
      <input
        className="col-span-4 border border-input rounded-lg px-3 py-2 text-sm bg-background"
        placeholder="Description"
        value={item.description}
        onChange={e => update('description', e.target.value)}
      />
      <select
        className="col-span-2 border border-input rounded-lg px-2 py-2 text-sm bg-background"
        value={item.type}
        onChange={e => update('type', e.target.value)}
      >
        <option value="labor">Labor</option>
        <option value="supply">Supply</option>
      </select>
      <input
        type="number" min="1" step="1"
        className="col-span-2 border border-input rounded-lg px-2 py-2 text-sm bg-background"
        placeholder="Qty"
        value={item.quantity}
        onChange={e => update('quantity', e.target.value)}
      />
      <input
        type="number" min="0" step="0.01"
        className="col-span-2 border border-input rounded-lg px-2 py-2 text-sm bg-background"
        placeholder="Unit $"
        value={item.unit_price}
        onChange={e => update('unit_price', e.target.value)}
      />
      <div className="col-span-1 text-sm font-medium text-foreground text-right">
        ${(item.line_total || 0).toFixed(2)}
      </div>
      <button onClick={() => onRemove(index)} className="col-span-1 flex justify-center text-destructive hover:text-destructive/80">
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function InvoiceForm({ jobs, onSaved, onCancel, editingInvoice }) {
  const [form, setForm] = useState(editingInvoice ? {
    customer_name: editingInvoice.customer_name || '',
    customer_email: editingInvoice.customer_email || '',
    service_address: editingInvoice.service_address || '',
    service_description: editingInvoice.service_description || '',
    job_id: editingInvoice.job_id || '',
    notes: editingInvoice.notes || '',
    status: editingInvoice.status || 'draft',
    line_items: editingInvoice.line_items?.length ? editingInvoice.line_items : [{ ...EMPTY_LINE }],
  } : {
    customer_name: '',
    customer_email: '',
    service_address: '',
    service_description: '',
    job_id: '',
    notes: '',
    status: 'draft',
    line_items: [{ ...EMPTY_LINE }],
  });
  const [saving, setSaving] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [sending, setSending] = useState(false);
  const [savedInvoiceId, setSavedInvoiceId] = useState(editingInvoice?.id || null);
  const [paymentLink, setPaymentLink] = useState(editingInvoice?.stripe_payment_link || '');
  const [applyTax, setApplyTax] = useState(editingInvoice ? (editingInvoice.tax_rate > 0) : true);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleJobSelect = (jobId) => {
    set('job_id', jobId);
    if (jobId) {
      const job = jobs.find(j => j.id === jobId);
      if (job) {
        set('customer_name', job.customer_name || '');
        set('customer_email', job.customer_email || '');
        set('service_address', job.address || '');
        set('service_description', job.service_name || '');
      }
    }
  };

  const updateLineItem = (index, updated) => {
    const items = form.line_items.map((item, i) => i === index ? updated : item);
    set('line_items', items);
  };

  const removeLineItem = (index) => {
    set('line_items', form.line_items.filter((_, i) => i !== index));
  };

  const addLineItem = () => {
    set('line_items', [...form.line_items, { ...EMPTY_LINE }]);
  };

  const totals = calcTotals(form.line_items, applyTax);

  const buildPayload = () => ({
    ...form,
    ...totals,
    tax_rate: applyTax ? TAX_RATE : 0,
    created_by_admin: true,
    due_before_start: true,
    stripe_payment_link: paymentLink || undefined,
  });

  const handleSaveDraft = async () => {
    if (!form.customer_email) return toast.error('Customer email is required.');
    setSaving(true);
    try {
      const inv = savedInvoiceId
        ? await base44.entities.Invoice.update(savedInvoiceId, buildPayload())
        : await base44.entities.Invoice.create(buildPayload());
      setSavedInvoiceId(inv.id || savedInvoiceId);
      toast.success('Invoice saved as draft.');
      onSaved();
    } catch (e) {
      toast.error('Failed to save invoice.');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateLink = async () => {
    if (!form.customer_email) return toast.error('Customer email is required.');
    setGeneratingLink(true);
    try {
      // Save first
      const payload = buildPayload();
      const inv = savedInvoiceId
        ? await base44.entities.Invoice.update(savedInvoiceId, payload)
        : await base44.entities.Invoice.create(payload);
      const id = inv.id || savedInvoiceId;
      setSavedInvoiceId(id);

      const res = await base44.functions.invoke('createInvoicePaymentLink', { invoice_id: id });
      if (res.data?.error) {
        toast.error(res.data.error);
      } else if (res.data?.charged_card_on_file) {
        toast.success('Card on file charged! Invoice marked as paid.');
        onSaved();
        onCancel();
      } else if (res.data?.payment_link) {
        setPaymentLink(res.data.payment_link);
        toast.success('Payment link generated! (No card on file)');
        onSaved();
      } else {
        toast.error('Failed to generate link.');
      }
    } catch (e) {
      toast.error('Error generating payment link.');
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleSend = async () => {
    if (!paymentLink && !savedInvoiceId) return toast.error('Generate a payment link first.');
    setSending(true);
    try {
      // Ensure saved
      const payload = { ...buildPayload(), stripe_payment_link: paymentLink };
      const inv = savedInvoiceId
        ? await base44.entities.Invoice.update(savedInvoiceId, payload)
        : await base44.entities.Invoice.create(payload);
      const id = inv.id || savedInvoiceId;
      setSavedInvoiceId(id);

      const res = await base44.functions.invoke('sendInvoiceEmail', { invoice_id: id });
      if (res.data?.success) {
        toast.success('Invoice sent to customer!');
        onSaved();
        onCancel();
      } else {
        toast.error(res.data?.error || 'Failed to send invoice.');
      }
    } catch (e) {
      toast.error('Error sending invoice.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-5">
      <h3 className="font-bold text-foreground text-base">{editingInvoice ? 'Edit Invoice' : 'New Invoice'}</h3>

      {/* Client Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Client Name *</label>
          <input value={form.customer_name} onChange={e => set('customer_name', e.target.value)}
            className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Client Email *</label>
          <input type="email" value={form.customer_email} onChange={e => set('customer_email', e.target.value)}
            className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Service Address</label>
          <input value={form.service_address} onChange={e => set('service_address', e.target.value)}
            className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Service Description</label>
          <input value={form.service_description} onChange={e => set('service_description', e.target.value)}
            placeholder="e.g. Lawn Mowing — Front & Back"
            className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-muted-foreground block mb-1">Link to Existing Job (optional)</label>
          <select value={form.job_id} onChange={e => handleJobSelect(e.target.value)}
            className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background">
            <option value="">— No job linked —</option>
            {jobs.map(j => (
              <option key={j.id} value={j.id}>
                {j.customer_name} · {j.service_name} · {j.address}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Line Items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-foreground">Line Items</label>
          <div className="hidden sm:grid grid-cols-12 gap-2 text-xs text-muted-foreground w-full ml-4">
            <span className="col-span-4">Description</span>
            <span className="col-span-2">Type</span>
            <span className="col-span-2">Qty</span>
            <span className="col-span-2">Unit $</span>
            <span className="col-span-1 text-right">Total</span>
          </div>
        </div>
        <div className="space-y-2">
          {form.line_items.map((item, i) => (
            <LineItemRow key={i} item={item} index={i} onChange={updateLineItem} onRemove={removeLineItem} />
          ))}
        </div>
        <button onClick={addLineItem} className="mt-2 flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
          <Plus size={13} /> Add Line Item
        </button>
      </div>

      {/* Totals */}
      <div className="bg-muted/30 rounded-xl p-4 space-y-1.5 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Labor Subtotal</span><span>${totals.labor_subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Supplies Subtotal</span><span>${totals.supplies_subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-foreground font-medium">
          <span>Subtotal</span><span>${totals.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center text-muted-foreground">
          <span>Sales Tax {applyTax ? '(6%)' : '(none)'}</span>
          <div className="flex items-center gap-2">
            <span>${totals.tax_amount.toFixed(2)}</span>
            <button
              onClick={() => setApplyTax(t => !t)}
              className={`text-xs font-semibold px-2 py-0.5 rounded-full border transition-colors ${applyTax ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'}`}
            >
              {applyTax ? 'Remove Tax' : '+ Add Tax'}
            </button>
          </div>
        </div>
        <div className="flex justify-between text-primary font-bold text-base border-t border-border pt-2 mt-1">
          <span>Total Due</span><span>${totals.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1">Notes</label>
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
          rows={2} placeholder="Job-specific details, instructions, etc."
          className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background resize-none" />
      </div>

      {paymentLink && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-800">
          <Link size={12} />
          <span className="flex-1 truncate">Payment link generated</span>
          <a href={paymentLink} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-semibold hover:underline">
            Open <ExternalLink size={11} />
          </a>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onCancel} size="sm">Cancel</Button>
        <Button type="button" variant="outline" onClick={handleSaveDraft} disabled={saving} size="sm">
          <Save size={13} /> {saving ? 'Saving...' : 'Save Draft'}
        </Button>
        <Button type="button" variant="outline" onClick={handleGenerateLink} disabled={generatingLink} size="sm">
          <Link size={13} /> {generatingLink ? 'Generating...' : 'Generate Payment Link'}
        </Button>
        <Button type="button" onClick={handleSend} disabled={sending || !paymentLink} size="sm">
          <Send size={13} /> {sending ? 'Sending...' : 'Send Invoice'}
        </Button>
      </div>
    </div>
  );
}

function InvoiceRow({ invoice, onRefresh, onEdit }) {
  const [expanded, setExpanded] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e) => {
    e.stopPropagation();
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

  const totals = {
    labor_subtotal: invoice.labor_subtotal || 0,
    supplies_subtotal: invoice.supplies_subtotal || 0,
    subtotal: invoice.subtotal || 0,
    tax_amount: invoice.tax_amount || 0,
    total: invoice.total || 0,
  };

  const handleGenerateLink = async () => {
    setGeneratingLink(true);
    try {
      const res = await base44.functions.invoke('createInvoicePaymentLink', { invoice_id: invoice.id });
      if (res.data?.error) {
        toast.error(res.data.error);
      } else if (res.data?.charged_card_on_file) {
        toast.success('Card on file charged successfully! Invoice marked as paid.');
        onRefresh();
      } else if (res.data?.payment_link) {
        toast.success('Payment link generated! (No card on file — link sent for manual payment)');
        onRefresh();
      } else {
        toast.error('Failed.');
      }
    } catch {
      toast.error('Error generating link.');
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleSend = async () => {
    setSending(true);
    try {
      const res = await base44.functions.invoke('sendInvoiceEmail', { invoice_id: invoice.id });
      if (res.data?.success) {
        toast.success('Invoice sent!');
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
    await base44.entities.Invoice.update(invoice.id, { status: 'paid' });
    if (invoice.job_id) {
      await base44.entities.Job.update(invoice.job_id, { status: 'scheduled' });
    }
    toast.success('Invoice marked as paid.');
    onRefresh();
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <FileText size={16} className="text-muted-foreground flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground">{invoice.customer_name || invoice.customer_email}</p>
          <p className="text-xs text-muted-foreground truncate">{invoice.service_description || 'No description'}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-sm text-foreground">${(invoice.total || 0).toFixed(2)}</p>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[invoice.status] || STATUS_COLORS.draft}`}>
            {invoice.status}
          </span>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
          title="Delete invoice"
        >
          <Trash2 size={14} />
        </button>
        {expanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
      </div>

      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
          {invoice.service_address && <p className="text-xs text-muted-foreground">{invoice.service_address}</p>}

          {(invoice.line_items || []).length > 0 && (
            <div className="space-y-1">
              {invoice.line_items.map((item, i) => (
                <div key={i} className="flex justify-between text-xs text-muted-foreground">
                  <span>{item.description} ({item.type}) × {item.quantity}</span>
                  <span>${(item.line_total || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="bg-muted/30 rounded-lg p-3 space-y-1 text-xs">
            <div className="flex justify-between text-muted-foreground"><span>Labor</span><span>${totals.labor_subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Supplies</span><span>${totals.supplies_subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-foreground"><span>Subtotal</span><span>${totals.subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>DC Sales Tax (6%)</span><span>${totals.tax_amount.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-primary text-sm border-t border-border pt-1 mt-1"><span>Total Due</span><span>${totals.total.toFixed(2)}</span></div>
          </div>

          {invoice.notes && <p className="text-xs text-muted-foreground italic">"{invoice.notes}"</p>}

          <div className="flex flex-wrap gap-2 pt-1">
            <button onClick={() => onEdit(invoice)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors">
              Edit
            </button>
            {!invoice.stripe_payment_link && (
              <button onClick={handleGenerateLink} disabled={generatingLink}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                <Link size={11} /> {generatingLink ? 'Generating...' : 'Generate Link'}
              </button>
            )}
            {invoice.stripe_payment_link && (
              <a href={invoice.stripe_payment_link} target="_blank" rel="noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
                <ExternalLink size={11} /> View Link
              </a>
            )}
            {invoice.status !== 'paid' && invoice.status !== 'cancelled' && invoice.customer_email && (
              <button onClick={handleSend} disabled={sending || !invoice.stripe_payment_link}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
                <Send size={11} /> {sending ? 'Sending...' : 'Resend Invoice'}
              </button>
            )}
            {invoice.status === 'sent' && (
              <button onClick={handleMarkPaid}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
                Mark as Paid
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminInvoiceBuilder({ allJobs }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);

  const loadInvoices = async () => {
    const data = await base44.entities.Invoice.list('-created_date');
    setInvoices(data);
    setLoading(false);
  };

  useEffect(() => { loadInvoices(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Invoices</h2>
          <p className="text-sm text-muted-foreground">{invoices.length} total · Create and send invoices to clients</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus size={14} /> New Invoice
        </Button>
      </div>

      {(showForm || editingInvoice) && (
        <InvoiceForm
          jobs={allJobs || []}
          onSaved={loadInvoices}
          onCancel={() => { setShowForm(false); setEditingInvoice(null); }}
          editingInvoice={editingInvoice}
        />
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-10">Loading...</p>
      ) : invoices.length === 0 && !showForm ? (
        <div className="text-center py-14 bg-card border border-dashed border-border rounded-xl">
          <FileText className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-muted-foreground font-medium">No invoices yet</p>
          <p className="text-sm text-muted-foreground mt-1">Create your first invoice above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map(inv => (
            <InvoiceRow key={inv.id} invoice={inv} onRefresh={loadInvoices} onEdit={(inv) => { setEditingInvoice(inv); setShowForm(false); }} />
          ))}
        </div>
      )}
    </div>
  );
}