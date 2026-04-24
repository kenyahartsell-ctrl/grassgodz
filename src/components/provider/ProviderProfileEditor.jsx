import { useState, useRef } from 'react';
import { Pencil, Save, X, Bell, Camera, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import StarRating from '@/components/shared/StarRating';

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

export default function ProviderProfileEditor({ user, profile, avgRating, reviews, onProfileUpdated }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(profile?.profile_image_url || '');
  const photoInputRef = useRef(null);
  const [form, setForm] = useState({
    name: profile?.name || user?.full_name || '',
    phone: profile?.phone || '',
    business_name: profile?.business_name || '',
    bio: profile?.bio || '',
    years_experience: profile?.years_experience || '',
    service_zip_codes: profile?.service_zip_codes?.join(', ') || '',
    notify_new_booking: profile?.notify_new_booking ?? true,
    notify_job_updates: profile?.notify_job_updates ?? true,
    notify_payment_received: profile?.notify_payment_received ?? true,
    notify_promotions: profile?.notify_promotions ?? false,
  });

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.');
      return;
    }
    setPhotoUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPhotoUrl(file_url);
      if (profile?.id) {
        await base44.entities.ProviderProfile.update(profile.id, { profile_image_url: file_url });
      }
      toast.success('Profile photo updated!');
      onProfileUpdated();
    } catch {
      toast.error('Failed to upload photo.');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const zipArray = form.service_zip_codes
        .split(',').map(z => z.trim()).filter(Boolean);
      const payload = {
        name: form.name,
        phone: form.phone,
        business_name: form.business_name,
        bio: form.bio,
        years_experience: Number(form.years_experience) || 0,
        service_zip_codes: zipArray,
        notify_new_booking: form.notify_new_booking,
        notify_job_updates: form.notify_job_updates,
        notify_payment_received: form.notify_payment_received,
        notify_promotions: form.notify_promotions,
      };
      if (profile?.id) {
        await base44.entities.ProviderProfile.update(profile.id, payload);
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
      business_name: profile?.business_name || '',
      bio: profile?.bio || '',
      years_experience: profile?.years_experience || '',
      service_zip_codes: profile?.service_zip_codes?.join(', ') || '',
      notify_new_booking: profile?.notify_new_booking ?? true,
      notify_job_updates: profile?.notify_job_updates ?? true,
      notify_payment_received: profile?.notify_payment_received ?? true,
      notify_promotions: profile?.notify_promotions ?? false,
    });
    setEditing(false);
  };

  return (
    <div className="space-y-4">
      {/* Contact Info Card */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Profile photo with upload button */}
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-border">
                {photoUrl ? (
                  <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-bold text-primary">{(form.name || '?')[0]}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={photoUploading}
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow border-2 border-card hover:bg-primary/90 transition-colors"
              >
                {photoUploading ? <Loader2 size={10} className="animate-spin" /> : <Camera size={10} />}
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>
            <div>
              <p className="font-bold text-foreground">{form.business_name || form.name}</p>
              <p className="text-xs text-muted-foreground">{form.name}</p>
              {avgRating && Number(avgRating) > 0 && <StarRating rating={Number(avgRating)} showValue />}
              <p className="text-xs text-muted-foreground/60 mt-0.5">Tap camera icon to update photo</p>
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
              { label: 'Email', value: user?.email },
              { label: 'Phone', value: profile?.phone || '—' },
              { label: 'Business Name', value: profile?.business_name || '—' },
              { label: 'Years of Experience', value: profile?.years_experience ? `${profile.years_experience} years` : '—' },
              { label: 'Service ZIPs', value: profile?.service_zip_codes?.join(', ') || '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-muted-foreground font-medium">{label}</p>
                <p className="text-sm text-foreground mt-0.5">{value}</p>
              </div>
            ))}
            {profile?.bio && (
              <div>
                <p className="text-xs text-muted-foreground font-medium">Bio</p>
                <p className="text-sm text-foreground mt-0.5">{profile.bio}</p>
              </div>
            )}
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
              <label className="text-xs font-medium text-muted-foreground">Business Name</label>
              <input value={form.business_name} onChange={e => set('business_name', e.target.value)}
                className="mt-1 w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Years of Experience</label>
              <input type="number" min="0" value={form.years_experience} onChange={e => set('years_experience', e.target.value)}
                className="mt-1 w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Service ZIP Codes (comma-separated)</label>
              <input value={form.service_zip_codes} onChange={e => set('service_zip_codes', e.target.value)}
                placeholder="62701, 62702, 62703"
                className="mt-1 w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Bio</label>
              <textarea value={form.bio} onChange={e => set('bio', e.target.value)}
                rows={3} placeholder="Tell customers about yourself..."
                className="mt-1 w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
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
          <Toggle checked={form.notify_new_booking} onChange={v => set('notify_new_booking', v)}
            label="New Booking Request" description="When a customer books a job with you" />
          <Toggle checked={form.notify_job_updates} onChange={v => set('notify_job_updates', v)}
            label="Job Status Updates" description="Changes to your scheduled jobs" />
          <Toggle checked={form.notify_payment_received} onChange={v => set('notify_payment_received', v)}
            label="Payment Received" description="When a payout is processed to your account" />
          <Toggle checked={form.notify_promotions} onChange={v => set('notify_promotions', v)}
            label="Promotions & News" description="Platform updates and earning tips" />
        </div>
        {!editing && (
          <button
            onClick={async () => {
              setSaving(true);
              try {
                if (profile?.id) {
                  await base44.entities.ProviderProfile.update(profile.id, {
                    notify_new_booking: form.notify_new_booking,
                    notify_job_updates: form.notify_job_updates,
                    notify_payment_received: form.notify_payment_received,
                    notify_promotions: form.notify_promotions,
                  });
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

      {/* Reviews */}
      {reviews && reviews.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-foreground">Reviews ({reviews.length})</h3>
            <div className="flex items-center gap-1.5">
              <StarRating rating={Number(avgRating)} size={13} />
              <span className="text-sm font-bold text-foreground">{avgRating}</span>
            </div>
          </div>
          <div className="space-y-3">
            {reviews.map(r => (
              <div key={r.id} className="border-b border-border last:border-0 pb-3 last:pb-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-foreground">{r.customer_name}</span>
                  <StarRating rating={r.rating} size={12} />
                </div>
                {r.comment && <p className="text-xs text-muted-foreground">{r.comment}</p>}
                <p className="text-xs text-muted-foreground/60 mt-0.5">{new Date(r.created_date).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}