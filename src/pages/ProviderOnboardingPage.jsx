import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, AlertCircle, Globe, FileText, ShieldCheck } from "lucide-react";

export default function ProviderOnboardingPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function startOnboarding() {
      try {
        const res = await base44.functions.invoke("stripeConnectOnboarding", {
          return_url: window.location.origin + "/provider",
        });

        const { url, error: fnError } = res.data;
        if (fnError) throw new Error(fnError);
        if (!url) throw new Error("No onboarding URL returned.");

        // Redirect to Stripe Connect onboarding
        window.location.href = url;
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }

    startOnboarding();
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Set Up Your Payout Account</h1>

        {/* Independent Contractor Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-left space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <h2 className="text-sm font-bold text-blue-900">Independent Contractor Status</h2>
          </div>
          <p className="text-sm text-blue-800 leading-relaxed">
            You operate as an <strong>independent contractor</strong> on Grassgodz, not an employee.
            You are responsible for your own taxes, including self-employment tax.
            Grassgodz does <strong>not</strong> withhold taxes from your payouts.
            1099-K reporting is handled automatically by Stripe per IRS thresholds.
          </p>
        </div>

        {/* Tax ID Instructions */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-left space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <h2 className="text-sm font-bold text-amber-900">Tax ID Required</h2>
          </div>
          <p className="text-sm text-amber-800 leading-relaxed">
            Stripe will ask for your <strong>Tax ID</strong> during setup. Please use the following:
          </p>
          <ul className="text-sm text-amber-800 space-y-1 list-none">
            <li className="flex items-start gap-2">
              <span className="font-bold text-amber-900 mt-0.5">•</span>
              <span><strong>Have an LLC or registered business?</strong> Enter your <strong>EIN (Employer Identification Number)</strong>.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-amber-900 mt-0.5">•</span>
              <span><strong>Operating as an individual with no business entity?</strong> Your <strong>SSN (Social Security Number)</strong> is acceptable.</span>
            </li>
          </ul>
          <p className="text-xs text-amber-700 border-t border-amber-200 pt-2">
            Onboarding cannot be completed without a valid Tax ID. This is required by Stripe and the IRS.
          </p>
        </div>

        {/* Website Instructions */}
        <div className="bg-muted border border-border rounded-xl p-4 text-left space-y-1">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <h2 className="text-sm font-bold text-foreground">Website Field</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            When Stripe asks for a website, enter{' '}
            <span className="font-bold text-foreground bg-muted px-1.5 py-0.5 rounded border border-border">grassgodz.com</span>{' '}
            — this is the platform you operate under.
          </p>
        </div>

        {loading && !error && (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm">Redirecting you to Stripe to set up your bank account…</p>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-left">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">Something went wrong</p>
              <p className="text-xs text-red-700 mt-0.5">{error}</p>
              <button
                onClick={() => { setError(null); setLoading(true); window.location.reload(); }}
                className="mt-3 text-xs font-semibold text-red-800 underline hover:text-red-900"
              >
                Try again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}