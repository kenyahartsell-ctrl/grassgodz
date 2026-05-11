import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { Home, Briefcase, User, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import BottomTabBar from '@/components/shared/BottomTabBar';
import PullToRefresh from '@/components/shared/PullToRefresh';
import ServiceCard from '@/components/customer/ServiceCard';
import JobCard from '@/components/customer/JobCard';
import QuotesModal from '@/components/customer/QuotesModal';
import RequestJobModal from '@/components/customer/RequestJobModal';
import ReviewModal from '@/components/customer/ReviewModal';
import ProfileCompletionChecklist from '@/components/customer/ProfileCompletionChecklist';
import CustomerProfileEditor from '@/components/customer/CustomerProfileEditor';

const LOGO_URL = 'https://media.base44.com/images/public/69e949497e5928c679297ebf/b2338f6dd_logo_transparent.png';

const TABS = [
  { key: 'home', label: 'Home', icon: Home, path: '/customer/home' },
  { key: 'jobs', label: 'My Jobs', icon: Briefcase, path: '/customer/jobs' },
  { key: 'profile', label: 'Profile', icon: User, path: '/customer/profile' },
];

function CustomerHome({ user, profile, services, jobs, reviews, onRequestService, onRefresh }) {
  const [selectedJob, setSelectedJob] = useState(null);
  const [reviewingJob, setReviewingJob] = useState(null);

  const activeJobs = jobs.filter(j => !['completed', 'cancelled'].includes(j.status));
  const reviewedIds = new Set(reviews.map(r => r.job_id));

  const handleAcceptQuote = async (quote) => {
    await base44.entities.Job.update(selectedJob.id, {
      provider_id: quote.provider_id,
      provider_email: quote.provider_email,
      provider_name: quote.provider_name,
      quoted_price: quote.price,
      status: 'accepted',
    });
    await base44.entities.Quote.update(quote.id, { status: 'accepted' });
    setSelectedJob(null);
    toast.success('Quote accepted! Your provider will be in touch.');
    onRefresh();
  };

  const handleReview = async (data) => {
    await base44.entities.Review.create({
      ...data,
      customer_id: user.id,
      customer_name: profile?.name || user.full_name,
    });
    toast.success('Review submitted!');
    onRefresh();
  };

  return (
    <PullToRefresh onRefresh={onRefresh}>
      <div className="px-4 py-5 space-y-5">
        {/* Greeting */}
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Hello, {profile?.name || user?.full_name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">What can we help with today?</p>
        </div>

        <ProfileCompletionChecklist profile={profile} onGoToProfile={() => {}} />

        {/* Active jobs summary */}
        {activeJobs.length > 0 && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <p className="text-sm font-semibold text-primary mb-2">Active Jobs ({activeJobs.length})</p>
            <div className="space-y-2">
              {activeJobs.slice(0, 2).map(j => (
                <JobCard key={j.id} job={j} onViewQuotes={setSelectedJob} reviewed={reviewedIds.has(j.id)} onReview={setReviewingJob} />
              ))}
            </div>
          </div>
        )}

        {/* Services */}
        <div>
          <h2 className="text-base font-bold text-foreground mb-3">Request a Service</h2>
          <div className="grid grid-cols-2 gap-3">
            {services.map(s => (
              <ServiceCard key={s.id} service={s} onSelect={onRequestService} />
            ))}
          </div>
        </div>

        {selectedJob && (
          <QuotesModal job={selectedJob} onClose={() => setSelectedJob(null)} onAcceptQuote={handleAcceptQuote} customerProfile={profile} />
        )}
        {reviewingJob && (
          <ReviewModal job={reviewingJob} onClose={() => setReviewingJob(null)} onSubmit={handleReview} />
        )}
      </div>
    </PullToRefresh>
  );
}

function CustomerJobs({ user, profile, jobs, reviews, onRefresh }) {
  const [selectedJob, setSelectedJob] = useState(null);
  const [reviewingJob, setReviewingJob] = useState(null);
  const reviewedIds = new Set(reviews.map(r => r.job_id));

  const handleAcceptQuote = async (quote) => {
    await base44.entities.Job.update(selectedJob.id, {
      provider_id: quote.provider_id,
      provider_email: quote.provider_email,
      provider_name: quote.provider_name,
      quoted_price: quote.price,
      status: 'accepted',
    });
    await base44.entities.Quote.update(quote.id, { status: 'accepted' });
    setSelectedJob(null);
    toast.success('Quote accepted!');
    onRefresh();
  };

  const handleReview = async (data) => {
    await base44.entities.Review.create({
      ...data,
      customer_id: user.id,
      customer_name: profile?.name || user.full_name,
    });
    toast.success('Review submitted!');
    onRefresh();
  };

  return (
    <PullToRefresh onRefresh={onRefresh}>
      <div className="px-4 py-5">
        <h2 className="text-lg font-bold text-foreground mb-4">My Jobs</h2>
        {jobs.length === 0 ? (
          <div className="text-center py-16">
            <Briefcase className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No jobs yet</p>
            <p className="text-xs text-muted-foreground mt-1">Request a service from the Home tab to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map(j => (
              <JobCard key={j.id} job={j} onViewQuotes={setSelectedJob} reviewed={reviewedIds.has(j.id)} onReview={setReviewingJob} />
            ))}
          </div>
        )}
        {selectedJob && (
          <QuotesModal job={selectedJob} onClose={() => setSelectedJob(null)} onAcceptQuote={handleAcceptQuote} customerProfile={profile} />
        )}
        {reviewingJob && (
          <ReviewModal job={reviewingJob} onClose={() => setReviewingJob(null)} onSubmit={handleReview} />
        )}
      </div>
    </PullToRefresh>
  );
}

function CustomerProfile({ user, profile, onRefresh }) {
  return (
    <PullToRefresh onRefresh={onRefresh}>
      <div className="px-4 py-5">
        <h2 className="text-lg font-bold text-foreground mb-4">Profile</h2>
        <CustomerProfileEditor user={user} profile={profile} onProfileUpdated={onRefresh} />
      </div>
    </PullToRefresh>
  );
}

export default function CustomerPortal() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [services, setServices] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestingService, setRequestingService] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const me = await base44.auth.me();
      setUser(me);
      const [allProfiles, allServices, allJobs, allReviews] = await Promise.all([
        base44.entities.CustomerProfile.filter({ user_email: me.email }),
        base44.entities.Service.filter({ active: true }),
        base44.entities.Job.filter({ customer_email: me.email }),
        base44.entities.Review.filter({ customer_id: me.id }),
      ]);
      setProfile(allProfiles[0] || null);
      setServices(allServices);
      setJobs(allJobs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
      setReviews(allReviews);
    } catch {
      toast.error('Failed to load your data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Redirect to /customer/home if at root
    if (window.location.pathname === '/customer' || window.location.pathname === '/customer/') {
      navigate('/customer/home', { replace: true });
    }
  }, [loadData, navigate]);

  const handleRequestService = async (serviceData) => {
    if (!user) return;
    try {
      const jobPayload = {
        ...serviceData,
        customer_id: profile?.id || user.id,
        customer_email: user.email,
        customer_name: profile?.name || user.full_name,
        status: 'requested',
      };
      await base44.entities.Job.create(jobPayload);
      toast.success('Service requested! Providers will send you quotes soon.');
      setRequestingService(null);
      loadData();
    } catch {
      toast.error('Failed to submit request.');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const pendingQuotesCount = jobs.filter(j => j.status === 'quoted').length;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border flex-shrink-0 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="Grassgodz" className="h-8 w-8 object-contain" />
            <span className="font-display font-bold text-base text-foreground">Grassgodz</span>
          </div>
          <button
            onClick={() => setRequestingService({ id: '', name: 'Custom Request' })}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold px-3 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus size={13} /> Request
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Routes>
          <Route path="home" element={
            <CustomerHome
              user={user} profile={profile} services={services}
              jobs={jobs} reviews={reviews}
              onRequestService={setRequestingService}
              onRefresh={loadData}
            />
          } />
          <Route path="jobs" element={
            <CustomerJobs user={user} profile={profile} jobs={jobs} reviews={reviews} onRefresh={loadData} />
          } />
          <Route path="profile" element={
            <CustomerProfile user={user} profile={profile} onRefresh={loadData} />
          } />
          <Route index element={<CustomerHome user={user} profile={profile} services={services} jobs={jobs} reviews={reviews} onRequestService={setRequestingService} onRefresh={loadData} />} />
        </Routes>
      </div>

      <BottomTabBar tabs={TABS} badge={{ jobs: pendingQuotesCount }} />

      {requestingService && (
        <RequestJobModal
          service={requestingService}
          customerProfile={profile}
          onClose={() => setRequestingService(null)}
          onSubmit={handleRequestService}
        />
      )}
    </div>
  );
}