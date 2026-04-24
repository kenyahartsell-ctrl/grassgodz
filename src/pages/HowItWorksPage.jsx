import { MapPin, Users, Star, CreditCard, CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageMeta from '@/components/shared/PageMeta';
import PublicNav from '@/components/public/PublicNav';
import PublicFooter from '@/components/public/PublicFooter';

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="How Grassgodz Works | Book a Lawn Pro in 60 Seconds"
        description="From booking to a beautiful lawn in 4 simple steps. Enter your address, get matched with a vetted local pro, and pay only after the job is complete."
        path="/how-it-works"
      />
      <PublicNav />

      {/* Header */}
      <section className="py-14 px-4 bg-white text-center">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">How Grassgodz Works</h1>
        <p className="text-muted-foreground max-w-lg mx-auto text-sm leading-relaxed">From booking to a beautiful lawn in three simple steps. Here's everything you need to know.</p>
      </section>

      {/* Steps */}
      <section className="py-12 px-4 bg-background max-w-3xl mx-auto">
        <div className="space-y-10">
          {[
            {
              step: '01', icon: MapPin, title: 'Tell us what you need',
              desc: 'Enter your ZIP code on the homepage and select the service you need. Fill in your address, preferred date, and any notes about your yard. The whole thing takes under 60 seconds.',
              bullets: ['No account needed to get a quote', 'Works for one-time and recurring jobs', 'Add photos or notes for custom requests'],
            },
            {
              step: '02', icon: Users, title: 'Get matched with vetted pros',
              desc: 'Providers in your area review your request and submit competitive quotes. You can compare their ratings, experience, and prices before choosing.',
              bullets: ['All providers are background-checked', 'Read reviews from real customers', 'Providers come to you — no phone calls needed'],
            },
            {
              step: '03', icon: Star, title: 'Your pro shows up',
              desc: 'Once you accept a quote, the job is scheduled. Your provider arrives on the agreed date and completes the work to your standards.',
              bullets: ['Get notified when your pro is on the way', 'Rate and review after every job', 'Rescheduling is easy through the app'],
            },
            {
              step: '04', icon: CreditCard, title: 'Pay securely, only after completion',
              desc: 'Payment is only captured once you confirm the job is done. Your card is authorized upfront but never charged until the work is complete.',
              bullets: ['Secure payments via Stripe', 'No cash, no awkwardness', 'Full refund policy for unsatisfactory work'],
            },
          ].map(({ step, icon: Icon, title, desc, bullets }) => (
            <div key={step} className="flex gap-5">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Icon size={22} className="text-primary" />
                </div>
              </div>
              <div>
                <span className="text-xs font-bold text-muted-foreground tracking-wider">STEP {step}</span>
                <h3 className="text-lg font-bold text-foreground mt-0.5 mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{desc}</p>
                <ul className="space-y-1.5">
                  {bullets.map(b => (
                    <li key={b} className="flex items-center gap-2 text-sm text-foreground">
                      <CheckCircle size={14} className="text-primary flex-shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 px-4 bg-primary text-white text-center">
        <h2 className="text-2xl font-display font-bold mb-3">Ready to get started?</h2>
        <p className="text-white/80 mb-6 text-sm">Enter your ZIP code and get quotes from local pros today.</p>
        <Link to="/signup/customer" className="inline-flex items-center gap-2 bg-white text-primary font-bold px-8 py-3.5 rounded-xl hover:bg-white/90 transition-colors">
          Book a service <ArrowRight size={16} />
        </Link>
      </section>

      <PublicFooter />
    </div>
  );
}