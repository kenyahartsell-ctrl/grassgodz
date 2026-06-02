import { useState } from 'react';
import { X, Star } from 'lucide-react';

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'];
const QUICK_TAGS = [
  'On time', 'Great quality', 'Very professional', 'Friendly',
  'Left yard clean', 'Would rebook', 'Communicated well',
];

export default function ReviewModal({ job, onClose, onSubmit }) {
  const [rating, setRating] = useState(5);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fullComment = [
      selectedTags.length ? selectedTags.join(', ') : '',
      comment,
    ].filter(Boolean).join(' · ');
    onSubmit({ job_id: job.id, provider_id: job.provider_id, rating, comment: fullComment });
    onClose();
  };

  const display = hovered || rating;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-card rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground">Rate Your Experience</h2>
            <p className="text-sm text-muted-foreground">{job.service_name} · {job.provider_name}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Star Rating */}
          <div className="text-center">
            <p className="text-sm font-medium text-foreground mb-3">Overall rating</p>
            <div className="flex justify-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map(i => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i)}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(0)}
                  className="transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    size={36}
                    className={i <= display ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-100'}
                  />
                </button>
              ))}
            </div>
            <p className={`text-sm font-semibold transition-colors ${display >= 4 ? 'text-green-600' : display >= 3 ? 'text-amber-600' : 'text-red-500'}`}>
              {RATING_LABELS[display]}
            </p>
          </div>

          {/* Quick Tags */}
          <div>
            <p className="text-sm font-medium text-foreground mb-2">What stood out? <span className="text-muted-foreground font-normal">(pick any)</span></p>
            <div className="flex flex-wrap gap-2">
              {QUICK_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    selectedTags.includes(tag)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted text-muted-foreground border-border hover:border-primary/40'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Anything else to add? <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
              placeholder="Share your experience — future customers read these!"
              className="w-full border border-input rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 border border-border rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors">
              Skip
            </button>
            <button type="submit" className="flex-1 bg-primary text-primary-foreground rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
              <Star size={14} className="fill-primary-foreground" /> Submit Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}