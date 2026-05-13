import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Users, Briefcase, CreditCard, Shield, TrendingUp, DollarSign, Star, Activity, Loader2, TestTube, Plus, UserCircle, MessageSquare, Mail, Trash2, Camera, SlidersHorizontal } from 'lucide-react';
import AdminPriceAdjustModal from '@/components/admin/AdminPriceAdjustModal';
import PhotoLightbox from '@/components/shared/PhotoLightbox';
import AdminAddJobModal from '@/components/admin/AdminAddJobModal';
import AdminAddProviderModal from '@/components/admin/AdminAddProviderModal';
import AdminAssignProviderModal from '@/components/admin/AdminAssignProviderModal';
import AdminCustomersTable from '@/components/admin/AdminCustomersTable';
import AdminSupportPanel from '@/components/admin/AdminSupportPanel';
import AdminEmailPanel from '@/components/admin/AdminEmailPanel';
import MetricCard from '../components/shared/MetricCard';
import StatusBadge from '../components/shared/StatusBadge';
import ProviderApprovalRow from '../components/admin/ProviderApprovalRow';
import AdminProvidersTable from '../components/admin/AdminProvidersTable';
import StarRating from '../components/shared/StarRating';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'customers', label: 'Customers', icon: UserCircle },
  { key: 'providers', label: 'Providers', icon: Users },
  { key: 'jobs', label: 'Jobs', icon: Briefcase },
  { key: 'payments', label: 'Payments', icon: CreditCard },
  { key: 'support', label: 'Support', icon: MessageSquare },
  { key: 'email', label: 'Email', icon: Mail },
];

export default function AdminPortal() {
  const [tab, setTab] = useState('dashboard');
  const [providers, setProviders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [payments, setPayments] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddJob, setShowAddJob] = useState(false);
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [assigningJob, setAssigningJob] = useState(null);
  const [viewingPhotos, setViewingPhotos] = useState(null);
  const [adjustingPayment, setAdjustingPayment] = useState(null); // { payment, job }

  useEffect(() => {
    // Log Stripe public key prefix for verification
    const pubKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (pubKey) {
      console.log('[Stripe] Publishable key detected:', pubKey.substring(0, 8) + '...');
    } else {
      console.warn('[Stripe] VITE_STRIPE_PUBLISHABLE_KEY not found in environment');
    }

    async function loadData() {
      try {
        const [allProviders, allCustomers, allJobs, allQuotes, allPayments, allReviews] = await Promise.all([
          base44.entities.ProviderProfile.list(),
          base44.entities.CustomerProfile.list(),
          base44.entities.Job.list('-created_date', 100),
          base44.entities.Quote.list('-created_date', 200),
          base44.entities.Payment.list('-created_date', 100),
          base44.entities.Review.list('-created_date', 100),
        ]);
        setProviders(allProviders);
        setCustomers(allCustomers);
        setJobs(allJobs);
        setQuotes(allQuotes);
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

  const handleDeleteJob = async (job) => {
    if (!window.confirm(`Permanently delete this job (${job.service_name} for ${job.customer_name})? This cannot be undone.`)) return;
    await base44.entities.Job.delete(job.id);
    setJobs(prev => prev.filter(j => j.id !== job.id));
    toast.success('Job deleted.');
  };

  const handleTestStripe = async () => {
    try {
      const res = await base44.functions.invoke('stripeSmokeTest', {});
      if (res.data.success) {
        if (res.data.livemode) {
          toast.warning('⚠️ Stripe connected but in LIVE mode — switch to test keys');
        } else {
          toast.success('✅ Stripe connected (test mode)');
        }
      } else {
        toast.error(`❌ Stripe connection failed: ${res.data.error}`);
      }
    } catch (err) {
      toast.error(`❌ Stripe connection failed: ${err.message}`);
    }
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
            <span className="text-sm font-medium text-foreground hidden sm:block">Super Admin</span>
            <button
              onClick={() => base44.auth.logout()}
              className="ml-2 px-3 py-1.5 text-xs font-semibold text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        {tab === 'dashboard' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">Platform Overview</h2>
                <p className="text-sm text-muted-foreground">Real-time metrics across the marketplace</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleTestStripe}
                className="flex items-center gap-2"
              >
                <TestTube size={14} />
                Test Stripe
              </Button>
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

        {tab === 'customers' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-foreground">Customers</h2>
                <p className="text-sm text-muted-foreground">{customers.length} registered customer{customers.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            {customers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No customers yet.</p>
            ) : (
              <AdminCustomersTable 
                customers={customers} 
                jobs={jobs} 
                quotes={quotes}
                onCustomerDeleted={async () => {
                  const allCustomers = await base44.entities.CustomerProfile.list();
                  setCustomers(allCustomers);
                }}
              />
            )}
          </div>
        )}

        {tab === 'providers' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-foreground">Providers</h2>
              <Button size="sm" onClick={() => setShowAddProvider(true)} className="flex items-center gap-2">
                <Plus size={14} /> Add Provider
              </Button>
            </div>
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
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-foreground">All Jobs</h2>
              <Button size="sm" onClick={() => setShowAddJob(true)} className="flex items-center gap-2">
                <Plus size={14} /> Add Job
              </Button>
            </div>
            {jobs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No jobs yet.</p>
            ) : (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                {jobs.map((j, i) => (
                  <div key={j.id} className={`px-5 py-4 flex flex-col gap-2 ${i < jobs.length - 1 ? 'border-b border-border' : ''}`}>
                    {/* Service type */}
                    <p className="text-sm font-bold text-foreground">{j.service_name}</p>
                    {/* Customer name */}
                    <p className="text-xs text-muted-foreground">{j.customer_name}</p>
                    {/* Status badge */}
                    <div><StatusBadge status={j.status} /></div>
                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/jobs/${j.id}`}
                        className="px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                      >
                        View
                      </Link>
                      {!['completed', 'cancelled'].includes(j.status) && (
                        <button onClick={() => setAssigningJob(j)} className="px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">Assign</button>
                      )}
                      {!['completed', 'cancelled'].includes(j.status) && (
                        <button onClick={() => handleCancelJob(j)} className="px-2.5 py-1 text-xs font-medium bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors">Cancel</button>
                      )}
                      <button onClick={() => handleDeleteJob(j)} className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-1">
                        <Trash2 size={12} /> Delete
                      </button>
                      {j.status === 'completed' && j.completion_photos && Object.keys(j.completion_photos).length > 0 && (
                        <button
                          onClick={() => setViewingPhotos(j.completion_photos)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <Camera size={12} /> Photos
                        </button>
                      )}
                    </div>
                    {/* Provider, date, zip */}
                    <p className="text-xs text-muted-foreground">
                      {j.provider_name || 'Unassigned'} · {j.scheduled_date ? new Date(j.scheduled_date).toLocaleDateString() : '—'} · {j.zip_code || '—'}
                    </p>
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
                      <Link to={`/jobs/${p.job_id}`} className="text-sm font-semibold text-primary hover:underline">View Job →</Link>
                      <p className="text-xs text-muted-foreground">{new Date(p.created_date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right mr-3 hidden sm:block">
                      <p className="text-xs text-muted-foreground">Platform: <span className="font-semibold text-foreground">${p.platform_fee?.toFixed(2) || '0.00'}</span></p>
                      <p className="text-xs text-muted-foreground">Provider: <span className="font-semibold text-foreground">${p.payout_amount?.toFixed(2) || '0.00'}</span></p>
                    </div>
                    <span className="text-sm font-bold text-foreground">${p.amount?.toFixed(2)}</span>
                    <StatusBadge status={p.status} />
                    <button
                      onClick={async () => {
                        let matchedJob = jobs.find(j => j.id === p.job_id) || null;
                        if (!matchedJob && p.job_id) {
                          try {
                            const fetched = await base44.entities.Job.list();
                            matchedJob = fetched.find(j => j.id === p.job_id) || null;
                          } catch {}
                        }
                        setAdjustingPayment({ payment: p, job: matchedJob });
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors"
                      title="Adjust final price"
                    >
                      <SlidersHorizontal size={11} /> Adjust
                    </button>
                    {p.status === 'captured' && (
                      <button onClick={() => handleRefund(p)} className="px-2.5 py-1 text-xs font-medium bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">Refund</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'support' && (
          <div>
            <div className="mb-5">
              <h2 className="text-xl font-bold text-foreground">Support Messaging</h2>
              <p className="text-sm text-muted-foreground">View job conversations and send admin support messages to customers or providers.</p>
            </div>
            <AdminSupportPanel jobs={jobs} />
          </div>
        )}

        {tab === 'email' && (
          <div>
            <div className="mb-5">
              <h2 className="text-xl font-bold text-foreground">Send Email</h2>
              <p className="text-sm text-muted-foreground">Send emails to customers or providers directly from here.</p>
            </div>
            <AdminEmailPanel />
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

      {assigningJob && (
        <AdminAssignProviderModal
          job={assigningJob}
          onClose={() => setAssigningJob(null)}
          onAssigned={async () => {
            const allJobs = await base44.entities.Job.list('-created_date', 100);
            setJobs(allJobs);
          }}
        />
      )}

      {showAddProvider && (
        <AdminAddProviderModal
          onClose={() => setShowAddProvider(false)}
          onAdded={async () => {
            const allProviders = await base44.entities.ProviderProfile.list();
            setProviders(allProviders);
          }}
        />
      )}

      {viewingPhotos && (
        <PhotoLightbox photos={viewingPhotos} onClose={() => setViewingPhotos(null)} />
      )}

      {adjustingPayment && (
        <AdminPriceAdjustModal
          payment={adjustingPayment.payment}
          job={adjustingPayment.job}
          onClose={() => setAdjustingPayment(null)}
          onSaved={({ price, platform_fee, provider_payout }) => {
            setPayments(prev => prev.map(p =>
              p.id === adjustingPayment.payment.id
                ? { ...p, amount: price, platform_fee, payout_amount: provider_payout }
                : p
            ));
            setJobs(prev => prev.map(j =>
              j.id === adjustingPayment.payment.job_id
                ? { ...j, final_price: price, quoted_price: price, platform_fee, provider_payout }
                : j
            ));
          }}
        />
      )}

      {showAddJob && (
        <AdminAddJobModal
          onClose={() => setShowAddJob(false)}
          onJobAdded={async () => {
            const allJobs = await base44.entities.Job.list('-created_date', 100);
            setJobs(allJobs);
          }}
        />
      )}

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