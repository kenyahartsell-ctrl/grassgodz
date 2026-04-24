import { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Briefcase, CreditCard, Shield, Leaf, TrendingUp, DollarSign, Star, Activity, Loader2 } from 'lucide-react';
import MetricCard from '../components/shared/MetricCard';
import StatusBadge from '../components/shared/StatusBadge';
import ProviderApprovalRow from '../components/admin/ProviderApprovalRow';
import AdminProvidersTable from '../components/admin/AdminProvidersTable';
import StarRating from '../components/shared/StarRating';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { toast } from 'sonner';

const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'providers', label: 'Providers', icon: Users },
  { key: 'jobs', label: 'Jobs', icon: Briefcase },
  { key: 'payments', label: 'Payments', icon: CreditCard },
  { key: 'reviews', label: 'Reviews', icon: Star },
];

export default function AdminPortal() {
  const [tab, setTab] = useState('dashboard');
  const [providers, setProviders] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [payments, setPayments] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [allProviders, allJobs, allPayments, allReviews] = await Promise.all([
          base44.entities.ProviderProfile.list(),
          base44.entities.Job.list('-created_date', 100),
          base44.entities.Payment.list('-created_date', 100),
          base44.entities.Review.list('-created_date', 100),
        ]);
        setProviders(allProviders);
        setJobs(allJobs);
        setPayments(allPayments);
        setReviews(allReviews);
      } catch (err) {
        toast.error('Failed to load admin data.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const activeProviders = providers.filter(p => p.status === 'active').length;
  const pendingProviders = providers.filter(p => ['pending_review', 'pending_approval', 'background_check_needed', 'more_info_needed'].includes(p.status)).length;
  const totalGMV = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const platformRevenue = payments.reduce((s, p) => s + (p.platform_fee || 0), 0);
  const weekJobs = jobs.filter(j => j.status !== 'cancelled').length;
  const avgJobValue = totalGMV / (payments.length || 1);

  // Build weekly chart from real jobs
  const weeklyData = (() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    return days.map((day, i) => {
      const dayJobs = jobs.filter(j => {
        if (!j.created_date) return false;
        const d = new Date(j.created_date);
        const diff = (now - d) / (1000 * 60 * 60 * 24);
        return d.getDay() === i && diff < 7;
      });
      return { day, jobs: dayJobs.length, gmv: dayJobs.reduce((s, j) => s + (j.quoted_price || 0), 0) };
    });
  })();

  const handleApprove = async (provider) => {
    await base44.entities.ProviderProfile.update(provider.id, { status: 'active' });
    setProviders(prev => prev.map(p => p.id === provider.id ? { ...p, status: 'active' } : p));
    toast.success(`${provider.business_name} approved and activated.`);
  };

  const handleReject = async (provider) => {
    await base44.entities.ProviderProfile.update(provider.id, { status: 'suspended' });
    setProviders(prev => prev.map(p => p.id === provider.id ? { ...p, status: 'suspended' } : p));
    toast.error(`${provider.business_name} has been rejected.`);
  };

  const handleSuspend = async (p) => {
    await base44.entities.ProviderProfile.update(p.id, { status: 'suspended' });
    setProviders(prev => prev.map(x => x.id === p.id ? { ...x, status: 'suspended' } : x));
    toast.success(`${p.business_name} suspended.`);
  };

  const handleRefund = async (payment) => {
    await base44.entities.Payment.update(payment.id, { status: 'refunded' });
    setPayments(prev => prev.map(p => p.id === payment.id ? { ...p, status: 'refunded' } : p));
    toast.success(`Payment refunded for job ${payment.job_id}.`);
  };

  const handleCancelJob = async (job) => {
    await base44.entities.Job.update(job.id, { status: 'cancelled' });
    setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'cancelled' } : j));
    toast.success('Job cancelled.');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card border-b border-border sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <img src="https://media.base44.com/images/public/69e949497e5928c679297ebf/b2338f6dd_logo_transparent.png" alt="Grassgodz" className="h-9 w-9 object-contain" />
          <span className="font-display font-bold text-lg text-foreground">Grassgodz</span>
          <span className="text-xs bg-purple-100 text-purple-700 font-semibold px-2 py-0.5 rounded-full ml-1">Admin</span>
          <div className="ml-auto flex items-center gap-2">
            <Shield size={16} className="text-purple-600" />
            <span className="text-sm font-medium text-foreground">Super Admin</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        {tab === 'dashboard' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-foreground">Platform Overview</h2>
              <p className="text-sm text-muted-foreground">Real-time metrics across the marketplace</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCard title="Active Providers" value={activeProviders} icon={Users} />
              <MetricCard title="Pending Approval" value={pendingProviders} icon={Activity} color="text-amber-600" bgColor="bg-amber-100" />
              <MetricCard title="Total GMV" value={`$${totalGMV.toFixed(0)}`} icon={DollarSign} color="text-blue-600" bgColor="bg-blue-100" />
              <MetricCard title="Platform Revenue" value={`$${platformRevenue.toFixed(0)}`} icon={TrendingUp} color="text-purple-600" bgColor="bg-purple-100" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <MetricCard title="Total Jobs" value={weekJobs} icon={Briefcase} />
              <MetricCard title="Avg Job Value" value={`$${avgJobValue.toFixed(0)}`} icon={Star} color="text-amber-600" bgColor="bg-amber-100" />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="text-sm font-bold text-foreground mb-4">Jobs This Week</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={weeklyData}>
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="jobs" fill="hsl(142,60%,28%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="text-sm font-bold text-foreground mb-4">Daily GMV ($)</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={weeklyData}>
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                    <Tooltip formatter={v => [`$${v}`, 'GMV']} />
                    <Line type="monotone" dataKey="gmv" stroke="hsl(200,70%,45%)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {pendingProviders > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                <h3 className="text-sm font-bold text-amber-800 mb-3">{pendingProviders} Provider{pendingProviders > 1 ? 's' : ''} Awaiting Review</h3>
                {providers.filter(p => ['pending_review', 'pending_approval'].includes(p.status)).map(p => (
                  <ProviderApprovalRow key={p.id} provider={p} onApprove={handleApprove} onReject={handleReject} />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'providers' && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-5">Providers</h2>
            {providers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No providers yet.</p>
            ) : (
              <AdminProvidersTable
                providers={providers}
                onRefresh={async () => {
                  const allProviders = await base44.entities.ProviderProfile.list();
                  setProviders(allProviders);
                }}
              />
            )}
          </div>
        )}

        {tab === 'jobs' && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-5">All Jobs</h2>
            {jobs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No jobs yet.</p>
            ) : (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                {jobs.map((j, i) => (
                  <div key={j.id} className={`flex items-center gap-3 px-5 py-4 ${i < jobs.length - 1 ? 'border-b border-border' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{j.service_name}</p>
                      <p className="text-xs text-muted-foreground">{j.customer_name} → {j.provider_name || 'Unassigned'}</p>
                      <p className="text-xs text-muted-foreground">{j.scheduled_date ? new Date(j.scheduled_date).toLocaleDateString() : '—'} · {j.zip_code}</p>
                    </div>
                    <StatusBadge status={j.status} />
                    {j.quoted_price && <span className="text-sm font-bold text-foreground hidden sm:block">${j.quoted_price}</span>}
                    {!['completed', 'cancelled'].includes(j.status) && (
                      <button onClick={() => handleCancelJob(j)} className="px-2.5 py-1 text-xs font-medium bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors">Cancel</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'payments' && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-5">Payments</h2>
            {payments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No payments yet.</p>
            ) : (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                {payments.map((p, i) => (
                  <div key={p.id} className={`flex items-center gap-3 px-5 py-4 ${i < payments.length - 1 ? 'border-b border-border' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">Job #{p.job_id}</p>
                      <p className="text-xs text-muted-foreground">{new Date(p.created_date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right mr-3 hidden sm:block">
                      <p className="text-xs text-muted-foreground">Platform: <span className="font-semibold text-foreground">${p.platform_fee?.toFixed(2) || '0.00'}</span></p>
                      <p className="text-xs text-muted-foreground">Provider: <span className="font-semibold text-foreground">${p.payout_amount?.toFixed(2) || '0.00'}</span></p>
                    </div>
                    <span className="text-sm font-bold text-foreground">${p.amount?.toFixed(2)}</span>
                    <StatusBadge status={p.status} />
                    {p.status === 'captured' && (
                      <button onClick={() => handleRefund(p)} className="px-2.5 py-1 text-xs font-medium bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">Refund</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'reviews' && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-5">Reviews</h2>
            {reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No reviews yet.</p>
            ) : (
              <div className="space-y-3">
                {reviews.map(r => (
                  <div key={r.id} className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-foreground">{r.customer_name}</p>
                          <span className="text-xs text-muted-foreground">→</span>
                          <p className="text-sm text-muted-foreground">Provider #{r.provider_id}</p>
                        </div>
                        {r.comment && <p className="text-xs text-muted-foreground italic mt-1">"{r.comment}"</p>}
                      </div>
                      <StarRating rating={r.rating} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="bg-card border-t border-border sticky bottom-0 z-30">
        <div className="max-w-5xl mx-auto flex">
          {NAV.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                tab === key ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={18} />
              <span className="hidden sm:block">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}