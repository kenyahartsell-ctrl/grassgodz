import { useState, useEffect } from 'react';
import { X, MapPin, Calendar, FileText, RefreshCw, CreditCard, Lock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { YARD_SIZES } from '@/lib/pricingFloors';

// Fixed lawn mowing prices by yard size
const LAWN_FIXED_PRICES = {
  small: { price: 45, label: 'Small', desc: 'Up to 1/8 acre' },
  medium: { price: 65, label: 'Medium', desc: '1/8 – 1/4 acre' },
  large: { price: 85, label: 'Large', desc: '1/4 – 1/2 acre' },
  xl: { price: 120, label: 'Extra Large', desc: '1/2+ acre' },
};
import { base44 } from '@/api/base44Client';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { toast } from 'sonner';

const LAWN_KEYWORDS = ['mow', 'mowing', 'grass', 'lawn', 'cut'];
const isLawnService = (name) => LAWN_KEYWORDS.some(k => name?.toLowerCase().includes(k));

// ── Inline card collection ────────────────────────────────────────────────────
function CardGateForm({ customerProfile, onCardSaved, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState(false);
  const [cardError, setCardError] = useState(null);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSaving(true);
    setCardError(null);
    try {
      const res = await base44.functions.invoke('createSetupIntent', {});
      if (res.data?.error) {
        if (res.data.error.toLowerCase().includes('profile not found') || res.data.error.toLowerCase().includes('not found')) {
          setProfileError(true);
          return;
        }
        throw new Error(res.data.error);
      }
      const result = await stripe.confirmCardSetup(res.data.client_secret, {
        payment_method: { card: elements.getElement(CardElement) },
      });
      if (result.error) {
        setCardError(result.error.message);
        return;
      }
      const pmId = result.setupIntent.payment_method;
      await base44.entities.CustomerProfile.update(customerProfile.id, {
        default_payment_method_id: pmId,
      });
      toast.success('Card saved!');
      onCardSaved(pmId);
    } catch (err) {
      setCardError(err.message || 'Failed to save card. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (profileError) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center text-center gap-3 py-4">
          <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center">
            <AlertCircle size={26} className="text-amber-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Account setup needed</h3>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              To schedule a cut, your account needs to be fully set up first. Here's what to do:
            </p>
          </div>
        </div>
        <div className="bg-muted/40 rounded-xl p-4 space-y-3 text-sm text-foreground">
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
            <p>Go to your <strong>Profile</strong> tab and make sure your name, address, and zip code are filled in.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
            <p>Add a payment card in your profile settings. <strong>You won't be charged until after the job is done.</strong></p>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
            <p>Come back here and request your cut — it only takes a minute!</p>
          </div>
        </div>
        <p className="text-xs text-center text-muted-foreground">Need help? Contact us at <strong>support@grassgodz.com</strong></p>
        <button
          type="button"
          onClick={onCancel}
          className="w-full border border-border rounded-xl py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="text-center mb-2">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
          <CreditCard size={22} className="text-primary" />
        </div>
        <h3 className="text-base font-bold text-foreground">Add a payment card</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Required before submitting a job request. <strong>You won't be charged until after the job is completed.</strong>
        </p>
      </div>
      <div className="border border-border rounded-xl p-3.5 bg-muted/20">
        <CardElement
          options={{
            style: {
              base: { fontSize: '14px', color: '#1a1a1a', '::placeholder': { color: '#9ca3af' } },
            },
          }}
        />
      </div>
      {cardError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-xs text-red-700">
          <AlertCircle size={13} className="text-red-500 flex-shrink-0 mt-0.5" />
          <span>{cardError}</span>
        </div>
      )}
      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Lock size={11} />
        <span>Secured by Stripe — only charged after job completion.</span>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border border-border rounded-xl py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || saving}
          className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><CreditCard size={14} /> Save & Continue</>}
        </button>
      </div>
    </form>
  );
}

function CardGate({ customerProfile, onCardSaved, onCancel }) {
  const [stripePromise, setStripePromise] = useState(null);

  useEffect(() => {
    base44.functions.invoke('getStripePublishableKey', {})
      .then(res => {
        if (res.data?.publishable_key) setStripePromise(loadStripe(res.data.publishable_key));
      });
  }, []);

  if (!stripePromise) {
    return (
      <div className="flex flex-col items-center py-8 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Loading payment form...</p>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <CardGateForm customerProfile={customerProfile} onCardSaved={onCardSaved} onCancel={onCancel} />
    </Elements>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────
export default function RequestJobModal({ service, onClose, onSubmit, customerProfile, onCardSaved }) {
  const { t } = useLanguage();
  const isLawn = isLawnService(service.name);
  const showRecurrence = isLawn;
  const [showCardGate, setShowCardGate] = useState(false);
  const [savedPmId, setSavedPmId] = useState(customerProfile?.default_payment_method_id || null);
  const [pendingForm, setPendingForm] = useState(null);

  const [form, setForm] = useState({
    address: customerProfile?.service_address || '',
    zip_code: customerProfile?.zip_code || '',
    scheduled_date: '',
    customer_notes: '',
    recurrence: 'one_time',
    yard_size: '',
  });

  const fixedPrice = isLawn && form.yard_size ? LAWN_FIXED_PRICES[form.yard_size]?.price : null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const hasCard = !!(savedPmId || customerProfile?.default_payment_method_id);
  const cashApproved = customerProfile?.allow_cash_payment;
    if (!hasCard && !cashApproved) {
      // Save form and show card gate
      setPendingForm({ ...form, service_id: service.id, service_name: service.name });
      setShowCardGate(true);
      return;
    }
    const submitData = { ...form, service_id: service.id, service_name: service.name };
    if (isLawn && fixedPrice) submitData.quoted_price = fixedPrice;
    onSubmit(submitData);
    onClose();
  };

  const handleCardSaved = (pmId) => {
    setSavedPmId(pmId);
    setShowCardGate(false);
    if (onCardSaved) onCardSaved(pmId);
    // Submit the pending form now that card is saved
    if (pendingForm) {
      if (isLawn && fixedPrice) pendingForm.quoted_price = fixedPrice;
      onSubmit(pendingForm);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {showCardGate ? 'Payment Info Required' : t('request_quote')}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">{service.name}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {showCardGate ? (
            <CardGate
              customerProfile={customerProfile}
              onCardSaved={handleCardSaved}
              onCancel={() => setShowCardGate(false)}
            />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Card-on-file status */}
              {savedPmId || customerProfile?.default_payment_method_id ? (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5 text-xs text-green-800 font-medium">
                  <CreditCard size={13} className="text-green-600" />
                  Card on file — you'll only be charged after job completion.
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-amber-800">
                  <CreditCard size={13} className="text-amber-600" />
                  <span>A card is required to submit a request. You won't be charged until after the job is done.</span>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-1.5">
                  <MapPin size={13} className="text-primary" /> {t('service_address')}
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">{t('zip_code')}</label>
                <input
                  type="text"
                  value={form.zip_code}
                  onChange={e => setForm(f => ({ ...f, zip_code: e.target.value }))}
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-1.5">
                  <Calendar size={13} className="text-primary" /> {t('preferred_date')}
                </label>
                <input
                  type="date"
                  value={form.scheduled_date}
                  onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))}
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              {showRecurrence && (
                <div>
                  <label className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-2">
                    <RefreshCw size={13} className="text-primary" /> {t('how_often')}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'one_time', label: t('one_time') },
                      { value: 'weekly', label: t('weekly') },
                      { value: 'biweekly', label: t('biweekly') },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, recurrence: opt.value }))}
                        className={`py-2.5 rounded-lg text-sm font-medium border transition-all ${
                          form.recurrence === opt.value
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-foreground border-input hover:border-primary/50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {form.recurrence !== 'one_time' && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {form.recurrence === 'weekly' ? t('recurrence_note_weekly') : t('recurrence_note_biweekly')}
                    </p>
                  )}
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-1.5">
                  <FileText size={13} className="text-primary" /> {t('notes_for_provider')}
                </label>
                <textarea
                  value={form.customer_notes}
                  onChange={e => setForm(f => ({ ...f, customer_notes: e.target.value }))}
                  rows={3}
                  placeholder={t('notes_placeholder')}
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
              {isLawn ? (
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Yard Size & Price *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(LAWN_FIXED_PRICES).map(([key, opt]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, yard_size: key }))}
                        className={`relative p-3 rounded-xl border-2 text-left transition-all ${
                          form.yard_size === key
                            ? 'border-primary bg-primary/5'
                            : 'border-input bg-background hover:border-primary/40'
                        }`}
                      >
                        {form.yard_size === key && (
                          <CheckCircle2 size={14} className="absolute top-2 right-2 text-primary" />
                        )}
                        <p className="text-sm font-bold text-foreground">{opt.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                        <p className="text-base font-bold text-primary mt-1">${opt.price}</p>
                      </button>
                    ))}
                  </div>
                  {fixedPrice && (
                    <div className="mt-3 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5 text-sm text-green-800 font-semibold">
                      <CheckCircle2 size={15} className="text-green-600 flex-shrink-0" />
                      You agree to <span className="text-green-700">${fixedPrice}</span> for this lawn cut — no waiting for quotes.
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Yard Size *</label>
                  <select
                    value={form.yard_size}
                    onChange={e => setForm(f => ({ ...f, yard_size: e.target.value }))}
                    required
                    className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select yard size…</option>
                    {YARD_SIZES.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              )}
              {!isLawn && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-xs text-amber-800 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: t('quote_disclaimer') }} />
              )}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose} className="flex-1 border border-border rounded-lg px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
                  {t('cancel')}
                </button>
                <button type="submit" className="flex-1 bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors">
                  {savedPmId || customerProfile?.default_payment_method_id ? t('submit_request') : 'Add Card & Continue'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}