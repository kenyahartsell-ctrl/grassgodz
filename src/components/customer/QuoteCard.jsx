import { CheckCircle, Star, Clock } from 'lucide-react';
import StatusBadge from '../shared/StatusBadge';

export default function QuoteCard({ quote, onAccept }) {
  const providerRating = 4.7;
  const providerJobs = 150;

  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">{quote.provider_name?.[0]}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{quote.provider_name}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star size={11} className="text-amber-400 fill-amber-400" />
                <span>{providerRating}</span>
                <span>·</span>
                <span>{providerJobs} jobs</span>
              </div>
            </div>
          </div>
          {quote.message && (
            <p className="text-xs text-muted-foreground mt-2 italic">"{quote.message}"</p>
          )}
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <Clock size={11} />
            <span>Expires {new Date(quote.expires_at).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xl font-bold text-foreground">${quote.price}</p>
          <StatusBadge status={quote.status} />
        </div>
      </div>
      {quote.status === 'pending' && onAccept && (
        <button
          onClick={() => onAccept(quote)}
          className="mt-3 w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
        >
          <CheckCircle size={15} />
          Accept This Quote
        </button>
      )}
    </div>
  );
}