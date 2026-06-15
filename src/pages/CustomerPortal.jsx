import { useState, useEffect } from 'react';
import PageMeta from '@/components/shared/PageMeta';
import { Home, Briefcase, User, Leaf, CalendarPlus, CheckCircle2, Clock, History, Loader2, FileText, Receipt, RefreshCw, LogOut } from 'lucide-react';
import LanguageToggle from '@/components/shared/LanguageToggle';
import { useLanguage } from '@/lib/LanguageContext';
import CustomerInvoicesPanel from '@/components/customer/CustomerInvoicesPanel';
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

const NAV_KEYS = [
  { key: 'home', labelKey: 'nav_home', icon: Home },
  { key: 'book', labelKey: 'nav_book', icon: CalendarPlus },
  { key: 'jobs', labelKey: 'nav_jobs', icon: Briefcase },
  { key: 'quotes', labelKey: 'nav_quotes', icon: FileText, badge: true },
  { key: 'invoices', labelKey: 'nav_invoices', icon: Receipt },
  { key: 'profile', labelKey: 'nav_account', icon: User },
];

export default function CustomerPortal() {
  const { t, setLang } = useLanguage();
  const [tab, setTab] = useState('home');
  const [user, setUser] = useState(null);
  const [customerProfile, setCustomerProfile] = useState(null);
  const [services, setServices] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [scheduledJobs, setScheduledJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedJobForQuotes, setSelectedJobForQuotes] = useState(null);
  const [selectedJobForReview, setSelectedJobForReview] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [cardNudgeDismissed, setCardNudgeDismissed] = useState(false);
  const [cancelConfirmId, setCancelConfirmId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    async function loadData() {
      try {
        const me = await base44.auth.me();
        setUser(me);

        const [profiles, allServices, myJobs, myReviews, myScheduledJobs] = await Promise.all([
          base44.entities.CustomerProfile.filter({ user_email: me.email }),
          base44.entities.Service.filter({ active: true }),
          base44.entities.Job.filter({ customer_email: me.email }),
          base44.entities.Review.filter({ customer_id: me.email }),
          base44.entities.ScheduledJob.filter({ client_email: me.email }),
        ]);

        const profile = profiles[0] || null;
        setCustomerProfile(profile);
        if (profile?.language) {
          setLang(profile.language);
        }
        setServices(allServices);
        setJobs(myJobs.map(j => ({ ...j, _providerProfile: null })));
        setReviews(myReviews);
        setScheduledJobs(myScheduledJobs || []);
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
    const [myJobs, updatedScheduled] = await Promise.all([
      base44.entities.Job.filter({ customer_email: user.email }),
      base44.entities.ScheduledJob.filter({ client_email: user.email }),
    ]);
    setJobs(myJobs);
    setScheduledJobs(updatedScheduled);
  };

  const handleToggleSchedule = async (sj) => {
    const newStatus = sj.status === 'active' ? 'paused' : 'active';
    try {
      await base44.entities.ScheduledJob.update(sj.id, { status: newStatus });
      setScheduledJobs(prev => prev.map(s => s.id === sj.id ? { ...s, status: newStatus } : s));
      toast.success(newStatus === 'paused' ? 'Recurring service paused.' : 'Recurring service resumed.');
    } catch (err) {
      toast.error('Could not update schedule: ' + err.message);
    }
  };

  const handleCancelSchedule = async (sj) => {
    try {
      await base44.entities.ScheduledJob.update(sj.id, { status: 'stopped' });
      setScheduledJobs(prev => prev.map(s => s.id === sj.id ? { ...s, status: 'stopped' } : s));
      setCancelConfirmId(null);
      toast.success('Recurring service cancelled.');
    } catch (err) {
      toast.error('Could not cancel schedule: ' + err.message);
    }
  };

  const reviewedJobIds = new Set(reviews.map(r => r.job_id));

  // For recurring jobs, only show the next upcoming one (the earliest scheduled_date per recurrence group)
  const deduplicatedUpcoming = (() => {
    const active = jobs.filter(j => ['scheduled', 'accepted', 'in_progress', 'quoted', 'requested'].includes(j.status));
    const seen = new Set();
    const result = [];
    // Sort by date so we pick the earliest per recurrence group
    const sorted = [...active].sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));
    for (const j of sorted) {
      const groupKey = j.recurrence_parent_id || j.id;
      if (!seen.has(groupKey)) {
        seen.add(groupKey);
        result.push(j);
      }
    }
    return result;
  })();

  const upcomingJobs = deduplicatedUpcoming;
  const pastJobs = jobs.filter(j => ['completed', 'cancelled'].includes(j.status));
  const activeScheduledJobs = scheduledJobs.filter(sj => sj.status !== 'stopped');

  const handleRequestJob = async (data) => {
    const baseJobData = {
      customer_id: user.id,
      customer_name: user.full_name,
      customer_email: user.email,
      status: 'requested',
      ...data,
    };

    const job = await base44.entities.Job.create(baseJobData);

    const newJobs = [{ ...job, _providerProfile: null }];

    base44.functions.invoke('notifyQuoteSubmitted', {
      job_id: job.id,
      customer_email: user.email,
      customer_name: user.full_name,
      service_name: data.service_name,
    }).catch(() => {});

    setJobs(prev => [...prev, ...newJobs]);
    setTab('quotes');
    toast.success("Request submitted! You'll see provider quotes here as they come in. Check your email for confirmation.");
  };

  const handleAcceptQuote = async (quote) => {
    setActionLoading(prev => ({ ...prev, [`acceptquote_${quote.id}`]: true }));
    try {
      await base44.functions.invoke('updateQuoteStatus', { quote_id: quote.id, status: 'accepted' });
      await base44.functions.invoke('notifyCustomerJobAccepted', { data: { job_id: quote.job_id } });
      await refreshJobs();
      setSelectedJobForQuotes(null);
    } finally {
      setActionLoading(prev => ({ ...prev, [`acceptquote_${quote.id}`]: false }));
    }
  };

  const handleCancelJob = async (job) => {
    setActionLoading(prev => ({ ...prev, [`canceljob_${job.id}`]: true }));
    try {
      await base44.entities.Job.update(job.id, { status: 'cancelled' });
      await refreshJobs();
      toast.success('Job request cancelled.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`canceljob_${job.id}`]: false }));
    }
  };

  const handleBooking = async (data) => {
    const newJob = await base44.entities.Job.create({
      customer_id: user.id,
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
      <PageMeta
        title="Grassgodz — The Godz of Lawn Care. Imagine your yard, perfected. | DC Metro"
        description="Book vetted local lawn care pros in the DC metro area. Honest pricing, insured pros, and zero hassle."
        path="/customer"
      />
      <header className="bg-card border-b border-border sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <img src="https://media.base44.com/images/public/69e949497e5928c679297ebf/b2338f6dd_logo_transparent.png" alt="Grassgodz" className="h-9 w-9 object-contain" />
          <span className="font-display font-bold text-lg text-foreground">Grassgodz</span>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={async () => { setIsRefreshing(true); await refreshJobs(); setIsRefreshing(false); }}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
            <LanguageToggle />
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">{displayName[0]}</span>
            </div>
            <span className="text-sm font-medium text-foreground hidden sm:block">{displayName}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">
        {tab === 'home' && (
          <div>
            {jobs.filter(j => j.status === 'quoted').length > 0 && (
              <div className="mb-4 bg-green-600 border border-green-700 rounded-2xl p-5 shadow-lg">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">🎉</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-bold text-white">A provider has quoted your yard!</p>
                    <p className="text-sm text-green-100 mt-0.5">
                      {jobs.filter(j => j.status === 'quoted').map(j => j.provider_name || 'A provider').join(', ')} submitted a price for your lawn care. Tap below to review and accept.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setTab('quotes')}
                  className="w-full bg-white text-green-700 font-bold py-3 rounded-xl text-sm hover:bg-green-50 transition-colors"
                >
                  👉 Review & Accept Quote
                </button>
              </div>
            )}

            {/* Card-on-file nudge for loyal customers */}
            {!cardNudgeDismissed && !customerProfile?.default_payment_method_id && pastJobs.filter(j => j.status === 'completed').length >= 2 && (
              <div className="mb-4 bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-lg">💳</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-amber-900">Add a card to keep booking</p>
                  <p className="text-xs text-amber-800 mt-0.5">We now require a card on file before placing a new request. It's only charged after your job is completed.</p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => setTab('profile')}
                      className="flex-1 bg-amber-700 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-amber-800 transition-colors"
                    >
                      Add Card Now →
                    </button>
                    <button
                      onClick={() => setCardNudgeDismissed(true)}
                      className="text-xs text-amber-700 font-medium px-3 py-2 rounded-lg hover:bg-amber-100 transition-colors"
                    >
                      Later
                    </button>
                  </div>
                </div>
              </div>
            )}
                        <ProfileCompletionChecklist profile={customerProfile} onGoToProfile={() => setTab('profile')} />

            <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 mb-6 text-white relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full" />
              <div className="absolute -right-2 -bottom-10 w-24 h-24 bg-white/5 rounded-full" />
              <p className="text-sm font-medium text-white/70 mb-1">Welcome back,</p>
              <h1 className="text-2xl font-bold mb-1">{displayName.split(' ')[0]} 👋</h1>
              {displayAddress && <p className="text-sm text-white/80">{displayAddress}</p>}
              {upcomingJobs.length > 0 && (
                <div className="mt-4 space-y-2">
                  {jobs.filter(j => j.status === 'quoted' && j.provider_name).map(j => (
                    <div key={j.id} className="bg-white/20 rounded-xl px-4 py-3 flex items-center gap-2 text-sm">
                      <span>✅</span>
                      <span><strong>{j.provider_name}</strong> quoted your {j.service_name} — tap "Review Quote" above!</span>
                    </div>
                  ))}
                  {jobs.filter(j => ['accepted','scheduled','in_progress'].includes(j.status)).length > 0 && (
                    <div className="bg-white/15 rounded-xl px-4 py-3 flex items-center gap-2 text-sm">
                      <CheckCircle2 size={15} />
                      <span>{jobs.filter(j => ['accepted','scheduled','in_progress'].includes(j.status)).length} job{jobs.filter(j => ['accepted','scheduled','in_progress'].includes(j.status)).length > 1 ? 's' : ''} scheduled</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-foreground">{t('request_service')}</h2>
                <button onClick={() => setTab('book')} className="text-xs font-semibold text-primary flex items-center gap-1">
                  <CalendarPlus size={13} /> {t('book_a_date')}
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {services.map(s => (
                  <ServiceCard key={s.id} service={s} onSelect={setSelectedService} />
                ))}
              </div>
            </div>

            {upcomingJobs.length > 0 && (
              <div>
                <h2 className="text-base font-bold text-foreground mb-3">{t('upcoming')}</h2>
                <div className="space-y-3">
                  {upcomingJobs.slice(0, 2).map(j => (
                    <JobCard key={j.id} job={j} customerProfile={customerProfile} onAcceptQuote={handleAcceptQuote} onReview={reviewedJobIds.has(j.id) ? null : setSelectedJobForReview} />
                  ))}
                </div>
                {upcomingJobs.length > 2 && (
                  <button onClick={() => setTab('jobs')} className="mt-2 text-sm text-primary font-medium">{t('view_all_jobs')}</button>
                )}
              </div>
            )}
          </div>
        )}

        {tab === 'book' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-foreground">{t('book_service')}</h2>
              <p className="text-sm text-muted-foreground mt-1">{t('book_service_sub')}</p>
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
                    <span className="text-sm font-bold text-primary">{t('from_price', { price: s.base_price_estimate })}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('book_now')}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === 'jobs' && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-5">{t('nav_jobs')}</h2>

            {upcomingJobs.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={15} className="text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">{t('upcoming')}</h3>
                </div>
                <div className="space-y-3">
                  {upcomingJobs.map(j => (
                    <JobCard key={j.id} job={j} customerProfile={customerProfile} onAcceptQuote={handleAcceptQuote} onReview={reviewedJobIds.has(j.id) ? null : setSelectedJobForReview} />
                  ))}
                </div>
              </div>
            )}

            {pastJobs.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <History size={15} className="text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-foreground">{t('past_jobs')}</h3>
                </div>
                <div className="space-y-3">
                  {pastJobs.map(j => (
                    <JobCard key={j.id} job={j} customerProfile={customerProfile} onAcceptQuote={handleAcceptQuote} onReview={reviewedJobIds.has(j.id) ? null : setSelectedJobForReview} reviewed={reviewedJobIds.has(j.id)} />
                  ))}
                </div>
              </div>
            )}

            {activeScheduledJobs.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <RefreshCw size={15} className="text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Recurring Services</h3>
                </div>
                <div className="space-y-3">
                  {activeScheduledJobs.map(sj => (
                    <div key={sj.id} className="bg-card border border-border rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground text-sm">{sj.service_type || 'Service'}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{sj.service_address || ''}</p>
                        </div>
                        <span className={'text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ' + (sj.status === 'paused' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800')}>
                          {sj.status === 'paused' ? 'Paused' : 'Active'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <RefreshCw size={11} />
                          {sj.recurrence === 'biweekly' ? 'Every 2 weeks' : sj.recurrence === 'weekly' ? 'Weekly' : sj.recurrence || 'Recurring'}
                        </span>
                        {sj.next_release_date && (
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            Next: {new Date(sj.next_release_date + 'T12:00:00').toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {cancelConfirmId === sj.id ? (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-2">
                          <p className="text-xs font-semibold text-red-800">Cancel recurring {sj.service_type || 'service'}? This cannot be undone.</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleCancelSchedule(sj)}
                              className="flex-1 bg-red-600 text-white text-xs font-semibold py-2 rounded-lg hover:bg-red-700 transition-colors"
                            >
                              Confirm Cancel
                            </button>
                            <button
                              onClick={() => setCancelConfirmId(null)}
                              className="flex-1 border border-border text-xs font-medium py-2 rounded-lg hover:bg-muted transition-colors"
                            >
                              Go Back
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleSchedule(sj)}
                            className={'flex-1 py-2 rounded-lg text-xs font-semibold transition-colors border ' + (sj.status === 'paused' ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90' : 'bg-background text-foreground border-border hover:bg-muted')}
                          >
                            {sj.status === 'paused' ? 'Resume' : 'Pause'}
                          </button>
                          <button
                            onClick={() => setCancelConfirmId(sj.id)}
                            className="px-3 py-2 rounded-lg text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {jobs.length === 0 && activeScheduledJobs.length === 0 && (
              <div className="text-center py-16">
                <Briefcase className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">{t('no_jobs')}</p>
                <p className="text-sm text-muted-foreground mt-1">{t('no_jobs_sub')}</p>
              </div>
            )}
          </div>
        )}

        {tab === 'quotes' && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">{t('my_quotes')}</h2>
            <p className="text-sm text-muted-foreground mb-4">{t('my_quotes_sub')}</p>

            {jobs.filter(j => !['completed','cancelled'].includes(j.status)).length === 0 ? (
              <div className="text-center py-16">
                <FileText className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">{t('no_active_requests')}</p>
                <p className="text-sm text-muted-foreground mt-1">{t('no_active_requests_sub')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.filter(j => !['completed','cancelled'].includes(j.status)).map(job => {
                   const statusMap = {
                     requested:   { label: t('waiting_for_quotes'), badge: 'bg-amber-100 text-amber-800' },
                     quoted:      { label: t('quote_received'), badge: 'bg-blue-100 text-blue-800' },
                     accepted:    { label: t('accepted'), badge: 'bg-indigo-100 text-indigo-800' },
                     scheduled:   { label: t('scheduled'), badge: 'bg-indigo-100 text-indigo-800' },
                     in_progress: { label: t('in_progress'), badge: 'bg-orange-100 text-orange-800' },
                   };
                   const cfg = statusMap[job.status] || statusMap.requested;
                   return (
                     <div key={job.id} className={'bg-card border rounded-xl p-4 ' + (job.status === 'quoted' ? 'border-blue-300 shadow-sm' : 'border-border')}>
                       <div className="flex items-start justify-between gap-3 mb-1">
                         <div className="flex-1 min-w-0">
                           <p className="font-semibold text-foreground text-sm">{job.service_name || 'Service Request'}</p>
                           <p className="text-xs text-muted-foreground mt-0.5">{job.address || '—'}</p>
                         </div>
                         <span className={'text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ' + cfg.badge}>
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
                          onCardSaved={async (pmId) => {
                            const profiles = await base44.entities.CustomerProfile.filter({ user_email: user.email });
                            setCustomerProfile(profiles[0] || null);
                          }}
                        />
                       {job.status === 'requested' && (
                         <button
                           onClick={() => handleCancelJob(job)}
                           disabled={actionLoading[`canceljob_${job.id}`]}
                           className="mt-3 w-full flex items-center justify-center gap-1.5 border border-red-200 text-red-600 text-xs font-semibold py-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-60"
                         >
                           {actionLoading[`canceljob_${job.id}`] ? <Loader2 size={12} className="animate-spin" /> : null}
                           Cancel Request
                         </button>
                       )}
                     </div>
                   );
                 })}
              </div>
            )}
          </div>
        )}

        {tab === 'invoices' && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">{t('invoices')}</h2>
            <p className="text-sm text-muted-foreground mb-4">{t('invoices_sub')}</p>
            <CustomerInvoicesPanel userEmail={user?.email} />
          </div>
        )}

        {tab === 'profile' && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-5">{t('my_account')}</h2>
            <CustomerProfileEditor
              user={user}
              profile={customerProfile}
              onProfileUpdated={async () => {
                const profiles = await base44.entities.CustomerProfile.filter({ user_email: user.email });
                setCustomerProfile(profiles[0] || null);
              }}
            />
            <div className="mt-6">
              <button
                onClick={() => base44.auth.logout('/')}
                className="w-full flex items-center justify-center gap-2 border border-destructive text-destructive rounded-xl py-3 text-sm font-semibold hover:bg-destructive/5 transition-colors"
              >
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          </div>
        )}
      </main>

      <nav className="bg-card border-t border-border sticky bottom-0 z-30">
        <div className="max-w-3xl mx-auto flex">
          {NAV_KEYS.map(({ key, labelKey, icon: NavIcon, badge }) => {
            const showBadge = badge && jobs.some(j => j.status === 'quoted');
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={'flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ' + (tab === key ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}
              >
                <div className="relative">
                  <NavIcon size={18} />
                  {showBadge && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border border-background" />
                  )}
                </div>
                {t(labelKey)}
              </button>
            );
          })}
        </div>
      </nav>

      {selectedService && (
        <RequestJobModal
          service={selectedService}
          onClose={() => setSelectedService(null)}
          onSubmit={handleRequestJob}
          customerProfile={customerProfile}
          onCardSaved={async (pmId) => {
            const profiles = await base44.entities.CustomerProfile.filter({ user_email: user.email });
            setCustomerProfile(profiles[0] || null);
          }}
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