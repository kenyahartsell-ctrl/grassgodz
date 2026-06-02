import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Briefcase, ChevronDown, ChevronRight, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const fmt = (n) => `$${(n || 0).toFixed(2)}`;

const STATUS_BADGE = {
  captured: 'bg-green-100 text-green-800',
  authorized: 'bg-blue-100 text-blue-800',
  refunded: 'bg-purple-100 text-purple-800',
  failed: 'bg-red-100 text-red-800',
};

export default function AdminPayoutsPanel({ providers }) {
  const [jobs, setJobs] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    async function load() {
      try {
        const [allJobs, allPayments] = await Promise.all([
          base44.entities.Job.filter({ status: 'completed' }),
          base44.entities.Payment.list(),
        ]);
        setJobs(allJobs);
        setPayments(allPayments);
      } catch {
        toast.error('Failed to load payout data.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Build per-provider summary
  const providerMap = {};
  providers.forEach(p => {
    providerMap[p.id] = {
      profile: p,
      completedJobs: [],
      payments: [],
    };
  });

  jobs.forEach(j => {
    if (j.provider_id && providerMap[j.provider_id]) {
      providerMap[j.provider_id].completedJobs.push(j);
    }
  });

  payments.forEach(p => {
    if (p.provider_id && providerMap[p.provider_id]) {
      providerMap[p.provider_id].payments.push(p);
    }
  });

  const rows = Object.values(providerMap).filter(r => r.completedJobs.length > 0 || r.payments.length > 0);

  // Platform totals
  const totalGMV = jobs.reduce((s, j) => s + (j.final_price || j.quoted_price || 0), 0);
  const totalPlatformFees = payments.reduce((s, p) => s + (p.platform_fee || 0), 0);
  const totalPayouts = payments.filter(p => p.status === 'captured').reduce((s, p) => s + (p.payout_amount || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">Provider Payout Calculations</h2>
        <p className="text-sm text-muted-foreground">Per-provider earnings breakdown across all completed jobs</p>
      </div>

      {/* Platform Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Total GMV</p>
          <p className="text-xl font-bold text-foreground">{fmt(totalGMV)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Platform Fees</p>
          <p className="text-xl font-bold text-green-700">{fmt(totalPlatformFees)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Provider Payouts</p>
          <p className="text-xl font-bold text-primary">{fmt(totalPayouts)}</p>
        </div>
      </div>

      {/* Per-Provider Cards */}
      {rows.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <DollarSign className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No payout data yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(({ profile, completedJobs: pJobs, payments: pPayments }) => {
            const totalEarned = pJobs.reduce((s, j) => s + (j.provider_payout || 0), 0);
            const totalPaid = pPayments.filter(p => p.status === 'captured').reduce((s, p) => s + (p.payout_amount || 0), 0);
            const pending = Math.max(0, totalEarned - totalPaid);
            const platformFees = pPayments.reduce((s, p) => s + (p.platform_fee || 0), 0);
            const gmv = pJobs.reduce((s, j) => s + (j.final_price || j.quoted_price || 0), 0);
            const isExpanded = expanded[profile.id];

            return (
              <div key={profile.id} className="bg-card border border-border rounded-xl overflow-hidden">
                {/* Provider Header Row */}
                <button
                  onClick={() => setExpanded(e => ({ ...e, [profile.id]: !e[profile.id] }))}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm">{profile.name || profile.business_name || profile.user_email}</p>
                    <p className="text-xs text-muted-foreground">{profile.user_email}</p>
                  </div>

                  {/* Summary pills */}
                  <div className="hidden sm:flex items-center gap-3 text-xs flex-shrink-0">
                    <div className="text-center">
                      <p className="text-muted-foreground">Jobs</p>
                      <p className="font-bold text-foreground">{pJobs.length}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground">GMV</p>
                      <p className="font-bold text-foreground">{fmt(gmv)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground">Earned</p>
                      <p className="font-bold text-primary">{fmt(totalEarned)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground">Paid Out</p>
                      <p className="font-bold text-green-700">{fmt(totalPaid)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground">Pending</p>
                      <p className={`font-bold ${pending > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>{fmt(pending)}</p>
                    </div>
                  </div>

                  {isExpanded ? <ChevronDown size={16} className="text-muted-foreground flex-shrink-0" /> : <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" />}
                </button>

                {/* Mobile summary */}
                <div className="sm:hidden px-5 pb-3 grid grid-cols-3 gap-2 text-xs">
                  <div><p className="text-muted-foreground">GMV</p><p className="font-bold">{fmt(gmv)}</p></div>
                  <div><p className="text-muted-foreground">Earned</p><p className="font-bold text-primary">{fmt(totalEarned)}</p></div>
                  <div><p className="text-muted-foreground">Pending</p><p className={`font-bold ${pending > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>{fmt(pending)}</p></div>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-border">
                    {/* Job-level breakdown */}
                    <div className="px-5 py-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Completed Jobs</p>
                      {pJobs.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No completed jobs</p>
                      ) : (
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-muted-foreground">
                              <th className="text-left pb-1 font-medium">Service</th>
                              <th className="text-left pb-1 font-medium">Customer</th>
                              <th className="text-left pb-1 font-medium">Date</th>
                              <th className="text-right pb-1 font-medium">Job Price</th>
                              <th className="text-right pb-1 font-medium">Platform Fee</th>
                              <th className="text-right pb-1 font-medium">Provider Cut</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {pJobs.map(j => {
                              const price = j.final_price || j.quoted_price || 0;
                              const fee = j.platform_fee || 0;
                              const payout = j.provider_payout || 0;
                              return (
                                <tr key={j.id} className="hover:bg-muted/20">
                                  <td className="py-2 pr-3 font-medium text-foreground">{j.service_name || '—'}</td>
                                  <td className="py-2 pr-3 text-muted-foreground">{j.customer_name || '—'}</td>
                                  <td className="py-2 pr-3 text-muted-foreground whitespace-nowrap">
                                    {j.completed_at ? new Date(j.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                  </td>
                                  <td className="py-2 pr-3 text-right text-foreground">{fmt(price)}</td>
                                  <td className="py-2 pr-3 text-right text-red-600">-{fmt(fee)}</td>
                                  <td className="py-2 text-right font-bold text-primary">{fmt(payout)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr className="border-t-2 border-border font-semibold">
                              <td colSpan={3} className="pt-2 text-muted-foreground">Totals</td>
                              <td className="pt-2 text-right text-foreground">{fmt(gmv)}</td>
                              <td className="pt-2 text-right text-red-600">-{fmt(platformFees)}</td>
                              <td className="pt-2 text-right text-primary">{fmt(totalEarned)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      )}
                    </div>

                    {/* Payment history */}
                    {pPayments.length > 0 && (
                      <div className="px-5 py-3 border-t border-border bg-muted/20">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Payment Records</p>
                        <div className="space-y-1.5">
                          {pPayments.map(p => (
                            <div key={p.id} className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">{new Date(p.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              <span className={`px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[p.status] || 'bg-gray-100 text-gray-600'}`}>{p.status}</span>
                              <span className="text-muted-foreground">Total: {fmt(p.amount)}</span>
                              <span className="font-bold text-primary">Payout: {fmt(p.payout_amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Payout summary bar */}
                    <div className="px-5 py-3 border-t border-border bg-primary/5 flex flex-wrap gap-4 text-xs">
                      <span className="flex items-center gap-1.5"><CheckCircle size={13} className="text-green-600" /> Paid Out: <strong className="text-green-700">{fmt(totalPaid)}</strong></span>
                      {pending > 0 && <span className="flex items-center gap-1.5"><Clock size={13} className="text-amber-600" /> Pending: <strong className="text-amber-600">{fmt(pending)}</strong></span>}
                      <span className="flex items-center gap-1.5"><TrendingUp size={13} className="text-primary" /> Total Earned: <strong className="text-primary">{fmt(totalEarned)}</strong></span>
                      <span className="flex items-center gap-1.5 text-muted-foreground"><Briefcase size={13} /> {pJobs.length} job{pJobs.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}