import { useState } from 'react';
import { DollarSign, Users, Zap, ArrowRight, CheckCircle } from 'lucide-react';
import PublicNav from '@/components/public/PublicNav';
import PublicFooter from '@/components/public/PublicFooter';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const BENEFITS = [
  { icon: DollarSign, text: 'Competitive pay — weekly payouts', color: 'text-green-600', bgColor: 'bg-green-100' },
  { icon: Users, text: 'We bring you customers', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { icon: Zap, text: 'Get paid fast', color: 'text-amber-600', bgColor: 'bg-amber-100' },
];

export default function BecomeProviderPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    serviceArea: '',
    equipment: 'yes',
  });

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim() || !form.serviceArea.trim()) {
      toast.error('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await base44.functions.invoke('createProviderProfile', {
        user_email: form.email,
        name: form.name,
        phone: form.phone,
        service_zip_codes: form.serviceArea.split(',').map(z => z.trim()).filter(Boolean),
        has_equipment: form.equipment === 'yes',
        status: 'pending_review',
      });
      if (res.data?.error) throw new Error(res.data.error);

      // Notify admin (non-critical)
      try {
        await base44.functions.invoke('sendWelcomeEmail', {
          data: res.data.profile,
          event: { entity_name: 'ProviderProfile' },
        });
      } catch { /* email failure shouldn't block signup */ }

      // Invite user — sends one-click account activation email
      try { await base44.users.inviteUser(form.email, 'user'); } catch { /* already invited — continue */ }

      setSubmitted(true);
    } catch (err) {
      toast.error('Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full border border-input rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />

      {/* HERO */}
      <section className="py-16 px-4 bg-gradient-to-br from-primary to-primary/80 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 leading-tight">
            Get Lawn Jobs Without Marketing
          </h1>
          <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
            Join GrassGodz and start receiving customers in your area.
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            {BENEFITS.map((benefit, i) => {
              const Icon = benefit.icon;
              return (
                <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <Icon className="w-6 h-6 mx-auto mb-2 text-white" />
                  <p className="text-sm font-medium text-white">{benefit.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FORM / CONFIRMATION */}
      <section className="py-16 px-4 flex-1">
        <div className="max-w-lg mx-auto">
          <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">

            {submitted ? (
              <div className="space-y-6 text-center py-2">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Application submitted!</h2>
                  <p className="text-sm text-muted-foreground mt-1">We've received your application and will be in touch soon.</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-4 text-left space-y-3">
                  <p className="text-xs font-bold text-foreground uppercase tracking-wide">What happens next</p>
                  {[
                    { s: '1', text: 'Our team reviews your application (1–2 business days)' },
                    { s: '2', text: `You'll receive an approval email at ${form.email} when accepted` },
                    { s: '3', text: "The approval email includes a link to set your password and sign in" },
                    { s: '4', text: "Once signed in, start accepting jobs and earning" },
                  ].map(({ s, text }) => (
                    <div key={s} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{s}</div>
                      <p className="text-sm text-foreground">{text}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Questions? Email <a href="mailto:pros@grassgodz.com" className="text-primary font-semibold">pros@grassgodz.com</a></p>
              </div>
            ) : (
            <>
            <h2 className="text-2xl font-bold text-foreground mb-1">Quick Application</h2>
            <p className="text-sm text-muted-foreground mb-6">Takes 2 minutes. No credit card required.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground uppercase tracking-wide block mb-1.5">Full Name</label>
                <input
                  required
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="Your name"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground uppercase tracking-wide block mb-1.5">Phone</label>
                <input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground uppercase tracking-wide block mb-1.5">Email</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="your@email.com"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground uppercase tracking-wide block mb-1.5">Service Area (ZIP Codes)</label>
                <input
                  required
                  value={form.serviceArea}
                  onChange={e => set('serviceArea', e.target.value)}
                  placeholder="62701, 62702, 62703"
                  className={inputClass}
                />
                <p className="text-xs text-muted-foreground mt-1.5">Enter the ZIP codes you service (comma-separated)</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground uppercase tracking-wide block mb-2">Do you have your own equipment?</label>
                <div className="flex gap-3">
                  {['yes', 'no'].map(option => (
                    <label key={option} className="flex items-center gap-2 cursor-pointer flex-1">
                      <input
                        type="radio"
                        name="equipment"
                        value={option}
                        checked={form.equipment === option}
                        onChange={e => set('equipment', e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-foreground capitalize font-medium">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 mt-6 text-base disabled:opacity-70"
              >
                {loading ? 'Submitting...' : (
                  <>
                    Apply Now <ArrowRight size={18} />
                  </>
                )}
              </button>

              <p className="text-center text-xs text-muted-foreground mt-4">
                We'll review your application and get back to you within 24 hours.
              </p>
            </form>
            </>
            )}
          </div>

          {/* Why GrassGodz */}
          <div className="mt-12">
            <h3 className="text-xl font-bold text-foreground mb-6 text-center">Why Join GrassGodz?</h3>
            <div className="space-y-4">
              {[
                { title: 'No Marketing Needed', desc: 'We bring customers to you. Focus on the work you love.' },
                { title: 'Competitive Pay', desc: 'Fair and transparent pay structure with weekly direct deposits.' },
                { title: 'Quick Payouts', desc: 'Get paid weekly directly to your bank account.' },
                { title: 'Your Schedule', desc: "Accept jobs that fit your availability. You're in control." },
              ].map((item, i) => (
                <div key={i} className="bg-secondary/30 rounded-xl p-4">
                  <h4 className="font-semibold text-foreground text-sm mb-1">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}