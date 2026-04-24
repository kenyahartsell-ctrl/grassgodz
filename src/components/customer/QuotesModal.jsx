import { X, FileQuestion, Loader2 } from 'lucide-react';
import QuoteCard from './QuoteCard';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function QuotesModal({ job, onClose, onAcceptQuote }) {
  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ['quotes', job.id],
    queryFn: () => base44.entities.Quote.filter({ job_id: job.id }),
    refetchOnWindowFocus: true,
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground">Provider Quotes</h2>
            <p className="text-sm text-muted-foreground">{job.service_name} · {new Date(job.scheduled_date).toLocaleDateString()}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : quotes.length === 0 ? (
            <div className="text-center py-10">
              <FileQuestion className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-medium">No quotes yet</p>
              <p className="text-xs text-muted-foreground mt-1">Providers in your area will submit quotes shortly.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {quotes.map(q => (
                <QuoteCard key={q.id} quote={q} onAccept={onAcceptQuote} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}