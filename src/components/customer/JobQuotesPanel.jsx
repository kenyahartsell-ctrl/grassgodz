import { useState } from 'react';
import { Loader2, FileQuestion } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import QuoteCard from './QuoteCard';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/LanguageContext';

export default function JobQuotesPanel({ job, customerProfile, onAcceptQuote, onCardSaved }) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [declining, setDeclining] = useState(null);

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ['quotes', job.id],
    queryFn: async () => {
      const res = await base44.functions.invoke('getQuotesForJob', { job_id: job.id });
      return res.data?.quotes || [];
    },
    refetchOnWindowFocus: true,
    refetchInterval: 15000,
  });

  const handleDecline = async (quote) => {
    setDeclining(quote.id);
    try {
      await base44.functions.invoke('updateQuoteStatus', { quote_id: quote.id, status: 'declined' });
      queryClient.invalidateQueries({ queryKey: ['quotes', job.id] });
      toast.success(t('quote_declined'));
    } catch {
      toast.error(t('quote_declined') + ' ' + t('payment_failed'));
    } finally {
      setDeclining(null);
    }
  };

  return (
    <div className="mt-3 border-t border-border pt-3">
      <p className="text-xs font-semibold text-primary mb-2">
        {t('provider_quotes')} {quotes.length > 0 ? `(${quotes.length})` : ''}
      </p>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      ) : quotes.length === 0 ? (
        <div className="flex flex-col items-center py-4 text-center">
          <FileQuestion className="w-7 h-7 text-muted-foreground/30 mb-2" />
          <p className="text-xs text-muted-foreground">{t('no_quotes_yet')}</p>
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
              onCardSaved={onCardSaved}
            />
          ))}
        </div>
      )}
    </div>
  );
}