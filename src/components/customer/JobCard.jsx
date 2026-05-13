import { useState } from 'react';
import { Calendar, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import StatusBadge from '../shared/StatusBadge';
import JobCompletionPhotos from './JobCompletionPhotos';
import JobQuotesPanel from './JobQuotesPanel';

export default function JobCard({ job, customerProfile, onAcceptQuote, onReview, reviewed }) {
  const [expanded, setExpanded] = useState(job.status === 'quoted');

  return (
    <div className={`bg-card border rounded-xl overflow-hidden transition-all ${job.status === 'quoted' ? 'border-blue-300 shadow-sm' : 'border-border'}`}>
      {/* Header row — always visible, tap to expand */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full text-left p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="font-semibold text-foreground text-sm truncate">{job.service_name || 'Service Request'}</h3>
              <StatusBadge status={job.status} />
            </div>
            <div className="space-y-1">
              {job.scheduled_date && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar size={12} />
                  <span>{new Date(job.scheduled_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                </div>
              )}
              {job.address && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin size={12} />
                  <span className="truncate">{job.address}</span>
                </div>
              )}
              {job.provider_name && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Provider:</span> {job.provider_name}
                </p>
              )}
            </div>
          </div>
          <div className="flex-shrink-0 flex flex-col items-end gap-1">
            {job.quoted_price && (
              <p className="text-base font-bold text-foreground">${job.quoted_price}</p>
            )}
            {job.status === 'quoted' && !expanded && (
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
                Respond →
              </span>
            )}
            {expanded ? <ChevronUp size={15} className="text-muted-foreground mt-1" /> : <ChevronDown size={15} className="text-muted-foreground mt-1" />}
          </div>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-border pt-3">
          {/* Quotes panel — for active (non-completed/cancelled) jobs */}
          {!['completed', 'cancelled'].includes(job.status) && (
            <JobQuotesPanel
              job={job}
              customerProfile={customerProfile}
              onAcceptQuote={onAcceptQuote}
            />
          )}

          {/* Review button for completed jobs */}
          {job.status === 'completed' && !reviewed && onReview && (
            <button
              onClick={() => onReview(job)}
              className="mt-2 w-full text-xs font-medium text-amber-700 border border-amber-200 bg-amber-50 rounded-lg px-3 py-2 hover:bg-amber-100 transition-colors"
            >
              Leave a Review
            </button>
          )}
          {job.status === 'completed' && reviewed && (
            <div className="mt-2 text-center text-xs font-medium text-green-700 border border-green-200 bg-green-50 rounded-lg px-3 py-2">
              ✓ Review submitted
            </div>
          )}

          {/* Completion photos */}
          {job.status === 'completed' && job.completion_photos && (
            <div className="mt-3">
              <JobCompletionPhotos photos={job.completion_photos} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}