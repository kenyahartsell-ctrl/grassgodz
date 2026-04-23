import { MapPin, DollarSign, Briefcase, Calendar, Leaf, AlertCircle, X } from 'lucide-react';
import { calculateDistance } from '@/lib/mapUtils';

export default function JobMarkerCard({ job, providerLocation, onAccept, onClose }) {
  const distance = providerLocation
    ? calculateDistance(providerLocation.lat, providerLocation.lng, job.lat, job.lng)
    : null;

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-lg">
      {/* Header with close button */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{job.service_name}</p>
          <h3 className="text-lg font-bold text-foreground mt-0.5">${job.payout} payout</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-muted rounded-lg transition-colors text-muted-foreground"
        >
          <X size={18} />
        </button>
      </div>

      {/* Job details */}
      <div className="space-y-3 mb-4">
        {/* Address */}
        <div className="flex items-start gap-3">
          <MapPin size={16} className="text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">{job.address}</p>
            {distance && (
              <p className="text-xs text-muted-foreground mt-0.5">{distance.toFixed(1)} miles away</p>
            )}
          </div>
        </div>

        {/* Property details */}
        <div className="grid grid-cols-2 gap-3 bg-secondary/20 rounded-lg p-3">
          {job.property_size && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Yard Size</p>
              <p className="text-sm font-semibold text-foreground capitalize">{job.property_size}</p>
            </div>
          )}
          {job.grass_height && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Grass Height</p>
              <p className="text-sm font-semibold text-foreground capitalize">{job.grass_height}</p>
            </div>
          )}
        </div>

        {/* Scheduled date */}
        {job.scheduled_date && (
          <div className="flex items-center gap-3">
            <Calendar size={16} className="text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Scheduled</p>
              <p className="text-sm font-medium text-foreground">
                {new Date(job.scheduled_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  weekday: 'short',
                })}
              </p>
            </div>
          </div>
        )}

        {/* Customer notes */}
        {job.customer_notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-800 font-medium mb-1">Customer Notes</p>
            <p className="text-xs text-amber-900 leading-relaxed">{job.customer_notes}</p>
          </div>
        )}
      </div>

      {/* Price breakdown */}
      <div className="bg-muted/30 rounded-lg p-3 mb-4 space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Quoted price</span>
          <span className="font-semibold text-foreground">${job.quoted_price || job.base_price || 50}</span>
        </div>
        <div className="h-px bg-border" />
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Your payout (75%)</span>
          <span className="font-bold text-primary text-sm">${job.payout}</span>
        </div>
      </div>

      {/* Accept button */}
      <button
        onClick={onAccept}
        className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:bg-primary/90 transition-colors"
      >
        Accept Job
      </button>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground text-center mt-3">
        You can decline this job from your My Jobs list anytime.
      </p>
    </div>
  );
}