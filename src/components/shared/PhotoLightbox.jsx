import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, AlertCircle, ZoomIn } from 'lucide-react';

const PHOTO_SLOTS = [
  { key: 'front_before', label: 'Front Yard', timing: 'Before' },
  { key: 'front_after',  label: 'Front Yard', timing: 'After' },
  { key: 'back_before',  label: 'Back Yard',  timing: 'Before' },
  { key: 'back_after',   label: 'Back Yard',  timing: 'After' },
  { key: 'left_before',  label: 'Left Side',  timing: 'Before' },
  { key: 'left_after',   label: 'Left Side',  timing: 'After' },
  { key: 'right_before', label: 'Right Side', timing: 'Before' },
  { key: 'right_after',  label: 'Right Side', timing: 'After' },
];

export default function PhotoLightbox({ photos, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [zoom, setZoom] = useState(1);

  // Build photo list from completion_photos object
  const photoList = PHOTO_SLOTS
    .filter(slot => photos[slot.key])
    .map(slot => ({
      url: photos[slot.key],
      label: slot.label,
      timing: slot.timing,
    }));

  const current = photoList[currentIndex] || {};

  const handlePrev = () => {
    setCurrentIndex(i => (i - 1 + photoList.length) % photoList.length);
    setImageError(false);
    setZoom(1);
  };

  const handleNext = () => {
    setCurrentIndex(i => (i + 1) % photoList.length);
    setImageError(false);
    setZoom(1);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') handlePrev();
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'Escape') onClose();
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photoList.length]);

  if (photoList.length === 0) {
    return null;
  }

  const handleImageError = () => {
    setImageError(true);
    console.error(`Failed to load photo: ${current.url}`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col" onClick={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 flex-shrink-0">
        <div className="flex-1">
          <h2 className="text-white font-semibold text-sm">{current.label}</h2>
          <p className="text-xs text-white/60 mt-0.5">
            {current.timing} · Photo {currentIndex + 1} of {photoList.length}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white transition-colors p-2"
        >
          <X size={20} />
        </button>
      </div>

      {/* Image viewer */}
      <div className="flex-1 flex items-center justify-center overflow-hidden relative" onClick={e => e.stopPropagation()}>
        {imageError ? (
          <div className="flex flex-col items-center justify-center gap-3 text-center px-6">
            <AlertCircle size={32} className="text-white/40" />
            <p className="text-white/60 text-sm">Photos unavailable. Contact support if needed.</p>
          </div>
        ) : (
          <>
            {/* Zoom info hint */}
            <div className="absolute top-4 right-4 text-xs text-white/40 flex items-center gap-1.5 pointer-events-none">
              <ZoomIn size={14} />
              Pinch to zoom
            </div>

            {/* Image with zoom */}
            <img
              src={current.url}
              alt={`${current.label} ${current.timing}`}
              onError={handleImageError}
              className="max-w-full max-h-full object-contain cursor-grab active:cursor-grabbing transition-transform"
              style={{ transform: `scale(${zoom})` }}
              onWheel={(e) => {
                e.preventDefault();
                setZoom(z => Math.max(1, Math.min(3, z - e.deltaY * 0.001)));
              }}
            />

            {/* Navigation buttons */}
            {photoList.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrev();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                  aria-label="Previous photo"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                  aria-label="Next photo"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {photoList.length > 1 && (
        <div className="flex gap-2 px-4 py-4 border-t border-white/10 flex-shrink-0 overflow-x-auto">
          {photoList.map((photo, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(i);
                setImageError(false);
                setZoom(1);
              }}
              className={`flex-shrink-0 w-14 h-14 rounded-lg border-2 overflow-hidden transition-all ${
                i === currentIndex ? 'border-white' : 'border-white/20 opacity-60 hover:opacity-100'
              }`}
            >
              <img
                src={photo.url}
                alt={`Thumbnail ${i + 1}`}
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}