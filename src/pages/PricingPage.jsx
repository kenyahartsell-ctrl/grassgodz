import { CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageMeta from '@/components/shared/PageMeta';
import PublicNav from '@/components/public/PublicNav';
import PublicFooter from '@/components/public/PublicFooter';

const SAMPLE_PRICES = [
  { service: 'Lawn Mowing', range: '$47 – $163', avg: '$79', note: 'Varies by lawn size and complexity' },
  { service: 'Leaf Removal', range: '$79 – $252', avg: '$110', note: 'Based on yard size and volume' },
  { service: 'Hedge Trimming', range: '$68 – $205', avg: '$95', note: 'Based on linear footage' },
  { service: 'Fertilization', range: '$89 – $221', avg: '$116', note: 'Depends on lawn square footage' },
  { service: 'Core Aeration', range: '$100 – $540', avg: '$131', note: 'By lawn size' },
  { service: 'Snow Removal', range: '$68 – $540', avg: '$95', note: 'Based on area and snowfall' },
];

const FAQS = [
  { q: 'Are prices fixed or negotiable?', a: 'Providers set their own prices. You\'ll receive competitive quotes from multiple pros and can choose the one that works best for your budget.' },
  { q: 'When do I get charged?', a: 'Your card is authorized when you accept a quote, but the charge only goes through after the job is marked complete. You never pay upfront.' },
  { q: 'What if I\'m not happy with the work?', a: 'Contact our support team within 24 hours of job completion and we\'ll work to resolve the issue — including a full or partial refund if warranted.' },
  { q: 'Are there any hidden fees?', a: 'None. You pay the quoted price. There\'s no surprise fee added at checkout.' },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="Lawn Care Pricing in DC Metro | Grassgodz"
        description="See transparent lawn care pricing for mowing, leaf removal, hedge trimming, and more. No hidden fees — pay only after the job is done."
        path="/pricing"
      />
      <PublicNav />

      {/* Header */}
      <section className="py-14 px-4 bg-white text-center">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">Honest Pricing</h1>
        <p className="text-muted-foreground max-w-md mx-auto text-sm leading-relaxed">No surprise fees. No hidden markups. Just transparent quotes from local pros.</p>
      </section>

      {/* Pay split */}
      <section className="py-10 px-4 bg-background">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-xl font-bold text-foreground mb-4">How pricing works</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">The price you see is the price you pay. No add-ons at checkout.</p>
        </div>
      </section>

      {/* Sample prices */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-foreground mb-6">Sample prices by service</h2>
          <div className="space-y-3">
            {SAMPLE_PRICES.map(({ service, range, avg, note }) => (
              <div key={service} className="flex items-center justify-between bg-background border border-border rounded-xl px-4 py-3.5 gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{service}</p>
                  <p className="text-xs text-muted-foreground">{note}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-primary">{range}</p>
                  <p className="text-xs text-muted-foreground">avg {avg}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-4">Prices are estimates. Final quotes are set by providers in your area and may vary.</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 px-4 bg-background">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-foreground mb-6">Pricing FAQ</h2>
          <div className="space-y-4">
            {FAQS.map(({ q, a }) => (
              <div key={q} className="bg-card border border-border rounded-xl p-5">
                <h3 className="text-sm font-bold text-foreground mb-2">{q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 px-4 bg-secondary/30 text-center">
        <h2 className="text-xl font-display font-bold text-foreground mb-2">Get a free quote today</h2>
        <p className="text-muted-foreground text-sm mb-6">Enter your ZIP code and see real prices from pros in your area.</p>
        <Link to="/signup/customer" className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-8 py-3.5 rounded-xl hover:bg-primary/90 transition-colors">
          Get a quote <ArrowRight size={16} />
        </Link>
      </section>

      <PublicFooter />
    </div>
  );
}