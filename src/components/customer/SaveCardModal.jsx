import { useState, useEffect } from 'react';
import { X, Loader2, CreditCard, Lock } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);

    try {
      // Get setup intent client secret
      const res = await base44.functions.invoke('createSetupIntent', {
        customer_id: customerProfile.id,
      });
      const { client_secret } = res.data;

      const result = await stripe.confirmCardSetup(client_secret, {
        payment_method: { card: elements.getElement(CardElement) },
      });

      if (result.error) {
        toast.error(result.error.message);
        return;
      }

      const paymentMethodId = result.setupIntent.payment_method;
      // Save as default
      await base44.entities.CustomerProfile.update(customerProfile.id, {
        default_payment_method_id: paymentMethodId,
      });

      toast.success('Card saved successfully!');
      onSuccess(paymentMethodId);
    } catch (err) {
      toast.error('Failed to save card. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div className="border border-border rounded-xl p-4 bg-muted/20">
        <CardElement options={CARD_ELEMENT_OPTIONS} />
      </div>
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
        {!publishableKey ? (
          <div className="p-6 text-sm text-destructive">Stripe is not configured. Please contact support.</div>
        ) : (
          <Elements stripe={stripePromise}>
            <CardForm customerProfile={customerProfile} onSuccess={onSuccess} onClose={onClose} />
          </Elements>
        )}
      </div>
    </div>
  );
}