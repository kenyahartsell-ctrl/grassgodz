import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Users, Briefcase, Shield, TrendingUp, DollarSign, Star, Activity, Loader2, TestTube, Plus, UserCircle, MessageSquare, Mail, Banknote, Receipt, CalendarDays, Copy, LinkIcon, UserPlus, MapPin, Camera, UserCheck, Flag } from 'lucide-react';
import AdminDuplicatesPanel from '@/components/admin/AdminDuplicatesPanel';
import { useRef } from 'react';
import WeatherRescheduleModal from '@/components/shared/WeatherRescheduleModal';
import AdminCalendarPanel from '@/components/admin/AdminCalendarPanel';
import AdminInvoiceBuilder from '@/components/admin/AdminInvoiceBuilder';
import AdminEditJobModal from '@/components/admin/AdminEditJobModal';
import AdminPriceAdjustModal from '@/components/admin/AdminPriceAdjustModal';
import PhotoLightbox from '@/components/shared/PhotoLightbox';
import AdminAddJobModal from '@/components/admin/AdminAddJobModal';
import AdminAddProviderModal from '@/components/admin/AdminAddProviderModal';
import AdminAssignProviderModal from '@/components/admin/AdminAssignProviderModal';
import AdminCustomersTable from '@/components/admin/AdminCustomersTable';
import AdminSupportPanel from '@/components/admin/AdminSupportPanel';
import AdminEmailPanel from '@/components/admin/AdminEmailPanel';
import AdminManualClientsPanel from '@/components/admin/AdminManualClientsPanel';
import AdminPaymentLinksPanel from '@/components/admin/AdminPaymentLinksPanel';
import AdminEditPriceModal from '@/components/admin/AdminEditPriceModal';
import MetricCard from '../components/shared/MetricCard';
import StatusBadge from '../components/shared/StatusBadge';
import ProviderApprovalRow from '../components/admin/ProviderApprovalRow';
import AdminProvidersTable from '../components/admin/AdminProvidersTable';
import StarRating from '../components/shared/StarRating';
import AdminGlobalSearch from '@/components/admin/AdminGlobalSearch';
import AdminJobsDashboard from '@/components/admin/AdminJobsDashboard';
import AdminPayoutsPanel from '@/components/admin/AdminPayoutsPanel';
import AdminInviteModal from '@/components/admin/AdminInviteModal';
import AdminZipLookup from '@/components/admin/AdminZipLookup';
import AdminComplaintsPanel from '@/components/admin/AdminComplaintsPanel';
import AdminCancelJobModal from '@/components/admin/AdminCancelJobModal';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import AdminCashOverridePanel from '@/components/admin/AdminCashOverridePanel';

const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'calendar', label: 'Calendar', icon: CalendarDays },
  { key: 'customers', label: 'Customers', icon: UserCircle },
  { key: 'providers', label: 'Providers', icon: Users },
  { key: 'jobs', label: 'Jobs', icon: Briefcase },
  { key: 'support', label: 'Support', icon: MessageSquare },
  { key: 'email', label: 'Email', icon: Mail },
  { key: 'manual', label: 'Manual', icon: Banknote },
  { key: 'invoices', label: 'Invoices', icon: Receipt },
  { key: 'paymentlinks', label: 'Pay Links', icon: LinkIcon },
  { key: 'payouts', label: 'Payouts', icon: DollarSign },
  { key: 'ziplookup', label: 'Zip Lookup', icon: MapPin },
  { key: 'accounts', label: 'Accounts', icon: UserCheck },
{ key: 'complaints', label: 'Complaints', icon: Flag },
  { key: 'cash', label: 'Cash OK', icon: DollarSign },
];

export default function AdminPortal() {
  const [tab, setTab] = useState('dashboard');
  const [providers, setProviders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [payments, setPayments] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddJob, setShowAddJob] = useState(false);
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [assigningJob, setAssigningJob] = useState(null);
  const [viewingPhotos, setViewingPhotos] = useState(null);
  const [adjustingPayment, setAdjustingPayment] = useState(null); // { payment, job }
  const [editingJob, setEditingJob] = useState(null);
  const [editingPriceJob, setEditingPriceJob] = useState(null);
  const [weatherJob, setWeatherJob] = useState(null);
  const [supportJob, setSupportJob] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [cancellingJob, setCancellingJob] = useState(null);
  const [adminPhotoUrl, setAdminPhotoUrl] = useState('');
  const [adminPhotoUploading, setAdminPhotoUploading] = useState(false);
  const adminPhotoRef = useRef(null);

  const handleAdminPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setAdminPhotoUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ profile_image_url: file_url });
      setAdminPhotoUrl(file_url);
      toast.success('Profile photo updated!');
    } catch {
      toast.error('Failed to upload photo.');
    } finally {
      setAdminPhotoUploading(false);
    }
  };

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
        const me = await base44.auth.me();
        setAdminUser(me);
        setAdminPhotoUrl(me?.profile_image_url || '');
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

  const handleCompleteJob = async (job) => {
    if (!window.confirm(`Mark "${job.service_name}" for ${job.customer_name} as complete? This will also capture payment if authorized.`)) return;
    try {
      await base44.functions.invoke('jobCompletedPaymentFlow', { job_id: job.id });
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'completed' } : j));
      toast.success('Job marked as complete and payment captured.');
    } catch (err) {
      toast.error('Failed to complete job: ' + err.message);
    }
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
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-2">
          <img src="https://media.base44.com/images/public/69e949497e5928c679297ebf/b2338f6dd_logo_transparent.png" alt="Grassgodz" className="h-8 w-8 object-contain flex-shrink-0" />
          <span className="font-display font-bold text-base text-foreground hidden sm:block">Grassgodz</span>
          <span className="text-xs bg-purple-100 text-purple-700 font-semibold px-2 py-0.5 rounded-full hidden sm:block">Admin</span>
          <AdminGlobalSearch
            customers={customers}
            providers={providers}
            jobs={jobs}
            onNavigate={(tab) => setTab(tab)}
          />
          <div className="ml-auto flex items-center gap-2 flex-shrink-0">
            <div className="relative hidden sm:block">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden border-2 border-border cursor-pointer" onClick={() => adminPhotoRef.current?.click()}>
                {adminPhotoUrl ? (
                  <img src={adminPhotoUrl} alt="Admin" className="w-full h-full object-cover" />
                ) : (
                  <Shield size={14} className="text-purple-600" />
                )}
              </div>
              {adminPhotoUploading && <Loader2 size={10} className="absolute -bottom-0.5 -right-0.5 animate-spin text-primary" />}
              {!adminPhotoUploading && (
                <button onClick={() => adminPhotoRef.current?.click()} className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground rounded-full flex items-center justify-center border border-card">
                  <Camera size={8} />
                </button>
              )}
              <input ref={adminPhotoRef} type="file" accept="image/*" className="hidden" onChange={handleAdminPhotoUpload} />
            </div>
            <span className="text-xs font-medium text-foreground hidden sm:block">Super Admin</span>
            <button
              onClick={() => base44.auth.logout()}
              className="px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors whitespace-nowrap"
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
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const emails = providers.map(p => p.user_email).filter(Boolean).join(', ');
                    navigator.clipboard.writeText(emails);
                    toast.success(`Copied ${providers.length} provider email${providers.length !== 1 ? 's' : ''}`);
                  }}
                  className="flex items-center gap-2"
                >
                  <Copy size={14} />
                  Copy Provider Emails
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const emails = customers.map(c => c.user_email).filter(Boolean).join(', ');
                    navigator.clipboard.writeText(emails);
                    toast.success(`Copied ${customers.length} customer email${customers.length !== 1 ? 's' : ''}`);
                  }}
                  className="flex items-center gap-2"
                >
                  <Copy size={14} />
                  Copy Customer Emails
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTestStripe}
                  className="flex items-center gap-2"
                >
                  <TestTube size={14} />
                  Test Stripe
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowInvite(true)}
                  className="flex items-center gap-2"
                >
                  <UserPlus size={14} />
                  Invite User
                </Button>
              </div>
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

        {tab === 'calendar' && (
          <AdminCalendarPanel providers={providers} />
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
          <AdminJobsDashboard
            jobs={jobs}
            setJobs={setJobs}
            handlers={{
              onAddJob: () => setShowAddJob(true),
              onEdit: (j) => setEditingJob(j),
              onEditPrice: (j) => setEditingPriceJob(j),
              onAssign: (j) => setAssigningJob(j),
              onUnassign: async (j) => {
                await base44.entities.Job.update(j.id, { provider_id: null, provider_email: null, provider_name: null, status: 'requested' });
                const allJobs = await base44.entities.Job.list('-created_date', 100);
                setJobs(allJobs);
                toast.success('Provider unassigned.');
              },
              onWeather: (j) => setWeatherJob(j),
              onComplete: handleCompleteJob,
              onCancel: (j) => setCancellingJob(j),
              onDelete: handleDeleteJob,
              onPhotos: (photos) => setViewingPhotos(photos),
              onChat: (j) => { setSupportJob(j); setTab('support'); },
            }}
          />
        )}

        {tab === 'support' && (
          <div>
            <div className="mb-5">
              <h2 className="text-xl font-bold text-foreground">Support Messaging</h2>
              <p className="text-sm text-muted-foreground">View job conversations and send admin support messages to customers or providers.</p>
            </div>
            <AdminSupportPanel jobs={jobs} initialJob={supportJob} onJobConsumed={() => setSupportJob(null)} adminUser={adminUser} />
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

        {tab === 'manual' && (
          <div>
            <AdminManualClientsPanel allJobs={jobs} />
          </div>
        )}

        {tab === 'invoices' && (
          <div>
            <AdminInvoiceBuilder allJobs={jobs} />
          </div>
        )}

        {tab === 'paymentlinks' && (
          <div>
            <AdminPaymentLinksPanel allJobs={jobs} />
          </div>
        )}

        {tab === 'payouts' && (
          <div>
            <AdminPayoutsPanel providers={providers} />
          </div>
        )}

        {tab === 'ziplookup' && (
          <AdminZipLookup providers={providers} />
        )}

        {tab === 'accounts' && (
          <AdminDuplicatesPanel
            customers={customers}
            onRefresh={async () => {
              const allCustomers = await base44.entities.CustomerProfile.list();
              setCustomers(allCustomers);
            }}
          />
        )}

        {tab === 'complaints' && (
<AdminComplaintsPanel providers={providers} />
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

      {editingJob && (
        <AdminEditJobModal
          job={editingJob}
          onClose={() => setEditingJob(null)}
          onSaved={async () => {
            const allJobs = await base44.entities.Job.list('-created_date', 100);
            setJobs(allJobs);
          }}
        />
      )}

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

      {weatherJob && (
        <WeatherRescheduleModal
          job={weatherJob}
          onClose={() => setWeatherJob(null)}
          onRescheduled={async () => {
            const allJobs = await base44.entities.Job.list('-created_date', 100);
            setJobs(allJobs);
          }}
        />
      )}

      {editingPriceJob && (
        <AdminEditPriceModal
          job={editingPriceJob}
          onClose={() => setEditingPriceJob(null)}
          onSaved={(newPrice) => {
            setJobs(prev => prev.map(j => j.id === editingPriceJob.id ? { ...j, quoted_price: newPrice } : j));
          }}
        />
      )}

      {showInvite && (
        <AdminInviteModal onClose={() => setShowInvite(false)} />
      )}

      {cancellingJob && (
        <AdminCancelJobModal
          job={cancellingJob}
          onClose={() => setCancellingJob(null)}
          onCancelled={async () => {
            const allJobs = await base44.entities.Job.list('-created_date', 100);
            setJobs(allJobs);
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
        <div className="max-w-5xl mx-auto flex overflow-x-auto scrollbar-hide">
          {NAV.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-shrink-0 flex flex-col items-center gap-1 py-3 px-3 text-xs font-medium transition-colors ${
                tab === key ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
        {tab === 'cash' && <AdminCashOverridePanel jobs={jobs} providers={providers} customers={customers} onRefresh={loadAll} />}
              <Icon size={18} />
              <span className="whitespace-nowrap">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
