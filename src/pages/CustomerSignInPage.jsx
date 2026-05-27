import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Loader2 } from 'lucide-react';
import PublicNav from '@/components/public/PublicNav';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const LOGO_URL = 'https://media.base44.com/images/public/69e949497e5928c679297ebf/b2338f6dd_logo_transparent.png';

// Steps: 'login' | 'verify'
export default function CustomerSignInPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [resending, setResending] = useState(false);

  // Step 1: attempt login — if unverified, platform throws and we show OTP step
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (!email || !password) { setLoginError('Email and password are required.'); return; }
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      // Logged in successfully (already verified) — redirect
      navigate('/redirect', { replace: true });
    } catch (err) {
      const msg = err?.message || err?.data?.message || JSON.stringify(err) || '';
      const lower = msg.toLowerCase();
      if (lower.includes('verif') || lower.includes('otp') || lower.includes('confirm') || lower.includes('not verified')) {
        // Account exists but needs OTP verification — send/resend OTP and show verify step
        try {
          await base44.auth.resendOtp(email);
        } catch { /* ignore resend errors, OTP may have already been sent */ }
        setStep('verify');
      } else if (lower.includes('invalid') || lower.includes('incorrect') || lower.includes('wrong') || lower.includes('credentials') || lower.includes('password')) {
        setLoginError('Incorrect email or password. Please try again.');
      } else if (lower.includes('not found') || lower.includes('no user') || lower.includes('does not exist')) {
        setLoginError('No account found with this email. Please sign up first.');
      } else {
        setLoginError(msg || 'Sign in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: verify OTP then login and redirect
  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 4) { setOtpError('Please enter the verification code.'); return; }
    setOtpError('');
    setLoading(true);
    try {
      await base44.auth.verifyOtp({ email, otpCode: otpCode.trim() });
      await base44.auth.loginViaEmailPassword(email, password);
      navigate('/redirect', { replace: true });
    } catch (err) {
      const msg = err?.message || err?.data?.message || JSON.stringify(err) || '';
      setOtpError(
        msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('incorrect')
          ? 'Invalid or expired code. Please try again or resend.'
          : `Verification failed: ${msg || 'Unknown error.'}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResending(true);
    try {
      await base44.auth.resendOtp(email);
      toast.success('Verification code resent! Check your inbox.');
    } catch {
      toast.error('Could not resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

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
              <h1 className="text-2xl font-display font-bold text-foreground">Verify your email</h1>
              <p className="text-sm text-muted-foreground mt-2">
                We sent a 6-digit code to<br />
                <span className="font-semibold text-foreground">{email}</span>
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
                    className={`w-full border rounded-xl px-4 py-3 text-center text-xl tracking-widest bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-colors ${otpError ? 'border-destructive' : 'border-input'}`}
                    autoFocus
                  />
                  {otpError && <p className="text-xs text-destructive mt-1">{otpError}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Verifying...</> : 'Confirm & Sign In'}
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
                  {' · '}
                  <button onClick={() => { setStep('login'); setOtpCode(''); setOtpError(''); }} className="text-primary font-semibold hover:underline">
                    Back
                  </button>
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Sign In Form ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-7">
            <img src={LOGO_URL} alt="Grassgodz" className="h-12 w-12 object-contain mx-auto mb-3" />
            <h1 className="text-2xl font-display font-bold text-foreground">Welcome back</h1>
            <p className="text-sm text-muted-foreground mt-1">Sign in to your customer account</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <form onSubmit={handleLogin} className="space-y-4" noValidate>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => { setEmail(e.target.value); setLoginError(''); }}
                  placeholder="you@email.com"
                  className={`w-full border rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-colors ${loginError ? 'border-destructive' : 'border-input'}`}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => { setPassword(e.target.value); setLoginError(''); }}
                    placeholder="Your password"
                    className={`w-full border rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-colors pr-11 ${loginError ? 'border-destructive' : 'border-input'}`}
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {loginError && <p className="text-xs text-destructive mt-1">{loginError}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in...</> : 'Sign In'}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-5">
            Don't have an account?{' '}
            <Link to="/signup/customer" className="text-primary font-semibold hover:underline">
              Sign up free
            </Link>
          </p>

          <p className="text-center text-xs text-muted-foreground mt-3">
            Are you a lawn care pro?{' '}
            <Link to="/signup/provider" className="text-primary font-semibold hover:underline">
              Apply to join →
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}