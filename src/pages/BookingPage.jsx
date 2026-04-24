import PublicNav from '@/components/public/PublicNav';
import PublicFooter from '@/components/public/PublicFooter';
import InstantQuoteForm from '@/components/public/InstantQuoteForm';
import GuestBookingModal from '@/components/public/GuestBookingModal';
import { useState } from 'react';
import { toast } from 'sonner';

export default function BookingPage() {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [quoteData, setQuoteData] = useState(null);

  const handleQuoteSubmit = (data) => {
    setQuoteData(data);
    setShowBookingModal(true);
    toast.success('Quote ready! Proceed to booking.');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">Get Your Instant Quote</h1>
          <p className="text-muted-foreground text-base">
            Enter your address, choose your service, and get an instant price estimate. No hidden fees.
          </p>
        </div>

        <InstantQuoteForm onBookingSubmit={handleQuoteSubmit} />

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4 mt-12">
          {[
            { icon: '⚡', title: 'Fast', desc: 'Get a quote in under 60 seconds' },
            { icon: '✓', title: 'Transparent', desc: 'No hidden fees, just honest pricing' },
            { icon: '🔒', title: 'Secure', desc: 'Your data is safe with us' },
          ].map((item, i) => (
            <div key={i} className="text-center">
              <span className="text-3xl mb-2 block">{item.icon}</span>
              <h3 className="font-bold text-foreground text-sm mb-1">{item.title}</h3>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <PublicFooter />

      {showBookingModal && quoteData && (
        <GuestBookingModal
          onClose={() => setShowBookingModal(false)}
          summary={{
            total: quoteData.total,
            subtotal: quoteData.subtotal,
            savings: quoteData.savings,
            frequency: quoteData.frequency,
            breakdown: quoteData.breakdown,
            address: quoteData.address,
            service: quoteData.service,
          }}
        />
      )}
    </div>
  );
}