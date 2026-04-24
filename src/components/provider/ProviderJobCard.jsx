import { useState } from 'react';
import { Calendar, MapPin, PlayCircle, CheckCircle, Image } from 'lucide-react';
import StatusBadge from '../shared/StatusBadge';
import JobPhotoUploadModal from './JobPhotoUploadModal';

export default function ProviderJobCard({ job, onMarkInProgress, onMarkComplete }) {
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  const handleComplete = async (job, photos) => {
    await onMarkComplete(job, photos);
  };

  return (
    <>
      <div className="bg-card border border-border rounded-xl p-4 hover:shadow-sm transition-all">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="font-semibold text-foreground text-sm">{job.service_name}</h3>
              <StatusBadge status={job.status} />
            </div>
            <p className="text-xs text-muted-foreground font-medium">{job.customer_name}</p>
          </div>
          {job.quoted_price && (
            <div className="text-right">
              <p className="text-lg font-bold text-foreground">${job.quoted_price}</p>
              <p className="text-xs text-primary font-medium">You earn ${(job.quoted_price * 0.75).toFixed(2)}</p>
            </div>
          )}
        </div>

        <div className="space-y-1 mb-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar size={11} />
            <span>{new Date(job.scheduled_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin size={11} />
            <span>{job.address}</span>
          </div>
        </div>

        {job.customer_notes && (
          <div className="bg-muted/40 rounded-lg px-3 py-2 text-xs text-muted-foreground mb-3">
            <span className="font-medium">Notes:</span> {job.customer_notes}
          </div>
        )}

        {/* Show photo count if already completed */}
        {job.status === 'completed' && job.completion_photos && (
          <div className="flex items-center gap-1.5 text-xs text-green-600 mb-3 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <Image size={12} />
            <span>8 completion photos submitted</span>
          </div>
        )}

        <div className="flex gap-2">
          {job.status === 'scheduled' && onMarkInProgress && (
            <button
              onClick={() => onMarkInProgress(job)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-orange-500 text-white rounded-lg py-2 text-xs font-semibold hover:bg-orange-600 transition-colors"
            >
              <PlayCircle size={13} />
              Mark In Progress
            </button>
          )}
          {job.status === 'in_progress' && onMarkComplete && (
            <button
              onClick={() => setShowPhotoModal(true)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-primary-foreground rounded-lg py-2 text-xs font-semibold hover:bg-primary/90 transition-colors"
            >
              <CheckCircle size={13} />
              Complete & Submit Photos
            </button>
          )}
        </div>
      </div>

      {showPhotoModal && (
        <JobPhotoUploadModal
          job={job}
          onClose={() => setShowPhotoModal(false)}
          onComplete={handleComplete}
        />
      )}
    </>
  );
}