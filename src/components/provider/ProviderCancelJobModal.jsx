import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const CANCELLATION_REASONS = [
  'I cannot make it within the time window',
  'Emergency / personal issue',
  'Vehicle / equipment problem',
  'Job location issue',
  'Other',
];

export default function ProviderCancelJobModal({ job, onClose, onCancelled }) {
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const finalReason = reason === 'Other' ? customReason.trim() : reason;
    if (!finalReason) {
      toast.error('Please select a reason.');
      return;
    }

    setSubmitting(true);
    try {
      await base44.entities.Job.update(job.id, {
        // Reset provider assignment so job can be reassigned
        status: 'requested',
        provider_id: null,
        provider_name: null,
        provider_email: null,
        accepted_at: null,
        cancelled_by: 'provider',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: finalReason,
        // Increment cancellation count on the job for tracking
        provider_cancellation_count: (job.provider_cancellation_count || 0) + 1,
      });

      // Log cancellation against provider profile admin notes
      try {
        const profiles = await base44.entities.ProviderProfile.filter({ user_email: job.provider_email });
        if (profiles?.[0]) {
          const p = profiles[0];
          const note = `[${new Date().toLocaleDateString()}] Cancelled job "${job.service_name}" (ID: ${job.id}) after acceptance. Reason: ${finalReason}`;
          await base44.entities.ProviderProfile.update(p.id, {
            admin_notes: (p.admin_notes ? p.admin_notes + '\n' : '') + note,
          });
        }
      } catch (_) {
        // Non-critical — don't block cancellation
      }

      toast.success('Job cancelled. It will be made available for other providers.');
      onCancelled?.();
      onClose();
    } catch {
      toast.error('Failed to cancel job. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500" />
            <h2 className="font-bold text-foreground">Cancel Job</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
            <p className="font-semibold mb-1">⚠️ Before you cancel:</p>
            <p>Cancelling after accepting a job is logged against your provider record. Repeated cancellations may affect your standing. Only cancel if you truly cannot complete this job.</p>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground mb-2">Why are you cancelling?</p>
            <div className="space-y-2">
              {CANCELLATION_REASONS.map(r => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                    reason === r
                      ? 'border-primary bg-primary/5 text-primary font-medium'
                      : 'border-border text-foreground hover:bg-muted/30'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {reason === 'Other' && (
            <textarea
              value={customReason}
              onChange={e => setCustomReason(e.target.value)}
              placeholder="Please describe the reason..."
              rows={3}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          )}
        </div>

        <div className="px-5 py-4 border-t border-border flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-border rounded-lg py-2.5 text-sm font-medium hover:bg-muted transition-colors"
          >
            Go Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !reason}
            className="flex-1 bg-red-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Cancelling...' : 'Confirm Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}