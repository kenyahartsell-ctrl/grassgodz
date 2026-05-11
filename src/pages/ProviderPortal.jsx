import { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Home, Briefcase, MapPin, User, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import BottomTabBar from '@/components/shared/BottomTabBar';
import PullToRefresh from '@/components/shared/PullToRefresh';
import ProviderProfileEditor from '@/components/provider/ProviderProfileEditor';
import ProviderJobCard from '@/components/provider/ProviderJobCard';
import AvailableJobCard from '@/components/provider/AvailableJobCard';
import BookingRequestCard from '@/components/provider/BookingRequestCard';
import ProviderJobMap from '@/components/provider/ProviderJobMap';

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: Home, path: '/provider' },
  { key: 'jobs', label: 'My Jobs', icon: Briefcase, path: '/provider/jobs' },
  { key: 'map', label: 'Map', icon: MapPin, path: '/provider/map' },
  { key: 'profile', label: 'Profile', icon: User, path: '/provider/profile' },
];

function ProviderDashboard({ user, profile, jobs, availableJobs, onRefresh, onAcceptJob, onMarkInProgress, onMarkComplete, onSubmitQuote }) {
  const bookingRequests = jobs.filter(j => j.status === 'requested' && j.provider_email === user?.email);
  const activeJobs = jobs.filter(j => ['accepted', 'scheduled', 'in_progress'].includes(j.status));
  const completedJobs = jobs.filter(j => j.status === 'completed');

  return (
    <PullToRefresh onRefresh={onRefresh} className="px-4 py-5 space-y-5">
      {/* Welcome */}
      <div>
        <h1 className="text-xl font-bold text-foreground">
          Hello, {profile?.name || user?.full_name || 'Pro'} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {completedJobs.length} completed · {activeJobs.length} active
        </p>
      </div>

      {/* Booking Requests */}
      {bookingRequests.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-foreground mb-3">Booking Requests ({bookingRequests.length})</h2>
          <div className="space-y-3">
            {bookingRequests.map(job => (
              <BookingRequestCard key={job.id} job={job} onAccept={onAcceptJob} onDecline={() => {}} />
            ))}
          </div>
        </div>
      )}

      {/* Active Jobs */}
      {activeJobs.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-foreground mb-3">Active Jobs ({activeJobs.length})</h2>
          <div className="space-y-3">
            {activeJobs.map(job => (
              <ProviderJobCard key={job.id} job={job} onMarkInProgress={onMarkInProgress} onMarkComplete={onMarkComplete} />
            ))}
          </div>
        </div>
      )}

      {/* Available Jobs */}
      {availableJobs.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-foreground mb-3">Available Jobs ({availableJobs.length})</h2>
          <div className="space-y-3">
            {availableJobs.map(job => (
              <AvailableJobCard
                key={job.id}
                job={job}
                onSubmitQuote={onSubmitQuote}
                onboardingComplete={profile?.onboarding_complete}
              />
            ))}
          </div>
        </div>
      )}

      {bookingRequests.length === 0 && activeJobs.length === 0 && availableJobs.length === 0 && (
        <div className="text-center py-10">
          <p className="text-muted-foreground text-sm">No active or available jobs right now.</p>
        </div>
      )}
    </PullToRefresh>
  );
}

function ProviderJobs({ jobs, onRefresh, onMarkInProgress, onMarkComplete }) {
  return (
    <PullToRefresh onRefresh={onRefresh} className="px-4 py-5 space-y-4">
      <h2 className="text-lg font-bold text-foreground">My Jobs</h2>
      {jobs.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground text-sm">No jobs yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => (
            <ProviderJobCard key={job.id} job={job} onMarkInProgress={onMarkInProgress} onMarkComplete={onMarkComplete} />
          ))}
        </div>
      )}
    </PullToRefresh>
  );
}

export default function ProviderPortal() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const loadData = async () => {
    try {
      const me = await base44.auth.me();
      setUser(me);

      const [profileRes, allJobs, availRes, allReviews] = await Promise.all([
        base44.functions.invoke('getMyProviderProfile', {}),
        base44.entities.Job.filter({ provider_email: me.email }, '-created_date', 50),
        base44.functions.invoke('getAvailableJobs', {}),
        base44.entities.Review.list('-created_date', 50),
      ]);

      const p = profileRes.data?.profile || null;
      setProfile(p);
      setJobs(allJobs);
      setAvailableJobs(availRes.data?.jobs || []);
      setReviews(allReviews.filter(r => r.provider_id === p?.id));
    } catch {
      toast.error('Failed to load your data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAcceptJob = async (job) => {
    await base44.entities.Job.update(job.id, {
      status: 'accepted',
      provider_email: user.email,
      provider_name: profile?.name || user.full_name,
      provider_id: profile?.id,
    });
    toast.success('Job accepted!');
    loadData();
  };

  const handleMarkInProgress = async (job) => {
    await base44.entities.Job.update(job.id, { status: 'in_progress' });
    toast.success('Job marked in progress.');
    loadData();
  };

  const handleMarkComplete = async (job, photos) => {
    await base44.entities.Job.update(job.id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      completion_photos: photos || {},
    });
    toast.success('Job marked complete!');
    loadData();
  };

  const handleSubmitQuote = async (job, { price, message }) => {
    await base44.entities.Quote.create({
      job_id: job.id,
      provider_id: profile?.id,
      provider_name: profile?.name || user.full_name,
      provider_email: user.email,
      price,
      message,
    });
    toast.success('Quote submitted!');
    loadData();
  };

  const activeTab = location.pathname.startsWith('/provider/jobs') ? 'jobs'
    : location.pathname.startsWith('/provider/map') ? 'map'
    : location.pathname.startsWith('/provider/profile') ? 'profile'
    : 'dashboard';

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      {/* Header */}
      <header className="bg-card border-b border-border flex-shrink-0 px-4 py-3 flex items-center gap-3">
        <img src="https://media.base44.com/images/public/69e949497e5928c679297ebf/b2338f6dd_logo_transparent.png" alt="Grassgodz" className="h-8 w-8 object-contain" />
        <span className="font-display font-bold text-lg text-foreground">Grassgodz</span>
        <span className="text-xs bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full ml-1">Pro</span>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={
            <ProviderDashboard
              user={user}
              profile={profile}
              jobs={jobs}
              availableJobs={availableJobs}
              onRefresh={loadData}
              onAcceptJob={handleAcceptJob}
              onMarkInProgress={handleMarkInProgress}
              onMarkComplete={handleMarkComplete}
              onSubmitQuote={handleSubmitQuote}
            />
          } />
          <Route path="/jobs" element={
            <ProviderJobs
              jobs={jobs}
              onRefresh={loadData}
              onMarkInProgress={handleMarkInProgress}
              onMarkComplete={handleMarkComplete}
            />
          } />
          <Route path="/map" element={
            <div className="h-full">
              <ProviderJobMap jobs={availableJobs} onAcceptJob={handleAcceptJob} providerProfile={profile} />
            </div>
          } />
          <Route path="/profile" element={
            <PullToRefresh onRefresh={loadData} className="px-4 py-5">
              <ProviderProfileEditor
                user={user}
                profile={profile}
                avgRating={avgRating}
                reviews={reviews}
                onProfileUpdated={loadData}
              />
            </PullToRefresh>
          } />
        </Routes>
      </div>

      <BottomTabBar tabs={TABS} activeTab={activeTab} />
    </div>
  );
}