import { useState } from 'react';
import { Home, Briefcase, User, Leaf, Plus, CheckCircle2, Clock, History } from 'lucide-react';
import ServiceCard from '../components/customer/ServiceCard';
import RequestJobModal from '../components/customer/RequestJobModal';
import JobCard from '../components/customer/JobCard';
import QuotesModal from '../components/customer/QuotesModal';
import ReviewModal from '../components/customer/ReviewModal';
import { MOCK_SERVICES, MOCK_JOBS, MOCK_CUSTOMER } from '../lib/mockData';
import { toast } from 'sonner';

const NAV = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'jobs', label: 'My Jobs', icon: Briefcase },
  { key: 'profile', label: 'Account', icon: User },
];

export default function CustomerPortal() {
  const [tab, setTab] = useState('home');
  const [selectedService, setSelectedService] = useState(null);
  const [selectedJobForQuotes, setSelectedJobForQuotes] = useState(null);
  const [selectedJobForReview, setSelectedJobForReview] = useState(null);
  const [jobs, setJobs] = useState(MOCK_JOBS.filter(j => j.customer_id === 'c1'));

  const upcomingJobs = jobs.filter(j => ['scheduled', 'accepted', 'in_progress', 'quoted', 'requested'].includes(j.status));
  const pastJobs = jobs.filter(j => ['completed', 'cancelled'].includes(j.status));

  const handleRequestJob = (data) => {
    const newJob = {
      id: `j_${Date.now()}`,
      customer_id: 'c1',
      customer_name: MOCK_CUSTOMER.name,
      customer_email: MOCK_CUSTOMER.user_email,
      status: 'requested',
      ...data,
      created_at: new Date().toISOString(),
    };
    setJobs(prev => [newJob, ...prev]);
    setTab('jobs');
    toast.success('Quote request submitted! Providers in your area will respond shortly.');
  };

  const handleAcceptQuote = (quote) => {
    setJobs(prev => prev.map(j =>
      j.id === quote.job_id
        ? { ...j, status: 'accepted', quoted_price: quote.price, provider_name: quote.provider_name, provider_id: quote.provider_id }
        : j
    ));
    setSelectedJobForQuotes(null);
    toast.success(`Quote accepted! Card authorized for $${quote.price}. Payment will be captured on completion.`);
  };

  const handleReview = (data) => {
    toast.success('Review submitted! Thank you for your feedback.');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Leaf size={16} className="text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg text-foreground">Grassgodz</span>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">{MOCK_CUSTOMER.name[0]}</span>
            </div>
            <span className="text-sm font-medium text-foreground hidden sm:block">{MOCK_CUSTOMER.name}</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">
        {tab === 'home' && (
          <div>
            {/* Hero */}
            <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 mb-6 text-white relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full" />
              <div className="absolute -right-2 -bottom-10 w-24 h-24 bg-white/5 rounded-full" />
              <p className="text-sm font-medium text-white/70 mb-1">Welcome back,</p>
              <h1 className="text-2xl font-bold mb-1">{MOCK_CUSTOMER.name.split(' ')[0]} 👋</h1>
              <p className="text-sm text-white/80">{MOCK_CUSTOMER.service_address}</p>
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
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {MOCK_SERVICES.map(s => (
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
                    <JobCard key={j.id} job={j} onViewQuotes={setSelectedJobForQuotes} onReview={setSelectedJobForReview} />
                  ))}
                </div>
                {upcomingJobs.length > 2 && (
                  <button onClick={() => setTab('jobs')} className="mt-2 text-sm text-primary font-medium">View all jobs →</button>
                )}
              </div>
            )}
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
                    <JobCard key={j.id} job={j} onViewQuotes={setSelectedJobForQuotes} onReview={setSelectedJobForReview} />
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
                    <JobCard key={j.id} job={j} onViewQuotes={setSelectedJobForQuotes} onReview={setSelectedJobForReview} />
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

        {tab === 'profile' && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-5">Account</h2>
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">{MOCK_CUSTOMER.name[0]}</span>
                </div>
                <div>
                  <p className="font-bold text-foreground">{MOCK_CUSTOMER.name}</p>
                  <p className="text-sm text-muted-foreground">{MOCK_CUSTOMER.user_email}</p>
                </div>
              </div>
              <hr className="border-border" />
              <div className="space-y-3">
                {[
                  { label: 'Phone', value: MOCK_CUSTOMER.phone },
                  { label: 'Service Address', value: MOCK_CUSTOMER.service_address },
                  { label: 'ZIP Code', value: MOCK_CUSTOMER.zip_code },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-muted-foreground font-medium">{label}</p>
                    <p className="text-sm text-foreground mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
              <hr className="border-border" />
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-2">Payment Method</p>
                <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
                  <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">VISA</span>
                  </div>
                  <span className="text-sm text-foreground">•••• •••• •••• 4242</span>
                </div>
              </div>
            </div>
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
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* Modals */}
      {selectedService && (
        <RequestJobModal
          service={selectedService}
          onClose={() => setSelectedService(null)}
          onSubmit={handleRequestJob}
        />
      )}
      {selectedJobForQuotes && (
        <QuotesModal
          job={selectedJobForQuotes}
          onClose={() => setSelectedJobForQuotes(null)}
          onAcceptQuote={handleAcceptQuote}
        />
      )}
      {selectedJobForReview && (
        <ReviewModal
          job={selectedJobForReview}
          onClose={() => setSelectedJobForReview(null)}
          onSubmit={handleReview}
        />
      )}
    </div>
  );
}