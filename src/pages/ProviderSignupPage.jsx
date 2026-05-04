import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, CheckCircle, ShieldAlert } from 'lucide-react';
import PublicNav from '@/components/public/PublicNav';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const STEPS = ['Personal Info', 'Credentials', 'Service Area', 'Background Check', 'Review & Submit'];

// NOTE: Provider signup uses base44.users.inviteUser() which sends an email invite.
// The provider clicks the invite link and sets their password on Base44's hosted auth page.
// This is the correct and only supported flow — Base44 SDK does not expose a register() API.

const SERVICES_LIST = [
  { id: 's1', name: 'Lawn Mowing' },
  { id: 's2', name: 'Leaf Removal' },
  { id: 's3', name: 'Hedge Trimming' },
  { id: 's4', name: 'Fertilization' },
  { id: 's5', name: 'Aeration' },
  { id: 's6', name: 'Snow Removal' },
];

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY',
  'LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND',
  'OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
];

const inputClass = 'w-full border border-input rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring';
const labelClass = 'text-xs font-medium text-muted-foreground block mb-1';

export default function ProviderSignupPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    // Step 0 – Personal
    name: '', email: '', phone: '', dob: '', homeAddress: '',
    emergencyContactName: '', emergencyContactPhone: '',
    // Step 1 – Credentials
    dlState: '', dlNumber: '', hasVehicle: '', hasEquipment: '', yearsExp: '', businessName: '', bio: '',
    // Step 2 – Service Area
    zipCodes: '', servicesOffered: [],
    // Step 3 – Consent
    agreedBackground: false, agreedTerms: false, signature: '',
  });

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));
  const toggleService = (id) => setForm(f => ({
    ...f,
    servicesOffered: f.servicesOffered.includes(id)
      ? f.servicesOffered.filter(s => s !== id)
      : [...f.servicesOffered, id],
  }));

  const validateAge = () => {
    if (!form.dob) return false;
    return (new Date() - new Date(form.dob)) / (1000 * 60 * 60 * 24 * 365.25) >= 18;
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (step === 0 && !validateAge()) { toast.error('You must be 18 or older to apply.'); return; }
    if (step === 3 && form.signature.trim().toLowerCase() !== form.name.trim().toLowerCase()) {
      toast.error('Signature must match your full legal name exactly.');
      return;
    }
    setStep(s => s + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await base44.functions.invoke('createProviderProfile', {
        user_email: form.email,
        name: form.name,
        phone: form.phone,
        dob: form.dob,
        home_address: form.homeAddress,
        business_name: form.businessName,
        bio: form.bio,
        years_experience: Number(form.yearsExp) || 0,
        dl_state: form.dlState,
        dl_number: form.dlNumber,
        has_vehicle: form.hasVehicle === 'yes',
        has_equipment: form.hasEquipment === 'yes',
        emergency_contact_name: form.emergencyContactName,
        emergency_contact_phone: form.emergencyContactPhone,
        service_zip_codes: form.zipCodes.split(',').map(z => z.trim()).filter(Boolean),
        services_offered: form.servicesOffered,
        consented_background_check: form.agreedBackground,
        consented_terms: form.agreedTerms,
        signature: form.signature,
        consent_timestamp: new Date().toISOString(),
        status: 'pending_review',
        background_check_status: 'not_started',
      });

      if (res.data?.error) throw new Error(res.data.error);
      const providerProfile = res.data.profile;

      // Invite the provider so they can log in and access their portal
      await base44.users.inviteUser(form.email, 'user');

      await base44.functions.invoke('sendWelcomeEmail', {
        data: providerProfile,
        event: { entity_name: 'ProviderProfile' },
      });

      navigate('/provider/pending');
    } catch {
      toast.error('Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />
      <main className="flex-1 flex flex-col items-center px-4 py-10">
        <div className="w-full max-w-lg">

          {/* Progress bar */}
          <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-1 flex-shrink-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  i < step ? 'bg-primary text-white' : i === step ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                {i < STEPS.length - 1 && <div className={`w-5 h-0.5 ${i < step ? 'bg-primary' : 'bg-border'}`} />}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Step {step + 1} of {STEPS.length}: <span className="font-semibold text-foreground">{STEPS[step]}</span>
          </p>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">

            {/* ── Step 0: Personal Info ── */}
            {step === 0 && (
              <form onSubmit={handleNext} className="space-y-4">
                <h2 className="text-xl font-bold text-foreground">Personal Information</h2>
                <div>
                  <label className={labelClass}>Full Legal Name *</label>
                  <input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="As it appears on your ID" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Email Address *</label>
                  <input required type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@email.com" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Phone Number *</label>
                  <input required type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(555) 123-4567" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Date of Birth * (must be 18+)</label>
                  <input required type="date" value={form.dob} onChange={e => set('dob', e.target.value)}
                    max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Home Address *</label>
                  <input required value={form.homeAddress} onChange={e => set('homeAddress', e.target.value)} placeholder="123 Main St, City, State ZIP" className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Emergency Contact Name *</label>
                    <input required value={form.emergencyContactName} onChange={e => set('emergencyContactName', e.target.value)} placeholder="Jane Doe" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Emergency Contact Phone *</label>
                    <input required type="tel" value={form.emergencyContactPhone} onChange={e => set('emergencyContactPhone', e.target.value)} placeholder="(555) 000-0000" className={inputClass} />
                  </div>
                </div>
                <button type="submit" className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                  Next <ArrowRight size={16} />
                </button>
              </form>
            )}

            {/* ── Step 1: Credentials & Business ── */}
            {step === 1 && (
              <form onSubmit={handleNext} className="space-y-4">
                <h2 className="text-xl font-bold text-foreground">Credentials & Experience</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Driver's License State *</label>
                    <select required value={form.dlState} onChange={e => set('dlState', e.target.value)} className={inputClass}>
                      <option value="">Select state</option>
                      {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Driver's License # *</label>
                    <input required value={form.dlNumber} onChange={e => set('dlNumber', e.target.value)} placeholder="DL number" className={inputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Vehicle Available? *</label>
                    <select required value={form.hasVehicle} onChange={e => set('hasVehicle', e.target.value)} className={inputClass}>
                      <option value="">Select</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Equipment Available? *</label>
                    <select required value={form.hasEquipment} onChange={e => set('hasEquipment', e.target.value)} className={inputClass}>
                      <option value="">Select</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Years of Lawn Care Experience *</label>
                  <input required type="number" min={0} max={50} value={form.yearsExp} onChange={e => set('yearsExp', e.target.value)} placeholder="0" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Business Name (or your name)</label>
                  <input value={form.businessName} onChange={e => set('businessName', e.target.value)} placeholder="Green Thumb Landscaping" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Tell customers about yourself *</label>
                  <textarea required value={form.bio} onChange={e => set('bio', e.target.value)} rows={3}
                    placeholder="Describe your experience, specialties, and what makes you great..."
                    className={`${inputClass} resize-none`} />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(0)} className="flex-1 border border-border rounded-xl py-3 text-sm font-medium hover:bg-muted transition-colors flex items-center justify-center gap-1"><ArrowLeft size={14} /> Back</button>
                  <button type="submit" className="flex-1 bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">Next <ArrowRight size={16} /></button>
                </div>
              </form>
            )}

            {/* ── Step 2: Service Area ── */}
            {step === 2 && (
              <form onSubmit={handleNext} className="space-y-4">
                <h2 className="text-xl font-bold text-foreground">Service Area & Services</h2>
                <div>
                  <label className={labelClass}>ZIP codes you serve * (comma-separated)</label>
                  <input required value={form.zipCodes} onChange={e => set('zipCodes', e.target.value)} placeholder="20001, 20002, 20003" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Services you offer * (select all that apply)</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {SERVICES_LIST.map(s => (
                      <button key={s.id} type="button" onClick={() => toggleService(s.id)}
                        className={`px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-colors border ${
                          form.servicesOffered.includes(s.id) ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:border-primary/50'
                        }`}>
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 border border-border rounded-xl py-3 text-sm font-medium hover:bg-muted transition-colors flex items-center justify-center gap-1"><ArrowLeft size={14} /> Back</button>
                  <button type="submit" disabled={form.servicesOffered.length === 0} className="flex-1 bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">Next <ArrowRight size={16} /></button>
                </div>
              </form>
            )}

            {/* ── Step 3: Background Check Consent (FCRA-compliant) ── */}
            {step === 3 && (
              <form onSubmit={handleNext} className="space-y-5">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldAlert size={20} className="text-primary" />
                  <h2 className="text-xl font-bold text-foreground">Background Check Disclosure</h2>
                </div>

                {/* FCRA standalone disclosure */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 leading-relaxed space-y-2">
                  <p className="font-bold text-amber-800">IMPORTANT DISCLOSURE — PLEASE READ CAREFULLY</p>
                  <p>
                    Grassgodz LLC ("Company") will obtain a consumer report (background check) about you from a consumer reporting agency for employment purposes, including your initial application.
                  </p>
                  <p>
                    This report may include information about your criminal history, driving record, and other publicly available records. The Company may use this information to make decisions about your application.
                  </p>
                  <p>
                    <strong>Your rights under the FCRA:</strong> You have the right to know if a report is used against you, the right to know what is in the report, and the right to dispute inaccurate information. For more information, visit <a href="https://www.consumer.ftc.gov" target="_blank" rel="noreferrer" className="underline font-semibold">consumer.ftc.gov</a>.
                  </p>
                  <p>
                    <strong>Arrest records:</strong> No applicant will be automatically disqualified based solely on an arrest record or criminal history without an individualized assessment.
                  </p>
                  <p>
                    <strong>Adverse action:</strong> If the Company takes adverse action based in whole or in part on information in a consumer report, you will receive a pre-adverse action notice, a copy of the report, and a Summary of Consumer Rights before any final decision is made.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 text-sm text-foreground leading-relaxed">
                  <p className="font-semibold mb-2">Authorization for Background Check</p>
                  <p className="text-muted-foreground">
                    I hereby authorize Grassgodz LLC and its designated agents and representatives to conduct a comprehensive review of my background through a consumer reporting agency. I understand this may include criminal records, motor vehicle records, and other public records. This authorization is valid for this application and, if hired, throughout my engagement with Grassgodz.
                  </p>
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" required checked={form.agreedBackground} onChange={e => set('agreedBackground', e.target.checked)} className="mt-1 w-4 h-4 accent-primary" />
                  <span className="text-sm text-foreground">
                    <strong>I have read and understand the above disclosure.</strong> I authorize Grassgodz LLC to obtain a consumer report about me for employment purposes, and I consent to a background check being performed on my application.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" required checked={form.agreedTerms} onChange={e => set('agreedTerms', e.target.checked)} className="mt-1 w-4 h-4 accent-primary" />
                  <span className="text-sm text-foreground">
                    I agree to the <a href="#" className="text-primary underline">Terms of Service</a> and <a href="#" className="text-primary underline">Provider Agreement</a>. I certify that the information I have provided is true and accurate.
                  </span>
                </label>

                {/* Electronic Signature */}
                <div>
                  <label className={labelClass}>Electronic Signature * — Type your full legal name to sign</label>
                  <input
                    required
                    value={form.signature}
                    onChange={e => set('signature', e.target.value)}
                    placeholder={form.name || 'Your full legal name'}
                    className={`${inputClass} font-serif italic text-lg`}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    By typing your name above, you are providing an electronic signature with the same legal effect as a handwritten signature. Must match: <strong>{form.name}</strong>
                  </p>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(2)} className="flex-1 border border-border rounded-xl py-3 text-sm font-medium hover:bg-muted transition-colors flex items-center justify-center gap-1"><ArrowLeft size={14} /> Back</button>
                  <button type="submit" disabled={!form.agreedBackground || !form.agreedTerms || !form.signature} className="flex-1 bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">Next <ArrowRight size={16} /></button>
                </div>
              </form>
            )}

            {/* ── Step 4: Review & Submit ── */}
            {step === 4 && (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h2 className="text-xl font-bold text-foreground">Review & Submit</h2>
                <p className="text-sm text-muted-foreground">Please review your information before submitting. You'll hear back within 1–2 business days.</p>

                <div className="bg-secondary/30 rounded-xl p-4 text-sm space-y-2 divide-y divide-border">
                  {[
                    ['Full Name', form.name],
                    ['Email', form.email],
                    ['Phone', form.phone],
                    ['Date of Birth', form.dob],
                    ['Home Address', form.homeAddress],
                    ['Emergency Contact', `${form.emergencyContactName} — ${form.emergencyContactPhone}`],
                    ['Driver\'s License', `${form.dlState} — ${form.dlNumber}`],
                    ['Vehicle', form.hasVehicle === 'yes' ? 'Yes' : 'No'],
                    ['Equipment', form.hasEquipment === 'yes' ? 'Yes' : 'No'],
                    ['Experience', `${form.yearsExp} year(s)`],
                    ['Business Name', form.businessName || '—'],
                    ['Service ZIPs', form.zipCodes],
                    ['Services', `${form.servicesOffered.length} selected`],
                    ['Signature', form.signature],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between pt-2 first:pt-0 gap-4">
                      <span className="text-muted-foreground flex-shrink-0">{label}</span>
                      <span className="font-medium text-right">{val}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-start gap-2">
                  <CheckCircle size={15} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-green-800">Background check consent recorded with electronic signature. A copy will be emailed to you.</p>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(3)} className="flex-1 border border-border rounded-xl py-3 text-sm font-medium hover:bg-muted transition-colors flex items-center justify-center gap-1"><ArrowLeft size={14} /> Back</button>
                  <button type="submit" disabled={loading} className="flex-1 bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:bg-primary/90 disabled:opacity-70 transition-colors">
                    {loading ? 'Submitting…' : 'Apply to Become a Provider'}
                  </button>
                </div>
              </form>
            )}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-5">
            Already have an account? <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </main>
    </div>
  );
}