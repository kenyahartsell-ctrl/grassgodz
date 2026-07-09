import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2, XCircle, Users, Mail, Loader2 } from 'lucide-react';
import PublicNav from '@/components/public/PublicNav';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

// signup-v4 — inline OTP verification flow
const LOGO_URL = 'https://media.base44.com/images/public/69e949497e5928c679297ebf/b2338f6dd_logo_transparent.png';

function PasswordStrength({ password }) {
  const checks = [
    { label: '8+ characters', pass: password.length >= 8 },
    { label: 'Uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', pass: /[a-z]/.test(password) },
    { label: 'Number', pass: /[0-9]/.test(password) },
  ];
  const passed = checks.filter(c => c.pass).length;
  const strength = passed <= 1 ? 'weak' : passed <= 3 ? 'medium' : 'strong';
  const colors = { weak: 'bg-red-400', medium: 'bg-amber-400', strong: 'bg-green-500' };
  const widths = { weak: 'w-1/4', medium: 'w-2/4', strong: 'w-full' };
  if (!password) return null;
  return (
    <div className="space-y-2 mt-1">
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${colors[strength]} ${widths[strength]}`} />
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        {checks.map(c => (
          <div key={c.label} className="flex items-center gap-1">
            {c.pass
              ? <CheckCircle2 size={11} className="text-green-500 flex-shrink-0" />
              : <XCircle size={11} className="text-muted-foreground flex-shrink-0" />}
            <span className={`text-xs ${c.pass ? 'text-green-600' : 'text-muted-foreground'}`}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Steps: 'form' | 'verify' | 'done'
export default function CustomerSignupPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const navigate = useNavigate();

  const [step, setStep] = useState('form');
  const [loading, setLoading] = useState(false);
  const [prosCount, setProsCount] = useState(null);
  const [errors, setErrors] = useState({});

  // OTP step state
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [resending, setResending] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    serviceAddress: '',
    zip: urlParams.get('zip') || '',
    billingSame: true,
    billingAddress: '',
    smsOptIn: false,
  });

  const set = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    setErrors(e => ({ ...e, [field]: null }));
  };

  const handlePhone = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 10);
    let formatted = digits;
    if (digits.length >= 7) formatted = `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
    else if (digits.length >= 4) formatted = `(${digits.slice(0,3)}) ${digits.slice(3)}`;
    else if (digits.length >= 1) formatted = `(${digits}`;
    set('phone', formatted);
  };

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

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Full name is required';
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Valid email required';
    const phoneDigits = form.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) errs.phone = 'Phone must be 10 digits';
if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
        else if (!/[A-Z]/.test(form.password)) errs.password = 'Password needs an uppercase letter';
            else if (!/[a-z]/.test(form.password)) errs.password = 'Password needs a lowercase letter';
                else if (!/[0-9]/.test(form.password)) errs.password = 'Password needs a number';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (!form.serviceAddress.trim()) errs.serviceAddress = 'Service address is required';
    if (!/^\d{5}$/.test(form.zip)) errs.zip = 'Valid 5-digit ZIP required';
    return errs;
  };

  // Step 1: Register → triggers OTP email from platform
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      await base44.auth.register({ email: form.email, password: form.password });
      setStep('verify');
    } catch (err) {
      const msg = err?.message || err?.data?.message || JSON.stringify(err) || '';
      if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('exists') || msg.toLowerCase().includes('duplicate')) {
        setErrors({ email: 'An account with this email already exists. Try signing in instead.' });
      } else if (msg.toLowerCase().includes('disabled') || msg.toLowerCase().includes('not enabled')) {
        toast.error('Email/password signup is not enabled. Please contact support.');
      } else {
        toast.error(`Signup failed: ${msg || 'Unknown error.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP → then login → then create profile → redirect
  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 4) { setOtpError('Please enter the verification code.'); return; }
    setOtpError('');
    setLoading(true);
    try {
      // Verify the OTP code
      await base44.auth.verifyOtp({ email: form.email, otpCode: otpCode.trim() });

      // Log in to get a session token
      await base44.auth.loginViaEmailPassword(form.email, form.password);

      // Set role to 'user' (customer)
      await base44.auth.updateMe({ role: 'user' });

      // Create the customer profile — guard against duplicates (e.g. OTP retry)
      const existing = await base44.entities.CustomerProfile.filter({ user_email: form.email });
      if (!existing || existing.length === 0) {
        const profileData = {
          name: form.name,
          phone: form.phone,
          service_address: form.serviceAddress,
          billing_address: form.billingSame ? form.serviceAddress : form.billingAddress,
          zip_code: form.zip,
          user_email: form.email,
          sms_opt_in: form.smsOptIn,
          sms_opt_in_date: form.smsOptIn ? new Date().toISOString() : null,
        };
        await base44.functions.invoke('createCustomerProfile', profileData);
      }

      // Navigate to dashboard
      navigate('/customer', { replace: true });
    } catch (err) {
      const msg = err?.message || err?.data?.message || JSON.stringify(err) || '';
      if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('incorrect') || msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('otp')) {
        setOtpError('Invalid or expired code. Please try again or resend.');
      } else {
        setOtpError(`Verification failed: ${msg || 'Unknown error.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResending(true);
    try {
      await base44.auth.resendOtp(form.email);
      toast.success('Verification code resent! Check your inbox.');
    } catch {
      toast.error('Could not resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const inputClass = (field) =>
    `w-full border rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-colors ${
      errors[field] ? 'border-destructive' : 'border-input'
    }`;

  // ── OTP Verification Step ──────────────────────────────────────
  if (step === 'verify') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <PublicNav />
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
          <div className="w-full max-w-md">
            <div className="text-center mb-7">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail size={28} className="text-green-600" />
              </div>
              <h1 className="text-2xl font-display font-bold text-foreground">Check your email</h1>
              <p className="text-sm text-muted-foreground mt-2">
                We sent a 6-digit verification code to<br />
                <span className="font-semibold text-foreground">{form.email}</span>
              </p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Verification Code *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={8}
                    value={otpCode}
                    onChange={e => { setOtpCode(e.target.value.replace(/\D/g, '')); setOtpError(''); }}
                    placeholder="123456"
                    className={`w-full border rounded-xl px-4 py-3 text-sm text-center text-xl tracking-widest bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-colors ${otpError ? 'border-destructive' : 'border-input'}`}
                    autoFocus
                  />
                  {otpError && <p className="text-xs text-destructive mt-1">{otpError}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Verifying...</> : 'Verify & Create Account'}
                </button>
              </form>

              <div className="mt-4 text-center">
                <p className="text-xs text-muted-foreground">
                  Didn't get a code?{' '}
                  <button
                    onClick={handleResendOtp}
                    disabled={resending}
                    className="text-primary font-semibold hover:underline disabled:opacity-50"
                  >
                    {resending ? 'Resending...' : 'Resend code'}
                  </button>
                  {' or '}
                  <button onClick={() => setStep('form')} className="text-primary font-semibold hover:underline">
                    go back
                  </button>
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Registration Form ──────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-7">
            <img src={LOGO_URL} alt="Grassgodz" className="h-12 w-12 object-contain mx-auto mb-3" />
            <h1 className="text-2xl font-display font-bold text-foreground">Create your account</h1>
            <p className="text-sm text-muted-foreground mt-1">Get matched with local lawn care pros</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            {prosCount !== null && (
              <div className="flex items-center gap-2 bg-secondary/40 rounded-xl px-4 py-2.5 text-sm font-medium text-foreground">
                <Users size={15} className="text-primary" />
                {prosCount > 0
                  ? `${prosCount} pro${prosCount > 1 ? 's' : ''} available in your area!`
                  : "No pros in your area yet — join the waitlist and we'll notify you."}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Full Name */}
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Full Name *</label>
                <input type="text" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Jane Smith" className={inputClass('name')} />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Email Address *</label>
                <input type="email" required value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@email.com" className={inputClass('email')} />
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Phone Number *</label>
                <input type="tel" required value={form.phone} onChange={e => handlePhone(e.target.value)} placeholder="(555) 123-4567" className={inputClass('phone')} />
                {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Password *</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} required value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min. 8 characters" className={inputClass('password') + ' pr-11'} />
                  <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
                <PasswordStrength password={form.password} />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Confirm Password *</label>
                <div className="relative">
                  <input type={showConfirm ? 'text' : 'password'} required value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} placeholder="Re-enter your password" className={inputClass('confirmPassword') + ' pr-11'} />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-destructive mt-1">{errors.confirmPassword}</p>}
              </div>

              {/* Service Address */}
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Service Address *</label>
                <input type="text" required value={form.serviceAddress} onChange={e => set('serviceAddress', e.target.value)} placeholder="123 Main St, City, State" className={inputClass('serviceAddress')} />
                {errors.serviceAddress && <p className="text-xs text-destructive mt-1">{errors.serviceAddress}</p>}
              </div>

              {/* ZIP */}
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">ZIP Code *</label>
                <input type="text" required value={form.zip} onChange={e => set('zip', e.target.value.replace(/\D/g, '').slice(0, 5))} placeholder="20001" maxLength={5} className={inputClass('zip')} />
                {errors.zip && <p className="text-xs text-destructive mt-1">{errors.zip}</p>}
              </div>

              {/* Billing Address */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.billingSame} onChange={e => set('billingSame', e.target.checked)} className="w-4 h-4 accent-primary" />
                  <span className="text-sm text-foreground">Billing address same as service address</span>
                </label>
                {!form.billingSame && (
                  <input type="text" value={form.billingAddress} onChange={e => set('billingAddress', e.target.value)} placeholder="Billing address" className={`${inputClass('billingAddress')} mt-2`} />
                )}
              </div>

              {/* SMS Consent */}
              <div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={form.smsOptIn}
                    onChange={e => set('smsOptIn', e.target.checked)}
                    className="mt-1 w-4 h-4 accent-primary flex-shrink-0"
                  />
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    By creating an account, you agree to receive SMS notifications from Grassgodz including job alerts, chat message notifications, and account updates. Message and data rates may apply. Reply STOP at any time to opt out.
                    <br />
                    <span className="text-[10px] opacity-70">Grassgodz is a brand operated by Tradegodz LLC.</span>
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-70 mt-2 flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> Creating account...</> : 'Create Account'}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-5">
            Already have an account?{' '}
            <Link to="/signin/customer" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>

          <p className="text-center text-xs text-muted-foreground mt-3">
            Are you a lawn care pro?{' '}
            <Link to="/signup/provider" className="text-primary font-semibold hover:underline">Apply here →</Link>
          </p>
        </div>
      </main>
    </div>
  );
}