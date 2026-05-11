import { useState, useEffect } from 'react';
import { LayoutDashboard, Search, CalendarDays, DollarSign, Star, Leaf, User, TrendingUp, AlertCircle, Bell, Loader2 } from 'lucide-react';
import AvailableJobCard from '../components/provider/AvailableJobCard';
import ProviderJobCard from '../components/provider/ProviderJobCard';
import BookingRequestCard from '../components/provider/BookingRequestCard';
import ProviderJobMap from '../components/provider/ProviderJobMap';
import StarRating from '../components/shared/StarRating';
import MetricCard from '../components/shared/MetricCard';

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

export default function ProviderPortal() {
  const [tab, setTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [providerProfile, setProviderProfile] = useState(null);
  const [myJobs, setMyJobs] = useState([]);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [bookingRequests, setBookingRequests] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

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

        setProviderProfile(profile);
        setAvailableJobs(unassigned);
        setMyJobs(allMyJobs);

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
          setBookingRequests(bookings);

          const myReviews = await base44.entities.Review.filter({ provider_id: profile.id });
          setReviews(myReviews);
        }
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
    const [myJobsRes, availableRes] = await Promise.all([
      base44.functions.invoke('getMyProviderJobs', {}),
      base44.functions.invoke('getAvailableJobs', {}),
    ]);
    const allMyJobs = myJobsRes.data?.jobs || [];
    const unassigned = availableRes.data?.jobs || [];
    setMyJobs(allMyJobs);
    setAvailableJobs(unassigned);
    if (providerProfile) {
      setBookingRequests(unassigned.filter(j =>
        j.scheduled_date &&
        Array.isArray(providerProfile?.service_zip_codes) &&
        providerProfile.service_zip_codes.includes(j.zip_code)
      ));
    }
  };

  const scheduled = myJobs.filter(j => ['scheduled', 'accepted'].includes(j.status));

  const inProgress = myJobs.filter(j => j.status === 'in_progress');
  const completed = myJobs.filter(j => j.status === 'completed');
  const totalEarnings = completed.reduce((sum, j) => sum + (j.provider_payout || 0), 0);

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

  const handleAcceptBooking = async (booking) => {
    await base44.entities.Job.update(booking.id, {
      provider_id: providerProfile.id,
      provider_name: providerProfile.business_name,
      provider_email: user.email,
      status: 'scheduled',
      quoted_price: booking.base_price,
    });
    await refreshJobs();
    toast.success(`Booking accepted! ${booking.service_name} for ${booking.customer_name} is now scheduled.`);
  };

  const handleDeclineBooking = async (booking) => {
    await base44.entities.Job.update(booking.id, { status: 'cancelled' });
    await refreshJobs();
    toast.error(`Booking for ${booking.customer_name} declined.`);
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
  };

  const handleMarkInProgress = async (job) => {
    await base44.entities.Job.update(job.id, { status: 'in_progress' });
    await refreshJobs();
    toast.success('Job marked as in progress.');
  };

  const handleMarkComplete = async (job, photos = {}, skipPhotos = false) => {
    // Save photos and mark job completed
    if (!skipPhotos) {
      await base44.entities.Job.update(job.id, { completion_photos: photos });
    }
    await base44.entities.Job.update(job.id, { status: 'completed', completed_at: new Date().toISOString() });
    // Attempt payment capture — if Stripe not set up, job is still marked complete
    try {
      const res = await base44.functions.invoke('capturePayment', { job_id: job.id, skip_photos: skipPhotos });
      if (res.data?.success) {
        const payout = res.data.payout?.toFixed(2) || ((job.quoted_price || 0) * 0.75).toFixed(2);
        await base44.functions.invoke('notifyCustomerJobComplete', { data: { job_id: job.id } }).catch(() => {});
        await refreshJobs();
        toast.success(`Job completed! $${payout} will be transferred to your account.`);
        return;
      }
    } catch { /* Stripe not configured — continue */ }
    await refreshJobs();
    const expectedPayout = ((job.quoted_price || 0) * 0.75).toFixed(2);
    toast.success(`Job completed! $${expectedPayout} payout pending once payment setup is complete.`);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

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
              <button
                onClick={async () => {
                  try {
                    const res = await base44.functions.invoke('createStripeConnectAccount', {
                      provider_id: providerProfile.id,
                      return_url: window.location.origin + '/provider',
                    });
                    if (res.data?.url) {
                      window.location.href = res.data.url;
                    }
                  } catch {
                    toast.error('Failed to start Stripe onboarding. Please try again.');
                  }
                }}
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
                    <ProviderJobCard key={j.id} job={j} onMarkComplete={handleMarkComplete} />
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
                    onAccept={handleAcceptBooking}
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
              <p className="text-sm text-muted-foreground">{availableJobs.length} job{availableJobs.length !== 1 ? 's' : ''} available near you</p>
            </div>
            {availableJobs.length === 0 ? (
              <div className="text-center py-16">
                <Search className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No available jobs right now</p>
                <p className="text-sm text-muted-foreground mt-1">Check back soon — new jobs are posted daily.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableJobs.map(job => (
                  <AvailableJobCard key={job.id} job={job} onSubmitQuote={handleSubmitQuote} onboardingComplete={providerProfile?.onboarding_complete} />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'myjobs' && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-5">My Jobs</h2>
            {inProgress.length > 0 && (
              <div className="mb-5">
                <h3 className="text-sm font-semibold text-orange-700 mb-3">In Progress</h3>
                <div className="space-y-3">
                  {inProgress.map(j => <ProviderJobCard key={j.id} job={j} onMarkComplete={handleMarkComplete} />)}
                </div>
              </div>
            )}
            {scheduled.length > 0 && (
              <div className="mb-5">
                <h3 className="text-sm font-semibold text-foreground mb-3">Scheduled</h3>
                <div className="space-y-3">
                  {scheduled.map(j => <ProviderJobCard key={j.id} job={j} onMarkInProgress={handleMarkInProgress} />)}
                </div>
              </div>
            )}
            {completed.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Completed</h3>
                <div className="space-y-3">
                  {completed.map(j => <ProviderJobCard key={j.id} job={j} />)}
                </div>
              </div>
            )}
            {myJobs.length === 0 && (
              <div className="text-center py-16">
                <CalendarDays className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No jobs yet</p>
                <p className="text-sm text-muted-foreground mt-1">Accept bookings or submit quotes to get started.</p>
              </div>
            )}
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
              <MetricCard title="Pending Payout" value="$0.00" icon={TrendingUp} color="text-blue-600" bgColor="bg-blue-100" />
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
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="bg-card border-t border-border sticky bottom-0 z-30">
        <div className="max-w-3xl mx-auto flex">
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