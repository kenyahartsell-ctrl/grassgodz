import { useState, useEffect } from 'react';
import { ArrowLeft, DollarSign, Briefcase, TrendingUp, Clock, CheckCircle, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const STATUS_CONFIG = {
  pending:   { label: 'Pending Review', badge: 'bg-amber-100 text-amber-800', icon: Clock },
  authorized:{ label: 'Authorized',     badge: 'bg-blue-100 text-blue-800',   icon: Clock },
  captured:  { label: 'Paid',           badge: 'bg-green-100 text-green-800', icon: CheckCircle },
  refunded:  { label: 'Refunded',       badge: 'bg-red-100 text-red-800',     icon: AlertCircle },
  failed:    { label: 'Failed',         badge: 'bg-red-100 text-red-800',     icon: AlertCircle },
};

function StatCard({ title, value, sub, icon: Icon, color = 'text-primary', bg = 'bg-primary/10' }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-start gap-4">
      <div className={`${bg} rounded-xl p-3 flex-shrink-0`}>
        <Icon className={`${color} w-5 h-5`} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function ProviderFinancialsPage() {
  const [loading, setLoading] = useState(true);
  const [providerProfile, setProviderProfile] = useState(null);
  const [completedJobs, setCompletedJobs] = useState([]);
  const [payments, setPayments] = useState([]);
  const [activeTab, setActiveTab] = useState('jobs');

  useEffect(() => {
    async function load() {
      try {
        const me = await base44.auth.me();
        const res = await base44.functions.invoke('getMyProviderProfile', {});
        const profile = res.data?.profile;
        if (!profile) { setLoading(false); return; }
        setProviderProfile(profile);

        const [jobs, allPayments] = await Promise.all([
          base44.entities.Job.filter({ provider_email: me.email }),
          base44.entities.Payment.filter({ provider_id: profile.id }),
        ]);

        setCompletedJobs(jobs.filter(j => j.status === 'completed').sort((a, b) =>
          new Date(b.completed_at || b.updated_date) - new Date(a.completed_at || a.updated_date)
        ));
        setPayments(allPayments.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
      } catch {
        toast.error('Failed to load financial data.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalEarnings = completedJobs.reduce((s, j) => s + (j.provider_payout || 0), 0);
  const paidOut = payments.filter(p => p.status === 'captured').reduce((s, p) => s + (p.payout_amount || 0), 0);
  const pending = totalEarnings - paidOut;

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/provider" className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft size={18} className="text-foreground" />
          </Link>
          <img src="https://media.base44.com/images/public/69e949497e5928c679297ebf/b2338f6dd_logo_transparent.png" alt="Grassgodz" className="h-8 w-8 object-contain" />
          <h1 className="font-bold text-foreground text-lg">Financial Summary</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard title="Total Earned" value={`$${totalEarnings.toFixed(2)}`} sub={`${completedJobs.length} completed jobs`} icon={DollarSign} />
          <StatCard title="Paid Out" value={`$${paidOut.toFixed(2)}`} sub="via Stripe Connect" icon={CheckCircle} color="text-green-600" bg="bg-green-100" />
          <StatCard title="Pending Payout" value={`$${Math.max(0, pending).toFixed(2)}`} sub="Awaiting capture" icon={Clock} color="text-amber-600" bg="bg-amber-100" />
          <StatCard title="Avg per Job" value={completedJobs.length ? `$${(totalEarnings / completedJobs.length).toFixed(2)}` : '—'} sub="Provider share (75%)" icon={TrendingUp} color="text-blue-600" bg="bg-blue-100" />
        </div>

        {/* Stripe Connect Status */}
        {providerProfile && (
          <div className={`rounded-xl border p-4 flex items-start gap-3 ${
            providerProfile.onboarding_complete
              ? 'bg-green-50 border-green-200'
              : 'bg-amber-50 border-amber-200'
          }`}>
            {providerProfile.onboarding_complete
              ? <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
              : <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
            }
            <div className="flex-1">
              <p className={`text-sm font-semibold ${providerProfile.onboarding_complete ? 'text-green-800' : 'text-amber-800'}`}>
                {providerProfile.onboarding_complete ? 'Stripe Connect active — payouts enabled' : 'Stripe Connect not set up — payouts on hold'}
              </p>
              <p className={`text-xs mt-0.5 ${providerProfile.onboarding_complete ? 'text-green-700' : 'text-amber-700'}`}>
                {providerProfile.onboarding_complete
                  ? 'Your bank account is connected. Funds are transferred automatically after job completion.'
                  : 'Set up your bank account to receive payouts for completed jobs.'}
              </p>
            </div>
            {!providerProfile.onboarding_complete && (
              <button
                onClick={async () => {
                  const res = await base44.functions.invoke('createStripeConnectAccount', {
                    provider_id: providerProfile.id,
                    return_url: window.location.href,
                  });
                  if (res.data?.url) window.location.href = res.data.url;
                }}
                className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold bg-amber-700 text-white px-3 py-1.5 rounded-lg hover:bg-amber-800 transition-colors"
              >
                Set Up <ExternalLink size={11} />
              </button>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {[['jobs', 'Completed Jobs'], ['payments', 'Payout History']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Completed Jobs Table */}
        {activeTab === 'jobs' && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {completedJobs.length === 0 ? (
              <div className="text-center py-14">
                <Briefcase className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-muted-foreground text-sm font-medium">No completed jobs yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Service</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Date</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Job Price</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Your Cut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {completedJobs.map(job => (
                      <tr key={job.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{job.service_name || '—'}</p>
                          <p className="text-xs text-muted-foreground">{job.customer_name || '—'}</p>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                          {job.completed_at
                            ? new Date(job.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-foreground">
                          {job.final_price != null ? `$${job.final_price.toFixed(2)}` : job.quoted_price != null ? `$${job.quoted_price.toFixed(2)}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-primary">
                          {job.provider_payout != null ? `$${job.provider_payout.toFixed(2)}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-border bg-muted/30">
                      <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-foreground">Total</td>
                      <td className="px-4 py-3 text-right text-base font-bold text-primary">${totalEarnings.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Payout History Table */}
        {activeTab === 'payments' && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {payments.length === 0 ? (
              <div className="text-center py-14">
                <DollarSign className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-muted-foreground text-sm font-medium">No payout records yet</p>
                <p className="text-xs text-muted-foreground mt-1">Payouts appear here after customers complete payment</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Date</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Total</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Your Payout</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {payments.map(p => {
                      const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.pending;
                      const Icon = cfg.icon;
                      return (
                        <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                            {new Date(p.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.badge}`}>
                              <Icon size={11} />
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-foreground">
                            {p.amount != null ? `$${p.amount.toFixed(2)}` : '—'}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-primary">
                            {p.payout_amount != null ? `$${p.payout_amount.toFixed(2)}` : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}