import { useState } from 'react';
import { X, Star } from 'lucide-react';

export default function ReviewModal({ job, onClose, onSubmit }) {
  const [rating, setRating] = useState(5);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ job_id: job.id, provider_id: job.provider_id, rating, comment });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground">Leave a Review</h2>
            <p className="text-sm text-muted-foreground">{job.service_name} · {job.provider_name}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="text-center">
            <p className="text-sm font-medium text-foreground mb-3">How would you rate this service?</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map(i => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i)}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={32}
                    className={i <= (hovered || rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-100'}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][rating]}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Comments (optional)</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={4}
              placeholder="Share your experience with this provider..."
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 border border-border rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors">
              Skip
            </button>
            <button type="submit" className="flex-1 bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors">
              Submit Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}