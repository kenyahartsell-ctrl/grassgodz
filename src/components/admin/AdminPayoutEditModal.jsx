import { useState } from 'react';
import { X, DollarSign, Camera, Upload, Check, Banknote, CreditCard, ArrowRightLeft, CircleDollarSign } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';

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

export default function AdminPayoutEditModal({ job, onClose, onSaved }) {
  const [payoutAmount, setPayoutAmount] = useState(job.provider_payout || '');
  const [finalPrice, setFinalPrice] = useState(job.final_price || job.quoted_price || '');
  const [platformFee, setPlatformFee] = useState(job.platform_fee || '');
  const [cashPaid, setCashPaid] = useState(job.cash_paid || false);
  const [photos, setPhotos] = useState(job.completion_photos || {});
  const [uploading, setUploading] = useState({});
  const [saving, setSaving] = useState(false);

  // Provider payout fields
  const [providerPaidOut, setProviderPaidOut] = useState(job.provider_paid_out || false);
  const [payoutMethod, setPayoutMethod] = useState(job.provider_payout_method || '');
  const [payoutNotes, setPayoutNotes] = useState(job.provider_payout_notes || '');
  const [payoutPhotos, setPayoutPhotos] = useState(job.provider_payout_photos || []);
  const [uploadingPayout, setUploadingPayout] = useState(false);

  const handlePhotoUpload = async (slot, file) => {
    if (!file) return;
    setUploading(u => ({ ...u, [slot]: true }));
    try {
      const compressedFile = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true });
      const safeFile = new File([compressedFile], file.name, { type: file.type || 'image/jpeg' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file: safeFile });
      setPhotos(p => ({ ...p, [slot]: file_url }));
      toast.success(`${slot.replace(/_/g, ' ')} uploaded`);
    } catch {
      toast.error('Photo upload failed');
    } finally {
      setUploading(u => ({ ...u, [slot]: false }));
    }
  };

  const handlePayoutPhotoUpload = async (file) => {
    if (!file) return;
    setUploadingPayout(true);
    try {
      const compressedFile = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true });
      const safeFile = new File([compressedFile], file.name, { type: file.type || 'image/jpeg' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file: safeFile });
      setPayoutPhotos(prev => [...prev, { url: file_url, uploaded_at: new Date().toISOString() }]);
      toast.success('Payout photo uploaded');
    } catch {
      toast.error('Photo upload failed');
    } finally {
      setUploadingPayout(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = {
        provider_payout: parseFloat(payoutAmount) || 0,
        final_price: parseFloat(finalPrice) || 0,
        platform_fee: parseFloat(platformFee) || 0,
        cash_paid: cashPaid,
        completion_photos: photos,
        provider_paid_out: providerPaidOut,
        provider_payout_method: payoutMethod || null,
        provider_payout_notes: payoutNotes || null,
        provider_payout_photos: payoutPhotos,
      };
      if (cashPaid && !job.cash_paid_date) {
        updates.cash_paid_date = new Date().toISOString();
      }
      if (providerPaidOut && !job.provider_payout_date) {
        updates.provider_payout_date = new Date().toISOString();
      }
      if (!providerPaidOut) {
        updates.provider_payout_date = null;
      }
      await base44.entities.Job.update(job.id, updates);
      toast.success('Payout record updated');
      onSaved?.();
      onClose();
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-bold text-foreground text-lg">Edit Payout</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {job.service_name} — {job.customer_name} — {job.provider_name}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Financials */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <DollarSign size={14} className="text-primary" /> Financials
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Final Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={finalPrice}
                  onChange={e => setFinalPrice(e.target.value)}
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Platform Fee ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={platformFee}
                  onChange={e => setPlatformFee(e.target.value)}
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Provider Payout ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={payoutAmount}
                  onChange={e => setPayoutAmount(e.target.value)}
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>

          {/* Cash Payment */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Banknote size={14} className="text-green-600" /> Cash Payment
            </h3>
            <button
              onClick={() => setCashPaid(v => !v)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all w-full text-left ${
                cashPaid
                  ? 'border-green-500 bg-green-50 text-green-800'
                  : 'border-border bg-card text-muted-foreground'
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${cashPaid ? 'border-green-500 bg-green-500' : 'border-muted-foreground'}`}>
                {cashPaid && <Check size={12} className="text-white" />}
              </div>
              <div>
                <p className="text-sm font-semibold">Mark as Cash Paid</p>
                <p className="text-xs opacity-75">Provider collected cash payment directly from customer</p>
              </div>
            </button>
          </div>

          {/* Provider Payout Status */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <CircleDollarSign size={14} className="text-primary" /> Provider Payout
            </h3>

            {/* Paid Out Toggle */}
            <button
              onClick={() => setProviderPaidOut(v => !v)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all w-full text-left mb-3 ${
                providerPaidOut
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border bg-card text-muted-foreground'
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${providerPaidOut ? 'border-primary bg-primary' : 'border-muted-foreground'}`}>
                {providerPaidOut && <Check size={12} className="text-white" />}
              </div>
              <div>
                <p className="text-sm font-semibold">Mark Provider as Paid Out</p>
                <p className="text-xs opacity-75">
                  {job.provider_payout_date
                    ? `Paid on ${new Date(job.provider_payout_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                    : 'Provider has received their payout'}
                </p>
              </div>
            </button>

            {/* Payout Method */}
            {providerPaidOut && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-2">Payment Method Used</label>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { value: 'cash', label: '💵 Cash', icon: Banknote },
                      { value: 'card', label: '💳 Card', icon: CreditCard },
                      { value: 'bank_transfer', label: '🏦 Bank Transfer', icon: ArrowRightLeft },
                      { value: 'other', label: '📋 Other', icon: null },
                    ].map(m => (
                      <button
                        key={m.value}
                        onClick={() => setPayoutMethod(m.value)}
                        className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                          payoutMethod === m.value
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payout Notes */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Payout Notes (optional)</label>
                  <textarea
                    value={payoutNotes}
                    onChange={e => setPayoutNotes(e.target.value)}
                    placeholder="e.g. Paid via Zelle, cash envelope, etc."
                    rows={2}
                    className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>

                {/* Payout Photos */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-2">Payout Proof Photos</label>
                  <div className="flex flex-wrap gap-2">
                    {payoutPhotos.map((p, i) => (
                      <div key={i} className="relative group">
                        <img src={p.url} alt="payout proof" className="w-20 h-20 object-cover rounded-lg border border-border" />
                        <button
                          onClick={() => setPayoutPhotos(prev => prev.filter((_, idx) => idx !== i))}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                    <label className={`flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${uploadingPayout ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'}`}>
                      {uploadingPayout ? (
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Upload size={14} className="text-muted-foreground mb-1" />
                          <span className="text-[10px] text-muted-foreground text-center">Add Photo</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => handlePayoutPhotoUpload(e.target.files[0])}
                        disabled={uploadingPayout}
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Completion Photos */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Camera size={14} className="text-primary" /> Completion Photos
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PHOTO_SLOTS.map(({ key, label }) => (
                <div key={key} className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">{label}</p>
                  {photos[key] ? (
                    <div className="relative group">
                      <img
                        src={photos[key]}
                        alt={label}
                        className="w-full h-20 object-cover rounded-lg border border-border"
                      />
                      <button
                        onClick={() => setPhotos(p => ({ ...p, [key]: null }))}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ) : (
                    <label className={`flex flex-col items-center justify-center h-20 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${uploading[key] ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'}`}>
                      {uploading[key] ? (
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Upload size={14} className="text-muted-foreground mb-1" />
                          <span className="text-xs text-muted-foreground">Upload</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => handlePhotoUpload(key, e.target.files[0])}
                        disabled={uploading[key]}
                      />
                    </label>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 text-sm bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}