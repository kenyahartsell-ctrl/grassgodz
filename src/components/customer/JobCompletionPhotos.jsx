import { useState } from 'react';
import { Camera } from 'lucide-react';
import PhotoLightbox from '../shared/PhotoLightbox';

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

export default function JobCompletionPhotos({ photos, onViewPhotos }) {
  const [selectedLightbox, setSelectedLightbox] = useState(false);

  if (!photos || Object.keys(photos).length === 0) {
    return null;
  }

  const photosByArea = {
    'Front Yard': PHOTO_SLOTS.filter(s => s.label === 'Front Yard'),
    'Back Yard': PHOTO_SLOTS.filter(s => s.label === 'Back Yard'),
    'Left Side': PHOTO_SLOTS.filter(s => s.label === 'Left Side'),
    'Right Side': PHOTO_SLOTS.filter(s => s.label === 'Right Side'),
  };

  return (
    <>
      <div className="mt-4 pt-4 border-t border-border">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wide mb-3">Completion Photos</h4>
        
        {Object.entries(photosByArea).map(([area, slots]) => {
          const hasPhotos = slots.some(s => photos[s.key]);
          if (!hasPhotos) return null;
          
          return (
            <div key={area} className="mb-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">{area}</p>
              <div className="grid grid-cols-4 gap-2">
                {slots.map(slot => (
                  <button
                    key={slot.key}
                    onClick={() => setSelectedLightbox(true)}
                    className="aspect-square rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-all"
                  >
                    {photos[slot.key] ? (
                      <img
                        src={photos[slot.key]}
                        alt={`${area} ${slot.timing}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <span className="text-xs text-muted-foreground text-center px-1">No photo</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        <button
          onClick={() => setSelectedLightbox(true)}
          className="mt-3 w-full flex items-center justify-center gap-2 text-xs font-semibold text-primary border border-primary/30 rounded-lg px-3 py-2 hover:bg-primary/5 transition-colors"
        >
          <Camera size={14} /> View All Photos
        </button>
      </div>

      {selectedLightbox && (
        <PhotoLightbox photos={photos} onClose={() => setSelectedLightbox(false)} />
      )}
    </>
  );
}