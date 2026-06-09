import { useState } from 'react';
import { X, Flag, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const REASONS = [
  { value: 'no_show', label: 'Provider no-showed' },
  { value: 'incomplete_work', label: 'Work was incomplete or poor quality' },
  { value: 'damage', label: 'Property was damaged' },
  { value: 'unprofessional_behavior', label: 'Unprofessional behavior' },
  { value: 'other', label: 'Other' },
];

export default function ReportIssueModal({ job, onClose }) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!reason) { toast.error('Please select a reason.'); return; }
    setSubmitting(true);
    try {
      await base44.functions.invoke('reportComplaint', {
        job_id: job.id,
        provider_id: job.provider_id,
        provider_name: job.provider_name || '',
        reason,
        description,
      });
      setSubmitted(true);
    } catch (err) {
      toast.error(err.message || 'Failed to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Flag size={16} className="text-red-500" />
            <h2 className="font-semibold text-foreground text-sm">Report an Issue</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
        </div>

        {submitted ? (
          <div className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <p className="font-semibold text-foreground mb-1">Report Submitted</p>
            <p className="text-sm text-muted-foreground mb-4">We'll review your complaint and follow up if needed.</p>
            <button onClick={onClose} className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-semibold">Done</button>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <p className="text-xs text-muted-foreground">
              Job: <span className="font-medium text-foreground">{job.service_name}</span> with {job.provider_name || 'your provider'}
            </p>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">What went wrong?</label>
              <select
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Select a reason…</option>
                {REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Additional details (optional)</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe what happened…"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={onClose} className="flex-1 border border-border rounded-lg py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !reason}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-lg py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting…' : 'Submit Report'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
