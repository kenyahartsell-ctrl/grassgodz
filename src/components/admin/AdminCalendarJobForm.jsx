import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const TIMES = ['7:00 AM','8:00 AM','9:00 AM','10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM'];

export default function AdminCalendarJobForm({ initialDate, existingJob, providers, onClose, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    client_name: '',
    client_email: '',
    service_address: '',
    zip_code: '',
    service_type: 'Lawn Mowing',
    preferred_time: '9:00 AM',
    provider_id: '',
    provider_name: '',
    provider_email: '',
    notes: '',
    payment_type: 'stripe',
    recurrence: 'one_time',
    start_date: initialDate || new Date().toISOString().split('T')[0],
    end_date: '',
  });

  useEffect(() => {
    if (existingJob) {
      setForm({
        client_name: existingJob.client_name || '',
        client_email: existingJob.client_email || '',
        service_address: existingJob.service_address || '',
        zip_code: existingJob.zip_code || '',
        service_type: existingJob.service_type || 'Lawn Mowing',
        preferred_time: existingJob.preferred_time || '9:00 AM',
        provider_id: existingJob.provider_id || '',
        provider_name: existingJob.provider_name || '',
        provider_email: existingJob.provider_email || '',
        notes: existingJob.notes || '',
        payment_type: existingJob.payment_type || 'stripe',
        recurrence: existingJob.recurrence || 'one_time',
        start_date: existingJob.start_date || initialDate || '',
        end_date: existingJob.end_date || '',
      });
    }
  }, [existingJob]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleProviderChange = (providerId) => {
    const p = providers.find(p => p.id === providerId);
    set('provider_id', providerId);
    set('provider_name', p?.name || p?.business_name || '');
    set('provider_email', p?.user_email || '');
  };

  const handleSave = async () => {
    if (!form.client_name || !form.service_address || !form.zip_code || !form.start_date) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        next_release_date: form.start_date,
        status: 'active',
      };
      if (existingJob) {
        await base44.entities.ScheduledJob.update(existingJob.id, payload);
        toast.success('Schedule updated.');
      } else {
        await base44.entities.ScheduledJob.create(payload);
        toast.success('Job scheduled successfully!');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!existingJob) return;
    if (!window.confirm('Cancel this scheduled job?')) return;
    await base44.entities.ScheduledJob.update(existingJob.id, { status: 'stopped' });
    toast.success('Schedule stopped.');
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border flex-shrink-0">
          <h2 className="text-base font-bold text-foreground">{existingJob ? 'Edit Scheduled Job' : 'Schedule New Job'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {/* Client Info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Client Name *</label>
              <input value={form.client_name} onChange={e => set('client_name', e.target.value)}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Client Email</label>
              <input type="email" value={form.client_email} onChange={e => set('client_email', e.target.value)}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Service Address *</label>
            <input value={form.service_address} onChange={e => set('service_address', e.target.value)}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">ZIP Code *</label>
              <input value={form.zip_code} onChange={e => set('zip_code', e.target.value)}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Service Type</label>
              <input value={form.service_type} onChange={e => set('service_type', e.target.value)}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Preferred Time</label>
              <select value={form.preferred_time} onChange={e => set('preferred_time', e.target.value)}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background">
                {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Payment Type</label>
              <select value={form.payment_type} onChange={e => set('payment_type', e.target.value)}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background">
                <option value="stripe">Stripe (Card)</option>
                <option value="cash">Cash</option>
              </select>
            </div>
          </div>

          {/* Provider Assignment */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Assign Provider (optional)</label>
            <select value={form.provider_id} onChange={e => handleProviderChange(e.target.value)}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background">
              <option value="">— Unassigned (all providers can claim) —</option>
              {providers.filter(p => p.status === 'active').map(p => (
                <option key={p.id} value={p.id}>{p.name || p.business_name} ({p.user_email})</option>
              ))}
            </select>
          </div>

          {/* Recurrence */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Recurrence</label>
            <div className="flex gap-2">
              {[['one_time','One Time'],['weekly','Weekly'],['biweekly','Biweekly']].map(([val, label]) => (
                <button key={val} onClick={() => set('recurrence', val)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                    form.recurrence === val ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted/40'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Start Date *</label>
              <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
            </div>
            {form.recurrence !== 'one_time' && (
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">End Date (optional)</label>
                <input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)}
                  min={form.start_date}
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              rows={2} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background resize-none" />
          </div>
        </div>

        <div className="p-5 border-t border-border flex gap-2 flex-shrink-0">
          {existingJob && (
            <Button variant="destructive" size="sm" onClick={handleCancel}>Stop Schedule</Button>
          )}
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 size={13} className="animate-spin" /> Saving...</> : existingJob ? 'Save Changes' : 'Schedule Job'}
          </Button>
        </div>
      </div>
    </div>
  );
}