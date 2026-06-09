import { useRef, useState } from 'react';
import { Camera, X, Loader2, ImagePlus } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function YardPhotoUpload({ photos, onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files) => {
    const remaining = 3 - photos.length;
    if (remaining <= 0) return;
    const selected = Array.from(files).slice(0, remaining);
    setUploading(true);
    const uploaded = [];
    for (const file of selected) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      uploaded.push(file_url);
    }
    onChange([...photos, ...uploaded]);
    setUploading(false);
  };

  const removePhoto = (index) => {
    onChange(photos.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-1">
        <Camera size={13} className="text-primary" /> Yard Photos <span className="text-destructive">*</span>
      </label>
      <p className="text-xs text-muted-foreground mb-3">
        Please upload 1–3 photos of your yard so your provider can prepare before arrival.
      </p>

      <div className="flex flex-wrap gap-2">
        {photos.map((url, i) => (
          <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
            <img src={url} alt={`Yard photo ${i + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removePhoto(i)}
              className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80 transition-colors"
            >
              <X size={11} />
            </button>
          </div>
        ))}

        {photos.length < 3 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <ImagePlus size={18} />
                <span className="text-[10px] font-medium">Add Photo</span>
              </>
            )}
          </button>
        )}
      </div>

      {photos.length === 0 && (
        <p className="text-xs text-destructive mt-1.5">At least 1 photo is required.</p>
      )}
      {photos.length > 0 && photos.length < 3 && (
        <p className="text-xs text-muted-foreground mt-1.5">{photos.length}/3 photos added. You can add up to {3 - photos.length} more.</p>
      )}
      {photos.length === 3 && (
        <p className="text-xs text-muted-foreground mt-1.5">Maximum 3 photos reached.</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        multiple
        className="hidden"
        onChange={e => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = ''; }}
      />
    </div>
  );
}