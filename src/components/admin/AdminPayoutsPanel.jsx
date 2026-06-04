import { useState, useEffect, useCallback } from 'react';
import { DollarSign, TrendingUp, Briefcase, ChevronDown, ChevronRight, CheckCircle, Clock, List, Users, Pencil, Camera, Banknote, CreditCard } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import AdminPayoutEditModal from './AdminPayoutEditModal';

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
  const [view, setView] = useState('providers'); // 'jobs' | 'providers'
  const [payoutFilter, setPayoutFilter] = useState('all');
  const [editingJob, setEditingJob] = useState(null);

  const load = useCallback(async () => {
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
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleCash = async (job) => {
    const isCash = job.cash_paid || job.payment_method === 'cash';
    const update = isCash
      ? { cash_paid: false, payment_method: 'stripe' }
      : { cash_paid: true, payment_method: 'cash', cash_paid_date: new Date().toISOString() };
    try {
      await base44.entities.Job.update(job.id, update);
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, ...update } : j));
      toast.success(isCash ? 'Marked as card payment.' : 'Marked as cash payment.');
    } catch {
      toast.error('Failed to update payment type.');
    }
  };

  // Build payment lookup by job_id
  const paymentByJob = {};
  payments.forEach(p => {
    if (p.job_id) paymentByJob[p.job_id] = p;
  });

  // Flat jobs list with payout status
  const jobsWithStatus = jobs.map(j => {
    const payment = paymentByJob[j.id];
    const isProcessed = payment?.status === 'captured';
    return { ...j, payment, isProcessed };
  });

  const filteredJobs = jobsWithStatus.filter(j => {
    if (payoutFilter === 'processed') return j.isProcessed;
    if (payoutFilter === 'pending') return !j.isProcessed;
    return true;
  });

  // Today's date in local format for filtering
  const todayStr = new Date().toISOString().slice(0, 10);

  // Provider map for provider view
  const providerMap = {};
  providers.forEach(p => {
    providerMap[p.id] = { profile: p, completedJobs: [], payments: [] };
  });
  jobs.forEach(j => {
    if (j.provider_id && providerMap[j.provider_id]) {
      const pName = (j.provider_name || '').toLowerCase();
      const isFreeman = pName.includes('freeman');
      const completedToday = j.completed_at && j.completed_at.slice(0, 10) === todayStr;
      if (isFreeman && completedToday) return; // exclude Ms. Freeman's jobs completed today
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
  const pendingPayouts = jobs.reduce((s, j) => {
    const p = paymentByJob[j.id];
    if (!p || p.status !== 'captured') return s + (j.provider_payout || 0);
    return s;
  }, 0);

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
        <h2 className="text-xl font-bold text-foreground">Provider Payouts</h2>
        <p className="text-sm text-muted-foreground">Completed job payouts and provider earnings breakdown</p>
      </div>

      {/* Platform Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Total GMV</p>
          <p className="text-lg font-bold text-foreground">{fmt(totalGMV)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Platform Fees</p>
          <p className="text-lg font-bold text-green-700">{fmt(totalPlatformFees)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Paid Out</p>
          <p className="text-lg font-bold text-primary">{fmt(totalPayouts)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Pending Payouts</p>
          <p className="text-lg font-bold text-amber-600">{fmt(pendingPayouts)}</p>
        </div>
      </div>

      {/* View Toggle + Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex bg-muted rounded-lg p-1 gap-1">
          <button
            onClick={() => setView('jobs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${view === 'jobs' ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <List size={13} /> All Jobs
          </button>
          <button
            onClick={() => setView('providers')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${view === 'providers' ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Users size={13} /> By Provider
          </button>
        </div>

        {view === 'jobs' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Filter:</span>
            {['all', 'processed', 'pending'].map(f => (
              <button
                key={f}
                onClick={() => setPayoutFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors capitalize ${
                  payoutFilter === f
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {f === 'all' ? `All (${jobsWithStatus.length})` : f === 'processed' ? `Processed (${jobsWithStatus.filter(j => j.isProcessed).length})` : `Pending (${jobsWithStatus.filter(j => !j.isProcessed).length})`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Jobs Flat List View */}
      {view === 'jobs' && (
        filteredJobs.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-xl">
            <DollarSign className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No jobs match this filter</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <span className="col-span-2">Date</span>
              <span className="col-span-2">Provider</span>
              <span className="col-span-2">Customer</span>
              <span className="col-span-2">Service</span>
              <span className="col-span-1 text-right">Job Price</span>
              <span className="col-span-1 text-right">Fee (10%)</span>
              <span className="col-span-1 text-right">Payout</span>
              <span className="col-span-1 text-center">Type / Edit</span>
            </div>
            <div className="divide-y divide-border">
              {filteredJobs.map(j => {
                const price = j.final_price || j.quoted_price || 0;
                const fee = parseFloat((price * 0.10).toFixed(2));
                const payout = parseFloat((price * 0.90).toFixed(2));
                const isCash = j.cash_paid || j.payment_method === 'cash';
                return (
                  <div key={j.id} className="grid grid-cols-2 sm:grid-cols-12 gap-2 px-4 py-3 hover:bg-muted/20 text-xs items-center">
                    <span className="col-span-1 sm:col-span-2 text-muted-foreground">
                      {j.completed_at ? new Date(j.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </span>
                    <span className="col-span-1 sm:col-span-2 font-medium text-foreground truncate">{j.provider_name || '—'}</span>
                    <span className="col-span-1 sm:col-span-2 text-muted-foreground truncate">{j.customer_name || '—'}</span>
                    <span className="col-span-1 sm:col-span-2 text-muted-foreground truncate">{j.service_name || '—'}</span>
                    <span className="col-span-1 sm:col-span-1 text-right font-medium text-foreground">{fmt(price)}</span>
                    <span className="col-span-1 sm:col-span-1 text-right text-red-600">-{fmt(fee)}</span>
                    <span className="col-span-1 sm:col-span-1 text-right font-bold text-primary">{fmt(payout)}</span>
                    <span className="col-span-1 sm:col-span-1 flex items-center justify-end gap-1.5 flex-wrap">
                      {/* Provider paid out badge */}
                      {j.provider_paid_out && (
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full font-semibold text-[10px] border bg-emerald-100 text-emerald-700 border-emerald-300`}>
                          ✓ {j.provider_payout_method || 'Paid'}
                        </span>
                      )}
                      {/* Cash toggle */}
                      <button
                        onClick={() => toggleCash(j)}
                        title={isCash ? 'Mark as card payment' : 'Mark as cash payment'}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full font-semibold text-[10px] border transition-colors ${
                          isCash
                            ? 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200'
                            : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
                        }`}
                      >
                        {isCash ? <><Banknote size={9} /> Cash</> : <><CreditCard size={9} /> Card</>}
                      </button>
                      <button
                        onClick={() => setEditingJob(j)}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-muted hover:bg-muted/70 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit payout"
                      >
                        <Pencil size={10} /> Edit
                      </button>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}

      {/* Provider View */}
      {view === 'providers' && (
        rows.length === 0 ? (
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
                  <button
                    onClick={() => setExpanded(e => ({ ...e, [profile.id]: !e[profile.id] }))}
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm">{profile.name || profile.business_name || profile.user_email}</p>
                      <p className="text-xs text-muted-foreground">{profile.user_email}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-3 text-xs flex-shrink-0">
                      <div className="text-center"><p className="text-muted-foreground">Jobs</p><p className="font-bold text-foreground">{pJobs.length}</p></div>
                      <div className="text-center"><p className="text-muted-foreground">GMV</p><p className="font-bold text-foreground">{fmt(gmv)}</p></div>
                      <div className="text-center"><p className="text-muted-foreground">Earned</p><p className="font-bold text-primary">{fmt(totalEarned)}</p></div>
                      <div className="text-center"><p className="text-muted-foreground">Paid Out</p><p className="font-bold text-green-700">{fmt(totalPaid)}</p></div>
                      <div className="text-center"><p className="text-muted-foreground">Pending</p><p className={`font-bold ${pending > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>{fmt(pending)}</p></div>
                    </div>
                    {isExpanded ? <ChevronDown size={16} className="text-muted-foreground flex-shrink-0" /> : <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" />}
                  </button>

                  <div className="sm:hidden px-5 pb-3 grid grid-cols-3 gap-2 text-xs">
                    <div><p className="text-muted-foreground">GMV</p><p className="font-bold">{fmt(gmv)}</p></div>
                    <div><p className="text-muted-foreground">Earned</p><p className="font-bold text-primary">{fmt(totalEarned)}</p></div>
                    <div><p className="text-muted-foreground">Pending</p><p className={`font-bold ${pending > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>{fmt(pending)}</p></div>
                  </div>

                  {isExpanded && (() => {
                    const cardJobs = pJobs.filter(j => !j.cash_paid && j.payment_method !== 'cash');
                    const cashJobs = pJobs.filter(j => j.cash_paid || j.payment_method === 'cash');

                    const calcTotals = (jList) => {
                      const total = jList.reduce((s, j) => s + (j.final_price || j.quoted_price || 0), 0);
                      const fee = parseFloat((total * 0.10).toFixed(2));
                      const payout = parseFloat((total * 0.90).toFixed(2));
                      return { total, fee, payout };
                    };

                    const cardTotals = calcTotals(cardJobs);
                    const cashTotals = calcTotals(cashJobs);
                    const allTotals = calcTotals(pJobs);

                    const JobTable = ({ jobList, label, accentClass }) => {
                      if (jobList.length === 0) return null;
                      const t = calcTotals(jobList);
                      return (
                        <div className="mb-4">
                          <p className="text-[11px] font-bold uppercase tracking-wide mb-2 flex items-center gap-1.5" style={{color: 'inherit'}}>
                            <span className={`inline-block w-2 h-2 rounded-full ${accentClass}`} />
                            {label} ({jobList.length} job{jobList.length !== 1 ? 's' : ''})
                          </p>
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-muted-foreground border-b border-border">
                                <th className="text-left pb-1.5 font-medium">Service</th>
                                <th className="text-left pb-1.5 font-medium hidden sm:table-cell">Customer</th>
                                <th className="text-left pb-1.5 font-medium hidden sm:table-cell">Date</th>
                                <th className="text-right pb-1.5 font-medium">Job Total</th>
                                <th className="text-right pb-1.5 font-medium">Fee (10%)</th>
                                <th className="text-right pb-1.5 font-medium">Payout (90%)</th>
                                <th className="text-right pb-1.5 font-medium">Edit</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {jobList.map(j => {
                                const price = j.final_price || j.quoted_price || 0;
                                const fee = parseFloat((price * 0.10).toFixed(2));
                                const payout = parseFloat((price * 0.90).toFixed(2));
                                return (
                                  <tr key={j.id} className="hover:bg-muted/20">
                                    <td className="py-2 pr-3 font-medium text-foreground">{j.service_name || '—'}</td>
                                    <td className="py-2 pr-3 text-muted-foreground hidden sm:table-cell">{j.customer_name || '—'}</td>
                                    <td className="py-2 pr-3 text-muted-foreground whitespace-nowrap hidden sm:table-cell">
                                      {j.completed_at ? new Date(j.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                    </td>
                                    <td className="py-2 pr-3 text-right text-foreground">{fmt(price)}</td>
                                    <td className="py-2 pr-3 text-right text-red-600">-{fmt(fee)}</td>
                                    <td className="py-2 pr-3 text-right font-bold text-primary">{fmt(payout)}</td>
                                    <td className="py-2 text-right">
                                      <div className="flex items-center justify-end gap-1 flex-wrap">
                                        {j.provider_paid_out && (
                                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-300">
                                            ✓ {j.provider_payout_method || 'Paid'}
                                          </span>
                                        )}
                                        <button
                                          onClick={() => setEditingJob(j)}
                                          className="inline-flex items-center gap-1 px-2 py-1 bg-muted hover:bg-muted/70 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                          <Pencil size={10} /> Edit
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot>
                              <tr className="border-t-2 border-border font-semibold bg-muted/30">
                                <td colSpan={3} className="pt-2 pb-1 text-muted-foreground hidden sm:table-cell">Subtotal</td>
                                <td className="pt-2 pb-1 text-right text-foreground">{fmt(t.total)}</td>
                                <td className="pt-2 pb-1 text-right text-red-600">-{fmt(t.fee)}</td>
                                <td className="pt-2 pb-1 text-right text-primary">{fmt(t.payout)}</td>
                                <td />
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      );
                    };

                    return (
                      <div className="border-t border-border">
                        <div className="px-5 py-4 space-y-2">
                          <JobTable jobList={cardJobs} label="💳 Card Payments" accentClass="bg-blue-500" />
                          <JobTable jobList={cashJobs} label="💵 Cash Payments" accentClass="bg-green-500" />
                        </div>

                        {/* Summary row */}
                        <div className="px-5 py-3 border-t border-border bg-primary/5">
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">Provider Earnings Summary</p>
                          <div className="grid grid-cols-3 gap-3 text-xs mb-3">
                            <div className="bg-card border border-border rounded-lg p-3 text-center">
                              <p className="text-muted-foreground mb-0.5">Total Job Value</p>
                              <p className="font-bold text-foreground text-sm">{fmt(allTotals.total)}</p>
                            </div>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                              <p className="text-red-600 mb-0.5">Grassgodz Fee (10%)</p>
                              <p className="font-bold text-red-700 text-sm">-{fmt(allTotals.fee)}</p>
                            </div>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                              <p className="text-green-700 mb-0.5">Provider Payout (90%)</p>
                              <p className="font-bold text-green-800 text-sm">{fmt(allTotals.payout)}</p>
                            </div>
                          </div>

                          {/* Card vs Cash breakdown */}
                          {cardJobs.length > 0 && cashJobs.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5">
                                <p className="font-semibold text-blue-800 mb-1.5 flex items-center gap-1"><span>💳</span> Card</p>
                                <div className="space-y-0.5 text-blue-700">
                                  <div className="flex justify-between"><span>Job Total</span><span className="font-medium">{fmt(cardTotals.total)}</span></div>
                                  <div className="flex justify-between"><span>Fee (10%)</span><span className="font-medium text-red-600">-{fmt(cardTotals.fee)}</span></div>
                                  <div className="flex justify-between border-t border-blue-200 pt-0.5 mt-0.5"><span className="font-bold">Payout</span><span className="font-bold">{fmt(cardTotals.payout)}</span></div>
                                </div>
                              </div>
                              <div className="bg-green-50 border border-green-200 rounded-lg p-2.5">
                                <p className="font-semibold text-green-800 mb-1.5 flex items-center gap-1"><span>💵</span> Cash</p>
                                <div className="space-y-0.5 text-green-700">
                                  <div className="flex justify-between"><span>Job Total</span><span className="font-medium">{fmt(cashTotals.total)}</span></div>
                                  <div className="flex justify-between"><span>Fee (10%)</span><span className="font-medium text-red-600">-{fmt(cashTotals.fee)}</span></div>
                                  <div className="flex justify-between border-t border-green-200 pt-0.5 mt-0.5"><span className="font-bold">Payout</span><span className="font-bold">{fmt(cashTotals.payout)}</span></div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Edit Payout Modal */}
      {editingJob && (
        <AdminPayoutEditModal
          job={editingJob}
          onClose={() => setEditingJob(null)}
          onSaved={() => { setEditingJob(null); load(); }}
        />
      )}
    </div>
  );
}