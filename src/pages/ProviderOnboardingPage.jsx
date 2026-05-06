import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, AlertCircle } from "lucide-react";

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