import { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, CheckCircle, Phone, Mail, MapPin, User, Scissors, Lock, Shield } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { base44 } from '@/api/base44Client';

// stripePromise is fetched dynamically from the backend

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '15px',
      color: '#111827',
      fontFamily: 'Inter, sans-serif',
      '::placeholder': { color: '#9ca3af' },
    },
    invalid: { color: '#ef4444' },
  },
};

function CheckoutForm({ form, summary, onSuccess, onBack }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError('');

    try {
      // 1. Create payment intent on server
      const res = await base44.functions.invoke('createPaymentIntent', {
        amount: summary.total,
        customerEmail: form.email,
        customerName: form.name,
        serviceDescription: summary.breakdown.map(b => b.label).join(', '),
      });

      const { clientSecret } = res.data;

      // 2. Confirm card payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: form.name,
            email: form.email,
            phone: form.phone,
            address: { line1: form.address },
          },
        },
      });

      if (result.error) {
        setError(result.error.message);
        setLoading(false);
        return;
      }

      // 3. Send confirmation email
      await base44.functions.invoke('sendBookingConfirmation', {
        customerEmail: form.email,
        customerName: form.name,
        customerPhone: form.phone,
        address: form.address,
        total: summary.total,
        frequency: summary.frequency,
        breakdown: summary.breakdown,
      });

      onSuccess();
    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handlePay} className="p-5 space-y-4">
      {/* Price summary */}
      <div className="bg-foreground rounded-2xl p-5 text-white text-center">
        <p className="text-xs text-white/60 uppercase tracking-wide font-semibold mb-1">
          {summary.frequency === 'one-time' ? 'Total Due Today' : `Per Visit · ${summary.frequency}`}
        </p>
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-5xl font-display font-bold">${summary.total}</span>
          {summary.savings > 0 && (
            <span className="text-base line-through text-white/40">${summary.subtotal}</span>
          )}
        </div>
        {summary.savings > 0 && (
          <p className="text-xs font-semibold text-green-400 mt-1">Saving ${summary.savings}/visit</p>
        )}
      </div>

      {/* Service breakdown */}
      <div className="bg-muted/40 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <Scissors size={13} className="text-primary" />
          <span className="text-xs font-bold text-foreground uppercase tracking-wide">Order Summary</span>
        </div>
        {summary.breakdown.map((line, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className={line.green ? 'text-green-600 font-medium' : 'text-muted-foreground'}>{line.label}</span>
            <span className={`font-semibold ${line.green ? 'text-green-600' : 'text-foreground'}`}>
              {line.amount < 0 ? `-$${Math.abs(line.amount)}` : `$${line.amount}`}
            </span>
          </div>
        ))}
      </div>

      {/* Secure Checkout */}
      <div className="border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Lock size={13} className="text-primary" />
          <span className="text-xs font-bold text-foreground uppercase tracking-wide">Secure Checkout</span>
        </div>
        <div className="border border-input rounded-xl px-4 py-3.5 bg-background">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
        {error && (
          <p className="text-xs text-destructive font-medium">{error}</p>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Shield size={12} className="text-green-600" />
          <span>256-bit SSL encrypted · Powered by Stripe</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !stripe}
        className="w-full bg-green-500 hover:bg-green-400 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-base disabled:opacity-70"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processing Payment...
          </span>
        ) : (
          <>Pay ${summary.total} & Book <ArrowRight size={16} /></>
        )}
      </button>
      <p className="text-center text-xs text-muted-foreground">Your card will be charged ${summary.total} now</p>
    </form>
  );
}

export default function GuestBookingModal({ onClose, summary }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [done, setDone] = useState(false);
  const [stripePromise, setStripePromise] = useState(null);

  useEffect(() => {
    base44.functions.invoke('getStripePublishableKey', {})
      .then(res => {
        const key = res.data?.publishable_key;
        if (key) setStripePromise(loadStripe(key));
      })
      .catch(() => {});
  }, []);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));
  const inputClass = "w-full border border-input rounded-xl px-4 py-3.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground";

  const stepLabel = done ? 'Booking Confirmed!' : step === 1 ? 'Your Info' : 'Secure Checkout';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={!done ? onClose : undefined} />

      <div className="relative z-10 w-full max-w-md bg-card rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            {step === 2 && !done && (
              <button onClick={() => setStep(1)} className="mr-1 text-muted-foreground hover:text-foreground">
                <ArrowLeft size={18} />
              </button>
            )}
            <span className="font-bold text-foreground text-base">{stepLabel}</span>
          </div>
          <div className="flex items-center gap-3">
            {!done && (
              <div className="flex gap-1.5">
                {[1, 2].map(s => (
                  <div key={s} className={`h-1.5 rounded-full transition-all ${s <= step ? 'bg-primary w-5' : 'bg-border w-3'}`} />
                ))}
              </div>
            )}
            {!done && (
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* STEP 1: Contact Info */}
          {step === 1 && (
            <form className="p-5 space-y-3" onSubmit={e => { e.preventDefault(); setStep(2); }}>
              <p className="text-sm text-muted-foreground mb-4">Quick and easy — no account needed.</p>

              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input required value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder="Full name" className={`${inputClass} pl-10`} />
              </div>
              <div className="relative">
                <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input required type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                  placeholder="Phone number" className={`${inputClass} pl-10`} />
              </div>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input required type="email" value={form.email} onChange={e => set('email', e.target.value)}
                  placeholder="Email address" className={`${inputClass} pl-10`} />
              </div>
              <div className="relative">
                <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input required value={form.address} onChange={e => set('address', e.target.value)}
                  placeholder="Service address" className={`${inputClass} pl-10`} />
              </div>

              <button type="submit"
                className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 mt-2 text-base">
                Continue to Payment <ArrowRight size={16} />
              </button>
              <p className="text-center text-xs text-muted-foreground">No account needed · Secure checkout</p>
            </form>
          )}

          {/* STEP 2: Stripe Payment */}
          {step === 2 && !done && (
            stripePromise ? (
              <Elements stripe={stripePromise}>
                <CheckoutForm
                  form={form}
                  summary={summary}
                  onSuccess={() => setDone(true)}
                  onBack={() => setStep(1)}
                />
              </Elements>
            ) : (
              <div className="p-10 flex justify-center">
                <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )
          )}

          {/* DONE: Confirmation */}
          {done && (
            <div className="p-6 space-y-4">
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-1">You're all set, {form.name.split(' ')[0]}!</h3>
                <p className="text-sm text-muted-foreground">A confirmation has been sent to <span className="font-semibold text-foreground">{form.email}</span></p>
              </div>

              {/* Booking summary */}
              <div className="bg-muted/40 rounded-xl p-4 space-y-2">
                <p className="text-xs font-bold text-foreground uppercase tracking-wide mb-3">Booking Summary</p>
                {summary.breakdown.map((line, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className={line.green ? 'text-green-600 font-medium' : 'text-muted-foreground'}>{line.label}</span>
                    <span className={`font-semibold ${line.green ? 'text-green-600' : 'text-foreground'}`}>
                      {line.amount < 0 ? `-$${Math.abs(line.amount)}` : `$${line.amount}`}
                    </span>
                  </div>
                ))}
                <div className="border-t border-border pt-2 flex justify-between">
                  <span className="text-sm font-bold">Total Paid</span>
                  <span className="text-sm font-bold text-primary">${summary.total}</span>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-green-800">
                  <MapPin size={13} /> <span>{form.address}</span>
                </div>
                <div className="flex items-center gap-2 text-green-800">
                  <Phone size={13} /> <span>{form.phone}</span>
                </div>
                <p className="text-xs text-green-700 mt-1">A local pro will contact you to confirm the exact time.</p>
              </div>

              <button onClick={onClose}
                className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:bg-primary/90 transition-colors">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}