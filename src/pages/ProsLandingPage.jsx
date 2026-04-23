import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, MapPin, DollarSign, Shield, CheckCircle, ArrowRight, Star } from 'lucide-react';
import PublicNav from '@/components/public/PublicNav';
import PublicFooter from '@/components/public/PublicFooter';

// ANALYTICS HOOK: track('pros_page_view') on mount
// ANALYTICS HOOK: track('pro_application_started') on CTA click

// PLACEHOLDER TESTIMONIALS — replace with real provider quotes after launch
const PRO_TESTIMONIALS = [
  { name: 'Carlos R.', biz: 'Ace Lawn Services', city: 'Springfield, IL', quote: "I was spending hours chasing new customers. With Grassgodz, jobs just come to me and I get paid on time every week. Game changer." },
  { name: 'Jenny P.', biz: 'Springfield Yard Works', city: 'Decatur, IL', quote: "The app makes scheduling so simple. I accepted 3 jobs on my lunch break and earned $480 that Saturday. Highly recommend." },
  { name: 'Dave M.', biz: 'Monroe Outdoors', city: 'Bloomington, IL', quote: "Finally, a platform that actually respects the professionals. Clear pay structure, no surprises, and the support team is responsive." },
];

export default function ProsLandingPage() {
  const [hours, setHours] = useState(20);
  const [jobsPerDay, setJobsPerDay] = useState(3);

  const avgJobPrice = 55;
  const providerCut = 0.75;
  const workDays = Math.ceil(hours / (jobsPerDay * 2)); // ~2 hrs per job
  const weeklyEst = Math.round(jobsPerDay * workDays * avgJobPrice * providerCut);

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      {/* HERO */}
      {/* Unsplash placeholder — replace with licensed landscaping pro image before launch */}
      <section
        className="relative min-h-[70vh] flex items-center justify-center"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(20,83,45,0.88) 0%, rgba(20,83,45,0.65) 100%), url('https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1600&auto=format&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="relative z-10 max-w-2xl mx-auto px-4 text-center text-white">
          <span className="inline-block bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">For Landscaping Professionals</span>
          <h1 className="text-4xl md:text-5xl font-display font-bold leading-tight mb-4">
            Grow your landscaping business — without the busywork.
          </h1>
          <p className="text-lg text-white/80 mb-8 leading-relaxed">
            We bring you customers, handle scheduling, and pay you weekly.<br className="hidden md:block" /> You focus on the work.
          </p>
          <Link
            to="/signup/provider"
            className="inline-flex items-center gap-2 bg-white text-primary font-bold px-8 py-4 rounded-xl hover:bg-white/90 transition-colors text-base"
          >
            Start your application <ArrowRight size={18} />
          </Link>
          <p className="mt-4 text-sm text-white/60">Join active pros already earning $500–$2,000/week</p>
        </div>
      </section>

      {/* WHY GRASSGODZ */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-center text-foreground mb-10">Why pros choose Grassgodz</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { icon: Users, title: 'Steady customers', desc: 'No marketing, no cold calls. We deliver qualified job requests directly to you in your service area.' },
              { icon: MapPin, title: 'Your area, your schedule', desc: 'Set the zip codes you serve and the days you work. Accept only the jobs that fit your calendar.' },
              { icon: DollarSign, title: 'Get paid weekly', desc: 'Automatic direct deposit every week. No chasing invoices, no awkward cash conversations.' },
              { icon: Shield, title: 'Support included', desc: 'Dedicated pro support, dispute resolution, and resources to help grow your business and reputation.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4 p-5 bg-secondary/30 rounded-2xl">
                <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="text-primary w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-1">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS FOR PROS */}
      <section className="py-16 px-4 bg-background">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-center text-foreground mb-10">How it works for pros</h2>
          <div className="space-y-4">
            {[
              { step: '1', title: 'Apply (5 minutes, free)', desc: 'Fill out a quick application with your experience, service area, and the services you offer.' },
              { step: '2', title: 'Get approved', desc: "We verify your info and background check, then walk you through a quick Stripe onboarding to set up your payouts." },
              { step: '3', title: 'Accept jobs in your area', desc: "Browse open jobs and booking requests in your zip codes. Accept what works for your schedule, quote, or confirm." },
              { step: '4', title: 'Get paid for completed work', desc: "Mark jobs complete in the app. Your share is transferred automatically, every week." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg flex-shrink-0">{step}</div>
                <div className="pt-1.5">
                  <h3 className="font-bold text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EARNINGS CALCULATOR */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-display font-bold text-center text-foreground mb-2">How much could you earn?</h2>
          <p className="text-center text-muted-foreground text-sm mb-8">Adjust the sliders to estimate your weekly take-home</p>

          <div className="bg-secondary/30 rounded-2xl p-6 space-y-6">
            <div>
              <div className="flex justify-between text-sm font-medium text-foreground mb-2">
                <span>Hours per week</span>
                <span className="text-primary font-bold">{hours} hrs</span>
              </div>
              <input
                type="range" min={5} max={60} step={5}
                value={hours}
                onChange={e => setHours(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm font-medium text-foreground mb-2">
                <span>Jobs per day</span>
                <span className="text-primary font-bold">{jobsPerDay} jobs</span>
              </div>
              <input
                type="range" min={1} max={8} step={1}
                value={jobsPerDay}
                onChange={e => setJobsPerDay(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <div className="bg-white rounded-xl p-5 text-center border border-border">
              <p className="text-sm text-muted-foreground mb-1">Estimated weekly earnings</p>
              <p className="text-4xl font-display font-bold text-primary">${weeklyEst.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-2">Based on avg $55/job × provider share</p>
            </div>

            <p className="text-xs text-muted-foreground text-center">Estimate based on average pricing. Actual earnings vary by service area, season, and job mix.</p>
          </div>
        </div>
      </section>

      {/* PRO TESTIMONIALS — PLACEHOLDER, replace after launch */}
      <section className="py-16 px-4 bg-background">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-display font-bold text-center text-foreground mb-10">What pros are saying</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PRO_TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-card border border-border rounded-2xl p-5">
                <div className="flex mb-3">
                  {[1,2,3,4,5].map(i => <Star key={i} size={13} className="text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-sm text-foreground leading-relaxed mb-4">"{t.quote}"</p>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.biz} · {t.city}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REQUIREMENTS */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-display font-bold text-center text-foreground mb-6">What you'll need to apply</h2>
          <ul className="space-y-3">
            {[
              '18+ years old',
              'Own equipment and reliable transportation',
              'Valid driver\'s license',
              'Bank account for direct deposit',
              'Pass a background check',
              'Liability insurance recommended (we can help you get it)',
            ].map(req => (
              <li key={req} className="flex items-center gap-3 text-sm text-foreground">
                <CheckCircle size={17} className="text-primary flex-shrink-0" />
                {req}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-16 px-4 bg-primary text-white text-center">
        <h2 className="text-2xl md:text-3xl font-display font-bold mb-3">Ready to start?</h2>
        <p className="text-white/80 mb-7">Apply in 5 minutes. No fees. No contracts.</p>
        <Link
          to="/signup/provider"
          className="inline-flex items-center gap-2 bg-white text-primary font-bold px-9 py-4 rounded-xl hover:bg-white/90 transition-colors text-base"
        >
          Apply now <ArrowRight size={18} />
        </Link>
      </section>

      <PublicFooter />
    </div>
  );
}