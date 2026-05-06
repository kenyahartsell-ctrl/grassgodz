import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { ArrowLeft, FileText, Loader2, Clock, CheckCircle2, CalendarCheck, Star } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  requested:   { label: 'Pending',             badge: 'bg-amber-100 text-amber-800',   icon: Clock },
  quoted:      { label: 'Provider Responded',  badge: 'bg-blue-100 text-blue-800',     icon: FileText },
  accepted:    { label: 'Booked',              badge: 'bg-indigo-100 text-indigo-800', icon: CalendarCheck },
  scheduled:   { label: 'Booked',              badge: 'bg-indigo-100 text-indigo-800', icon: CalendarCheck },
  in_progress: { label: 'In Progress',         badge: 'bg-orange-100 text-orange-800', icon: Clock },
  completed:   { label: 'Completed',           badge: 'bg-green-100 text-green-800',   icon: CheckCircle2 },
  cancelled:   { label: 'Cancelled',           badge: 'bg-gray-100 text-gray-600',     icon: Clock },
};

const DISCLAIMER = "This quote is not a guaranteed price. It allows lawn care professionals in your area to review your request and respond with their availability and final pricing.";

export default function MyQuotesPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const me = await base44.auth.me();
        const myJobs = await base44.entities.Job.filter({ customer_email: me.email }, '-created_date');
        setJobs(myJobs);
      } catch {
        toast.error('Failed to load your quotes.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card border-b border-border sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft size={18} className="text-muted-foreground" />
          </button>
          <img src="https://media.base44.com/images/public/69e949497e5928c679297ebf/b2338f6dd_logo_transparent.png" alt="Grassgodz" className="h-8 w-8 object-contain" />
          <h1 className="font-display font-bold text-base text-foreground">My Quotes</h1>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 text-xs text-amber-800 leading-relaxed">
          <strong>Note:</strong> {DISCLAIMER}
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="font-medium text-muted-foreground">No quotes yet</p>
            <p className="text-sm text-muted-foreground mt-1">Request a service from the portal to get started.</p>
            <button
              onClick={() => navigate('/customer')}
              className="mt-5 bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors"
            >
              Request a Service
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map(job => {
              const cfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.requested;
              const Icon = cfg.icon;
              return (
                <div key={job.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm">{job.service_name || 'Service Request'}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{job.address || '—'}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${cfg.badge}`}>
                      <Icon size={11} />
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                    <span>Requested: {job.created_date ? format(new Date(job.created_date), 'MMM d, yyyy') : '—'}</span>
                    {job.scheduled_date && <span>Preferred: {format(new Date(job.scheduled_date), 'MMM d')}</span>}
                    {job.quoted_price && <span className="font-semibold text-primary">Quoted: ${job.quoted_price}</span>}
                  </div>
                  {job.status === 'quoted' && (
                    <button
                      onClick={() => navigate('/customer')}
                      className="mt-3 w-full bg-primary text-primary-foreground text-xs font-semibold py-2 rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      View & Accept Quote →
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}