import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, ArrowLeft, Upload } from 'lucide-react';
import PublicNav from '@/components/public/PublicNav';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

// ANALYTICS HOOK: track('pro_application_started') on mount
// ANALYTICS HOOK: track('pro_application_completed') after submission

const STEPS = ['Personal Info', 'Business Info', 'Service Area', 'Background Check', 'Account Setup'];

const SERVICES_LIST = [
  { id: 's1', name: 'Lawn Mowing' },
  { id: 's2', name: 'Leaf Removal' },
  { id: 's3', name: 'Hedge Trimming' },
  { id: 's4', name: 'Fertilization' },
  { id: 's5', name: 'Aeration' },
  { id: 's6', name: 'Snow Removal' },
];

export default function ProviderSignupPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', email: '', phone: '', dob: '',
    businessName: '', yearsExp: '', bio: '',
    zipCodes: '', servicesOffered: [],
    agreedBackground: false, agreedTerms: false,
  });

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const toggleService = (id) => {
    setForm(f => ({
      ...f,
      servicesOffered: f.servicesOffered.includes(id)
        ? f.servicesOffered.filter(s => s !== id)
        : [...f.servicesOffered, id],
    }));
  };

  const validateAge = () => {
    if (!form.dob) return false;
    const dob = new Date(form.dob);
    const age = (new Date() - dob) / (1000 * 60 * 60 * 24 * 365.25);
    return age >= 18;
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (step === 0 && !validateAge()) {
      toast.error('You must be 18 or older to apply.');
      return;
    }
    setStep(s => s + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Create ProviderProfile with pending status; auth handled by base44
      await base44.entities.ProviderProfile.create({
        user_email: form.email,
        name: form.name,
        phone: form.phone,
        business_name: form.businessName,
        bio: form.bio,
        years_experience: Number(form.yearsExp),
        service_zip_codes: form.zipCodes.split(',').map(z => z.trim()).filter(Boolean),
        services_offered: form.servicesOffered,
        status: 'pending_approval',
      });
      // ANALYTICS HOOK: track('pro_application_completed')
      navigate('/provider/pending');
    } catch (err) {
      toast.error('Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          {/* Progress */}
          <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-1 flex-shrink-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  i < step ? 'bg-primary text-white' : i === step ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                {i < STEPS.length - 1 && <div className={`w-6 h-0.5 ${i < step ? 'bg-primary' : 'bg-border'}`} />}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mb-4">Step {step + 1} of {STEPS.length}: <span className="font-semibold text-foreground">{STEPS[step]}</span></p>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">

            {/* Step 0: Personal Info */}
            {step === 0 && (
              <form onSubmit={handleNext} className="space-y-4">
                <h2 className="text-xl font-bold text-foreground">Personal Information</h2>
                <input required value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder="Full name" className="w-full border border-input rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                <input required type="email" value={form.email} onChange={e => set('email', e.target.value)}
                  placeholder="Email address" className="w-full border border-input rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                <input required type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                  placeholder="Phone number" className="w-full border border-input rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Date of birth (must be 18+)</label>
                  <input required type="date" value={form.dob} onChange={e => set('dob', e.target.value)}
                    max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    className="w-full border border-input rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <button type="submit" className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                  Next <ArrowRight size={16} />
                </button>
              </form>
            )}

            {/* Step 1: Business Info */}
            {step === 1 && (
              <form onSubmit={handleNext} className="space-y-4">
                <h2 className="text-xl font-bold text-foreground">Business Information</h2>
                <input required value={form.businessName} onChange={e => set('businessName', e.target.value)}
                  placeholder="Business name (or your name)" className="w-full border border-input rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                <input required type="number" min={0} max={50} value={form.yearsExp} onChange={e => set('yearsExp', e.target.value)}
                  placeholder="Years of experience" className="w-full border border-input rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                <textarea required value={form.bio} onChange={e => set('bio', e.target.value)}
                  rows={3} placeholder="Brief bio — tell customers about yourself and your work..."
                  className="w-full border border-input rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(0)} className="flex-1 border border-border rounded-xl py-3 text-sm font-medium hover:bg-muted transition-colors flex items-center justify-center gap-1">
                    <ArrowLeft size={14} /> Back
                  </button>
                  <button type="submit" className="flex-1 bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                    Next <ArrowRight size={16} />
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Service Area + Services */}
            {step === 2 && (
              <form onSubmit={handleNext} className="space-y-4">
                <h2 className="text-xl font-bold text-foreground">Service Area & Services</h2>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">ZIP codes you serve (comma-separated)</label>
                  <input required value={form.zipCodes} onChange={e => set('zipCodes', e.target.value)}
                    placeholder="62701, 62702, 62703" className="w-full border border-input rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                  <p className="text-xs text-muted-foreground mt-1">Enter the ZIP codes within your service radius</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Services you offer (select all that apply)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {SERVICES_LIST.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleService(s.id)}
                        className={`px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-colors border ${
                          form.servicesOffered.includes(s.id)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background border-border hover:border-primary/50'
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 border border-border rounded-xl py-3 text-sm font-medium hover:bg-muted transition-colors flex items-center justify-center gap-1">
                    <ArrowLeft size={14} /> Back
                  </button>
                  <button type="submit" disabled={form.servicesOffered.length === 0} className="flex-1 bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    Next <ArrowRight size={16} />
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Background Check + Terms */}
            {step === 3 && (
              <form onSubmit={handleNext} className="space-y-5">
                <h2 className="text-xl font-bold text-foreground">Background Check & Terms</h2>
                <div className="bg-secondary/30 rounded-xl p-4 text-sm text-muted-foreground leading-relaxed">
                  By continuing, you consent to a background check as part of the Grassgodz provider approval process. This helps us maintain a safe and trustworthy platform.
                </div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.agreedBackground} onChange={e => set('agreedBackground', e.target.checked)} className="mt-1" required />
                  <span className="text-sm text-foreground">I consent to a background check and understand it may affect my application.</span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.agreedTerms} onChange={e => set('agreedTerms', e.target.checked)} className="mt-1" required />
                  <span className="text-sm text-foreground">I agree to the <a href="#" className="text-primary underline">Terms of Service</a> and <a href="#" className="text-primary underline">Provider Agreement</a>.</span>
                </label>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(2)} className="flex-1 border border-border rounded-xl py-3 text-sm font-medium hover:bg-muted transition-colors flex items-center justify-center gap-1">
                    <ArrowLeft size={14} /> Back
                  </button>
                  <button type="submit" disabled={!form.agreedBackground || !form.agreedTerms} className="flex-1 bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    Next <ArrowRight size={16} />
                  </button>
                </div>
              </form>
            )}

            {/* Step 4: Account Setup / Submit */}
            {step === 4 && (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h2 className="text-xl font-bold text-foreground">Submit Your Application</h2>
                <p className="text-sm text-muted-foreground">Review your info below, then submit. You'll receive an email when your application is reviewed (usually within 24 hours).</p>
                <div className="bg-secondary/30 rounded-xl p-4 text-sm space-y-1.5">
                  <p><span className="text-muted-foreground">Name:</span> <span className="font-medium">{form.name}</span></p>
                  <p><span className="text-muted-foreground">Business:</span> <span className="font-medium">{form.businessName}</span></p>
                  <p><span className="text-muted-foreground">Experience:</span> <span className="font-medium">{form.yearsExp} years</span></p>
                  <p><span className="text-muted-foreground">ZIPs:</span> <span className="font-medium">{form.zipCodes}</span></p>
                  <p><span className="text-muted-foreground">Services:</span> <span className="font-medium">{form.servicesOffered.length} selected</span></p>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(3)} className="flex-1 border border-border rounded-xl py-3 text-sm font-medium hover:bg-muted transition-colors flex items-center justify-center gap-1">
                    <ArrowLeft size={14} /> Back
                  </button>
                  <button type="submit" disabled={loading} className="flex-1 bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-70">
                    {loading ? 'Submitting...' : 'Submit Application'}
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