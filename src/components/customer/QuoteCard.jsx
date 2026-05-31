import { useState } from 'react';
import { CheckCircle, Star, Clock, CreditCard, Loader2, Lock } from 'lucide-react';
import StatusBadge from '../shared/StatusBadge';
import SaveCardModal from './SaveCardModal';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/LanguageContext';

export default function QuoteCard({ quote, onAccept, onDecline, decliningId, customerProfile }) {
  const { t } = useLanguage();
  const [showCardModal, setShowCardModal] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [authorizing, setAuthorizing] = useState(false);
  const [quoteAccepted, setQuoteAccepted] = useState(false);

  const hasPaymentMethod = !!customerProfile?.default_payment_method_id;

  // Step 1: Accept the quote first
  const handleAccept = async () => {
    setAccepting(true);
    try {
      await base44.functions.invoke('updateJobToQuoted', {
        job_id: quote.job_id,
        quoted_price: quote.price,
        provider_id: quote.provider_id,
        provider_email: quote.provider_email,
        provider_name: quote.provider_name,
      });
      setQuoteAccepted(true);
      // Step 2: Now collect payment
      if (hasPaymentMethod) {
        await doAuthorize(customerProfile.default_payment_method_id);
      } else {
        setShowCardModal(true);
      }
    } catch (err) {
      toast.error('Failed to accept quote. Please try again.');
    } finally {
      setAccepting(false);
    }
  };

  // Called after card is saved
  const handleCardSaved = async (paymentMethodId) => {
    setShowCardModal(false);
    await doAuthorize(paymentMethodId);
  };

  // Step 2: Authorize payment after quote is accepted
  const doAuthorize = async (paymentMethodId) => {
    setAuthorizing(true);
    try {
      const res = await base44.functions.invoke('authorizePayment', {
        job_id: quote.job_id,
        payment_method_id: paymentMethodId,
      });
      if (res.data?.success) {
        toast.success(t('quote_accepted', { price: quote.price }));
        onAccept(quote);
      } else {
        toast.error(res.data?.error || t('payment_failed'));
      }
    } catch (err) {
      toast.error(t('payment_failed'));
    } finally {
      setAuthorizing(false);
    }
  };

  return (
    <>
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

        {quote.status === 'pending' && (
          <div className="mt-3 space-y-2">
            <div className="flex gap-2">
              {onDecline && (
                <button
                  onClick={() => onDecline(quote)}
                  disabled={decliningId === quote.id}
                  className="flex-1 border border-border rounded-lg py-2.5 text-sm font-medium text-muted-foreground hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  {decliningId === quote.id ? <Loader2 size={14} className="animate-spin" /> : t('decline')}
                </button>
              )}
              {onAccept && (
                <button
                  onClick={handleAccept}
                  disabled={accepting || authorizing}
                  className="flex-1 bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {accepting ? (
                    <><Loader2 size={15} className="animate-spin" /> Accepting...</>
                  ) : authorizing ? (
                    <><Loader2 size={15} className="animate-spin" /> {t('authorizing')}</>
                  ) : hasPaymentMethod ? (
                    <><CheckCircle size={15} /> {t('accept_pay')}</>
                  ) : (
                    <><CreditCard size={15} /> Accept Quote</>
                  )}
                </button>
              )}
            </div>
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <Lock size={10} />
              <span>{t('card_note')}</span>
            </div>
          </div>
        )}
      </div>

      {showCardModal && (
        <SaveCardModal
          customerProfile={customerProfile}
          onClose={() => setShowCardModal(false)}
          onSuccess={handleCardSaved}
        />
      )}
    </>
  );
}