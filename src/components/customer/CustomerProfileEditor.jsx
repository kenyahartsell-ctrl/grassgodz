import { useState } from 'react';
import { Pencil, Save, X, Bell, LogOut, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

function Toggle({ checked, onChange, label, description }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${checked ? 'bg-primary' : 'bg-muted'}`}
      >
        <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

export default function CustomerProfileEditor({ user, profile, onProfileUpdated }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSignOut = () => {
    base44.auth.logout('/');
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await base44.functions.invoke('deleteMyAccount', { account_type: 'customer' });
      toast.success('Account closed. Signing out...');
      setTimeout(() => base44.auth.logout('/'), 1500);
    } catch {
      toast.error('Failed to close account. Please contact support.');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };
  const [form, setForm] = useState({
    name: profile?.name || user?.full_name || '',
    phone: profile?.phone || '',
    service_address: profile?.service_address || '',
    zip_code: profile?.zip_code || '',
    notify_new_quote: profile?.notify_new_quote ?? true,
    notify_job_accepted: profile?.notify_job_accepted ?? true,
    notify_job_completed: profile?.notify_job_completed ?? true,
    notify_promotions: profile?.notify_promotions ?? false,
  });

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, user_email: user.email };
      if (profile?.id) {
        await base44.entities.CustomerProfile.update(profile.id, payload);
      } else {
        await base44.entities.CustomerProfile.create(payload);
      }
      toast.success('Profile updated successfully.');
      setEditing(false);
      onProfileUpdated();
    } catch {
      toast.error('Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      name: profile?.name || user?.full_name || '',
      phone: profile?.phone || '',
      service_address: profile?.service_address || '',
      zip_code: profile?.zip_code || '',
      notify_new_quote: profile?.notify_new_quote ?? true,
      notify_job_accepted: profile?.notify_job_accepted ?? true,
      notify_job_completed: profile?.notify_job_completed ?? true,
      notify_promotions: profile?.notify_promotions ?? false,
    });
    setEditing(false);
  };

  // Auto-open edit mode if no profile exists yet
  const isNewProfile = !profile?.id;

  return (
    <div className="space-y-4">
      {isNewProfile && !editing && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2">
          <Pencil size={14} className="text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-800 font-medium">Complete your profile to make booking faster. <button onClick={() => setEditing(true)} className="underline font-semibold">Add your info →</button></p>
        </div>
      )}

      {/* Contact Info Card */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-lg font-bold text-primary">{(form.name || user?.full_name || '?')[0]}</span>
            </div>
            <div>
              <p className="font-bold text-foreground">{form.name || user?.full_name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          {!editing && (
            <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
              <Pencil size={13} /> Edit
            </button>
          )}
        </div>

        {!editing ? (
          <div className="space-y-3 border-t border-border pt-4">
            {[
              { label: 'Phone', value: profile?.phone || '—' },
              { label: 'Service Address', value: profile?.service_address || '—' },
              { label: 'ZIP Code', value: profile?.zip_code || '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-muted-foreground font-medium">{label}</p>
                <p className="text-sm text-foreground mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-3 border-t border-border pt-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Full Name</label>
              <input value={form.name} onChange={e => set('name', e.target.value)}
                className="mt-1 w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Phone</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)}
                placeholder="(555) 000-0000"
                className="mt-1 w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Service Address</label>
              <input value={form.service_address} onChange={e => set('service_address', e.target.value)}
                placeholder="123 Main St, City, State"
                className="mt-1 w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">ZIP Code</label>
              <input value={form.zip_code} onChange={e => set('zip_code', e.target.value)}
                maxLength={5} placeholder="62701"
                className="mt-1 w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={handleCancel} className="flex-1 flex items-center justify-center gap-1.5 border border-border rounded-lg py-2 text-xs font-medium hover:bg-muted transition-colors">
                <X size={13} /> Cancel
              </button>
              <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-primary-foreground rounded-lg py-2 text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-70">
                <Save size={13} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Notification Preferences */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <Bell size={15} className="text-primary" />
          <h3 className="text-sm font-bold text-foreground">Email Notifications</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">Choose what emails you want to receive.</p>
        <div className="divide-y divide-border">
          <Toggle checked={form.notify_new_quote} onChange={v => set('notify_new_quote', v)}
            label="New Quote Received" description="When a provider sends you a quote" />
          <Toggle checked={form.notify_job_accepted} onChange={v => set('notify_job_accepted', v)}
            label="Job Accepted" description="When a provider accepts your booking" />
          <Toggle checked={form.notify_job_completed} onChange={v => set('notify_job_completed', v)}
            label="Job Completed" description="When your job is marked as done" />
          <Toggle checked={form.notify_promotions} onChange={v => set('notify_promotions', v)}
            label="Promotions & News" description="Special offers and platform updates" />
        </div>
        {editing && (
          <p className="text-xs text-muted-foreground mt-3 italic">Save your contact info above to also save notification preferences.</p>
        )}
        {!editing && (
          <button
            onClick={async () => {
              setSaving(true);
              try {
                const notifData = {
                  notify_new_quote: form.notify_new_quote,
                  notify_job_accepted: form.notify_job_accepted,
                  notify_job_completed: form.notify_job_completed,
                  notify_promotions: form.notify_promotions,
                };
                if (profile?.id) {
                  await base44.entities.CustomerProfile.update(profile.id, notifData);
                } else {
                  await base44.entities.CustomerProfile.create({ ...notifData, user_email: user.email });
                }
                toast.success('Notification preferences saved.');
                onProfileUpdated();
              } catch {
                toast.error('Failed to save preferences.');
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving}
            className="mt-4 w-full bg-primary text-primary-foreground rounded-lg py-2 text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-70"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        )}
      </div>
    </div>
  );
}