import { Calendar, MapPin, DollarSign, PlayCircle, CheckCircle } from 'lucide-react';
import StatusBadge from '../shared/StatusBadge';

export default function ProviderJobCard({ job, onMarkInProgress, onMarkComplete }) {
  return (
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
            onClick={() => onMarkComplete(job)}
            className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-primary-foreground rounded-lg py-2 text-xs font-semibold hover:bg-primary/90 transition-colors"
          >
            <CheckCircle size={13} />
            Mark Complete
          </button>
        )}
      </div>
    </div>
  );
}