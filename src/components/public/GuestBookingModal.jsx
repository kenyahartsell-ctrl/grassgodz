import { useState } from 'react';
import { X, ArrowRight, ArrowLeft, CheckCircle, Phone, Mail, MapPin, User, Scissors } from 'lucide-react';

export default function GuestBookingModal({ onClose, summary }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleConfirm = async () => {
    setLoading(true);
    // Simulate brief processing — replace with real payment/booking call
    await new Promise(r => setTimeout(r, 900));
    setLoading(false);
    setDone(true);
  };

  const inputClass = "w-full border border-input rounded-xl px-4 py-3.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md bg-card rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            {step > 1 && !done && (
              <button onClick={() => setStep(s => s - 1)} className="mr-1 text-muted-foreground hover:text-foreground">
                <ArrowLeft size={18} />
              </button>
            )}
            <span className="font-bold text-foreground text-base">
              {done ? 'Booking Requested!' : step === 1 ? 'Your Info' : 'Confirm & Book'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {!done && (
              <div className="flex gap-1.5">
                {[1, 2].map(s => (
                  <div key={s} className={`h-1.5 rounded-full transition-all ${s <= step ? 'bg-primary w-5' : 'bg-border w-3'}`} />
                ))}
              </div>
            )}
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* STEP 1: Contact Info */}
          {step === 1 && (
            <form
              className="p-5 space-y-3"
              onSubmit={e => { e.preventDefault(); setStep(2); }}
            >
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
                Review Order <ArrowRight size={16} />
              </button>
              <p className="text-center text-xs text-muted-foreground">No charge until the job is complete</p>
            </form>
          )}

          {/* STEP 2: Confirm */}
          {step === 2 && !done && (
            <div className="p-5 space-y-4">
              {/* Price */}
              <div className="bg-foreground rounded-2xl p-5 text-white text-center">
                <p className="text-xs text-white/60 uppercase tracking-wide font-semibold mb-1">
                  {summary.frequency === 'one-time' ? 'Estimated Total' : `Per Visit · ${summary.frequency}`}
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

              {/* Service details */}
              <div className="bg-muted/40 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Scissors size={14} className="text-primary" />
                  <span className="text-xs font-bold text-foreground uppercase tracking-wide">Service Details</span>
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

              {/* Customer details */}
              <div className="bg-muted/40 rounded-xl p-4 space-y-1.5">
                <p className="text-xs font-bold text-foreground uppercase tracking-wide mb-2">Your Details</p>
                {[
                  { icon: User, val: form.name },
                  { icon: Phone, val: form.phone },
                  { icon: Mail, val: form.email },
                  { icon: MapPin, val: form.address },
                ].map(({ icon: Icon, val }) => (
                  <div key={val} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon size={13} className="flex-shrink-0 text-primary" />
                    <span>{val}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleConfirm}
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-400 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-base disabled:opacity-70"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <>Continue to Payment <ArrowRight size={16} /></>
                )}
              </button>
              <p className="text-center text-xs text-muted-foreground">We'll confirm your booking via email & text</p>
            </div>
          )}

          {/* DONE */}
          {done && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Request Received!</h3>
              <p className="text-sm text-muted-foreground mb-1">
                We'll reach out to <span className="font-semibold text-foreground">{form.email}</span> and <span className="font-semibold text-foreground">{form.phone}</span> shortly to confirm.
              </p>
              <p className="text-xs text-muted-foreground mt-3 mb-6">No payment collected yet — you only pay after the job is done.</p>
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