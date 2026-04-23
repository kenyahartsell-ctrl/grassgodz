import { AlertTriangle, Mail, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import PublicNav from '@/components/public/PublicNav';

export default function ProviderSuspendedPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center max-w-lg mx-auto w-full">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle size={36} className="text-red-500" />
        </div>
        <h1 className="text-2xl font-display font-bold text-foreground mb-3">Account Suspended</h1>
        <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
          Your Grassgodz provider account has been suspended. This may be due to a policy violation, an unresolved issue, or a request you made.
        </p>
        <div className="w-full bg-card border border-border rounded-2xl p-5 text-left mb-8 text-sm">
          <h3 className="font-bold text-foreground mb-2">To appeal this decision:</h3>
          <ol className="space-y-2 text-muted-foreground list-decimal list-inside">
            <li>Email our support team at the address below</li>
            <li>Include your full name and registered email</li>
            <li>Explain why you believe the suspension should be lifted</li>
            <li>Our team will respond within 2–3 business days</li>
          </ol>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail size={15} />
          <span>Contact us at <a href="mailto:support@grassgodz.com" className="text-primary font-semibold hover:underline">support@grassgodz.com</a></span>
        </div>
      </main>
    </div>
  );
}