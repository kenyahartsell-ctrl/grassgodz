import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Home, Briefcase, User, Plus, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import BottomTabBar from '@/components/shared/BottomTabBar';
import PullToRefresh from '@/components/shared/PullToRefresh';
import CustomerProfileEditor from '@/components/customer/CustomerProfileEditor';
import JobCard from '@/components/customer/JobCard';
import RequestJobModal from '@/components/customer/RequestJobModal';
import QuotesModal from '@/components/customer/QuotesModal';
import ReviewModal from '@/components/customer/ReviewModal';

const TABS = [
  { key: 'home', label: 'Home', icon: Home, path: '/customer' },
  { key: 'jobs', label: 'My Jobs', icon: Briefcase, path: '/customer/jobs' },
  { key: 'profile', label: 'Profile', icon: User, path: '/customer/profile' },
];

function CustomerHome({ user, profile, jobs, onRefresh, onRequestJob }) {
  const activeJobs = jobs.filter(j => !['completed', 'cancelled'].includes(j.status));
  const recentCompleted = jobs.filter(j => j.status === 'completed').slice(0, 3);

  return (
    <PullToRefresh onRefresh={onRefresh} className="px-4 py-5 space-y-5">
      {/* Welcome */}
      <div>
        <h1 className="text-xl font-bold text-foreground">
          Hello, {profile?.name || user?.full_name || 'there'} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your lawn care requests</p>
      </div>

      {/* Request button */}
      <button
        onClick={onRequestJob}
        className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-4 rounded-2xl hover:bg-primary/90 transition-colors shadow-sm"
      >
        <Plus size={18} />
        Request Lawn Service
      </button>

      {/* Active jobs */}
      {activeJobs.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-foreground mb-3">Active Jobs ({activeJobs.length})</h2>
          <div className="space-y-3">
            {activeJobs.map(job => (
              <JobCard key={job.id} job={job} onRefresh={onRefresh} />
            ))}
          </div>
        </div>
      )}

      {/* Recent completed */}
      {recentCompleted.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-foreground mb-3">Recently Completed</h2>
          <div className="space-y-3">
            {recentCompleted.map(job => (
              <JobCard key={job.id} job={job} onRefresh={onRefresh} />
            ))}
          </div>
        </div>
      )}

      {jobs.length === 0 && (
        <div className="text-center py-10">
          <p className="text-muted-foreground text-sm">No jobs yet. Request your first lawn service!</p>
        </div>
      )}
    </PullToRefresh>
  );
}

function CustomerJobs({ jobs, onRefresh }) {
  return (
    <PullToRefresh onRefresh={onRefresh} className="px-4 py-5 space-y-4">
      <h2 className="text-lg font-bold text-foreground">All Jobs</h2>
      {jobs.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground text-sm">No jobs yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => (
            <JobCard key={job.id} job={job} onRefresh={onRefresh} />
          ))}
        </div>
      )}
    </PullToRefresh>
  );
}

export default function CustomerPortal() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const loadData = async () => {
    try {
      const me = await base44.auth.me();
      setUser(me);
      const [profiles, allJobs] = await Promise.all([
        base44.entities.CustomerProfile.filter({ user_email: me.email }),
        base44.entities.Job.filter({ customer_email: me.email }, '-created_date', 50),
      ]);
      setProfile(profiles[0] || null);
      setJobs(allJobs);
    } catch {
      toast.error('Failed to load your data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Redirect /customer to /customer/home logically — keep path as /customer
  const activeTab = location.pathname.startsWith('/customer/jobs') ? 'jobs'
    : location.pathname.startsWith('/customer/profile') ? 'profile'
    : 'home';

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
        <span className="text-xs bg-secondary text-secondary-foreground font-semibold px-2 py-0.5 rounded-full ml-1">Customer</span>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<CustomerHome user={user} profile={profile} jobs={jobs} onRefresh={loadData} onRequestJob={() => setShowRequestModal(true)} />} />
          <Route path="/jobs" element={<CustomerJobs jobs={jobs} onRefresh={loadData} />} />
          <Route path="/profile" element={
            <PullToRefresh onRefresh={loadData} className="px-4 py-5">
              <CustomerProfileEditor user={user} profile={profile} onProfileUpdated={loadData} />
            </PullToRefresh>
          } />
        </Routes>
      </div>

      <BottomTabBar tabs={TABS} activeTab={activeTab} />

      {showRequestModal && (
        <RequestJobModal
          user={user}
          profile={profile}
          onClose={() => setShowRequestModal(false)}
          onJobCreated={() => { setShowRequestModal(false); loadData(); }}
        />
      )}
    </div>
  );
}