import { useState } from 'react';
import { CheckCircle, Star, Clock, CreditCard, Loader2, Lock, ExternalLink, Copy, X } from 'lucide-react';
import StatusBadge from '../shared/StatusBadge';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/LanguageContext';

export default function QuoteCard({ quote, onAccept, onDecline, decliningId, customerProfile }) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [paymentLink, setPaymentLink] = useState(null); // shown when customer has no email

  const handleApprove = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('acceptQuoteAndGeneratePaymentLink', {
        quote_id: quote.id,
      });

      if (res.data?.error) throw new Error(res.data.error);

      // If card on file was charged successfully — job is confirmed immediately
      if (res.data?.charged_card_on_file) {
        toast.success('Payment collected from card on file — job confirmed!');
        onAccept && onAccept(quote);
        return;
      }

      // Has a checkout URL — redirect customer if they have an email, otherwise show link
      if (res.data?.payment_link) {
        const hasEmail = !!customerProfile?.user_email;
        if (hasEmail) {
          // Redirect customer to Stripe Checkout
          window.location.href = res.data.payment_link;
        } else {
          // No email — display link so admin/provider can text it
          setPaymentLink(res.data.payment_link);
          toast.info('No customer email on file. Copy and text them the payment link below.');
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to generate payment link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(paymentLink);
    toast.success('Link copied!');
  };

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
                <span>4.7</span>
                <span>·</span>
                <span>150 jobs</span>
              </div>
            </div>
          </div>
          {quote.message && (
            <p className="text-xs text-muted-foreground mt-2 italic">"{quote.message}"</p>
          )}
          {quote.expires_at && (
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <Clock size={11} />
              <span>{t('expires_label') || 'Expires'} {new Date(quote.expires_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xl font-bold text-foreground">${quote.price}</p>
          <StatusBadge status={quote.status} />
        </div>
      </div>

      {/* Payment link display (no-email path) */}
      {paymentLink && (
        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
          <p className="text-xs font-semibold text-amber-800">Payment link generated — text this to the customer:</p>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={paymentLink}
              className="flex-1 text-xs border border-amber-300 rounded-lg px-2 py-1.5 bg-white text-amber-900 truncate"
            />
            <button onClick={copyLink} className="flex-shrink-0 p-1.5 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors" title="Copy">
              <Copy size={13} className="text-amber-700" />
            </button>
            <a href={paymentLink} target="_blank" rel="noreferrer" className="flex-shrink-0 p-1.5 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors" title="Open">
              <ExternalLink size={13} className="text-amber-700" />
            </a>
          </div>
          <p className="text-xs text-amber-700">Job will be confirmed automatically once the customer completes payment.</p>
        </div>
      )}

      {quote.status === 'pending' && !paymentLink && (
        <div className="mt-3 space-y-2">
          <div className="flex gap-2">
            {onDecline && (
              <button
                onClick={() => onDecline(quote)}
                disabled={decliningId === quote.id || loading}
                className="flex-1 border border-border rounded-lg py-2.5 text-sm font-medium text-muted-foreground hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {decliningId === quote.id ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                {t('decline')}
              </button>
            )}
            <button
              onClick={handleApprove}
              disabled={loading}
              className="flex-1 bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <><Loader2 size={15} className="animate-spin" /> Generating payment link...</>
              ) : (
                <><CreditCard size={15} /> Approve &amp; Pay</>
              )}
            </button>
          </div>
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <Lock size={10} />
            <span>Job confirmed only after payment is received</span>
          </div>
        </div>
      )}
    </div>
  );
}