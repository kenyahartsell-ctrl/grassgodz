import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Scissors, Wind, Sprout, Snowflake, CircleDot, Crop, Star, Shield, Users, ArrowRight, CheckCircle } from 'lucide-react';
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
  { name: 'Sarah M.', city: 'Springfield, IL', rating: 5, quote: "Booked in under a minute. Mike showed up on time and the lawn looked perfect. Will never call around for quotes again." },
  { name: 'David R.', city: 'Decatur, IL', rating: 5, quote: "Honest pricing, great pros. I love that I can track the job and pay through the app without any awkward cash exchanges." },
  { name: 'Karen T.', city: 'Bloomington, IL', rating: 5, quote: "I've used Grassgodz three times now. Each pro has been professional, fast, and thorough. Highly recommend." },
];

export default function HomePage() {




  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      {/* HERO */}
      <section
        className="relative min-h-[92vh] flex items-center justify-center"
        style={{
          backgroundImage: `linear-gradient(160deg, rgba(14,60,32,0.93) 0%, rgba(20,83,45,0.75) 100%), url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&auto=format&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="relative z-10 max-w-2xl mx-auto px-4 text-center text-white py-16">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-xs font-semibold text-white/90 mb-6">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Local pros available in your area now
          </div>

          <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight mb-4 tracking-tight">
            Your Lawn.<br />Local Pros.
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-8 max-w-md mx-auto">
            Get matched with a local lawn care professional in your area — book in under 60 seconds.
          </p>

          {/* ZIP form */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-4">
            <Link
              to="/book"
              className="flex-1 bg-green-400 hover:bg-green-300 text-green-950 font-bold px-7 py-4 rounded-xl transition-colors whitespace-nowrap shadow-lg text-base flex items-center justify-center"
            >
              Get Instant Quote
            </Link>
          </div>

          {/* Secondary CTA */}
          <a
            href="/pros"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white transition-colors underline underline-offset-4"
          >
            Become a Provider <ArrowRight size={14} />
          </a>

          {/* Trust bar */}
          <div className="mt-10 flex items-center justify-center gap-6 flex-wrap text-xs text-white/60">
            <span>⭐ 4.8 avg rating</span>
            <span>·</span>
            <span>1,200+ jobs done</span>
            <span>·</span>
            <span>Pay only after completion</span>
          </div>
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
              { step: '1', icon: '📍', title: 'Enter your address', desc: 'Tell us where you are and what service you need. Takes less than 30 seconds.' },
              { step: '2', icon: '🤝', title: 'Get matched with a local pro', desc: 'We connect you with a vetted, insured lawn care professional in your area.' },
              { step: '3', icon: '🌿', title: 'Sit back while we handle your lawn', desc: 'Your pro shows up, does the work, and you only pay when the job is done.' },
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
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">Get an Instant Estimate</h2>
            <p className="text-muted-foreground text-sm">No signup needed — see your price in seconds.</p>
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