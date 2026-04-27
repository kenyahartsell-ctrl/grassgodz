import { Calendar, MapPin, Car, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatusBadge from '../shared/StatusBadge';
import JobCompletionPhotos from './JobCompletionPhotos';

export default function JobCard({ job, onViewQuotes, onReview, reviewed }) {
  return (
    <Link to={`/jobs/${job.id}`} className="block">
    <div className="bg-card border border-border rounded-xl p-4 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-foreground text-sm truncate">{job.service_name}</h3>
            <StatusBadge status={job.status} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar size={12} />
              <span>{new Date(job.scheduled_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin size={12} />
              <span className="truncate">{job.address}</span>
            </div>
            {job.provider_name && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="font-medium">Provider:</span>
                <span>{job.provider_name}</span>
              </div>
            )}
            {job._providerProfile && (job._providerProfile.vehicle_make || job._providerProfile.vehicle_model) && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Car size={11} className="flex-shrink-0" />
                <span>
                  {[job._providerProfile.vehicle_year, job._providerProfile.vehicle_make, job._providerProfile.vehicle_model].filter(Boolean).join(' ')}
                </span>
              </div>
            )}
            {job._providerProfile?.qualifications?.length > 0 && (
              <div className="flex items-start gap-1.5 text-xs text-muted-foreground mt-1">
                <Award size={11} className="flex-shrink-0 mt-0.5 text-primary" />
                <div className="flex flex-wrap gap-1">
                  {job._providerProfile.qualifications.map((q, i) => (
                    <span key={i} className="bg-primary/10 text-primary font-medium px-1.5 py-0.5 rounded-full text-xs">{q}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        {job.quoted_price && (
          <div className="text-right flex-shrink-0">
            <p className="text-lg font-bold text-foreground">${job.quoted_price}</p>
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        {job.status === 'requested' && onViewQuotes && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onViewQuotes(job); }}
            className="text-xs font-medium text-primary border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/5 transition-colors"
          >
            View Quotes
          </button>
        )}
        {job.status === 'quoted' && onViewQuotes && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onViewQuotes(job); }}
            className="text-xs font-semibold bg-primary text-primary-foreground rounded-lg px-3 py-1.5 hover:bg-primary/90 transition-colors"
          >
            Review Quotes
          </button>
        )}
        {job.status === 'completed' && !reviewed && onReview && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onReview(job); }}
            className="text-xs font-medium text-amber-700 border border-amber-200 bg-amber-50 rounded-lg px-3 py-1.5 hover:bg-amber-100 transition-colors"
          >
            Leave Review
          </button>
        )}
        {job.status === 'completed' && reviewed && (
          <span className="text-xs font-medium text-green-700 border border-green-200 bg-green-50 rounded-lg px-3 py-1.5">
            ✓ Reviewed
          </span>
        )}
      </div>

      {job.status === 'completed' && job.completion_photos && (
        <JobCompletionPhotos photos={job.completion_photos} />
      )}
    </div>
    </Link>
  );
}