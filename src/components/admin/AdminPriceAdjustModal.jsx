import { useState } from 'react';
import { X, DollarSign, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AdminPriceAdjustModal({ payment, job, onClose, onSaved }) {
  const currentAmount = payment?.amount ?? job?.final_price ?? job?.quoted_price ?? '';
  const [newPrice, setNewPrice] = useState(currentAmount !== '' ? Number(currentAmount).toFixed(2) : '');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const price = parseFloat(newPrice);
    if (isNaN(price) || price < 0) { toast.error('Enter a valid price'); return; }
    if (!notes.trim()) { toast.error('Please add a note explaining the adjustment'); return; }

    setSaving(true);
    try {
      const platform_fee = parseFloat((price * 0.25).toFixed(2));
      const provider_payout = parseFloat((price * 0.75).toFixed(2));

      // Update job pricing
      if (job) {
        await base44.entities.Job.update(job.id, {
          final_price: price,
          quoted_price: price,
          platform_fee,
          provider_payout,
          provider_notes: notes,
        });
      }

      // Update payment record if exists
      if (payment) {
        await base44.entities.Payment.update(payment.id, {
          amount: price,
          platform_fee,
          payout_amount: provider_payout,
        });
      }

      toast.success('Price adjusted successfully');
      onSaved?.({ price, platform_fee, provider_payout, notes });
      onClose();
    } catch {
      toast.error('Failed to save price adjustment');
    } finally {
      setSaving(false);
    }
  };

  const price = parseFloat(newPrice);
  const valid = !isNaN(price) && price >= 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-base font-bold text-foreground">Adjust Final Price</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {job ? `${job.service_name} · ${job.customer_name}` : `Payment #${payment?.id?.slice(0, 8)}`}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Current pricing summary */}
          <div className="bg-muted/40 rounded-xl p-4 text-sm space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Current Pricing</p>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total charged</span>
              <span className="font-semibold">{currentAmount !== '' ? `$${Number(currentAmount).toFixed(2)}` : '—'}</span>
            </div>
            {payment?.platform_fee != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform fee (25%)</span>
                <span className="font-semibold">${Number(payment.platform_fee).toFixed(2)}</span>
              </div>
            )}
            {payment?.payout_amount != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Provider payout (75%)</span>
                <span className="font-semibold">${Number(payment.payout_amount).toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* New price input */}
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1.5">New Final Price</label>
            <div className="flex items-center border border-input rounded-xl overflow-hidden bg-background focus-within:ring-2 focus-within:ring-ring">
              <span className="px-3 text-muted-foreground font-medium">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newPrice}
                onChange={e => setNewPrice(e.target.value)}
                placeholder="0.00"
                className="flex-1 py-2.5 pr-3 text-sm bg-transparent focus:outline-none"
                autoFocus
              />
            </div>
            {valid && newPrice && (
              <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                <span>Platform fee: <strong className="text-foreground">${(price * 0.25).toFixed(2)}</strong></span>
                <span>Provider payout: <strong className="text-foreground">${(price * 0.75).toFixed(2)}</strong></span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1.5">Admin Notes <span className="text-destructive">*</span></label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Reason for adjustment (e.g. job done outside portal, discount applied, correction...)"
              className="w-full border border-input rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !valid || !notes.trim()}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check size={14} />
              {saving ? 'Saving...' : 'Save Adjustment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}