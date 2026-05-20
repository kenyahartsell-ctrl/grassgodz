import { useState } from 'react';
import { X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const JOB_STATUSES = ['requested', 'quoted', 'accepted', 'scheduled', 'in_progress', 'completed', 'cancelled'];

export default function AdminEditJobModal({ job, onClose, onSaved }) {
  const [form, setForm] = useState({
    customer_name: job.customer_name || '',
    address: job.address || '',
    service_name: job.service_name || '',
    status: job.status || 'requested',
    scheduled_date: job.scheduled_date || '',
    customer_phone: job.customer_phone || '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.Job.update(job.id, form);
      toast.success('Job updated.');
      onSaved();
      onClose();
    } catch (e) {
      toast.error('Failed to update job.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-bold text-foreground">Edit Job</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Customer Name</label>
            <input
              value={form.customer_name}
              onChange={e => set('customer_name', e.target.value)}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Customer Phone</label>
            <input
              value={form.customer_phone}
              onChange={e => set('customer_phone', e.target.value)}
              placeholder="e.g. (202) 555-1234"
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Service Address</label>
            <input
              value={form.address}
              onChange={e => set('address', e.target.value)}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Job Type</label>
            <input
              value={form.service_name}
              onChange={e => set('service_name', e.target.value)}
              placeholder="e.g. Lawn Mowing"
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Status</label>
            <select
              value={form.status}
              onChange={e => set('status', e.target.value)}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background"
            >
              {JOB_STATUSES.map(s => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Scheduled Date</label>
            <input
              type="date"
              value={form.scheduled_date}
              onChange={e => set('scheduled_date', e.target.value)}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background"
            />
          </div>
        </div>

        <div className="flex gap-2 px-5 pb-5">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}