import { Clock, CheckCircle, Mail, KeyRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import PublicNav from '@/components/public/PublicNav';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ProviderPendingPage() {
  const [stripeLoading, setStripeLoading] = useState(false);
  const [providerProfile, setProviderProfile] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const me = await base44.auth.me();
        const profiles = await base44.entities.ProviderProfile.filter({ user_email: me.email });
        setProviderProfile(profiles[0] || null);
      } catch {}
    }
    load();
  }, []);

  const handleStripeOnboarding = async () => {
    if (!providerProfile) return;
    setStripeLoading(true);
    try {
      const res = await base44.functions.invoke('stripeConnectOnboarding', {
        provider_profile_id: providerProfile.id,
        return_url: window.location.origin + '/provider',
      });
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        toast.error(res.data?.error || 'Failed to start onboarding.');
      }
    } catch (err) {
      toast.error('Failed to start Stripe onboarding. Please try again.');
    } finally {
      setStripeLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center max-w-lg mx-auto w-full">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6">
          <Clock size={36} className="text-amber-600" />
        </div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-3">Application Under Review</h1>
        <p className="text-muted-foreground mb-4 leading-relaxed text-sm">
          Thanks for applying! Our team is reviewing your application. You'll hear back within <strong>1–2 business days</strong> — most pros are approved within 24 hours.
        </p>
        <div className="w-full bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 text-left space-y-3">
          <div className="flex items-center gap-2">
            <Mail size={18} className="text-blue-600 flex-shrink-0" />
            <p className="text-sm font-bold text-blue-800">Activate your account via email</p>
          </div>
          <p className="text-xs text-blue-700 leading-relaxed">
            We sent you an activation email. <strong>Click the link inside to set your password</strong> — that's it. No second form, no redirect. Once done, you can sign in and access your portal when approved.
          </p>
          <div className="bg-blue-100 rounded-lg p-2.5 flex items-start gap-2">
            <KeyRound size={13} className="text-blue-700 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800">Didn't get it? Check your spam folder or email <a href="mailto:pros@grassgodz.com" className="text-primary font-semibold">pros@grassgodz.com</a></p>
          </div>
        </div>

        <div className="w-full bg-card border border-border rounded-2xl p-6 text-left space-y-4 mb-8">
          <h3 className="text-sm font-bold text-foreground">What happens next</h3>
          {[
            { icon: CheckCircle, color: 'text-primary', title: 'Background check', desc: "We'll run a standard background check (usually takes a few hours)." },
            { icon: CheckCircle, color: 'text-primary', title: 'Stripe onboarding', desc: "Once approved, you'll get an email to connect your bank account for weekly payouts." },
            { icon: CheckCircle, color: 'text-primary', title: 'Start accepting jobs', desc: "You'll have access to the provider app and can start accepting jobs in your area immediately." },
          ].map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="flex gap-3">
              <Icon size={18} className={`${color} flex-shrink-0 mt-0.5`} />
              <div>
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {providerProfile && !providerProfile.onboarding_complete && (
          <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 text-left">
            <p className="text-sm font-bold text-amber-800 mb-1">Connect Your Bank Account</p>
            <p className="text-xs text-amber-700 mb-3">Set up Stripe now so payouts are ready the moment you're approved.</p>
            <button
              onClick={handleStripeOnboarding}
              disabled={stripeLoading}
              className="bg-amber-700 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-amber-800 transition-colors disabled:opacity-60"
            >
              {stripeLoading ? 'Loading…' : 'Start Stripe Onboarding →'}
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail size={15} />
          <span>Questions? Email us at <a href="mailto:pros@grassgodz.com" className="text-primary font-semibold hover:underline">pros@grassgodz.com</a></span>
        </div>
      </main>
    </div>
  );
}