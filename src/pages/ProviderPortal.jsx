import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Briefcase, User, DollarSign } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import BottomTabBar from '@/components/shared/BottomTabBar';
import PullToRefresh from '@/components/shared/PullToRefresh';
import ProviderJobCard from '@/components/provider/ProviderJobCard';
import AvailableJobCard from '@/components/provider/AvailableJobCard';
import BookingRequestCard from '@/components/provider/BookingRequestCard';
import ProviderProfileEditor from '@/components/provider/ProviderProfileEditor';
import MetricCard from '@/components/shared/MetricCard';
import { Link } from 'react-router-dom';

const LOGO_URL = 'https://media.base44.com/images/public/69e949497e5928c679297ebf/b2338f6dd_logo_transparent.png';

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/provider/dashboard' },
  { key: 'jobs', label: 'My Jobs', icon: Briefcase, path: '/provider/jobs' },
  { key: 'profile', label: 'Profile', icon: User, path: '/provider/profile' },
];

function ProviderDashboard({ user, profile, myJobs, availableJobs, reviews, onAcceptJob, onMarkInProgress, onMarkComplete, onRefresh }) {
  const pendingBookings = myJobs.filter(j => j.status === 'requested' && j.provider_email === user?.email);
  const scheduledJobs = myJobs.filter(j => ['accepted', 'scheduled', 'in_progress'].includes(j.status));
  const completedJobs = myJobs.filter(j => j.status === 'completed');
  const totalEarnings = completedJobs.reduce((s, j) => s + (j.provider_payout || 0), 0);
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <PullToRefresh onRefresh={onRefresh}>
      <div className="px-4 py-5 space-y-5">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Welcome back, {profile?.name?.split(' ')[0] || user?.full_name?.split(' ')[0] || 'Pro'} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{profile?.business_name || 'Your Dashboard'}</p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <MetricCard title="Total Earned" value={`$${totalEarnings.toFixed(0)}`} icon={DollarSign} color="text-green-600" bgColor="bg-green-100" />
          <MetricCard title="Jobs Done" value={completedJobs.length} icon={Briefcase} />
        </div>

        {/* Booking requests */}
        {pendingBookings.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-foreground mb-2">Booking Requests ({pendingBookings.length})</h2>
            <div className="space-y-3">
              {pendingBookings.map(j => (
                <BookingRequestCard key={j.id} job={j}
                  onAccept={onAcceptJob}
                  onDecline={async (job) => {
                    await base44.entities.Job.update(job.id, { provider_id: null, provider_email: null, provider_name: null, status: 'requested' });
                    toast.success('Booking declined.');
                    onRefresh();
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming jobs */}
        {scheduledJobs.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-foreground mb-2">Upcoming Jobs ({scheduledJobs.length})</h2>
            <div className="space-y-3">
              {scheduledJobs.map(j => (
                <ProviderJobCard key={j.id} job={j} onMarkInProgress={onMarkInProgress} onMarkComplete={onMarkComplete} />
              ))}
            </div>
          </div>
        )}

        {/* Available jobs in area */}
        {availableJobs.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-foreground mb-2">Available in Your Area ({availableJobs.length})</h2>
            <div className="space-y-3">
              {availableJobs.slice(0, 5).map(j => (
                <AvailableJobCard key={j.id} job={j} onSubmitQuote={onAcceptJob} onboardingComplete={profile?.onboarding_complete} />
              ))}
            </div>
          </div>
        )}

        {pendingBookings.length === 0 && scheduledJobs.length === 0 && availableJobs.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No jobs right now</p>
            <p className="text-xs text-muted-foreground mt-1">New jobs matching your ZIP codes will appear here.</p>
          </div>
        )}
      </div>
    </PullToRefresh>
  );
}

function ProviderJobs({ myJobs, onMarkInProgress, onMarkComplete, onRefresh }) {
  const active = myJobs.filter(j => !['completed', 'cancelled'].includes(j.status));
  const past = myJobs.filter(j => ['completed', 'cancelled'].includes(j.status));

  return (
    <PullToRefresh onRefresh={onRefresh}>
      <div className="px-4 py-5 space-y-5">
        <h2 className="text-lg font-bold text-foreground">My Jobs</h2>
        {active.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Active</h3>
            <div className="space-y-3">
              {active.map(j => (
                <ProviderJobCard key={j.id} job={j} onMarkInProgress={onMarkInProgress} onMarkComplete={onMarkComplete} />
              ))}
            </div>
          </div>
        )}
        {past.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">History</h3>
            <div className="space-y-3">
              {past.map(j => (
                <ProviderJobCard key={j.id} job={j} />
              ))}
            </div>
          </div>
        )}
        {myJobs.length === 0 && (
          <div className="text-center py-16">
            <Briefcase className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No jobs yet</p>
          </div>
        )}
      </div>
    </PullToRefresh>
  );
}

function ProviderProfile({ user, profile, reviews, onRefresh }) {
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <PullToRefresh onRefresh={onRefresh}>
      <div className="px-4 py-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Profile</h2>
          <Link to="/provider/financials" className="text-xs font-semibold text-primary border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/5 transition-colors flex items-center gap-1.5">
            <DollarSign size={12} /> Financials
          </Link>
        </div>
        <ProviderProfileEditor
          user={user}
          profile={profile}
          avgRating={avgRating}
          reviews={reviews}
          onProfileUpdated={onRefresh}
        />
      </div>
    </PullToRefresh>
  );
}

export default function ProviderPortal() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [myJobs, setMyJobs] = useState([]);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const me = await base44.auth.me();
      setUser(me);
      const profileRes = await base44.functions.invoke('getMyProviderProfile', {});
      const pProfile = profileRes.data?.profile || null;
      setProfile(pProfile);

      const [myJobsData, reviewsData] = await Promise.all([
        base44.entities.Job.filter({ provider_email: me.email }),
        pProfile?.id ? base44.entities.Review.filter({ provider_id: pProfile.id }) : Promise.resolve([]),
      ]);
      setMyJobs(myJobsData.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
      setReviews(reviewsData);

      // Load available jobs matching provider's ZIP codes
      if (pProfile?.service_zip_codes?.length > 0) {
        const availRes = await base44.functions.invoke('getAvailableJobs', {});
        const available = (availRes.data?.jobs || []).filter(j =>
          pProfile.service_zip_codes.includes(j.zip_code)
        );
        setAvailableJobs(available);
      }
    } catch {
      toast.error('Failed to load your data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    if (window.location.pathname === '/provider' || window.location.pathname === '/provider/') {
      navigate('/provider/dashboard', { replace: true });
    }
  }, [loadData, navigate]);

  const handleAcceptJob = async (job) => {
    if (!user || !profile) return;
    try {
      await base44.entities.Job.update(job.id, {
        provider_id: profile.id,
        provider_email: user.email,
        provider_name: profile.name || user.full_name,
        status: 'accepted',
      });
      toast.success('Job accepted!');
      loadData();
    } catch {
      toast.error('Failed to accept job.');
    }
  };

  const handleSubmitQuote = async (job, quoteData) => {
    if (!user || !profile) return;
    try {
      await base44.entities.Quote.create({
        job_id: job.id,
        provider_id: profile.id,
        provider_name: profile.name || user.full_name,
        provider_email: user.email,
        price: quoteData.price,
        message: quoteData.message,
        status: 'pending',
      });
      await base44.entities.Job.update(job.id, { status: 'quoted' });
      toast.success('Quote submitted!');
      loadData();
    } catch {
      toast.error('Failed to submit quote.');
    }
  };

  const handleMarkInProgress = async (job) => {
    await base44.entities.Job.update(job.id, { status: 'in_progress' });
    toast.success('Job marked as in progress.');
    loadData();
  };

  const handleMarkComplete = async (job, photos) => {
    await base44.entities.Job.update(job.id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      completion_photos: photos || {},
    });
    toast.success('Job marked as complete!');
    loadData();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const pendingBookings = myJobs.filter(j => j.status === 'requested' && j.provider_email === user?.email).length;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border flex-shrink-0 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="Grassgodz" className="h-8 w-8 object-contain" />
            <span className="font-display font-bold text-base text-foreground">Grassgodz</span>
            <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full ml-1">Pro</span>
          </div>
          {profile && (
            <div className="flex items-center gap-2">
              {profile.profile_image_url ? (
                <img src={profile.profile_image_url} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-border" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">{(profile.name || user?.full_name || '?')[0]}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Routes>
          <Route path="dashboard" element={
            <ProviderDashboard
              user={user} profile={profile} myJobs={myJobs}
              availableJobs={availableJobs} reviews={reviews}
              onAcceptJob={handleSubmitQuote}
              onMarkInProgress={handleMarkInProgress}
              onMarkComplete={handleMarkComplete}
              onRefresh={loadData}
            />
          } />
          <Route path="jobs" element={
            <ProviderJobs myJobs={myJobs} onMarkInProgress={handleMarkInProgress} onMarkComplete={handleMarkComplete} onRefresh={loadData} />
          } />
          <Route path="profile" element={
            <ProviderProfile user={user} profile={profile} reviews={reviews} onRefresh={loadData} />
          } />
          <Route index element={
            <ProviderDashboard
              user={user} profile={profile} myJobs={myJobs}
              availableJobs={availableJobs} reviews={reviews}
              onAcceptJob={handleSubmitQuote}
              onMarkInProgress={handleMarkInProgress}
              onMarkComplete={handleMarkComplete}
              onRefresh={loadData}
            />
          } />
        </Routes>
      </div>

      <BottomTabBar tabs={TABS} badge={{ dashboard: pendingBookings }} />
    </div>
  );
}