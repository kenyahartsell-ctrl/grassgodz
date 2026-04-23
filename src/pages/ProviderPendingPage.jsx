import { Clock, CheckCircle, Mail, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import PublicNav from '@/components/public/PublicNav';

export default function ProviderPendingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center max-w-lg mx-auto w-full">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6">
          <Clock size={36} className="text-amber-600" />
        </div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-3">Application Under Review</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed text-sm">
          Thanks for applying! Our team is reviewing your application. You'll hear back within <strong>1–2 business days</strong> — most pros are approved within 24 hours.
        </p>

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

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail size={15} />
          <span>Questions? Email us at <a href="mailto:pros@grassgodz.com" className="text-primary font-semibold hover:underline">pros@grassgodz.com</a></span>
        </div>
      </main>
    </div>
  );
}