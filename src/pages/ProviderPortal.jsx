import { useState, useEffect } from 'react';
import { LayoutDashboard, Search, CalendarDays, DollarSign, Star, Leaf, User, TrendingUp, AlertCircle, Bell, Loader2, FileText, Clock, Power, RefreshCw, LogOut } from 'lucide-react';
import AvailableJobCard from '../components/provider/AvailableJobCard';
import ProviderJobCard from '../components/provider/ProviderJobCard';
import BookingRequestCard from '../components/provider/BookingRequestCard';
import ProviderJobMap from '../components/provider/ProviderJobMap';
import ScheduledJobsMap from '../components/provider/ScheduledJobsMap';
import StarRating from '../components/shared/StarRating';
import MetricCard from '../components/shared/MetricCard';
import MyQuotesPanel from '@/components/provider/MyQuotesPanel';

import ReadyToWorkToggle from '@/components/provider/ReadyToWorkToggle';
import AvailableJobsDiscovery from '@/components/provider/AvailableJobsDiscovery';

import { base44 } from '@/api/base44Client';
import ProviderProfileEditor from '@/components/provider/ProviderProfileEditor';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'bookings', label: 'Bookings', icon: Bell },
  { key: 'available', label: 'Available', icon: Search },
  { key: 'myjobs', label: 'My Jobs', icon: CalendarDays },
  { key: 'earnings', label: 'Earnings', icon: DollarSign },
  { key: 'profile', label: 'Profile', icon: User },
];


function BiWeeklyCalendar({ jobs }) {
  const [viewDate, setViewDate] = useState(new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const scheduledDays = new Set(
    jobs.filter(j => j.scheduled_date).map(j => {
      const d = new Date(j.scheduled_date);
      return d.getFullYear() === year && d.getMonth() === month ? d.getDate() : null;
    }).filter(Boolean)
  );
  const jobsByDay = {};
  jobs.forEach(j => {
    if (!j.scheduled_date) return;
    const d = new Date(j.scheduled_date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!jobsByDay[day]) jobsByDay[day] = [];
      jobsByDay[day].push(j);
    }
  });
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const today = new Date();
  const isToday = (d) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground text-lg leading-none">‹</button>
        <p className="text-sm font-bold text-foreground">{viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
        <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground text-lg leading-none">›</button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, idx) => (
          <div key={idx} className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs ${!day ? '' : isToday(day) ? 'bg-primary text-primary-foreground font-bold' : scheduledDays.has(day) ? 'bg-green-100 text-green-800 font-semibold ring-1 ring-green-400' : 'text-foreground'}`}>
            {day && <span>{day}</span>}
            {day && scheduledDays.has(day) && <span className="w-1 h-1 rounded-full bg-green-600 mt-0.5" />}
          </div>
        ))}
      </div>
      <div className="mt-4 border-t border-border pt-3">
        <p className="text-xs font-semibold text-foreground mb-2">Bi-Weekly Jobs This Month</p>
        {Object.keys(jobsByDay).length === 0 ? (
          <p className="text-xs text-muted-foreground">No bi-weekly jobs this month.</p>
        ) : (
          <div className="space-y-1.5">
            {Object.entries(jobsByDay).sort(([a],[b]) => Number(a)-Number(b)).flatMap(([day, dayJobs]) =>
              dayJobs.map(j => (
                <div key={j.id} className="flex items-center gap-2 text-xs">
                  <span className="w-16 flex-shrink-0 font-medium text-foreground">
                    {new Date(year, month, Number(day)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="text-muted-foreground truncate">{j.service_name} — {j.customer_name}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProviderPortal() {
  const [tab, setTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [providerProfile, setProviderProfile] = useState(null);
  const [myJobs, setMyJobs] = useState([]);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [mapJobs, setMapJobs] = useState([]);
  const [bookingRequests, setBookingRequests] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unpaidInvoiceJobIds, setUnpaidInvoiceJobIds] = useState(new Set());
  const [showStripeGuide, setShowStripeGuide] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [jobsDateFilter, setJobsDateFilter] = useState('today');

  useEffect(() => {
    async function loadData() {
      try {
        const me = await base44.auth.me();
        setUser(me);

        // Fetch provider's own jobs + profile, and available jobs in parallel
        const [myJobsRes, availableRes] = await Promise.all([
          base44.functions.invoke('getMyProviderJobs', {}),
          base44.functions.invoke('getAvailableJobs', {}),
        ]);

        const profile = myJobsRes.data?.profile || null;
        const allMyJobs = myJobsRes.data?.jobs || [];
        const unassigned = availableRes.data?.jobs || [];
        const todayMapJobs = availableRes.data?.map_jobs || [];
        setMapJobs(todayMapJobs);

        setProviderProfile(profile);
        setMyJobs(allMyJobs);

        if (!profile) {
          setAvailableJobs(unassigned);
        }

        if (profile) {
          // Check if Stripe onboarding was just completed (e.g. returning from Stripe)
          if (profile.stripe_connect_account_id && !profile.onboarding_complete) {
            try {
              const result = await base44.functions.invoke('checkStripeOnboardingStatus', {
                provider_id: profile.id,
              });
              if (result.data?.onboarding_complete) {
                profile.onboarding_complete = true;
              }
            } catch {}
          }

          const bookings = unassigned.filter(j =>
            j.scheduled_date && Array.isArray(profile.service_zip_codes) &&
            profile.service_zip_codes.includes(j.zip_code)
          );
          const bookingIds = new Set(bookings.map(b => b.id));
          setAvailableJobs(unassigned.filter(j => !bookingIds.has(j.id)));
          setBookingRequests(bookings);

          const myReviews = await base44.entities.Review.filter({ provider_id: profile.id });
          setReviews(myReviews);
        }

        // Load unpaid invoices to warn provider
        try {
          const invoices = await base44.entities.Invoice.filter({ status: 'sent' });
          const jobIds = new Set(invoices.filter(i => i.job_id).map(i => i.job_id));
          setUnpaidInvoiceJobIds(jobIds);
        } catch {}
      } catch (err) {
        toast.error('Failed to load data.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const refreshJobs = async () => {
    if (!user) return;
    setIsRefreshing(true);
    try {
      const [myJobsRes, availableRes] = await Promise.all([
        base44.functions.invoke('getMyProviderJobs', {}),
        base44.functions.invoke('getAvailableJobs', {}),
      ]);
      const allMyJobs = myJobsRes.data?.jobs || [];
      const unassigned = availableRes.data?.jobs || [];
      const refreshedMapJobs = availableRes.data?.map_jobs || [];
      setMapJobs(refreshedMapJobs);
      setMyJobs(allMyJobs);
      if (providerProfile) {
        const newBookings = unassigned.filter(j =>
          j.scheduled_date &&
          Array.isArray(providerProfile?.service_zip_codes) &&
          providerProfile.service_zip_codes.includes(j.zip_code)
        );
        setBookingRequests(newBookings);
        const bookingIds = new Set(newBookings.map(b => b.id));
        setAvailableJobs(unassigned.filter(j => !bookingIds.has(j.id)));
      } else {
        setAvailableJobs(unassigned);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const scheduled = myJobs.filter(j => ['scheduled', 'accepted'].includes(j.status));

  const inProgress = myJobs.filter(j => j.status === 'in_progress');
  const completed = myJobs.filter(j => j.status === 'completed');
  const totalEarnings = completed.reduce((sum, j) => sum + (j.provider_payout || 0), 0);
  const pendingPayout = myJobs.filter(j => ['in_progress', 'scheduled', 'accepted'].includes(j.status)).reduce((sum, j) => sum + (j.provider_payout || 0), 0);

  const now = new Date();
  const thisMonthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });
  const thisMonthCompleted = completed.filter(j => {
    if (!j.completed_at) return false;
    const d = new Date(j.completed_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const thisMonthEarnings = thisMonthCompleted.reduce((sum, j) => sum + (j.provider_payout || 0), 0);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : providerProfile?.avg_rating || '—';

  const setLoading_ = (key, val) => setActionLoading(prev => ({ ...prev, [key]: val }));

  const handleAcceptBooking = async (booking) => {
    setLoading_(`accept_${booking.id}`, true);
    try {
      const res = await base44.functions.invoke('providerAcceptJob', { job_id: booking.id, action: 'accept' });
      if (res.data?.error) { toast.error(res.data.error); return; }
      await refreshJobs();
      toast.success(`Booking accepted! ${booking.service_name} for ${booking.customer_name} is now scheduled.`);
      try {
        const profiles = await base44.entities.CustomerProfile.filter({ user_email: booking.customer_email });
        const phone = profiles?.[0]?.phone;
        if (phone) {
          await base44.functions.invoke('sendSMS', {
            to: phone,
            body: 'Hi ' + (booking.customer_name || 'there') + '! Your ' + (booking.service_name || 'lawn service') + ' with Grassgodz is confirmed by ' + (providerProfile.business_name || 'your provider') + '. See you soon! 🌿',
          });
        }
      } catch {}
    } finally {
      setLoading_(`accept_${booking.id}`, false);
    }
  };

  const handleDeclineBooking = async (booking) => {
    setLoading_(`decline_${booking.id}`, true);
    try {
      const res = await base44.functions.invoke('providerAcceptJob', { job_id: booking.id, action: 'decline' });
      if (res.data?.error) { toast.error(res.data.error); return; }
      await refreshJobs();
      toast.error(`Booking for ${booking.customer_name} declined.`);
    } finally {
      setLoading_(`decline_${booking.id}`, false);
    }
  };

  const handleAcceptCashJob = async (job) => {
    setLoading_(`accept_${job.id}`, true);
    try {
      const res = await base44.functions.invoke('providerAcceptJob', { job_id: job.id, action: 'accept' });
      if (res.data?.error) { toast.error(res.data.error); return; }
      await refreshJobs();
      toast.success(`Cash job accepted! ${job.service_name} for ${job.customer_name} is now scheduled.`);
      setTab('myjobs');
    } finally {
      setLoading_(`accept_${job.id}`, false);
    }
  };

  const handleSubmitQuote = async (job, quoteData) => {
    const quote = await base44.entities.Quote.create({
      job_id: job.id,
      provider_id: providerProfile.id,
      provider_name: providerProfile.business_name || providerProfile.name,
      provider_email: user.email,
      price: quoteData.price,
      message: quoteData.message,
      status: 'pending',
      provider_avg_rating: providerProfile.avg_rating || null,
      provider_total_jobs: providerProfile.total_jobs_completed || 0,
    });
    // Update job status to 'quoted' so the customer sees the provider responded
    await base44.functions.invoke('updateJobToQuoted', {
      job_id: job.id,
      quoted_price: quoteData.price,
      provider_email: user.email,
      provider_id: providerProfile.id,
      provider_name: providerProfile.business_name || providerProfile.name,
    });
    await base44.functions.invoke('notifyCustomerNewQuote', { data: quote }).catch(() => {});
    await refreshJobs();
    toast.success(`Quote of $${quoteData.price} submitted for ${job.service_name}!`);
    setTab('myjobs');
  };

  const handleMarkInProgress = async (job) => {
    setLoading_(`inprogress_${job.id}`, true);
    try {
      await base44.entities.Job.update(job.id, { status: 'in_progress' });
      await refreshJobs();
      toast.success('Job marked as in progress.');
    } finally {
      setLoading_(`inprogress_${job.id}`, false);
    }
  };

  const handleMarkComplete = async (job, photos = {}, skipPhotos = false) => {
    // Save completion photos via backend function (bypasses RLS)
    if (!skipPhotos && Object.keys(photos).length > 0) {
      await base44.functions.invoke('submitJobPhoto', { job_id: job.id, photos });
    }
    // capturePayment handles marking completed, calculating payout, and notifying customer
    const res = await base44.functions.invoke('capturePayment', {
      job_id: job.id,
      skip_photos: skipPhotos,
    });
    if (res.data?.success) {
      const payout = res.data.payout != null ? Number(res.data.payout).toFixed(2) : ((job.quoted_price || 0) * 0.90).toFixed(2);
      await refreshJobs();
      toast.success(`Job completed! $${payout} payout — customer has been notified.`);
    // SMS customer on job completion + payment
    try {
      const profiles = await base44.entities.CustomerProfile.filter({ user_email: job.customer_email });
      const phone = profiles?.[0]?.phone;
      if (phone) {
        await base44.functions.invoke('sendSMS', {
          to: phone,
          body: 'Hi ' + (job.customer_name || 'there') + '! Your ' + (job.service_name || 'lawn service') + ' is complete and payment of $' + payout + ' has been processed. Thanks for choosing Grassgodz! 🌿',
        });
      }
    } catch {}
    } else {
      toast.error(res.data?.error || 'Failed to complete job. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const isProviderActive = providerProfile?.status === 'active';

  const handleStatusChanged = (newStatus) => {
    setProviderProfile(p => p ? { ...p, status: newStatus } : p);
  };

  const displayName = providerProfile?.name || user?.full_name || 'Provider';
  const businessName = providerProfile?.business_name || displayName;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-30 flex-shrink-0">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <img src="https://media.base44.com/images/public/69e949497e5928c679297ebf/b2338f6dd_logo_transparent.png" alt="Grassgodz" className="h-9 w-9 object-contain" />
          <span className="font-display font-bold text-lg text-foreground">Grassgodz</span>
          <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full ml-1">Provider</span>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={async () => { setIsRefreshing(true); await refreshJobs(); setIsRefreshing(false); }} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">{displayName[0]}</span>
            </div>
            <span className="text-sm font-medium text-foreground hidden sm:block">{businessName}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto max-w-3xl mx-auto w-full px-4 py-6">
        {/* Stripe Onboarding Banner — persistent but non-blocking */}
        {providerProfile && !providerProfile?.onboarding_complete && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">Complete your payment setup to receive payouts</p>
              <p className="text-xs text-amber-700 mt-0.5">You can still accept and complete jobs — set up your bank account to get paid when jobs are completed.</p>
              <p className="text-xs text-amber-700 mt-1.5 font-medium">📌 When Stripe asks for a website, enter <strong>grassgodz.com</strong> — this is the platform you operate under.</p>
              <button
                onClick={() => setShowStripeGuide(true)}
                className="mt-2 text-xs font-semibold text-amber-800 underline hover:text-amber-900"
              >
                Set Up Stripe Payouts →
              </button>
            </div>
          </div>
        )}

        {tab === 'dashboard' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-foreground">Dashboard</h2>
              <p className="text-sm text-muted-foreground">Welcome back, {displayName.split(' ')[0]}</p>
            </div>

            {providerProfile && (
              <ReadyToWorkToggle
                providerProfile={providerProfile}
                onStatusChanged={handleStatusChanged}
              />
            )}

            <div className="grid grid-cols-2 gap-3">
              <MetricCard title="Scheduled" value={scheduled.length} icon={CalendarDays} />
              <MetricCard title="In Progress" value={inProgress.length} icon={TrendingUp} color="text-orange-600" bgColor="bg-orange-100" />
              <MetricCard title="Total Completed" value={providerProfile?.total_jobs_completed || completed.length} icon={Star} color="text-amber-600" bgColor="bg-amber-100" />
              <MetricCard title="Avg Rating" value={avgRating} icon={Star} color="text-amber-500" bgColor="bg-amber-50" />
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-bold text-foreground mb-4">Monthly Earnings</h3>
              {(() => {
                const now = new Date();
                const earningsData = Array.from({ length: 6 }, (_, i) => {
                  const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
                  const month = d.toLocaleString('default', { month: 'short' });
                  const monthJobs = completed.filter(j => {
                    if (!j.completed_at) return false;
                    const jd = new Date(j.completed_at);
                    return jd.getMonth() === d.getMonth() && jd.getFullYear() === d.getFullYear();
                  });
                  const earnings = monthJobs.reduce((sum, j) => sum + (j.provider_payout || 0), 0);
                  return { month, earnings };
                });
                const hasEarnings = earningsData.some(d => d.earnings > 0);
                if (!hasEarnings) {
                  return (
                    <div className="flex flex-col items-center justify-center h-[160px] text-center">
                      <p className="text-sm text-muted-foreground">No earnings yet.</p>
                      <p className="text-xs text-muted-foreground mt-1">Complete jobs to start earning.</p>
                    </div>
                  );
                }
                return (
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={earningsData}>
                      <defs>
                        <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(142,60%,28%)" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="hsl(142,60%,28%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                      <Tooltip formatter={(v) => [`$${v}`, 'Earnings']} />
                      <Area type="monotone" dataKey="earnings" stroke="hsl(142,60%,28%)" fill="url(#eg)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                );
              })()}
            </div>

            {bookingRequests.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-foreground">Pending Booking Requests</h3>
                  <button onClick={() => setTab('bookings')} className="text-xs font-semibold text-primary">View all →</button>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                  <Bell size={18} className="text-amber-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-800">{bookingRequests.length} booking request{bookingRequests.length > 1 ? 's' : ''} awaiting your response</p>
                    <p className="text-xs text-amber-700 mt-0.5">Customers have selected specific dates and times for you.</p>
                  </div>
                  <button
                    onClick={() => setTab('bookings')}
                    className="flex-shrink-0 bg-amber-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-amber-800 transition-colors"
                  >
                    Review
                  </button>
                </div>
              </div>
            )}

            {inProgress.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-foreground mb-3">In Progress</h3>
                <div className="space-y-3">
                  {inProgress.map(j => (
                    <ProviderJobCard key={j.id} job={j} onMarkComplete={handleMarkComplete} onJobCancelled={refreshJobs} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'bookings' && (
          <div>
            <div className="mb-5">
              <h2 className="text-xl font-bold text-foreground">Booking Requests</h2>
              <p className="text-sm text-muted-foreground">Customers who have scheduled a specific date and time.</p>
            </div>
            {bookingRequests.length === 0 ? (
              <div className="text-center py-16">
                <Bell className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No pending booking requests</p>
                <p className="text-sm text-muted-foreground mt-1">When customers book you for a specific date, they'll appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookingRequests.map(b => (
                  <BookingRequestCard
                    key={b.id}
                    job={b}
                    onSubmitQuote={handleSubmitQuote}
                    onDecline={handleDeclineBooking}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'available' && (
          <div>
            <div className="mb-5">
              <h2 className="text-xl font-bold text-foreground">Available Jobs</h2>
            </div>
            {!isProviderActive ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <Power className="w-7 h-7 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-foreground font-semibold">You're currently Inactive</p>
                  <p className="text-sm text-muted-foreground mt-1">Go to Dashboard and tap "Ready to Work" to see available jobs.</p>
                </div>
                <button
                  onClick={() => setTab('dashboard')}
                  className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  Go to Dashboard
                </button>
              </div>
            ) : (
              <AvailableJobsDiscovery
                jobs={availableJobs}
                mapJobs={mapJobs}
                providerProfile={providerProfile}
                onSubmitQuote={handleSubmitQuote}
                onAcceptCashJob={handleAcceptCashJob}
                onboardingComplete={providerProfile?.onboarding_complete}
              />
            )}
          </div>
        )}

        {tab === 'quotes' && (
          <div>
            <div className="mb-5">
              <h2 className="text-xl font-bold text-foreground">My Quotes</h2>
              <p className="text-sm text-muted-foreground">Track quotes you've submitted and their status.</p>
            </div>
            <MyQuotesPanel providerProfile={providerProfile} onGoToMyJobs={() => setTab('myjobs')} />
          </div>
        )}

        {tab === 'myjobs' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-foreground">My Jobs</h2>
              <div className="flex items-center bg-muted rounded-lg p-1 gap-1">
                {['today', 'tomorrow'].map(d => (
                  <button
                    key={d}
                    onClick={() => setJobsDateFilter(d)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all capitalize ${jobsDateFilter === d ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
                  >
                    {d === 'today' ? 'Today' : 'Tomorrow'}
                  </button>
                ))}
              </div>
            </div>
            {(() => {
              const todayStr = new Date().toISOString().split('T')[0];
              const tomorrowDate = new Date();
              tomorrowDate.setDate(tomorrowDate.getDate() + 1);
              const tomorrowStr = tomorrowDate.toISOString().split('T')[0];
              const targetDate = jobsDateFilter === 'today' ? todayStr : tomorrowStr;

              const dateInProgress = inProgress.filter(j => j.scheduled_date === todayStr);
              const dateScheduled = scheduled.filter(j => j.scheduled_date === targetDate);
              const dateCompleted = completed.filter(j => j.scheduled_date === targetDate);
              const biweeklyJobs = dateScheduled.filter(j => j.recurrence === 'biweekly');

              return (
                <>
                  {jobsDateFilter === 'today' && dateInProgress.length > 0 && (
                    <div className="mb-5">
                      <h3 className="text-sm font-semibold text-orange-700 mb-3">In Progress</h3>
                      <div className="space-y-3">
                        {dateInProgress.map(j => <ProviderJobCard key={j.id} job={j} onMarkComplete={handleMarkComplete} onJobCancelled={refreshJobs} />)}
                      </div>
                    </div>
                  )}
                  {dateScheduled.length > 0 && (
                    <div className="mb-5">
                      <h3 className="text-sm font-semibold text-foreground mb-3">Scheduled Jobs</h3>
                      <div className="space-y-3">
                        {dateScheduled.map(j => (
                          <div key={j.id}>
                            {unpaidInvoiceJobIds.has(j.id) && (
                              <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-t-xl px-3 py-2 -mb-1">
                                <Clock size={12} className="flex-shrink-0" />
                                Awaiting customer payment before job can begin.
                              </div>
                            )}
                            <ProviderJobCard job={j} onMarkInProgress={unpaidInvoiceJobIds.has(j.id) ? undefined : handleMarkInProgress} onMarkComplete={unpaidInvoiceJobIds.has(j.id) ? undefined : handleMarkComplete} onJobCancelled={refreshJobs} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {biweeklyJobs.length > 0 && (
                    <div className="mb-5">
                      <h3 className="text-sm font-semibold text-foreground mb-3">Bi-Weekly Schedule</h3>
                      <BiWeeklyCalendar jobs={biweeklyJobs} />
                    </div>
                  )}
                  {dateScheduled.length === 0 && dateInProgress.length === 0 && dateCompleted.length === 0 && (
                    <div className="text-center py-16">
                      <CalendarDays className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground font-medium">No jobs {jobsDateFilter === 'today' ? 'today' : 'tomorrow'}</p>
                      <p className="text-sm text-muted-foreground mt-1">Check back or look at available jobs.</p>
                    </div>
                  )}
                  {dateCompleted.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3">Completed</h3>
                      <div className="space-y-3">
                        {dateCompleted.map(j => <ProviderJobCard key={j.id} job={j} onJobCancelled={refreshJobs} />)}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
        
        {tab === 'earnings' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-foreground">Earnings</h2>
              <Link to="/provider/financials" className="text-xs font-semibold text-primary border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/5 transition-colors">
                Full Financial Summary →
              </Link>
            </div>

            {/* Monthly Summary Card */}
            <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-5 mb-5 text-white">
              <p className="text-xs font-semibold text-white/70 uppercase tracking-wide mb-1">{thisMonthName} Summary</p>
              <div className="flex items-end gap-6 mt-2">
                <div>
                  <p className="text-3xl font-bold">${thisMonthEarnings.toFixed(2)}</p>
                  <p className="text-xs text-white/70 mt-0.5">Earned this month</p>
                </div>
                <div className="border-l border-white/20 pl-6">
                  <p className="text-3xl font-bold">{thisMonthCompleted.length}</p>
                  <p className="text-xs text-white/70 mt-0.5">Jobs completed</p>
                </div>
              </div>
              {thisMonthCompleted.length > 0 && (
                <p className="text-xs text-white/60 mt-3">
                  Avg ${(thisMonthEarnings / thisMonthCompleted.length).toFixed(2)} per job this month
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <MetricCard title="Total Earned" value={`$${totalEarnings.toFixed(2)}`} icon={DollarSign} />
              <MetricCard title="Pending Payout" value={`$${pendingPayout.toFixed(2)}`} icon={TrendingUp} color="text-blue-600" bgColor="bg-blue-100" />
            </div>



            <h3 className="text-sm font-semibold text-foreground mb-3">Payment History</h3>
            {completed.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No completed jobs yet.</p>
            ) : (
              <div className="space-y-2">
                {completed.map(j => (
                  <div key={j.id} className="flex items-center justify-between bg-card border border-border rounded-lg px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{j.service_name}</p>
                      <p className="text-xs text-muted-foreground">{j.completed_at ? new Date(j.completed_at).toLocaleDateString() : '—'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">+${j.provider_payout?.toFixed(2) || '—'}</p>

                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'profile' && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-5">Profile</h2>
            <ProviderProfileEditor
              user={user}
              profile={providerProfile}
              avgRating={avgRating}
              reviews={reviews}
              onProfileUpdated={async () => {
                const r = await base44.functions.invoke('getMyProviderProfile', {});
                setProviderProfile(r.data?.profile || null);
              }}
            />
            <div className="mt-6">
              <button
                onClick={() => base44.auth.logout('/') }
                className="w-full flex items-center justify-center gap-2 border border-destructive text-destructive rounded-xl py-3 text-sm font-semibold hover:bg-destructive/5 transition-colors"
              >
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          </div>
        )}
      </main>


      {/* Stripe Onboarding Guidance Modal */}
      {showStripeGuide && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-5 border-b border-border">
              <h2 className="text-base font-bold text-foreground">Before you go to Stripe</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Here's exactly what Stripe will ask — no surprises.</p>
            </div>
            <div className="p-5 space-y-3">
              {[
                { field: 'Business name', answer: providerProfile?.business_name || (providerProfile?.name + ' Lawn Care') || 'Your name + "Lawn Care"', tip: 'Use your personal name or the name you go by — no LLC required.' },
                { field: 'Business phone', answer: providerProfile?.phone || 'Your personal cell number', tip: 'Your personal cell is fine. This is for account recovery only.' },
                { field: 'Business website', answer: 'grassgodz.com', tip: 'Always enter grassgodz.com — this is the platform you operate through.' },
                { field: 'Business type', answer: 'Individual / Sole proprietor', tip: 'Select "Individual" — you do not need an LLC or EIN.' },
                { field: 'SSN (last 4)', answer: 'Your Social Security Number last 4 digits', tip: 'Required by law for identity verification. Stripe keeps this secure.' },
                { field: 'Bank account', answer: 'Your checking account & routing number', tip: 'This is where Grassgodz will send your payouts.' },
              ].map(({ field, answer, tip }) => (
                <div key={field} className="bg-muted/30 rounded-xl p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-bold text-foreground">{field}</p>
                    <p className="text-xs font-semibold text-primary text-right">{answer}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{tip}</p>
                </div>
              ))}
            </div>
            <div className="p-5 pt-0 flex gap-3">
              <button
                onClick={() => setShowStripeGuide(false)}
                className="flex-1 border border-border rounded-xl py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                Go back
              </button>
              <button
                onClick={async () => {
                  setShowStripeGuide(false);
                  try {
                    const res = await base44.functions.invoke('createStripeConnectAccount', {
                      provider_id: providerProfile.id,
                      return_url: window.location.origin + '/provider',
                    });
                    if (res.data?.url) window.location.href = res.data.url;
                  } catch {
                    toast.error('Failed to start Stripe onboarding. Please try again.');
                  }
                }}
                className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-bold hover:bg-primary/90 transition-colors"
              >
                I'm ready — Continue to Stripe →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <nav className="bg-card border-t border-border sticky bottom-0 z-30">
        <div className="max-w-3xl mx-auto flex">
          {NAV.map(({ key, label, icon: NavIcon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                tab === key ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="relative">
                <NavIcon size={18} />
              </div>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}