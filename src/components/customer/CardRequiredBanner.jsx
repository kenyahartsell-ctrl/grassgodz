import { useState, useEffect } from 'react';
import { CreditCard, Lock, Loader2, CheckCircle } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

function CardForm({ customerProfile, onCardSaved }) {
  const stripe = useStripe();
  const elements = useElements();
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSaving(true);
    try {
      const res = await base44.functions.invoke('createSetupIntent', {});
      if (res.data?.error) throw new Error(res.data.error);
      const result = await stripe.confirmCardSetup(res.data.client_secret, {
        payment_method: { card: elements.getElement(CardElement) },
      });
      if (result.error) throw new Error(result.error.message);
      const pmId = result.setupIntent.payment_method;
      await base44.entities.CustomerProfile.update(customerProfile.id, {
        default_payment_method_id: pmId,
      });
      toast.success('Card saved — booking confirmed!');
      onCardSaved(pmId);
    } catch (err) {
      toast.error(err.message || 'Failed to save card.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-3 mt-3">
      <div className="border border-border rounded-lg p-3 bg-card">
        <CardElement
          options={{
            style: {
              base: { fontSize: '14px', color: '#1a1a1a', '::placeholder': { color: '#9ca3af' } },
            },
          }}
        />
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Lock size={10} />
        <span>Secured by Stripe. Only charged after job completion.</span>
      </div>
      <button
        type="submit"
        disabled={!stripe || saving}
        className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {saving ? (
          <><Loader2 size={14} className="animate-spin" /> Saving...</>
        ) : (
          <><CreditCard size={14} /> Save Card & Confirm Booking</>
        )}
      </button>
    </form>
  );
}

export default function CardRequiredBanner({ customerProfile, onCardSaved }) {
  const [stripePromise, setStripePromise] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    base44.functions.invoke('getStripePublishableKey', {}).then((res) => {
      if (res.data?.publishable_key) {
        setStripePromise(loadStripe(res.data.publishable_key));
      }
    });
  }, []);

  if (!customerProfile) return null;

  return (
    <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
      <div className="flex items-start gap-2">
        <CreditCard size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-900">Add a payment card to confirm your booking</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Your provider accepted the job. Add a card to lock it in — you're only charged after the work is done.
          </p>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-2 bg-amber-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
            >
              Add Payment Card
            </button>
          )}
          {showForm && stripePromise && (
            <Elements stripe={stripePromise}>
              <CardForm
                customerProfile={customerProfile}
                onCardSaved={onCardSaved}
              />
            </Elements>
          )}
          {showForm && !stripePromise && (
            <div className="flex justify-center py-3">
              <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
