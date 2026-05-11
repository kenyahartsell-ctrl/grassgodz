import { useState } from 'react';
import { X, FileQuestion, Loader2 } from 'lucide-react';
import QuoteCard from './QuoteCard';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function QuotesModal({ job, onClose, onAcceptQuote, customerProfile }) {
  const queryClient = useQueryClient();
  const [declining, setDeclining] = useState(null);

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ['quotes', job.id],
    queryFn: async () => {
      const res = await base44.functions.invoke('getQuotesForJob', { job_id: job.id });
      return res.data?.quotes || [];
    },
    refetchOnWindowFocus: true,
  });

  const handleDecline = async (quote) => {
    setDeclining(quote.id);
    try {
      await base44.functions.invoke('updateQuoteStatus', { quote_id: quote.id, status: 'declined' });
      queryClient.invalidateQueries({ queryKey: ['quotes', job.id] });
      toast.success('Quote declined.');
    } catch {
      // Fallback: try direct update (may work if provider_email matches via RLS)
      try {
        await base44.entities.Quote.update(quote.id, { status: 'declined' });
        queryClient.invalidateQueries({ queryKey: ['quotes', job.id] });
        toast.success('Quote declined.');
      } catch {
        toast.error('Could not decline quote. Please try again.');
      }
    } finally {
      setDeclining(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-foreground">Provider Quotes</h2>
            <p className="text-sm text-muted-foreground">
              {job.service_name}
              {job.scheduled_date ? ` · ${new Date(job.scheduled_date).toLocaleDateString()}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
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
                <QuoteCard
                  key={q.id}
                  quote={q}
                  onAccept={onAcceptQuote}
                  onDecline={handleDecline}
                  decliningId={declining}
                  customerProfile={customerProfile}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}