import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AdminAddProviderModal({ onClose, onAdded }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    business_name: '',
    years_experience: '',
    service_zip_codes: '',
    status: 'active',
  });

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      toast.error('Name and email are required.');
      return;
    }
    setSaving(true);
    try {
      // Create the ProviderProfile record
      await base44.entities.ProviderProfile.create({
        user_email: form.email,
        name: form.name,
        phone: form.phone,
        business_name: form.business_name,
        years_experience: Number(form.years_experience) || 0,
        service_zip_codes: form.service_zip_codes
          ? form.service_zip_codes.split(',').map(z => z.trim()).filter(Boolean)
          : [],
        status: form.status,
        onboarding_complete: false,
        background_check_status: 'not_started',
      });

      // Invite the user so they can log in
      await base44.users.inviteUser(form.email, 'user');

      toast.success(`${form.name} added and invite sent to ${form.email}.`);
      onAdded?.();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to add provider.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full border border-input rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring';
  const labelClass = 'text-xs font-medium text-muted-foreground block mb-1';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-base font-bold text-foreground">Add Provider Manually</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Creates a profile and sends a login invite</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Full Name *</label>
              <input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Jane Smith" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email *</label>
              <input required type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="jane@email.com" className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Phone</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(555) 123-4567" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Business Name</label>
              <input value={form.business_name} onChange={e => set('business_name', e.target.value)} placeholder="Green Thumb LLC" className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Years Experience</label>
              <input type="number" min={0} max={50} value={form.years_experience} onChange={e => set('years_experience', e.target.value)} placeholder="0" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Initial Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} className={inputClass}>
                <option value="active">Active</option>
                <option value="pending_review">Pending Review</option>
                <option value="background_check_pending">BG Check Pending</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Service ZIP Codes (comma-separated)</label>
            <input value={form.service_zip_codes} onChange={e => set('service_zip_codes', e.target.value)} placeholder="20001, 20002, 22201" className={inputClass} />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <><Loader2 size={14} className="animate-spin" /> Adding...</> : 'Add Provider & Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}