import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PageMeta from '@/components/shared/PageMeta';
import { Scissors, Wind, Sprout, Snowflake, CircleDot, Crop, Star, Shield, Users, ArrowRight, CheckCircle, Home, Briefcase, Zap, CreditCard, MapPin, DollarSign, Calendar, ShieldCheck } from 'lucide-react';
import PublicNav from '@/components/public/PublicNav';
import PublicFooter from '@/components/public/PublicFooter';
import PricingCalculator from '@/components/public/PricingCalculator';
import { base44 } from '@/api/base44Client';

// ANALYTICS HOOK: track('homepage_view') on mount
// ANALYTICS HOOK: track('zip_submitted', { zip }) on CTA click

const SERVICES = [
  { name: 'Lawn Mowing', icon: Scissors, price: 45, desc: 'Full mowing, edging, and cleanup' },
  { name: 'Leaf Removal', icon: Wind, price: 80, desc: 'Blowing, raking, and hauling' },
  { name: 'Hedge Trimming', icon: Crop, price: 65, desc: 'Precision shrub and hedge shaping' },
  { name: 'Fertilization', icon: Sprout, price: 90, desc: 'Lawn treatment and weed control' },
  { name: 'Aeration', icon: CircleDot, price: 110, desc: 'Core aeration for healthier grass' },
  { name: 'Snow Removal', icon: Snowflake, price: 75, desc: 'Driveway and walkway clearing' },
];

// PLACEHOLDER TESTIMONIALS — replace with real reviews after launch
const TESTIMONIALS = [
  { name: 'Sarah M.', city: 'Washington, D.C.', rating: 5, quote: "Booked in under a minute. Mike showed up on time and the lawn looked perfect. Will never call around for quotes again." },
  { name: 'David R.', city: 'Silver Spring, MD', rating: 5, quote: "Honest pricing, great pros. I love that I can track the job and pay through the app without any awkward cash exchanges." },
  { name: 'Karen T.', city: 'Arlington, VA', rating: 5, quote: "I've used Grassgodz three times now. Each pro has been professional, fast, and thorough. Highly recommend." },
];

export default function HomePage() {




  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="Grassgodz — Lawn Care That Just Shows Up | DC Metro"
        description="Book vetted local lawn care pros in the DC metro area. Honest pricing, insured pros, and zero hassle. Get a quote in 60 seconds."
        path="/"
      />
      <PublicNav />

      {/* HERO — Split Card Layout */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center px-4 py-16"
        style={{
          backgroundImage: `linear-gradient(160deg, rgba(14,60,32,0.95) 0%, rgba(20,83,45,0.80) 100%), url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&auto=format&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Top badge */}
        <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-xs font-semibold text-white/90 mb-6">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Local pros available in your area now
        </div>

        <h1 className="text-4xl md:text-5xl font-display font-bold text-white text-center mb-3 tracking-tight">
          Your Lawn. Local Pros.
        </h1>
        <p className="text-white/70 text-center text-sm mb-10 max-w-sm">
          Are you a homeowner or a lawn care professional?
        </p>

        {/* Split Cards */}
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* CUSTOMER CARD */}
          <div
            className="group bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-7 flex flex-col gap-5 hover:border-green-400/60 hover:shadow-2xl hover:shadow-green-900/40 transition-all duration-300 cursor-pointer"
            style={{ borderLeftColor: '#2D6A2D', borderLeftWidth: '3px' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#2D6A2D' }}>
                <Home size={22} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-green-300 uppercase tracking-wider">For Homeowners</p>
                <h2 className="text-xl font-display font-bold text-white leading-tight">I Need Lawn Care</h2>
              </div>
            </div>

            <ul className="space-y-2.5">
              {[
                { icon: Zap, text: 'Instant quotes from local pros' },
                { icon: CreditCard, text: 'Secure payment — pay after completion' },
                { icon: MapPin, text: 'Real-time job tracking' },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-2.5 text-white/85 text-sm">
                  <Icon size={15} className="text-green-400 flex-shrink-0" />
                  {text}
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-2 mt-auto pt-2">
              <Link
                to="/signup/customer"
                className="w-full text-center font-bold py-3 rounded-xl transition-colors text-sm"
                style={{ backgroundColor: '#2D6A2D', color: '#fff' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#3a8a3a'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#2D6A2D'}
              >
                Get Started as Customer
              </Link>
              <button
                onClick={() => base44.auth.redirectToLogin(window.location.origin + '/redirect')}
                className="w-full text-center font-semibold py-3 rounded-xl border border-white/25 text-white/80 hover:bg-white/10 transition-colors text-sm"
              >
                Customer Sign In
              </button>
            </div>
          </div>

          {/* PROVIDER CARD */}
          <div
            className="group bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-7 flex flex-col gap-5 hover:border-green-300/60 hover:shadow-2xl hover:shadow-green-900/40 transition-all duration-300 cursor-pointer"
            style={{ borderLeftColor: '#1C411C', borderLeftWidth: '3px' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#1C411C' }}>
                <Briefcase size={22} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-green-300 uppercase tracking-wider">For Professionals</p>
                <h2 className="text-xl font-display font-bold text-white leading-tight">I Provide Lawn Care</h2>
              </div>
            </div>

            <ul className="space-y-2.5">
              {[
                { icon: Calendar, text: 'Steady stream of local jobs' },
                { icon: DollarSign, text: 'Keep 75% — weekly payouts' },
                { icon: ShieldCheck, text: 'Platform handles payments & admin' },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-2.5 text-white/85 text-sm">
                  <Icon size={15} className="text-green-400 flex-shrink-0" />
                  {text}
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-2 mt-auto pt-2">
              <Link
                to="/signup/provider"
                className="w-full text-center font-bold py-3 rounded-xl transition-colors text-sm"
                style={{ backgroundColor: '#1C411C', color: '#fff' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2a5c2a'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#1C411C'}
              >
                Get Started as Provider
              </Link>
              <button
                onClick={() => base44.auth.redirectToLogin(window.location.origin + '/redirect')}
                className="w-full text-center font-semibold py-3 rounded-xl border border-white/25 text-white/80 hover:bg-white/10 transition-colors text-sm"
              >
                Provider Sign In
              </button>
            </div>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-5 text-xs text-white/60">
          <span className="flex items-center gap-1.5"><ShieldCheck size={13} className="text-green-400" /> All providers insured</span>
          <span className="w-px h-3 bg-white/20" />
          <span className="flex items-center gap-1.5"><CreditCard size={13} className="text-green-400" /> Secure payments</span>
          <span className="w-px h-3 bg-white/20" />
          <span className="flex items-center gap-1.5"><MapPin size={13} className="text-green-400" /> 30-mile DC metro coverage</span>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">How It Works</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">We connect you with trusted local lawn care professionals — fast, simple, and on your schedule.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Connector line (desktop only) */}
            <div className="hidden md:block absolute top-10 left-1/4 right-1/4 h-0.5 bg-border z-0" />
            {[
              { step: '1', icon: '📋', title: 'Post your request', desc: 'Sign up, describe your service, and submit your request in under 60 seconds.' },
              { step: '2', icon: '💬', title: 'Compare quotes from local pros', desc: 'Vetted local professionals send you competing quotes within 24 hours.' },
              { step: '3', icon: '🌿', title: 'Book your favorite & relax', desc: 'Pick the best offer, schedule, and pay only after the job is done.' },
            ].map(card => (
              <div key={card.step} className="relative bg-secondary/40 rounded-2xl p-6 text-center z-10">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center mx-auto mb-3">
                  {card.step}
                </div>
                <div className="text-3xl mb-3">{card.icon}</div>
                <h3 className="font-bold text-foreground text-base mb-2">{card.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING CALCULATOR */}
      <section className="py-16 px-4 bg-background">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">See What Your Service Costs</h2>
            <p className="text-muted-foreground text-sm">Get a free estimate — then sign up to request quotes from local pros.</p>
          </div>
          <PricingCalculator />
        </div>
      </section>

      {/* SERVICES */}
      <section className="py-16 px-4 bg-background">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-center text-foreground mb-2">Services We Offer</h2>
          <p className="text-center text-muted-foreground mb-10 text-sm">Professional lawn & yard care for every season</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {SERVICES.map(({ name, icon: Icon, price, desc }) => (
              <div key={name} className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3">
                <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Icon className="text-primary w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
                <span className="text-sm font-bold text-primary mt-auto">From ${price}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST STATS + TESTIMONIALS */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-12 text-center">
            {[
              { stat: '1,200+', label: 'Jobs Completed' },
              { stat: '4.8★', label: 'Average Rating' },
              { stat: '100%', label: 'Insured Pros' },
            ].map(({ stat, label }) => (
              <div key={label}>
                <p className="text-2xl md:text-3xl font-display font-bold text-primary">{stat}</p>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Testimonials — PLACEHOLDER, replace with real reviews after launch */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-background border border-border rounded-2xl p-5">
                <div className="flex mb-3">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-foreground leading-relaxed mb-4">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">{t.name[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING TRANSPARENCY */}
      <section className="py-14 px-4 bg-background">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-display font-bold text-foreground mb-3">A marketplace you can trust</h2>
          <p className="text-muted-foreground text-sm mb-5">
            GrassGodz doesn't send a crew — we connect you with independent, vetted local professionals. You see the price upfront, and your card is only charged after the job is complete.
          </p>
          <a href="/pricing" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            See sample prices <ArrowRight size={14} />
          </a>
        </div>
      </section>

      {/* PROVIDER TEASER */}
      <section className="py-16 px-4 bg-secondary/30">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-3">Are you a lawn care professional?</h2>
          <p className="text-muted-foreground mb-2">Join the GrassGodz marketplace and get matched with customers in your area.</p>
          <p className="text-sm text-muted-foreground mb-6">Earn $500–$2,000/week on your own schedule — no marketing, no hassle.</p>
          <a
            href="/pros"
            className="inline-flex items-center gap-2 bg-foreground text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-foreground/90 transition-colors"
          >
            Become a Provider <ArrowRight size={16} />
          </a>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}