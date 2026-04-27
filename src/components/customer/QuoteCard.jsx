import { useState } from 'react';
import { CheckCircle, Star, Clock, CreditCard, Loader2, Lock } from 'lucide-react';
import StatusBadge from '../shared/StatusBadge';
import SaveCardModal from './SaveCardModal';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function QuoteCard({ quote, onAccept, customerProfile }) {
  const [showCardModal, setShowCardModal] = useState(false);
  const [authorizing, setAuthorizing] = useState(false);

  const hasPaymentMethod = !!customerProfile?.default_payment_method_id;

  const handleAccept = async () => {
    if (!hasPaymentMethod) {
      setShowCardModal(true);
      return;
    }
    await doAuthorize(customerProfile.default_payment_method_id);
  };

  const handleCardSaved = async (paymentMethodId) => {
    setShowCardModal(false);
    await doAuthorize(paymentMethodId);
  };

  const doAuthorize = async (paymentMethodId) => {
    setAuthorizing(true);
    try {
      const res = await base44.functions.invoke('authorizePayment', {
        job_id: quote.job_id,
        payment_method_id: paymentMethodId,
      });
      if (res.data?.success) {
        toast.success(`Quote accepted! Card authorized for $${quote.price}.`);
        onAccept(quote);
      } else {
        toast.error(res.data?.error || 'Payment authorization failed.');
      }
    } catch (err) {
      toast.error('Payment authorization failed. Please try again.');
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
          <div className="mt-3 space-y-2">
            <button
              onClick={handleAccept}
              disabled={authorizing}
              className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {authorizing ? (
                <><Loader2 size={15} className="animate-spin" /> Authorizing...</>
              ) : hasPaymentMethod ? (
                <><CheckCircle size={15} /> Accept & Authorize Payment</>
              ) : (
                <><CreditCard size={15} /> Accept & Add Payment Method</>
              )}
            </button>
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <Lock size={10} />
              <span>Card authorized now, charged only after job completion</span>
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