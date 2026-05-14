import { Link } from 'react-router-dom';
import { ArrowRight, Star, ShieldCheck, CreditCard, MapPin, CheckCircle, Scissors, Wind, Crop, Sprout, CircleDot, Snowflake } from 'lucide-react';
import PublicNav from '@/components/public/PublicNav';
import PublicFooter from '@/components/public/PublicFooter';
import PageMeta from '@/components/shared/PageMeta';

const OTHER_CITIES = [
  { name: 'Washington, DC', path: '/lawn-care/washington-dc' },
  { name: 'Arlington, VA', path: '/lawn-care/arlington-va' },
  { name: 'Alexandria, VA', path: '/lawn-care/alexandria-va' },
  { name: 'Silver Spring, MD', path: '/lawn-care/silver-spring-md' },
  { name: 'Bethesda, MD', path: '/lawn-care/bethesda-md' },
];

const SERVICES = [
  { name: 'Lawn Mowing', icon: Scissors, price: 47 },
  { name: 'Leaf Removal', icon: Wind, price: 84 },
  { name: 'Hedge Trimming', icon: Crop, price: 68 },
  { name: 'Fertilization', icon: Sprout, price: 95 },
  { name: 'Aeration', icon: CircleDot, price: 116 },
  { name: 'Snow Removal', icon: Snowflake, price: 79 },
];

export default function CityPageLayout({ city }) {
  const {
    name, state, slug, metaTitle, metaDescription, h1, intro,
    neighborhoods, faqs, bodyParagraphs, jsonLd,
  } = city;

  const otherCities = OTHER_CITIES.filter(c => c.path !== `/lawn-care/${slug}`);

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title={metaTitle}
        description={metaDescription}
        path={`/lawn-care/${slug}`}
      />

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PublicNav />

      {/* HERO */}
      <section
        className="relative py-20 px-4 flex flex-col items-center justify-center text-center"
        style={{
          backgroundImage: `linear-gradient(160deg, rgba(14,60,32,0.95) 0%, rgba(20,83,45,0.82) 100%), url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&auto=format&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 rounded-full px-4 py-1.5 text-xs font-semibold text-white/90 mb-5">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Serving {name}, {state}
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4 max-w-3xl leading-tight">
          {h1}
        </h1>
        <p className="text-white/70 text-base max-w-xl mb-8">{intro}</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/signup/customer"
            className="px-8 py-4 rounded-xl font-bold text-sm text-white transition-colors"
            style={{ backgroundColor: '#2D6A2D' }}
          >
            Get Free Quotes →
          </Link>
          <Link
            to="/how-it-works"
            className="px-8 py-4 rounded-xl font-semibold text-sm border border-white/30 text-white/80 hover:bg-white/10 transition-colors"
          >
            How It Works
          </Link>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-5 text-xs text-white/60">
          <span className="flex items-center gap-1.5"><ShieldCheck size={13} className="text-green-400" /> Insured pros</span>
          <span className="w-px h-3 bg-white/20" />
          <span className="flex items-center gap-1.5"><CreditCard size={13} className="text-green-400" /> Pay after completion</span>
          <span className="w-px h-3 bg-white/20" />
          <span className="flex items-center gap-1.5"><Star size={13} className="text-green-400" /> 4.8★ avg rating</span>
        </div>
      </section>

      {/* BODY CONTENT */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-3xl mx-auto space-y-5">
          {bodyParagraphs.map((p, i) => (
            <p key={i} className="text-foreground leading-relaxed text-base">{p}</p>
          ))}
        </div>
      </section>

      {/* SERVICES */}
      <section className="py-14 px-4 bg-background">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-center text-foreground mb-2">
            Lawn Care Services in {name}
          </h2>
          <p className="text-center text-muted-foreground mb-10 text-sm">Competitive quotes from local pros — no contracts</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {SERVICES.map(({ name: svc, icon: Icon, price }) => (
              <div key={svc} className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3">
                <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Icon className="text-primary w-5 h-5" />
                </div>
                <h3 className="font-semibold text-foreground text-sm">{svc}</h3>
                <span className="text-sm font-bold text-primary mt-auto">From ${price}</span>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/pricing" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
              See full pricing <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-center text-foreground mb-10">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Post your request', desc: 'Sign up, describe what you need, and submit. Takes under 60 seconds.' },
              { step: '2', title: 'Get competing quotes', desc: 'Vetted local pros in ' + name + ' send you quotes within 24 hours.' },
              { step: '3', title: 'Book & relax', desc: 'Pick your favorite pro. Pay only after the job is done to your satisfaction.' },
            ].map(card => (
              <div key={card.step} className="bg-secondary/40 rounded-2xl p-6 text-center">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center mx-auto mb-3">
                  {card.step}
                </div>
                <h3 className="font-bold text-foreground text-base mb-2">{card.title}</h3>
                <p className="text-sm text-muted-foreground">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEIGHBORHOODS */}
      <section className="py-14 px-4 bg-background">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-display font-bold text-foreground mb-2">Neighborhoods We Serve in {name}</h2>
          <p className="text-muted-foreground text-sm mb-6">Our pros cover the full {name} area, including:</p>
          <div className="flex flex-wrap gap-2">
            {neighborhoods.map(n => (
              <span key={n} className="flex items-center gap-1.5 bg-secondary text-secondary-foreground text-xs font-medium px-3 py-1.5 rounded-full">
                <MapPin size={11} className="text-primary" /> {n}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FAQS */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-display font-bold text-foreground mb-8 text-center">
            Frequently Asked Questions — {name} Lawn Care
          </h2>
          <div className="space-y-5">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-border rounded-xl p-5">
                <h3 className="font-semibold text-foreground text-sm mb-2">{faq.q}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT FORM */}
      <section className="py-14 px-4 bg-secondary/20">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-2xl font-display font-bold text-foreground mb-2">Have a Question?</h2>
          <p className="text-muted-foreground text-sm mb-6">We'll get back to you within a few hours.</p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target;
              const name = form.name.value;
              const email = form.email.value;
              const message = form.message.value;
              try {
                const { base44 } = await import('@/api/base44Client');
                await base44.functions.invoke('adminSendEmail', {
                  to: email,
                  subject: `GrassGodz inquiry from ${name} — ${city.name}`,
                  body: message,
                });
                form.reset();
                alert('Thanks! We\'ll be in touch soon.');
              } catch {
                alert('Something went wrong. Please try again.');
              }
            }}
            className="bg-card border border-border rounded-2xl p-6 text-left space-y-4"
          >
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Your Name</label>
              <input name="name" required className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Jane Smith" />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Email</label>
              <input name="email" type="email" required className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="jane@email.com" />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Message</label>
              <textarea name="message" required rows={4} className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" placeholder="Tell us about your lawn care needs..." />
            </div>
            <button type="submit" className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors text-sm">
              Send Message
            </button>
          </form>
        </div>
      </section>

      {/* INTERNAL LINKS — OTHER CITIES */}
      <section className="py-10 px-4 bg-white border-t border-border">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wide mb-4">Also Serving</h2>
          <div className="flex flex-wrap gap-2">
            {otherCities.map(c => (
              <Link key={c.path} to={c.path} className="text-sm text-primary hover:underline font-medium">
                Lawn Care {c.name}
              </Link>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <Link to="/services" className="text-muted-foreground hover:text-primary">All Services</Link>
            <Link to="/pricing" className="text-muted-foreground hover:text-primary">Pricing</Link>
            <Link to="/how-it-works" className="text-muted-foreground hover:text-primary">How It Works</Link>
            <Link to="/become-provider" className="text-muted-foreground hover:text-primary">For Providers</Link>
          </div>
        </div>
      </section>

      {/* STICKY MOBILE CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-card border-t border-border px-4 py-3 flex gap-3">
        <Link to="/signup/customer" className="flex-1 bg-primary text-primary-foreground text-sm font-bold py-3 rounded-xl text-center">
          Get Free Quote
        </Link>
        <Link to="/how-it-works" className="flex-1 border border-border text-foreground text-sm font-semibold py-3 rounded-xl text-center">
          Learn More
        </Link>
      </div>

      <div className="h-16 sm:h-0" /> {/* spacer for sticky bar */}
      <PublicFooter />
    </div>
  );
}