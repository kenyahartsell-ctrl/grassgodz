import { useState } from 'react';
import { X, Upload, Loader2, Image } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const JOB_STATUSES = ['pending_deposit', 'requested', 'quoted', 'accepted', 'scheduled', 'in_progress', 'completed', 'cancelled'];

const PHOTO_SLOTS = [
  { key: 'front_before', label: 'Front Before' },
  { key: 'front_after', label: 'Front After' },
  { key: 'back_before', label: 'Back Before' },
  { key: 'back_after', label: 'Back After' },
  { key: 'left_before', label: 'Left Before' },
  { key: 'left_after', label: 'Left After' },
  { key: 'right_before', label: 'Right Before' },
  { key: 'right_after', label: 'Right After' },
];

export default function AdminEditJobModal({ job, onClose, onSaved }) {
  const [form, setForm] = useState({
    customer_name: job.customer_name || '',
    address: job.address || '',
    service_name: job.service_name || '',
    status: job.status || 'requested',
    scheduled_date: job.scheduled_date || '',
    customer_phone: job.customer_phone || '',
    provider_name: job.provider_name || '',
    provider_email: job.provider_email || '',
    final_price: job.final_price || job.quoted_price || '',
  });
  const [photos, setPhotos] = useState(job.completion_photos || {});
  const [uploading, setUploading] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handlePhotoUpload = async (slotKey, file) => {
    setUploading(u => ({ ...u, [slotKey]: true }));
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPhotos(p => ({ ...p, [slotKey]: file_url }));
    } catch {
      toast.error('Failed to upload photo.');
    } finally {
      setUploading(u => ({ ...u, [slotKey]: false }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.Job.update(job.id, {
        ...form,
        final_price: form.final_price ? Number(form.final_price) : null,
        completion_photos: photos,
      });
      toast.success('Job updated.');
      onSaved();
      onClose();
    } catch {
      toast.error('Failed to update job.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <h2 className="font-bold text-foreground">Edit Job</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Customer Name</label>
              <input value={form.customer_name} onChange={e => set('customer_name', e.target.value)} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Customer Phone</label>
              <input value={form.customer_phone} onChange={e => set('customer_phone', e.target.value)} placeholder="(202) 555-1234" className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Service Address</label>
              <input value={form.address} onChange={e => set('address', e.target.value)} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Amount ($)</label>
              <input type="number" step="0.01" value={form.final_price} onChange={e => set('final_price', e.target.value)} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Job Type</label>
              <input value={form.service_name} onChange={e => set('service_name', e.target.value)} placeholder="e.g. Lawn Mowing" className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background">
                {JOB_STATUSES.map(s => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Scheduled Date</label>
            <input type="date" value={form.scheduled_date} onChange={e => set('scheduled_date', e.target.value)} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
          </div>

          {/* Provider Section */}
          <div className="border-t border-border pt-4">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-3">Provider</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Provider Name</label>
                <input value={form.provider_name} onChange={e => set('provider_name', e.target.value)} placeholder="Full name" className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Provider Email</label>
                <input value={form.provider_email} onChange={e => set('provider_email', e.target.value)} placeholder="email@example.com" className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
              </div>
            </div>
          </div>

          {/* Completion Photos */}
          <div className="border-t border-border pt-4">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-3">Completion Photos</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PHOTO_SLOTS.map(({ key, label }) => {
                const existing = photos[key];
                const isUploading = uploading[key];
                return (
                  <div key={key} className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground font-medium">{label}</label>
                    <label className="relative cursor-pointer group">
                      <div className={`w-full aspect-square rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors ${existing ? 'border-primary/30' : 'border-border hover:border-primary/40'}`}>
                        {isUploading ? (
                          <Loader2 size={18} className="animate-spin text-muted-foreground" />
                        ) : existing ? (
                          <img src={existing} alt={label} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-muted-foreground group-hover:text-primary transition-colors">
                            <Image size={16} />
                            <span className="text-xs">Upload</span>
                          </div>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => e.target.files[0] && handlePhotoUpload(key, e.target.files[0])}
                      />
                    </label>
                    {existing && (
                      <button
                        type="button"
                        onClick={() => setPhotos(p => { const n = { ...p }; delete n[key]; return n; })}
                        className="text-xs text-red-500 hover:text-red-700 text-center"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex gap-2 px-5 pb-5 pt-3 border-t border-border flex-shrink-0">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? <><Loader2 size={14} className="animate-spin mr-1" /> Saving...</> : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}