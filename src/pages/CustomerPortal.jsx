import { useState, useEffect } from 'react';
import { Home, Briefcase, User, Leaf, CalendarPlus, CheckCircle2, Clock, History, Loader2, FileText } from 'lucide-react';
import ServiceCard from '../components/customer/ServiceCard';
import RequestJobModal from '../components/customer/RequestJobModal';
import JobCard from '../components/customer/JobCard';
import QuotesModal from '../components/customer/QuotesModal';
import JobQuotesPanel from '../components/customer/JobQuotesPanel';
import ReviewModal from '../components/customer/ReviewModal';
import BookingModal from '../components/customer/BookingModal';
import ProfileCompletionChecklist from '@/components/customer/ProfileCompletionChecklist';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import CustomerProfileEditor from '@/components/customer/CustomerProfileEditor';

const NAV = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'book', label: 'Book', icon: CalendarPlus },
  { key: 'jobs', label: 'My Jobs', icon: Briefcase },
  { key: 'quotes', label: 'Quotes', icon: FileText, badge: true },
  { key: 'profile', label: 'Account', icon: User },
];

export default function CustomerPortal() {
  const [tab, setTab] = useState('home');
  const [user, setUser] = useState(null);
  const [customerProfile, setCustomerProfile] = useState(null);
  const [services, setServices] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedJobForQuotes, setSelectedJobForQuotes] = useState(null);
  const [selectedJobForReview, setSelectedJobForReview] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const me = await base44.auth.me();
        setUser(me);

        const [profiles, allServices, myJobs, myReviews, allProviders] = await Promise.all([
          base44.entities.CustomerProfile.filter({ user_email: me.email }),
          base44.entities.Service.filter({ active: true }),
          base44.entities.Job.filter({ customer_email: me.email }),
          base44.entities.Review.filter({ customer_id: me.email }),
          base44.entities.ProviderProfile.list(),
        ]);

        setCustomerProfile(profiles[0] || null);
        setServices(allServices);
        // Attach provider profile data to each job
        const providerMap = Object.fromEntries(allProviders.map(p => [p.id, p]));
        setJobs(myJobs.map(j => ({
          ...j,
          _providerProfile: j.provider_id ? providerMap[j.provider_id] || null : null,
        })));
        setReviews(myReviews);
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
    const myJobs = await base44.entities.Job.filter({ customer_email: user.email });
    setJobs(myJobs);
  };

  const reviewedJobIds = new Set(reviews.map(r => r.job_id));
  const upcomingJobs = jobs.filter(j => ['scheduled', 'accepted', 'in_progress', 'quoted', 'requested'].includes(j.status));
  const pastJobs = jobs.filter(j => ['completed', 'cancelled'].includes(j.status));

  const handleRequestJob = async (data) => {
    const job = await base44.entities.Job.create({
      customer_id: customerProfile?.id || user.email,
      customer_name: user.full_name,
      customer_email: user.email,
      status: 'requested',
      ...data,
    });
    // Send confirmation notification
    base44.functions.invoke('notifyQuoteSubmitted', {
      job_id: job.id,
      customer_email: user.email,
      customer_name: user.full_name,
      service_name: data.service_name,
    }).catch(() => {});
    setJobs(prev => [...prev, { ...job, _providerProfile: null }]);
    setTab('quotes');
    toast.success('Quote request submitted! Providers in your area will respond shortly.');
  };

  const handleAcceptQuote = async (quote) => {
    // Payment authorization is handled inside QuoteCard via authorizePayment backend function.
    // Here we update quote status via the backend function (customers can't write quotes directly via RLS).
    await base44.functions.invoke('updateQuoteStatus', { quote_id: quote.id, status: 'accepted' });
    await base44.functions.invoke('notifyCustomerJobAccepted', { data: { job_id: quote.job_id } });
    await refreshJobs();
    setSelectedJobForQuotes(null);
  };

  const handleBooking = async (data) => {
    const newJob = await base44.entities.Job.create({
      customer_id: customerProfile?.id || user.email,
      customer_name: user.full_name,
      customer_email: user.email,
      status: 'requested',
      ...data,
    });
    setJobs(prev => [...prev, { ...newJob, _providerProfile: null }]);
    setTab('jobs');
    toast.success('Booking request sent! Providers in your area will respond shortly.');
  };

  const handleReview = async (data) => {
    await base44.entities.Review.create({
      ...data,
      customer_id: user.email,
      customer_name: user.full_name,
    });
    const myReviews = await base44.entities.Review.filter({ customer_id: user.email });
    setReviews(myReviews);
    toast.success('Review submitted! Thank you for your feedback.');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const displayName = user?.full_name || 'there';
  const displayAddress = customerProfile?.service_address || '';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <img src="https://media.base44.com/images/public/69e949497e5928c679297ebf/b2338f6dd_logo_transparent.png" alt="Grassgodz" className="h-9 w-9 object-contain" />
          <span className="font-display font-bold text-lg text-foreground">Grassgodz</span>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">{displayName[0]}</span>
            </div>
            <span className="text-sm font-medium text-foreground hidden sm:block">{displayName}</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">
        {tab === 'home' && (
          <div>
            {/* Pending quotes alert */}
            {jobs.filter(j => j.status === 'quoted').length > 0 && (
              <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
                <FileText size={18} className="text-blue-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-800">
                    You have {jobs.filter(j => j.status === 'quoted').length} quote{jobs.filter(j => j.status === 'quoted').length > 1 ? 's' : ''} waiting for your response!
                  </p>
                  <p className="text-xs text-blue-700 mt-0.5">A provider has submitted a price — review and accept to book your service.</p>
                </div>
                <button
                  onClick={() => setTab('quotes')}
                  className="flex-shrink-0 bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Review
                </button>
              </div>
            )}

            {/* Profile completion checklist */}
            <ProfileCompletionChecklist profile={customerProfile} onGoToProfile={() => setTab('profile')} />

            {/* Hero */}
            <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 mb-6 text-white relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full" />
              <div className="absolute -right-2 -bottom-10 w-24 h-24 bg-white/5 rounded-full" />
              <p className="text-sm font-medium text-white/70 mb-1">Welcome back,</p>
              <h1 className="text-2xl font-bold mb-1">{displayName.split(' ')[0]} 👋</h1>
              {displayAddress && <p className="text-sm text-white/80">{displayAddress}</p>}
              {upcomingJobs.length > 0 && (
                <div className="mt-4 bg-white/15 rounded-xl px-4 py-3 flex items-center gap-2 text-sm">
                  <CheckCircle2 size={15} />
                  <span>{upcomingJobs.length} upcoming job{upcomingJobs.length > 1 ? 's' : ''} scheduled</span>
                </div>
              )}
            </div>

            {/* Services */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-foreground">Request a Service</h2>
                <button
                  onClick={() => setTab('book')}
                  className="text-xs font-semibold text-primary flex items-center gap-1"
                >
                  <CalendarPlus size={13} /> Book a date
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {services.map(s => (
                  <ServiceCard key={s.id} service={s} onSelect={setSelectedService} />
                ))}
              </div>
            </div>

            {/* Recent Jobs */}
            {upcomingJobs.length > 0 && (
              <div>
                <h2 className="text-base font-bold text-foreground mb-3">Upcoming Jobs</h2>
                <div className="space-y-3">
                  {upcomingJobs.slice(0, 2).map(j => (
                    <JobCard key={j.id} job={j} customerProfile={customerProfile} onAcceptQuote={handleAcceptQuote} onReview={reviewedJobIds.has(j.id) ? null : setSelectedJobForReview} />
                  ))}
                </div>
                {upcomingJobs.length > 2 && (
                  <button onClick={() => setTab('jobs')} className="mt-2 text-sm text-primary font-medium">View all jobs →</button>
                )}
              </div>
            )}
          </div>
        )}

        {tab === 'book' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-foreground">Book a Service</h2>
              <p className="text-sm text-muted-foreground mt-1">Choose a service and pick your preferred date & time.</p>
            </div>
            <div className="grid grid-cols-1 gap-3 mb-6">
              {services.map(s => (
                <button
                  key={s.id}
                  onClick={() => setShowBookingModal(s)}
                  className="group text-left bg-card border border-border rounded-xl p-4 hover:border-primary/40 hover:shadow-md transition-all flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <CalendarPlus className="text-primary w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm">{s.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{s.description}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className="text-sm font-bold text-primary">From ${s.base_price_estimate}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">Book now →</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === 'jobs' && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-5">My Jobs</h2>

            {upcomingJobs.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={15} className="text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Upcoming</h3>
                </div>
                <div className="space-y-3">
                  {upcomingJobs.map(j => (
                    <JobCard key={j.id} job={j} customerProfile={customerProfile} onAcceptQuote={handleAcceptQuote} onReview={reviewedJobIds.has(j.id) ? null : setSelectedJobForReview} />
                  ))}
                </div>
              </div>
            )}

            {pastJobs.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <History size={15} className="text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-foreground">Past Jobs</h3>
                </div>
                <div className="space-y-3">
                  {pastJobs.map(j => (
                    <JobCard key={j.id} job={j} customerProfile={customerProfile} onAcceptQuote={handleAcceptQuote} onReview={reviewedJobIds.has(j.id) ? null : setSelectedJobForReview} reviewed={reviewedJobIds.has(j.id)} />
                  ))}
                </div>
              </div>
            )}

            {jobs.length === 0 && (
              <div className="text-center py-16">
                <Briefcase className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No jobs yet</p>
                <p className="text-sm text-muted-foreground mt-1">Request a service from the Home tab to get started.</p>
              </div>
            )}
          </div>
        )}

        {tab === 'quotes' && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">My Quotes</h2>
            <p className="text-sm text-muted-foreground mb-4">View provider quotes on your service requests.</p>

            {jobs.filter(j => !['completed','cancelled'].includes(j.status)).length === 0 ? (
              <div className="text-center py-16">
                <FileText className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No active requests</p>
                <p className="text-sm text-muted-foreground mt-1">Request a service from the Home tab to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.filter(j => !['completed','cancelled'].includes(j.status)).map(job => {
                  const statusMap = {
                    requested:   { label: 'Waiting for quotes', badge: 'bg-amber-100 text-amber-800' },
                    quoted:      { label: 'Quote received!', badge: 'bg-blue-100 text-blue-800' },
                    accepted:    { label: 'Accepted', badge: 'bg-indigo-100 text-indigo-800' },
                    scheduled:   { label: 'Scheduled', badge: 'bg-indigo-100 text-indigo-800' },
                    in_progress: { label: 'In Progress', badge: 'bg-orange-100 text-orange-800' },
                  };
                  const cfg = statusMap[job.status] || statusMap.requested;
                  return (
                    <div key={job.id} className={`bg-card border rounded-xl p-4 ${job.status === 'quoted' ? 'border-blue-300 shadow-sm' : 'border-border'}`}>
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground text-sm">{job.service_name || 'Service Request'}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{job.address || '—'}</p>
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                      </div>
                      {job.scheduled_date && (
                        <p className="text-xs text-muted-foreground mb-1">
                          Date: {new Date(job.scheduled_date).toLocaleDateString()}
                        </p>
                      )}
                      <JobQuotesPanel
                        job={job}
                        customerProfile={customerProfile}
                        onAcceptQuote={handleAcceptQuote}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'profile' && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-5">Account</h2>
            <CustomerProfileEditor
              user={user}
              profile={customerProfile}
              onProfileUpdated={async () => {
                const profiles = await base44.entities.CustomerProfile.filter({ user_email: user.email });
                setCustomerProfile(profiles[0] || null);
              }}
            />
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="bg-card border-t border-border sticky bottom-0 z-30">
        <div className="max-w-3xl mx-auto flex">
          {NAV.map(({ key, label, icon: Icon, badge }) => {
            const showBadge = badge && jobs.some(j => j.status === 'quoted');
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                  tab === key ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="relative">
                  <Icon size={18} />
                  {showBadge && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border border-background" />
                  )}
                </div>
                {label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Modals */}
      {selectedService && (
        <RequestJobModal
          service={selectedService}
          onClose={() => setSelectedService(null)}
          onSubmit={handleRequestJob}
          customerProfile={customerProfile}
        />
      )}
      {selectedJobForQuotes && (
        <QuotesModal
          job={selectedJobForQuotes}
          onClose={() => setSelectedJobForQuotes(null)}
          onAcceptQuote={handleAcceptQuote}
          customerProfile={customerProfile}
        />
      )}
      {selectedJobForReview && (
        <ReviewModal
          job={selectedJobForReview}
          onClose={() => setSelectedJobForReview(null)}
          onSubmit={handleReview}
        />
      )}
      {showBookingModal && (
        <BookingModal
          preselectedService={typeof showBookingModal === 'object' ? showBookingModal : null}
          onClose={() => setShowBookingModal(false)}
          onSubmit={handleBooking}
          customerProfile={customerProfile}
        />
      )}
    </div>
  );
}