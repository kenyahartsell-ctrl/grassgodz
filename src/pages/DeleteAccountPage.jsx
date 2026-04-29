import PublicNav from '@/components/public/PublicNav';
import PublicFooter from '@/components/public/PublicFooter';
import { Mail, Smartphone, Trash2, ShieldCheck } from 'lucide-react';

const LOGO_URL = 'https://media.base44.com/images/public/69e949497e5928c679297ebf/b2338f6dd_logo_transparent.png';

export default function DeleteAccountPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />

      <main className="flex-1 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src={LOGO_URL} alt="Grassgodz" className="h-10 w-10 object-contain" />
              <span className="font-display font-bold text-2xl text-foreground">Grassgodz</span>
            </div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">Delete Your Grassgodz Account</h1>
            <p className="text-muted-foreground">You can request deletion of your account and all associated data at any time.</p>
          </div>

          <div className="space-y-6">
            {/* In-App Deletion */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Smartphone size={18} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">In-App Deletion</h2>
                  <span className="text-xs bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">Recommended</span>
                </div>
              </div>
              <ol className="space-y-2">
                {[
                  'Sign in to the Grassgodz app',
                  'Go to your profile settings',
                  "Scroll to the 'Danger Zone' section",
                  "Click 'Close My Account'",
                  'Confirm by typing DELETE',
                  'Your account and all data will be permanently deleted immediately',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-foreground">
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {/* Email Request */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Mail size={18} className="text-blue-600" />
                </div>
                <h2 className="text-lg font-bold text-foreground">Email Request</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">If you've already deleted the app and cannot sign in:</p>
              <ol className="space-y-2">
                {[
                  <>Email <a href="mailto:support@grassgodz.com" className="text-primary font-semibold hover:underline">support@grassgodz.com</a> from the email address associated with your account</>,
                  <>Subject line: <span className="font-semibold text-foreground">"Delete My Account"</span></>,
                  'Include your full name and phone number for verification',
                  'We will process your request within 7 business days',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-foreground">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* What gets deleted */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Trash2 size={16} className="text-red-600" />
                  <h3 className="text-sm font-bold text-red-800">What Gets Deleted</h3>
                </div>
                <ul className="space-y-1.5 text-sm text-red-700">
                  {[
                    'Your account profile (name, email, phone, address)',
                    'All job requests and history',
                    'Saved payment methods (removed from our system and Stripe)',
                    'All messages and photos',
                    'Reviews you\'ve written',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-secondary/40 border border-border rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck size={16} className="text-primary" />
                  <h3 className="text-sm font-bold text-foreground">What We Keep</h3>
                </div>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {[
                    'Anonymized payment transaction records (required by law for tax compliance for 7 years)',
                    'Aggregated analytics data with no personal identifiers',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-muted-foreground flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Contact */}
            <div className="text-center text-sm text-muted-foreground border-t border-border pt-6">
              If you have questions, contact{' '}
              <a href="mailto:support@grassgodz.com" className="text-primary font-semibold hover:underline">
                support@grassgodz.com
              </a>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}