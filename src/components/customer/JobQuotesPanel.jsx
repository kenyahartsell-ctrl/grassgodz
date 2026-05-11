import { useState } from 'react';
import { ChevronDown, ChevronUp, Loader2, FileQuestion } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import QuoteCard from './QuoteCard';
import { toast } from 'sonner';

export default function JobQuotesPanel({ job, customerProfile, onAcceptQuote }) {
  const [open, setOpen] = useState(true);
  const queryClient = useQueryClient();
  const [declining, setDeclining] = useState(null);

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ['quotes', job.id],
    queryFn: async () => {
      const res = await base44.functions.invoke('getQuotesForJob', { job_id: job.id });
      return res.data?.quotes || [];
    },
    refetchOnWindowFocus: true,
    refetchInterval: 15000, // poll every 15s so customer sees new quotes
  });

  const handleDecline = async (quote) => {
    setDeclining(quote.id);
    try {
      await base44.functions.invoke('updateQuoteStatus', { quote_id: quote.id, status: 'declined' });
      queryClient.invalidateQueries({ queryKey: ['quotes', job.id] });
      toast.success('Quote declined.');
    } catch {
      toast.error('Could not decline quote. Please try again.');
    } finally {
      setDeclining(null);
    }
  };

  return (
    <div className="mt-3 border-t border-border pt-3">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between text-xs font-semibold text-primary mb-2"
      >
        <span>Provider Quotes {quotes.length > 0 ? `(${quotes.length})` : ''}</span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {open && (
        isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : quotes.length === 0 ? (
          <div className="flex flex-col items-center py-4 text-center">
            <FileQuestion className="w-7 h-7 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">No quotes yet — providers will respond shortly.</p>
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
        )
      )}
    </div>
  );
}