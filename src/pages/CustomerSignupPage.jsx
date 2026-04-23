import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, ArrowLeft, Users } from 'lucide-react';
import PublicNav from '@/components/public/PublicNav';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

// ANALYTICS HOOK: track('customer_signup_started') on mount
// ANALYTICS HOOK: track('customer_signup_completed') after profile created

const STEPS = ['Service Address', 'Your Account', 'Verify Email'];

export default function CustomerSignupPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const [step, setStep] = useState(0);
  const [prosCount, setProsCount] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    street: '',
    city: '',
    state: '',
    zip: urlParams.get('zip') || '',
    name: '',
    email: '',
    phone: '',
  });

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  // Check pros in zip when zip is filled
  useEffect(() => {
    if (form.zip.length === 5) {
      base44.entities.ProviderProfile.filter({ status: 'active' })
        .then(providers => {
          const count = providers.filter(p =>
            Array.isArray(p.service_zip_codes) && p.service_zip_codes.includes(form.zip)
          ).length;
          setProsCount(count);
        })
        .catch(() => setProsCount(null));
    } else {
      setProsCount(null);
    }
  }, [form.zip]);

  const handleNext = (e) => {
    e.preventDefault();
    if (step < STEPS.length - 1) setStep(s => s + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Redirect to login/signup via base44 auth
      base44.auth.redirectToLogin();
      // After auth, CustomerProfile creation would happen in a post-login hook
    } catch {
      toast.error('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  i < step ? 'bg-primary text-white' : i === step ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  {i < step ? <CheckCircle size={14} /> : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
                {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? 'bg-primary' : 'bg-border'}`} />}
              </div>
            ))}
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            {/* Step 0: Address */}
            {step === 0 && (
              <form onSubmit={handleNext} className="space-y-4">
                <h2 className="text-xl font-bold text-foreground">Where do you need service?</h2>

                {prosCount !== null && (
                  <div className="flex items-center gap-2 bg-secondary/40 rounded-xl px-4 py-2.5 text-sm font-medium text-foreground">
                    <Users size={15} className="text-primary" />
                    {prosCount > 0
                      ? `${prosCount} pro${prosCount > 1 ? 's' : ''} available in your area!`
                      : 'No pros in this area yet — we may still be able to help.'}
                  </div>
                )}

                <input required value={form.street} onChange={e => set('street', e.target.value)}
                  placeholder="Street address" className="w-full border border-input rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                <div className="grid grid-cols-2 gap-3">
                  <input required value={form.city} onChange={e => set('city', e.target.value)}
                    placeholder="City" className="border border-input rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                  <input required value={form.state} onChange={e => set('state', e.target.value)}
                    placeholder="State" maxLength={2} className="border border-input rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <input required value={form.zip} onChange={e => set('zip', e.target.value)}
                  placeholder="ZIP code" maxLength={5} pattern="[0-9]{5}"
                  className="w-full border border-input rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />

                <button type="submit" className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                  Next <ArrowRight size={16} />
                </button>
              </form>
            )}

            {/* Step 1: Account details */}
            {step === 1 && (
              <form onSubmit={handleNext} className="space-y-4">
                <h2 className="text-xl font-bold text-foreground">Create your account</h2>
                <input required value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder="Full name" className="w-full border border-input rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                <input required type="email" value={form.email} onChange={e => set('email', e.target.value)}
                  placeholder="Email address" className="w-full border border-input rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                <input required type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                  placeholder="Phone number" className="w-full border border-input rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(0)} className="flex-1 border border-border rounded-xl py-3 text-sm font-medium hover:bg-muted transition-colors flex items-center justify-center gap-1">
                    <ArrowLeft size={14} /> Back
                  </button>
                  <button type="submit" className="flex-2 flex-1 bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                    Next <ArrowRight size={16} />
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Verify / Finalize */}
            {step === 2 && (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h2 className="text-xl font-bold text-foreground">Almost there!</h2>
                <p className="text-sm text-muted-foreground">
                  Click the button below to create your account. You'll be asked to verify your email before your first booking.
                </p>
                <div className="bg-secondary/30 rounded-xl p-4 text-sm space-y-1">
                  <p><span className="text-muted-foreground">Name:</span> <span className="font-medium">{form.name}</span></p>
                  <p><span className="text-muted-foreground">Email:</span> <span className="font-medium">{form.email}</span></p>
                  <p><span className="text-muted-foreground">Address:</span> <span className="font-medium">{form.street}, {form.city}, {form.state} {form.zip}</span></p>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 border border-border rounded-xl py-3 text-sm font-medium hover:bg-muted transition-colors flex items-center justify-center gap-1">
                    <ArrowLeft size={14} /> Back
                  </button>
                  <button type="submit" disabled={loading} className="flex-1 bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-70">
                    {loading ? 'Creating...' : 'Create Account'}
                  </button>
                </div>
              </form>
            )}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-5">
            Already have an account? <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </main>
    </div>
  );
}