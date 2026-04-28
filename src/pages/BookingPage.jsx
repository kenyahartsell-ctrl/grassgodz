import PublicNav from '@/components/public/PublicNav';
import PublicFooter from '@/components/public/PublicFooter';
import InstantQuoteForm from '@/components/public/InstantQuoteForm';

export default function BookingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">Get Your Price Estimate</h1>
          <p className="text-muted-foreground text-base">
            Enter your address, choose your service, and see an instant price estimate. Sign up to request quotes from local pros.
          </p>
        </div>

        <InstantQuoteForm />

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4 mt-12">
          {[
            { icon: '⚡', title: 'Fast', desc: 'Post your request in 60 seconds' },
            { icon: '✓', title: 'Competitive', desc: 'Pros send competing quotes to you' },
            { icon: '🔒', title: 'Secure', desc: 'Pay only when the job is done' },
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
    </div>
  );
}