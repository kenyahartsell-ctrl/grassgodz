import { X, Phone, MapPin, Car, Wrench, Shield, Star, Mail, Calendar, FileText, User, AlertCircle, CheckCircle, DollarSign, Banknote, CreditCard, Info } from 'lucide-react';
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import StarRating from '@/components/shared/StarRating';
import StatusBadge from '@/components/shared/StatusBadge';

function InfoRow({ label, value, highlight }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <p className={`text-sm font-medium ${highlight ? highlight : 'text-foreground'}`}>{value || '—'}</p>
    </div>
  );
}

const fmt = (n) => `$${(n || 0).toFixed(2)}`;

function ProviderEarningsSection({ providerId, providerEmail }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Job.filter({ status: 'completed', provider_email: providerEmail })
      .then(setJobs)
      .finally(() => setLoading(false));
  }, [providerEmail]);

  const cardJobs = jobs.filter(j => !j.cash_paid && j.payment_method !== 'cash');
  const cashJobs = jobs.filter(j => j.cash_paid || j.payment_method === 'cash');

  const calcTotals = (list) => {
    const total = list.reduce((s, j) => s + (j.final_price || j.quoted_price || 0), 0);
    return { total, fee: total * 0.10, payout: total * 0.90 };
  };

  const cardT = calcTotals(cardJobs);
  const cashT = calcTotals(cashJobs);
  const allT = calcTotals(jobs);

  if (loading) return <div className="text-xs text-muted-foreground py-2">Loading earnings…</div>;

  return (
    <section>
      <h3 className="text-xs font-bold text-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
        <DollarSign size={13} className="text-primary" /> Earnings Summary
      </h3>

      {/* Cash fee notice */}
      <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-4">
        <Info size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>Note:</strong> Any cash payments made in person directly to the provider are still subject to the Grassgodz 10% platform fee. These fees will be deducted and tracked accordingly.
        </p>
      </div>

      {jobs.length === 0 ? (
        <p className="text-xs text-muted-foreground bg-muted/30 rounded-xl p-4 text-center">No completed jobs yet.</p>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
            <div className="bg-card border border-border rounded-lg p-3 text-center">
              <p className="text-muted-foreground mb-0.5">Job Total</p>
              <p className="font-bold text-foreground">{fmt(allT.total)}</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
              <p className="text-red-600 mb-0.5">Fee (10%)</p>
              <p className="font-bold text-red-700">-{fmt(allT.fee)}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <p className="text-green-700 mb-0.5">Payout (90%)</p>
              <p className="font-bold text-green-800">{fmt(allT.payout)}</p>
            </div>
          </div>

          {/* Card vs Cash sub-totals */}
          {cardJobs.length > 0 && cashJobs.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="font-semibold text-blue-800 mb-1.5 flex items-center gap-1"><CreditCard size={11} /> Card ({cardJobs.length})</p>
                <div className="space-y-0.5 text-blue-700">
                  <div className="flex justify-between"><span>Total</span><span>{fmt(cardT.total)}</span></div>
                  <div className="flex justify-between"><span>Fee</span><span className="text-red-600">-{fmt(cardT.fee)}</span></div>
                  <div className="flex justify-between font-bold border-t border-blue-200 pt-0.5"><span>Payout</span><span>{fmt(cardT.payout)}</span></div>
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="font-semibold text-green-800 mb-1.5 flex items-center gap-1"><Banknote size={11} /> Cash ({cashJobs.length})</p>
                <div className="space-y-0.5 text-green-700">
                  <div className="flex justify-between"><span>Total</span><span>{fmt(cashT.total)}</span></div>
                  <div className="flex justify-between"><span>Fee</span><span className="text-red-600">-{fmt(cashT.fee)}</span></div>
                  <div className="flex justify-between font-bold border-t border-green-200 pt-0.5"><span>Payout</span><span>{fmt(cashT.payout)}</span></div>
                </div>
              </div>
            </div>
          )}

          {/* Job rows */}
          <div className="bg-muted/30 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left px-3 py-2 font-medium">Service</th>
                  <th className="text-left px-3 py-2 font-medium">Type</th>
                  <th className="text-right px-3 py-2 font-medium">Total</th>
                  <th className="text-right px-3 py-2 font-medium">Fee (10%)</th>
                  <th className="text-right px-3 py-2 font-medium">Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {jobs.map(j => {
                  const price = j.final_price || j.quoted_price || 0;
                  const isCash = j.cash_paid || j.payment_method === 'cash';
                  return (
                    <tr key={j.id} className="hover:bg-muted/40">
                      <td className="px-3 py-2 font-medium text-foreground">{j.service_name || '—'}</td>
                      <td className="px-3 py-2">
                        {isCash
                          ? <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold"><Banknote size={9} /> Cash</span>
                          : <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold"><CreditCard size={9} /> Card</span>
                        }
                      </td>
                      <td className="px-3 py-2 text-right text-foreground">{fmt(price)}</td>
                      <td className="px-3 py-2 text-right text-red-600">-{fmt(price * 0.10)}</td>
                      <td className="px-3 py-2 text-right font-bold text-primary">{fmt(price * 0.90)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

export default function ProviderDetailModal({ provider: p, onClose }) {
  if (!p) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-border">
              {p.profile_image_url ? (
                <img src={p.profile_image_url} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-primary">{(p.name || p.user_email || '?')[0].toUpperCase()}</span>
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{p.business_name || p.name || '—'}</h2>
              <p className="text-sm text-muted-foreground">{p.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={p.status} />
                {p.avg_rating > 0 && <StarRating rating={Math.round(p.avg_rating)} size={13} showValue />}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Contact Info */}
          <section>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
              <User size={13} className="text-primary" /> Contact Information
            </h3>
            <div className="grid grid-cols-2 gap-4 bg-muted/30 rounded-xl p-4">
              <InfoRow label="Email" value={p.user_email} />
              <InfoRow label="Full Name" value={p.name} />
              <InfoRow label="Business Name" value={p.business_name} />
              <InfoRow label="Phone" value={p.phone} />
              <InfoRow label="Date of Birth" value={p.dob} />
              <InfoRow label="Home Address" value={p.home_address} />
              <InfoRow label="Emergency Contact" value={p.emergency_contact_name} />
              <InfoRow label="Emergency Phone" value={p.emergency_contact_phone} />
            </div>
          </section>

          {/* Identification */}
          <section>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
              <FileText size={13} className="text-primary" /> Identification
            </h3>
            <div className="grid grid-cols-2 gap-4 bg-muted/30 rounded-xl p-4">
              <InfoRow label="Driver's License State" value={p.dl_state} />
              <InfoRow label="Driver's License #" value={p.dl_number} />
              <InfoRow label="Has Vehicle" value={p.has_vehicle ? 'Yes' : 'No'} highlight={p.has_vehicle ? 'text-green-600' : 'text-muted-foreground'} />
              <InfoRow label="Has Equipment" value={p.has_equipment ? 'Yes' : 'No'} highlight={p.has_equipment ? 'text-green-600' : 'text-muted-foreground'} />
            </div>
          </section>

          {/* Background Check */}
          <section>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
              <Shield size={13} className="text-primary" /> Background Check
            </h3>
            <div className="bg-muted/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className={`text-sm font-semibold px-2.5 py-0.5 rounded-full ${
                  p.background_check_status === 'clear' ? 'bg-green-100 text-green-700' :
                  p.background_check_status === 'pending' ? 'bg-amber-100 text-amber-700' :
                  p.background_check_status === 'consider' ? 'bg-orange-100 text-orange-700' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {p.background_check_status || 'Not Started'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Consent Given</span>
                <div className="flex items-center gap-1.5">
                  {p.consented_background_check ? (
                    <><CheckCircle size={14} className="text-green-600" /><span className="text-sm font-medium text-green-700">Yes</span></>
                  ) : (
                    <><AlertCircle size={14} className="text-red-500" /><span className="text-sm font-medium text-red-600">No</span></>
                  )}
                </div>
              </div>
              {p.consent_timestamp && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Consent Date</span>
                  <span className="text-sm font-medium">{new Date(p.consent_timestamp).toLocaleString()}</span>
                </div>
              )}
              {p.signature && (
                <div>
                  <span className="text-xs text-muted-foreground">Electronic Signature</span>
                  <p className="text-sm font-medium italic mt-0.5">{p.signature}</p>
                </div>
              )}
              {p.checkr_candidate_id && <InfoRow label="Checkr Candidate ID" value={p.checkr_candidate_id} />}
              {p.checkr_report_id && <InfoRow label="Checkr Report ID" value={p.checkr_report_id} />}
            </div>
          </section>

          {/* Work Info */}
          <section>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
              <Wrench size={13} className="text-primary" /> Work Information
            </h3>
            <div className="grid grid-cols-2 gap-4 bg-muted/30 rounded-xl p-4">
              <InfoRow label="Years of Experience" value={p.years_experience ? `${p.years_experience} years` : null} />
              <InfoRow label="Total Jobs Completed" value={p.total_jobs_completed} />
              <InfoRow label="Average Rating" value={p.avg_rating > 0 ? `${p.avg_rating} / 5` : null} />
              <InfoRow label="Stripe Account" value={p.stripe_connect_account_id} />
              <div className="col-span-2">
                <InfoRow label="Service ZIP Codes" value={(p.service_zip_codes || []).join(', ') || null} />
              </div>
            </div>
            {p.bio && (
              <div className="mt-3 bg-muted/30 rounded-xl p-4">
                <p className="text-xs text-muted-foreground font-medium mb-1">Bio</p>
                <p className="text-sm text-foreground">{p.bio}</p>
              </div>
            )}
          </section>

          {/* Earnings Summary (admin-only) */}
          <ProviderEarningsSection providerId={p.id} providerEmail={p.user_email} />

          {/* Admin Notes */}
          {p.admin_notes && (
            <section>
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wide mb-3">Admin Notes</h3>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">{p.admin_notes}</div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}