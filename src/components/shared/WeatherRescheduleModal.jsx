import { useState } from 'react';
import { X, CloudRain, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export default function WeatherRescheduleModal({ job, onClose, onRescheduled }) {
  const [newDate, setNewDate] = useState('');
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const handleSave = async () => {
    if (!newDate) { toast.error('Please select a new date.'); return; }
    setSaving(true);
    try {
      await base44.entities.Job.update(job.id, {
        scheduled_date: newDate,
        status: 'scheduled',
        weather_check_status: 'pending',
        auto_cancelled_weather: false,
        cancellation_reason: null,
      });
      toast.success('Job rescheduled due to inclement weather.');
      onRescheduled?.();
      onClose();
    } catch {
      toast.error('Failed to reschedule job.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <CloudRain size={18} className="text-blue-500" />
            <h2 className="font-bold text-foreground">Weather Reschedule</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
            <p className="font-semibold mb-0.5">Inclement Weather Reschedule</p>
            <p className="text-xs text-blue-700">
              Rescheduling <strong>{job.service_name}</strong> for <strong>{job.customer_name}</strong>.
              Current date: {job.scheduled_date ? new Date(job.scheduled_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '—'}
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">New Scheduled Date *</label>
            <input
              type="date"
              min={today}
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div className="flex gap-2 px-5 pb-5">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !newDate} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
            {saving ? <><Loader2 size={14} className="animate-spin mr-1" /> Rescheduling...</> : 'Reschedule'}
          </Button>
        </div>
      </div>
    </div>
  );
}