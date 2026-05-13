import { useState } from 'react';
import { X, DollarSign, Check, ChevronDown, ChevronUp } from 'lucide-react';
import StatusBadge from '@/components/shared/StatusBadge';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

function JobPricingForm({ job }) {
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState(job.final_price ?? job.quoted_price ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const p = parseFloat(price);
    if (isNaN(p) || p < 0) { toast.error('Enter a valid price'); return; }
    setSaving(true);
    try {
      const platform_fee = parseFloat((p * 0.25).toFixed(2));
      const provider_payout = parseFloat((p * 0.75).toFixed(2));
      await base44.entities.Job.update(job.id, {
        final_price: p,
        quoted_price: p,
        platform_fee,
        provider_payout,
      });
      job.final_price = p;
      job.quoted_price = p;
      toast.success('Final pricing saved!');
      setOpen(false);
    } catch {
      toast.error('Failed to save pricing');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
      >
        <DollarSign size={11} />
        {open ? 'Cancel' : 'Set Final Price'}
        {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>

      {open && (
        <div className="mt-2 bg-muted/30 border border-border rounded-lg p-3 space-y-2">
          <p className="text-xs text-muted-foreground">Enter the final job price. Platform fee (25%) and provider payout (75%) will be calculated automatically.</p>
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-input rounded-lg overflow-hidden bg-background flex-1">
              <span className="px-2 text-sm text-muted-foreground">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="0.00"
                className="flex-1 py-1.5 pr-2 text-sm bg-transparent focus:outline-none"
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Check size={12} />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
          {price && !isNaN(parseFloat(price)) && (
            <div className="text-xs text-muted-foreground flex gap-4">
              <span>Platform: <strong>${(parseFloat(price) * 0.25).toFixed(2)}</strong></span>
              <span>Provider payout: <strong>${(parseFloat(price) * 0.75).toFixed(2)}</strong></span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CustomerDetailModal({ customer, jobs, quotes, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-foreground">{customer.name || 'Customer'}</h2>
            <p className="text-xs text-muted-foreground">{customer.user_email}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto p-5 space-y-5">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Contact</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium ml-1">{customer.phone || '—'}</span></div>
              <div><span className="text-muted-foreground">ZIP:</span> <span className="font-medium ml-1">{customer.zip_code || '—'}</span></div>
              <div className="col-span-2"><span className="text-muted-foreground">Service Address:</span> <span className="font-medium ml-1">{customer.service_address || '—'}</span></div>
              <div className="col-span-2"><span className="text-muted-foreground">Billing Address:</span> <span className="font-medium ml-1">{customer.billing_address || '—'}</span></div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Jobs ({jobs.length})</p>
            {jobs.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No jobs.</p>
            ) : (
              <div className="space-y-2">
                {jobs.map(j => {
                  const jobQuotes = quotes.filter(q => q.job_id === j.id);
                  return (
                    <div key={j.id} className="border border-border rounded-lg p-3 text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold">{j.service_name}</span>
                        <StatusBadge status={j.status} />
                      </div>
                      <p className="text-xs text-muted-foreground">{j.scheduled_date ? new Date(j.scheduled_date).toLocaleDateString() : '—'} · {j.address}</p>
                      {j.quoted_price && <p className="text-xs font-semibold text-primary mt-0.5">${j.quoted_price} quoted</p>}
                      {j.final_price && j.final_price !== j.quoted_price && (
                        <p className="text-xs font-semibold text-green-700 mt-0.5">${j.final_price.toFixed(2)} final</p>
                      )}
                      {j.provider_name && <p className="text-xs text-muted-foreground">Provider: {j.provider_name}</p>}
                      {jobQuotes.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-border space-y-1">
                          {jobQuotes.map(q => (
                            <div key={q.id} className="flex justify-between text-xs">
                              <span>{q.provider_name}</span>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-primary">${q.price}</span>
                                <StatusBadge status={q.status} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <JobPricingForm job={j} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}