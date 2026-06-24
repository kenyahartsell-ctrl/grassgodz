import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Upload, Loader2, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';

export default function AdminPhotoUploadModal({ job, onClose, onUploaded }) {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    setFiles(selected);
    setPreviews(selected.map(f => URL.createObjectURL(f)));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    try {
      const uploadedPhotos = [];
      for (const file of files) {
        const compressedFile = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true });
        const safeFile = new File([compressedFile], file.name, { type: file.type || 'image/jpeg' });
        const { file_url } = await base44.integrations.Core.UploadFile({ file: safeFile });
        uploadedPhotos.push({ url: file_url, uploaded_at: new Date().toISOString() });
      }

      const existing = job.admin_photos || [];
      await base44.entities.Job.update(job.id, {
        admin_photos: [...existing, ...uploadedPhotos],
      });

      toast.success(`${uploadedPhotos.length} photo${uploadedPhotos.length > 1 ? 's' : ''} uploaded.`);
      onUploaded([...existing, ...uploadedPhotos]);
      onClose();
    } catch {
      toast.error('Failed to upload photos.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-sm p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-foreground">Add Admin Photos</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-muted-foreground mb-4">
          Photos will be tagged as <span className="font-semibold text-foreground">Admin Upload</span> and shown in the job gallery.
        </p>

        {/* Drop zone */}
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-border rounded-xl py-8 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors mb-4"
        >
          <ImagePlus size={24} />
          <span className="text-sm font-medium">Click to select photos</span>
          <span className="text-xs">JPG, PNG, WEBP</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Previews */}
        {previews.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {previews.map((src, i) => (
              <div key={i} className="aspect-square rounded-lg overflow-hidden border border-border">
                <img src={src} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={uploading}>
            Cancel
          </Button>
          <Button
            className="flex-1 gap-2"
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? 'Uploading...' : `Upload ${files.length > 0 ? `(${files.length})` : ''}`}
          </Button>
        </div>
      </div>
    </div>
  );
}