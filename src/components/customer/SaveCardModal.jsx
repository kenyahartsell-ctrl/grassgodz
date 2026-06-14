import { useState, useEffect } from 'react';
import { X, Loader2, CreditCard, Lock, AlertCircle } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '15px',
      color: '#1a1a1a',
      fontFamily: 'Inter, sans-serif',
      '::placeholder': { color: '#9ca3af' },
    },
    invalid: { color: '#ef4444' },
  },
};

function CardForm({ customerProfile, onSuccess, onClose }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [profileError, setProfileError] = useState(false);
  const [cardError, setCardError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setCardError(null);

    try {
      const res = await base44.functions.invoke('createSetupIntent', {});
      if (res.data?.error) {
        if (res.data.error.toLowerCase().includes('profile not found') || res.data.error.toLowerCase().includes('not found')) {
          setProfileError(true);
          return;
        }
        setCardError('Could not initialize payment setup. Please try again.');
        return;
      }
      const { client_secret } = res.data;

      const result = await stripe.confirmCardSetup(client_secret, {
        payment_method: { card: elements.getElement(CardElement) },
      });

      if (result.error) {
        setCardError(result.error.message);
        return;
      }

      const paymentMethodId = result.setupIntent.payment_method;
      await base44.functions.invoke('savePaymentMethod', { profile_id: customerProfile.id, payment_method_id: paymentMethodId });

      toast.success('Card saved successfully!');
      onSuccess(paymentMethodId);
    } catch (err) {
      setCardError(err.message || 'Failed to save card. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (profileError) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center">
            <AlertCircle size={26} className="text-amber-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Account setup needed</h3>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Before you can save a card, your customer profile needs to be set up. Here's what to do:
            </p>
          </div>
        </div>
        <div className="bg-muted/40 rounded-xl p-4 space-y-3 text-sm text-foreground">
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
            <p>Go to your <strong>Profile</strong> tab and fill in your name, address, and zip code.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
            <p>Return here to add your payment card. <strong>You won't be charged until after your job is completed.</strong></p>
          </div>
        </div>
        <p className="text-xs text-center text-muted-foreground">Need help? Contact us at <strong>support@grassgodz.com</strong></p>
        <button onClick={onClose} className="w-full border border-border rounded-xl py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
          Close
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div className="border border-border rounded-xl p-4 bg-muted/20">
        <CardElement options={CARD_ELEMENT_OPTIONS} />
      </div>
      {cardError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-xs text-red-700">
          <AlertCircle size={13} className="text-red-500 flex-shrink-0 mt-0.5" />
          <span>{cardError}</span>
        </div>
      )}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Lock size={11} />
        <span>Secured by Stripe. Your card will be authorized, not charged, until the job is completed.</span>
      </div>
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><CreditCard size={16} /> Save Card</>}
      </button>
    </form>
  );
}

export default function SaveCardModal({ customerProfile, onClose, onSuccess }) {
  const [stripePromise, setStripePromise] = useState(null);
  const [keyError, setKeyError] = useState(false);

  useEffect(() => {
    base44.functions.invoke('getStripePublishableKey', {})
      .then(res => {
        const key = res.data?.publishable_key;
        if (key) {
          setStripePromise(loadStripe(key));
        } else {
          setKeyError(true);
        }
      })
      .catch(() => setKeyError(true));
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-base font-bold text-foreground">Add Payment Method</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Your card is only charged after job completion</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted">
            <X size={18} />
          </button>
        </div>

        {keyError ? (
          <div className="p-6 text-center text-sm text-red-600">
            Payment system not configured. Please contact support.
          </div>
        ) : !stripePromise ? (
          <div className="p-6 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <Elements stripe={stripePromise}>
            <CardForm customerProfile={customerProfile} onSuccess={onSuccess} onClose={onClose} />
          </Elements>
        )}
      </div>
    </div>
  );
}