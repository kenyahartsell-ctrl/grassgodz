import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Bell, ArrowRight } from 'lucide-react';
import PublicNav from '@/components/public/PublicNav';
import PublicFooter from '@/components/public/PublicFooter';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

// ANALYTICS HOOK: track('not_available_page_view', { zip }) on mount

export default function NotAvailablePage() {
  const urlParams = new URLSearchParams(window.location.search);
  const zip = urlParams.get('zip') || '';
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleWaitlist = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.entities.WaitlistEntry.create({
        email,
        zip_code: zip,
        signed_up_at: new Date().toISOString(),
      });
      setSubmitted(true);
      toast.success("You're on the list! We'll email you when we launch in your area.");
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-6">
          <MapPin size={36} className="text-primary" />
        </div>

        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-3">
          We're not in ZIP {zip} yet — but we're growing fast.
        </h1>
        <p className="text-muted-foreground text-sm max-w-md mb-8 leading-relaxed">
          Grassgodz is expanding to new areas every month. Drop your email below and you'll be the first to know when we launch near you.
        </p>

        {!submitted ? (
          <form onSubmit={handleWaitlist} className="flex flex-col sm:flex-row gap-3 w-full max-w-md mb-10">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="flex-1 border border-input rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-70 whitespace-nowrap"
            >
              {loading ? 'Saving...' : 'Notify Me'}
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-2 bg-secondary/40 rounded-xl px-5 py-3 mb-10 text-sm font-medium text-foreground">
            <Bell size={16} className="text-primary" />
            You're on the waitlist for ZIP {zip}!
          </div>
        )}

        <div className="border-t border-border pt-8 max-w-md">
          <p className="text-sm text-muted-foreground mb-4">
            Are you a landscaping pro in this area? <br />
            <strong className="text-foreground">We're actively looking for providers in new markets.</strong>
          </p>
          <a
            href="/signup/provider"
            className="inline-flex items-center gap-2 border border-primary text-primary font-semibold px-6 py-3 rounded-xl hover:bg-primary/5 transition-colors text-sm"
          >
            Apply as a Pro <ArrowRight size={15} />
          </a>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}