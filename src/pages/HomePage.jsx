import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scissors, Wind, Sprout, Snowflake, CircleDot, Crop, Star, Shield, Users, ArrowRight, CheckCircle } from 'lucide-react';
import PublicNav from '@/components/public/PublicNav';
import PublicFooter from '@/components/public/PublicFooter';
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
  const [zip, setZip] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleZipSubmit = async (e) => {
    e.preventDefault();
    if (!zip.trim()) return;
    setLoading(true);
    // ANALYTICS HOOK: track('zip_submitted', { zip })
    try {
      const providers = await base44.entities.ProviderProfile.filter({ status: 'active' });
      const hasProvider = providers.some(p =>
        Array.isArray(p.service_zip_codes) && p.service_zip_codes.includes(zip.trim())
      );
      if (hasProvider) {
        navigate(`/signup/customer?zip=${zip.trim()}`);
      } else {
        navigate(`/not-available?zip=${zip.trim()}`);
      }
    } catch {
      navigate(`/signup/customer?zip=${zip.trim()}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      {/* HERO — replace background image URL with a licensed photo before launch */}
      {/* Unsplash placeholder: https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600 */}
      <section
        className="relative min-h-[70vh] md:min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(20,83,45,0.85) 0%, rgba(20,83,45,0.6) 100%), url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&auto=format&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="relative z-10 max-w-2xl mx-auto px-4 text-center text-white">
          <h1 className="text-4xl md:text-6xl font-display font-bold leading-tight mb-4">
            Lawn care that<br />just shows up.
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-8 leading-relaxed">
            Top-rated local pros, fair prices, and zero hassle.<br className="hidden md:block" /> Book in 60 seconds.
          </p>

          {/* Zip form */}
          <form onSubmit={handleZipSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="text"
              value={zip}
              onChange={e => setZip(e.target.value)}
              placeholder="Enter your ZIP code"
              maxLength={5}
              pattern="[0-9]{5}"
              className="flex-1 rounded-xl px-5 py-4 text-foreground text-base bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-white font-bold px-7 py-4 rounded-xl transition-colors disabled:opacity-70 whitespace-nowrap"
            >
              {loading ? 'Checking...' : 'Get Started'}
            </button>
          </form>
          <p className="mt-4 text-sm text-white/60">Trusted by 1,200+ homeowners across the greater Midwest</p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-center text-foreground mb-10">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '1', icon: '📍', title: 'Tell us what you need', desc: 'Enter your zip code, pick a service, and describe your yard. Takes less than a minute.' },
              { step: '2', icon: '🌿', title: 'Get matched with vetted pros', desc: 'Local providers in your area send you competitive quotes. You pick the best fit.' },
              { step: '3', icon: '☀️', title: 'Sit back and enjoy', desc: 'Your pro shows up on schedule. Pay securely through the app only after the job is done.' },
            ].map(card => (
              <div key={card.step} className="bg-secondary/40 rounded-2xl p-6 text-center">
                <div className="text-4xl mb-4">{card.icon}</div>
                <h3 className="font-bold text-foreground text-lg mb-2">{card.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
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
          <h2 className="text-2xl font-display font-bold text-foreground mb-3">Honest pricing, no surprises</h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-5">
            You pay the quoted price — nothing more. Your pro keeps 75% for their great work. Grassgodz takes 25% to cover secure payments, customer support, and smart matching.
          </p>
          <a href="/pricing" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            See sample prices <ArrowRight size={14} />
          </a>
        </div>
      </section>

      {/* PROVIDER TEASER */}
      <section className="py-16 px-4 bg-secondary/30">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-3">Grow your landscaping business with us</h2>
          <p className="text-muted-foreground mb-6">Earn $500–$2,000 per week. Set your own schedule. Get paid weekly.</p>
          <a
            href="/pros"
            className="inline-flex items-center gap-2 bg-foreground text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-foreground/90 transition-colors"
          >
            Become a Pro <ArrowRight size={16} />
          </a>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}