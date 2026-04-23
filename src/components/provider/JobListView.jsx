import { calculateDistance } from '@/lib/mapUtils';
import { MapPin, Briefcase, DollarSign, AlertCircle } from 'lucide-react';

export default function JobListView({ jobs, selectedJobId, onSelectJob, providerLocation, onAcceptJob }) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-card border-b border-border p-4 sticky top-0 z-10">
        <h3 className="text-sm font-bold text-foreground">Available Jobs</h3>
        <p className="text-xs text-muted-foreground mt-1">{jobs.length} job{jobs.length !== 1 ? 's' : ''} available</p>
      </div>

      {/* Jobs list */}
      <div className="flex-1 overflow-y-auto">
        {jobs.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            <AlertCircle size={20} className="mx-auto mb-2 opacity-50" />
            <p>No jobs match your filters</p>
            <p className="text-xs mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="space-y-2 p-3">
            {jobs.map(job => {
              const distance = providerLocation
                ? calculateDistance(
                    providerLocation.lat,
                    providerLocation.lng,
                    job.lat,
                    job.lng
                  )
                : null;

              return (
                <button
                  key={job.id}
                  onClick={() => onSelectJob(job)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    selectedJobId === job.id
                      ? 'bg-primary/5 border-primary'
                      : 'bg-card border-border hover:border-primary/40'
                  }`}
                >
                  {/* Header: price and service type */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                        <DollarSign size={16} className="text-primary font-bold" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">${job.payout}</p>
                        <p className="text-xs text-muted-foreground">{job.service_name}</p>
                      </div>
                    </div>
                    {distance && (
                      <div className="text-right">
                        <p className="text-xs font-semibold text-primary">{distance.toFixed(1)}mi</p>
                        <p className="text-xs text-muted-foreground">away</p>
                      </div>
                    )}
                  </div>

                  {/* Job details tags */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {job.property_size && (
                      <span className="text-xs bg-secondary/50 text-secondary-foreground px-2 py-0.5 rounded capitalize">
                        {job.property_size} yard
                      </span>
                    )}
                    {job.grass_height && (
                      <span className="text-xs bg-secondary/50 text-secondary-foreground px-2 py-0.5 rounded capitalize">
                        {job.grass_height} grass
                      </span>
                    )}
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-2 mb-2">
                    <MapPin size={13} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground line-clamp-1">{job.address}</p>
                  </div>

                  {/* CTA button */}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onAcceptJob(job);
                    }}
                    className="w-full text-xs font-semibold bg-primary text-primary-foreground px-3 py-2 rounded-lg hover:bg-primary/90 transition-colors mt-2"
                  >
                    View & Accept
                  </button>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}