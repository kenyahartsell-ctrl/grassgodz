import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const CANCEL_REASONS = [
  'Customer requested cancellation',
  'Customer no longer needs service',
  'Customer moved or wrong address',
  'Duplicate booking',
  'No payment method on file',
  'Provider unavailable',
  'Weather — customer cancelled',
  'Pricing dispute',
  'Other',
];

const CANCELLED_BY_OPTIONS = [
  { value: 'customer', label: 'Customer' },
  { value: 'provider', label: 'Provider' },
  { value: 'admin', label: 'Admin' },
  { value: 'system', label: 'System' },
];

export default function AdminCancelJobModal({ job, onClose, onCancelled }) {
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [cancelledBy, setCancelledBy] = useState('customer');
  const [saving, setSaving] = useState(false);

  const finalReason = reason === 'Other' ? customReason : reason;

  const handleCancel = async () => {
    if (!finalReason.trim()) {
      toast.error('Please select or enter a cancellation reason.');
      return;
    }
    setSaving(true);
    try {
      await base44.entities.Job.update(job.id, {
        status: 'cancelled',
        cancellation_reason: finalReason.trim(),
        cancelled_by: cancelledBy,
        cancelled_at: new Date().toISOString(),
      });
      toast.success('Job cancelled with reason saved.');
      onCancelled();
      onClose();
    } catch {
      toast.error('Failed to cancel job.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500" />
            <h2 className="font-bold text-foreground">Cancel Job</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 min-h-0">
          {/* Job summary */}
          <div className="bg-muted/40 rounded-xl px-4 py-3 text-sm">
            <p className="font-semibold text-foreground">{job.service_name}</p>
            <p className="text-muted-foreground text-xs mt-0.5">{job.customer_name} · {job.address || '—'}</p>
          </div>

          {/* Cancelled by */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-2">Cancelled by</label>
            <div className="flex gap-2 flex-wrap">
              {CANCELLED_BY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setCancelledBy(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    cancelledBy === opt.value
                      ? 'bg-red-100 text-red-800 border-red-300'
                      : 'bg-muted text-muted-foreground border-border hover:border-red-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reason selector */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-2">
              Reason for cancellation <span className="text-red-500">*</span>
            </label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {CANCEL_REASONS.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm border transition-colors ${
                    reason === r
                      ? 'bg-red-50 border-red-300 text-red-800 font-medium'
                      : 'border-border text-foreground hover:bg-muted/50'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Custom reason */}
          {reason === 'Other' && (
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Describe the reason</label>
              <textarea
                value={customReason}
                onChange={e => setCustomReason(e.target.value)}
                rows={3}
                placeholder="Enter details about why this job was cancelled..."
                className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 pb-5 pt-3 border-t border-border shrink-0">
          <Button variant="outline" onClick={onClose} className="flex-1">Keep Job</Button>
          <Button
            onClick={handleCancel}
            disabled={saving || !finalReason.trim()}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            {saving ? 'Cancelling...' : 'Confirm Cancel'}
          </Button>
        </div>
      </div>
    </div>
  );
}
