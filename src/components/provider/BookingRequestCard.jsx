import { Calendar, MapPin, Clock, CheckCircle, XCircle, FileText } from 'lucide-react';

export default function BookingRequestCard({ job, onAccept, onDecline }) {
  return (
    <div className="bg-card border-2 border-amber-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">New Booking Request</span>
          </div>
          <h3 className="font-bold text-foreground text-base mt-1">{job.service_name}</h3>
          <p className="text-sm text-muted-foreground font-medium">{job.customer_name}</p>
        </div>
        {job.base_price && (
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-muted-foreground">Est. earn</p>
            <p className="text-lg font-bold text-primary">${(job.base_price * 0.75).toFixed(0)}+</p>
          </div>
        )}
      </div>

      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar size={12} className="text-primary flex-shrink-0" />
          <span className="font-medium">
            {new Date(job.scheduled_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
        </div>
        {job.scheduled_time && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock size={12} className="text-primary flex-shrink-0" />
            <span>{job.scheduled_time}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin size={12} className="text-primary flex-shrink-0" />
          <span className="truncate">{job.address}</span>
        </div>
        {job.customer_notes && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg p-2 mt-2">
            <FileText size={12} className="flex-shrink-0 mt-0.5" />
            <span>{job.customer_notes}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onDecline(job)}
          className="flex-1 flex items-center justify-center gap-1.5 border border-border rounded-xl py-2.5 text-sm font-medium text-muted-foreground hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all"
        >
          <XCircle size={15} />
          Decline
        </button>
        <button
          onClick={() => onAccept(job)}
          className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold hover:bg-primary/90 transition-all"
        >
          <CheckCircle size={15} />
          Accept Booking
        </button>
      </div>
    </div>
  );
}