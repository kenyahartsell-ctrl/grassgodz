import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Upload, Loader2, ImagePlus, CheckCircle2, Clock, Banknote, DollarSign, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';
import imageCompression from 'browser-image-compression';

/**
 * AdminProviderPayoutModal
 * Lets admin record that a provider was paid out for a completed job.
 * Stores on the Job entity:
 *   provider_payout_status : 'pending' | 'paid_out'
 *   provider_payout_notes  : string  (how they were paid — Zelle, check, Venmo, etc.)
 *   provider_payout_date   : string  (ISO date string)
 *   provider_payout_receipt: { url, uploaded_at }  (screenshot / receipt photo)
 */
export default function AdminProviderPayoutModal({ job, onClose, onSaved }) {
  const [status, setStatus]   = useState(job.provider_payout_status || 'pending');
  const [notes, setNotes]     = useState(job.provider_payout_notes || '');
  const [date, setDate]       = useState(
    job.provider_payout_date
      ? job.provider_payout_date.slice(0, 10)
      : format(new Date(), 'yyyy-MM-dd')
  );
  const [receipt, setReceipt] = useState(job.provider_payout_receipt || null);
  const [previewUrl, setPreviewUrl] = useState(
    job.provider_payout_receipt?.url || null
  );
  const [receiptFile, setReceiptFile] = useState(null);
  const [saving, setSaving]   = useState(false);
  const inputRef              = useRef(null);

  const providerShare = job.final_price
    ? (Number(job.final_price) * 0.9).toFixed(2)
    : job.quoted_price
      ? (Number(job.quoted_price) * 0.9).toFixed(2)
      : null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let receiptData = receipt;

      // Upload new receipt if one was selected
      if (receiptFile) {
        const compressedFile = await imageCompression(receiptFile, { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true });
        const safeFile = new File([compressedFile], receiptFile.name, { type: receiptFile.type || 'image/jpeg' });
        const { file_url } = await base44.integrations.Core.UploadFile({ file: safeFile });
        receiptData = { url: file_url, uploaded_at: new Date().toISOString() };
      }

      const patch = {
        provider_payout_status : status,
        provider_payout_notes  : notes.trim(),
        provider_payout_date   : status === 'paid_out' ? date : null,
        provider_payout_receipt: receiptData,
      };

      await base44.entities.Job.update(job.id, patch);
      toast.success(status === 'paid_out' ? 'Payout recorded ✓' : 'Saved as pending');
      onSaved({ ...job, ...patch });
      onClose();
    } catch {
      toast.error('Failed to save payout info.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4'
      onClick={onClose}
    >
      <div
        className='bg-card border border-border rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5'
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Receipt size={18} className='text-primary' />
            <h2 className='text-base font-bold text-foreground'>Provider Payout</h2>
          </div>
          <button onClick={onClose} className='text-muted-foreground hover:text-foreground transition-colors'>
            <X size={18} />
          </button>
        </div>

        {/* Job summary */}
        <div className='bg-muted/40 border border-border rounded-xl px-4 py-3 text-sm space-y-1'>
          <p className='font-bold text-foreground truncate'>{job.service_name || 'Job'} — {job.customer_name || '—'}</p>
          <p className='text-muted-foreground text-xs'>
            Provider: <span className='font-semibold text-foreground'>{job.provider_name || 'Unassigned'}</span>
          </p>
          {providerShare && (
            <p className='text-muted-foreground text-xs flex items-center gap-1'>
              <DollarSign size={11} />
              Provider share (90%): <span className='font-bold text-green-700 ml-1'>${providerShare}</span>
            </p>
          )}
        </div>

        {/* Status toggle */}
        <div>
          <p className='text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide'>Payout Status</p>
          <div className='grid grid-cols-2 gap-2'>
            <button
              onClick={() => setStatus('pending')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all ${ status === 'pending' ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-card border-border text-muted-foreground hover:bg-muted/50' }`}
            >
              <Clock size={14} /> Not Paid Out
            </button>
            <button
              onClick={() => setStatus('paid_out')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all ${ status === 'paid_out' ? 'bg-green-100 border-green-300 text-green-800' : 'bg-card border-border text-muted-foreground hover:bg-muted/50' }`}
            >
              <CheckCircle2 size={14} /> Paid Out
            </button>
          </div>
        </div>

        {/* Date + notes (shown when paid out) */}
        {status === 'paid_out' && (
          <div className='space-y-3'>
            <div>
              <label className='text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5'>Date Paid</label>
              <input
                type='date'
                value={date}
                onChange={e => setDate(e.target.value)}
                className='w-full px-3 py-2 text-sm bg-muted/40 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30'
              />
            </div>
            <div>
              <label className='text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5'>How were they paid?</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder='e.g. Zelle to 555-867-5309, Venmo @providerhandle, check #1042, cash in hand...'
                rows={3}
                className='w-full px-3 py-2 text-sm bg-muted/40 border border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none'
              />
            </div>
          </div>
        )}

        {/* Receipt photo */}
        <div>
          <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2'>Receipt / Screenshot</p>
          {previewUrl ? (
            <div className='relative'>
              <img
                src={previewUrl}
                alt='Receipt'
                className='w-full max-h-48 object-contain rounded-xl border border-border bg-muted/20'
              />
              <button
                onClick={() => { setPreviewUrl(null); setReceiptFile(null); setReceipt(null); }}
                className='absolute top-2 right-2 p-1 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors'
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => inputRef.current?.click()}
              className='w-full border-2 border-dashed border-border rounded-xl py-6 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors'
            >
              <ImagePlus size={22} />
              <span className='text-xs font-medium'>Upload payment screenshot</span>
            </button>
          )}
          <input ref={inputRef} type='file' accept='image/*' className='hidden' onChange={handleFileChange} />
        </div>

        {/* Actions */}
        <div className='flex gap-2 pt-1'>
          <Button variant='outline' className='flex-1' onClick={onClose} disabled={saving}>Cancel</Button>
          <Button className='flex-1 gap-2' onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={14} className='animate-spin' /> : <Banknote size={14} />}
            {saving ? 'Saving...' : 'Save Payout'}
          </Button>
        </div>
      </div>
    </div>
  );
}