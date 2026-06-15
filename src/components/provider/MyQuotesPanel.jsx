import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, FileText, CheckCircle2, Clock, XCircle, DollarSign, ArrowRight, PartyPopper } from 'lucide-react';

const STATUS_CONFIG = {
  pending:  { label: 'Awaiting Customer Response', badge: 'bg-amber-100 text-amber-800', icon: Clock },
  accepted: { label: 'Accepted!',                  badge: 'bg-green-100 text-green-800',  icon: CheckCircle2 },
  declined: { label: 'Declined',                   badge: 'bg-red-100 text-red-700',      icon: XCircle },
  expired:  { label: 'Expired',                    badge: 'bg-gray-100 text-gray-500',    icon: Clock },
};

export default function MyQuotesPanel({ providerProfile, onGoToMyJobs }) {
  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ['provider-quotes', providerProfile?.id],
    queryFn: async () => {
      if (!providerProfile?.id) return [];
      // Use service-role-backed function to bypass RLS email-case issues
      const res = await base44.functions.invoke('getMyProviderQuotes', { provider_id: providerProfile.id });
      return res.data?.quotes || [];
    },
    enabled: !!providerProfile?.id,
    refetchOnWindowFocus: true,
    refetchInterval: 10000,
  });

  const { data: jobMap = {} } = useQuery({
    queryKey: ['provider-quote-jobs', quotes.map(q => q.job_id).join(',')],
    queryFn: async () => {
      if (quotes.length === 0) return {};
      const jobIds = [...new Set(quotes.map(q => q.job_id))];
      const jobs = await Promise.all(
        jobIds.map(id => base44.entities.Job.filter({ id }).then(r => r[0]).catch(() => null))
      );
      return Object.fromEntries(jobs.filter(Boolean).map(j => [j.id, j]));
    },
    enabled: quotes.length > 0,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-9 h-9 text-muted-foreground/20 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground font-medium">No quotes submitted yet</p>
        <p className="text-xs text-muted-foreground mt-1">Submit quotes on available jobs to see them here.</p>
      </div>
    );
  }

  const accepted = quotes.filter(q => q.status === 'accepted');
  const pending  = quotes.filter(q => q.status === 'pending');
  const other    = quotes.filter(q => !['pending', 'accepted'].includes(q.status));

  const renderQuote = (q) => {
    const cfg = STATUS_CONFIG[q.status] || STATUS_CONFIG.pending;
    const Icon = cfg.icon;
    const job = jobMap[q.job_id];
    const isAccepted = q.status === 'accepted';

    return (
      <div
        key={q.id}
        className={`bg-card border rounded-xl p-4 ${isAccepted ? 'border-green-300 shadow-md' : 'border-border'}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{job?.service_name || 'Service Job'}</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{job?.address || '—'}</p>
            {job?.customer_name && (
              <p className="text-xs text-muted-foreground mt-0.5">Customer: {job.customer_name}</p>
            )}
            {job?.scheduled_date && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Date: {new Date(job.scheduled_date).toLocaleDateString()}
              </p>
            )}
            {q.message && (
              <p className="text-xs text-muted-foreground mt-1.5 italic">"{q.message}"</p>
            )}
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="flex items-center gap-1 justify-end mb-1.5">
              <DollarSign size={14} className="text-primary" />
              <span className="text-lg font-bold text-foreground">{q.price}</span>
            </div>
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
              <Icon size={10} />
              {cfg.label}
            </span>
          </div>
        </div>

        {isAccepted && (
          <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2">
              <PartyPopper size={15} className="text-green-600 flex-shrink-0" />
              <p className="text-sm font-semibold text-green-800">Your quote was accepted!</p>
            </div>
            <p className="text-xs text-green-700">
              {job?.customer_name || 'The customer'} accepted your ${q.price} quote.
              Head to <strong>My Jobs</strong> to manage this job and mark progress.
            </p>
            {onGoToMyJobs && (
              <button
                onClick={onGoToMyJobs}
                className="w-full flex items-center justify-center gap-2 bg-green-600 text-white rounded-lg py-2 text-xs font-semibold hover:bg-green-700 transition-colors"
              >
                Go to My Jobs <ArrowRight size={13} />
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {accepted.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-green-700 uppercase tracking-wide mb-2">
            🎉 Accepted ({accepted.length})
          </h3>
          <div className="space-y-3">{accepted.map(renderQuote)}</div>
        </div>
      )}
      {pending.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
            Awaiting Response ({pending.length})
          </h3>
          <div className="space-y-3">{pending.map(renderQuote)}</div>
        </div>
      )}
      {other.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Past Quotes</h3>
          <div className="space-y-3 opacity-60">{other.map(renderQuote)}</div>
        </div>
      )}
    </div>
  );
}