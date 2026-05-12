import { useState, useRef } from 'react';
import { X, Camera, CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';

const PHOTO_SLOTS = [
  { key: 'front_before', label: 'Front Yard', timing: 'Before', required: true },
  { key: 'front_after',  label: 'Front Yard', timing: 'After',  required: true },
  { key: 'back_before',  label: 'Back Yard',  timing: 'Before', required: true },
  { key: 'back_after',   label: 'Back Yard',  timing: 'After',  required: true },
  { key: 'left_before',  label: 'Left Side',  timing: 'Before', required: true },
  { key: 'left_after',   label: 'Left Side',  timing: 'After',  required: true },
  { key: 'right_before', label: 'Right Side', timing: 'Before', required: true },
  { key: 'right_after',  label: 'Right Side', timing: 'After',  required: true },
];

function PhotoSlot({ slot, url, onUpload, uploading }) {
  const inputRef = useRef(null);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${slot.timing === 'Before' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
          {slot.timing}
        </span>
        <span className="text-xs text-muted-foreground font-medium">{slot.label}</span>
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={`relative w-full aspect-[4/3] rounded-xl border-2 overflow-hidden transition-all ${
          url
            ? 'border-green-400'
            : 'border-dashed border-border hover:border-primary/50 bg-muted/30'
        }`}
      >
        {url ? (
           <>
             <img src={url} alt={`${slot.label} ${slot.timing}`} className="w-full h-full object-cover" />
             <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
               <CheckCircle size={12} className="text-white" />
             </div>
             <div className="absolute bottom-0 inset-x-0 bg-black/40 py-1 text-xs text-white text-center font-medium">
               Tap to replace
             </div>
           </>
         ) : (
           <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
             {uploading ? (
               <>
                 <Loader2 size={20} className="text-primary animate-spin" />
                 <span className="text-xs text-muted-foreground">{uploading === 'compressing' ? 'Compressing...' : 'Uploading...'}</span>
               </>
             ) : (
               <>
                 <Camera size={20} className="text-muted-foreground/50" />
                 <span className="text-xs text-muted-foreground">Tap to add</span>
               </>
             )}
           </div>
         )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onUpload}
      />
    </div>
  );
}

export default function JobPhotoUploadModal({ job, onClose, onComplete }) {
  const [photos, setPhotos] = useState({});
  const [uploading, setUploading] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const MIN_PHOTOS = 4;
  const allRequired = Object.keys(photos).length >= MIN_PHOTOS;

  const handleUpload = async (key, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(u => ({ ...u, [key]: 'compressing' }));
    try {
      let finalFile = file;
      try {
        finalFile = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1600,
          useWebWorker: true,
          fileType: 'image/jpeg',
        });
      } catch (compressionError) {
        console.warn('Image compression failed, uploading original:', compressionError);
      }
      setUploading(u => ({ ...u, [key]: 'uploading' }));
      const { file_url } = await base44.integrations.Core.UploadFile({ file: finalFile });
      setPhotos(p => ({ ...p, [key]: file_url }));
    } catch {
      toast.error('Photo upload failed. Please try again.');
    } finally {
      setUploading(u => ({ ...u, [key]: false }));
    }
  };

  const handleSubmit = async () => {
    if (!allRequired) {
      toast.error('Please upload at least 4 photos before completing the job.');
      return;
    }
    setSubmitting(true);
    try {
      await onComplete(job, photos);
      onClose();
    } catch {
      toast.error('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const uploadedCount = PHOTO_SLOTS.filter(s => photos[s.key]).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-card rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="font-bold text-foreground text-base">Job Completion Photos</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{uploadedCount} / {PHOTO_SLOTS.length} photos · 4 required</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-muted flex-shrink-0">
          <div
            className="h-full bg-primary transition-all duration-300 rounded-full"
            style={{ width: `${(uploadedCount / PHOTO_SLOTS.length) * 100}%` }}
          />
        </div>

        {/* Photo grid */}
        <div className="flex-1 overflow-y-auto p-5">
          <p className="text-xs text-muted-foreground mb-4 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            A minimum of 4 photos are required to complete the job and release payment.
          </p>

          {/* Group by area */}
          {['Front Yard', 'Back Yard', 'Left Side', 'Right Side'].map(area => {
            const slots = PHOTO_SLOTS.filter(s => s.label === area);
            return (
              <div key={area} className="mb-5">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wide mb-2">{area}</h3>
                <div className="grid grid-cols-2 gap-3">
                  {slots.map(slot => (
                    <PhotoSlot
                      key={slot.key}
                      slot={slot}
                      url={photos[slot.key]}
                      uploading={!!uploading[slot.key]}
                      onUpload={(e) => handleUpload(slot.key, e)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border flex-shrink-0">
          <button
            onClick={handleSubmit}
            disabled={!allRequired || submitting}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <><Loader2 size={16} className="animate-spin" /> Submitting...</>
            ) : (
              <><CheckCircle size={16} /> Complete Job & Get Paid <ArrowRight size={14} /></>
            )}
          </button>
          {!allRequired && (
            <p className="text-center text-xs text-muted-foreground mt-2">
              {MIN_PHOTOS - uploadedCount} more photo{MIN_PHOTOS - uploadedCount !== 1 ? 's' : ''} needed (minimum {MIN_PHOTOS})
            </p>
          )}
        </div>
      </div>
    </div>
  );
}