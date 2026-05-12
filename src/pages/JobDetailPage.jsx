import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Camera, User, ClipboardList, MapPin, Calendar, DollarSign, AlertCircle, CheckCircle2, Wrench, Hash } from 'lucide-react';
import StatusBadge from '@/components/shared/StatusBadge';
import JobChat from '@/components/shared/JobChat';
import PhotoLightbox from '@/components/shared/PhotoLightbox';
import JobPhotoUploadModal from '@/components/provider/JobPhotoUploadModal';
import { format } from 'date-fns';

const STATUS_ORDER = ['requested', 'quoted', 'accepted', 'scheduled', 'in_progress', 'completed', 'cancelled'];
const SHOW_FULL_ADDRESS_STATUSES = ['accepted', 'scheduled', 'in_progress', 'completed'];

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-start gap-3 py-2.5 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground font-medium flex-shrink-0">{label}</span>
      <span className="text-xs text-foreground text-right">{value}</span>
    </div>
  );
}

export default function JobDetailPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [job, setJob] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('order');
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const isAdmin = user?.role === 'admin';
  const senderRole = user && job
    ? (isAdmin ? 'admin' : job.customer_email === user.email ? 'customer' : 'provider')
    : null;
  // providerProfileId is set in the load effect via fallback lookup — stored on the job object itself for use in access logic

  const otherPartyName = isAdmin
    ? `${job?.customer_name || 'Customer'} ↔ ${job?.provider_name || 'Provider'}`
    : senderRole === 'customer'
      ? (job?.provider_name || 'Provider')
      : (job?.customer_name || 'Customer');

  useEffect(() => {
    async function load() {
      try {
        const me = await base44.auth.me();
        setUser(me);

        // Try user-scoped fetch first; fall back to provider jobs lookup (RLS may block provider access)
        let foundJob = null;
        let providerProfileId = null;
        const jobs = await base44.entities.Job.filter({ id: jobId });
        foundJob = jobs[0] || null;

        // If not found via RLS, check if user is a provider and fetch via backend (bypasses RLS)
        if (!foundJob && me.role !== 'admin') {
          const provRes = await base44.functions.invoke('getMyProviderJobs', {});
          const providerJobs = provRes.data?.jobs || [];
          providerProfileId = provRes.data?.profile?.id || null;
          foundJob = providerJobs.find(j => j.id === jobId) || null;
        }

        if (!foundJob) {
          toast.error('Job not found.');
          navigate('/');
          return;
        }

        // Access control
        const isCustomer = foundJob.customer_email === me.email;
        const isProvider = foundJob.provider_email === me.email || (providerProfileId && foundJob.provider_id === providerProfileId);
        const isAdmin = me.role === 'admin';

        if (!isCustomer && !isProvider && !isAdmin) {
          toast.error("You don't have access to this job.");
          navigate(me.role === 'admin' ? '/admin' : isCustomer ? '/customer' : '/provider');
          return;
        }

        setJob(foundJob);

        // Load payment
        const payments = await base44.entities.Payment.filter({ job_id: jobId });
        setPayment(payments[0] || null);
      } catch (err) {
        toast.error('Failed to load job.');
        navigate('/');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [jobId]);

  const handleMarkComplete = async (j, photos) => {
    if (j.status === 'completed') {
      // Retrospective photo save only — job already done
      await base44.entities.Job.update(j.id, { completion_photos: { ...(j.completion_photos || {}), ...photos } });
      toast.success('Photos saved!');
      const jobs = await base44.entities.Job.filter({ id: jobId });
      setJob(jobs[0]);
      setShowPhotoModal(false);
      return;
    }
    const res = await base44.functions.invoke('capturePayment', {
      job_id: j.id,
      skip_photos: false,
    });
    if (res.data?.success) {
      toast.success('Job completed! Payment captured.');
      const jobs = await base44.entities.Job.filter({ id: jobId });
      setJob(jobs[0]);
      setShowPhotoModal(false);
    } else {
      toast.error(res.data?.error || 'Failed to complete job.');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!job) return null;

  const showFullAddress = isAdmin || SHOW_FULL_ADDRESS_STATUSES.includes(job.status);
  const hasPhotos = job.completion_photos && Object.values(job.completion_photos).some(Boolean);
  const backPath = senderRole === 'customer' ? '/customer' : senderRole === 'provider' ? '/provider' : '/admin';

  const statusTimeline = STATUS_ORDER
    .filter(s => s !== 'cancelled')
    .map(s => ({
      status: s,
      done: STATUS_ORDER.indexOf(job.status) >= STATUS_ORDER.indexOf(s),
      current: job.status === s,
    }));

  return (
    <div className="flex flex-col bg-background" style={{ height: '100dvh' }}>
      {/* Sticky header */}
      <header className="flex-shrink-0 bg-card border-b border-border sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to={backPath} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground truncate">{job.service_name}</p>
          </div>
          <StatusBadge status={job.status} />
        </div>
      </header>

      {/* Job summary card */}
      <div className="flex-shrink-0 bg-card border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User size={18} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{otherPartyName}</p>
              <p className="text-xs text-muted-foreground">
                {job.scheduled_date
                  ? format(new Date(job.scheduled_date), 'EEE, MMM d, yyyy')
                  : 'No date set'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {showFullAddress ? job.address : `${job.zip_code}`}
              </p>
            </div>
            {job.quoted_price && (
              <div className="text-right flex-shrink-0">
                <p className="text-base font-bold text-foreground">${job.quoted_price}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex-shrink-0 bg-card border-b border-border">
        <div className="max-w-2xl mx-auto flex">
          {['order', 'chat', 'photos', 'details'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-xs font-semibold capitalize transition-colors border-b-2 ${
                tab === t
                  ? 'text-primary border-primary'
                  : 'text-muted-foreground border-transparent hover:text-foreground'
              }`}
            >
              {t === 'order' ? 'Order' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 max-w-2xl mx-auto w-full flex flex-col">

        {/* ORDER TAB */}
        {tab === 'order' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">

            {/* Order Header */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <ClipboardList size={18} className="text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-base font-bold text-foreground">{job.service_name}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Job #{job.id?.slice(-8).toUpperCase()}</p>
                  <div className="mt-2">
                    <StatusBadge status={job.status} />
                  </div>
                </div>
                {job.quoted_price && (
                  <div className="text-right flex-shrink-0">
                    <p className="text-xl font-bold text-primary">${job.quoted_price}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                )}
              </div>
            </div>

            {/* Schedule & Location */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <p className="text-xs font-bold text-foreground uppercase tracking-wide">Schedule & Location</p>
              <div className="flex items-start gap-3">
                <Calendar size={15} className="text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Scheduled Date</p>
                  <p className="text-sm font-semibold text-foreground">
                    {job.scheduled_date
                      ? format(new Date(job.scheduled_date), 'EEEE, MMMM d, yyyy')
                      : 'Not yet scheduled'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={15} className="text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Service Address</p>
                  <p className="text-sm font-semibold text-foreground">
                    {showFullAddress ? job.address : `ZIP: ${job.zip_code}`}
                  </p>
                  {job.zip_code && showFullAddress && (
                    <p className="text-xs text-muted-foreground">{job.zip_code}</p>
                  )}
                  {showFullAddress && job.address && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(job.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary font-semibold hover:underline mt-1 block"
                    >
                      Open in Google Maps →
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* People */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <p className="text-xs font-bold text-foreground uppercase tracking-wide">People</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <User size={14} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="text-sm font-semibold text-foreground">{job.customer_name || '—'}</p>
                  {isAdmin && <p className="text-xs text-muted-foreground">{job.customer_email}</p>}
                </div>
              </div>
              {job.provider_name ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Wrench size={14} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Provider</p>
                    <p className="text-sm font-semibold text-foreground">{job.provider_name}</p>
                    {isAdmin && <p className="text-xs text-muted-foreground">{job.provider_email}</p>}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <AlertCircle size={13} />
                  No provider assigned yet
                </div>
              )}
            </div>

            {/* Customer Instructions */}
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs font-bold text-foreground uppercase tracking-wide mb-3">
                {senderRole === 'provider' ? '📋 Customer Instructions' : '📋 Your Instructions'}
              </p>
              {job.customer_notes ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-900 leading-relaxed">{job.customer_notes}</p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">No special instructions provided.</p>
              )}
              {job.provider_notes && (
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Provider Notes</p>
                  <div className="bg-muted/40 rounded-lg p-3">
                    <p className="text-sm text-foreground leading-relaxed">{job.provider_notes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Provider Checklist — shown only to providers */}
            {senderRole === 'provider' && (
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-xs font-bold text-foreground uppercase tracking-wide mb-3">✅ Provider Checklist</p>
                <div className="space-y-2">
                  {[
                    'Review customer instructions above before arriving',
                    'Take before photos on arrival',
                    'Complete the requested service thoroughly',
                    'Take after photos once work is complete',
                    'Mark job as complete in the portal',
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 size={14} className="text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing Summary */}
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs font-bold text-foreground uppercase tracking-wide mb-3">
                <DollarSign size={12} className="inline mr-1" />
                Pricing Summary
              </p>
              <div className="space-y-2">
                {job.quoted_price && (
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Quoted Price</span>
                    <span className="text-sm font-bold text-foreground">${job.quoted_price}</span>
                  </div>
                )}
                {job.final_price && (
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Final Price</span>
                    <span className="text-sm font-bold text-foreground">${job.final_price}</span>
                  </div>
                )}
                {payment && (
                  <>
                    {senderRole === 'provider' && payment.payout_amount && (
                      <div className="flex justify-between items-center py-2 border-b border-border">
                        <span className="text-sm text-muted-foreground">Your Earnings</span>
                        <span className="text-sm font-bold text-primary">${payment.payout_amount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-muted-foreground">Payment Status</span>
                      <StatusBadge status={payment.status} />
                    </div>
                  </>
                )}
                {senderRole === 'provider' && job.quoted_price && !payment && (
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Your Estimated Earnings</span>
                    <span className="text-sm font-bold text-primary">${(job.quoted_price * 0.75).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* CHAT TAB */}
        {tab === 'chat' && (
          <JobChat
            job={job}
            user={user}
            senderRole={senderRole}
            otherPartyName={otherPartyName}
          />
        )}

        {/* PHOTOS TAB */}
        {tab === 'photos' && (
          <div className="flex-1 overflow-y-auto p-4">
            {senderRole === 'provider' && ['in_progress', 'scheduled', 'accepted', 'completed'].includes(job.status) && (
              <button
                onClick={() => setShowPhotoModal(true)}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl py-4 text-sm font-medium text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors mb-4"
              >
                <Camera size={16} /> Add Photos
              </button>
            )}
            {hasPhotos ? (
              <>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {Object.entries(job.completion_photos)
                    .filter(([, url]) => url)
                    .map(([key, url]) => (
                      <button
                        key={key}
                        onClick={() => setLightboxOpen(true)}
                        className="aspect-square rounded-lg overflow-hidden border border-border"
                      >
                        <img src={url} alt={key} className="w-full h-full object-cover" />
                      </button>
                    ))}
                </div>
                <button
                  onClick={() => setLightboxOpen(true)}
                  className="w-full text-xs text-primary font-semibold border border-primary/30 rounded-lg py-2 hover:bg-primary/5 transition-colors"
                >
                  View All Photos
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Camera className="w-10 h-10 text-muted-foreground/20 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No photos yet</p>
                {senderRole === 'provider' && (
                  <p className="text-xs text-muted-foreground mt-1">Upload before/after photos to document your work.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* DETAILS TAB */}
        {tab === 'details' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Admin — both parties overview */}
            {isAdmin && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-3">Transaction Parties</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">Customer</p>
                    <p className="text-sm font-semibold text-foreground">{job.customer_name || '—'}</p>
                    <p className="text-xs text-muted-foreground">{job.customer_email || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">Provider</p>
                    <p className="text-sm font-semibold text-foreground">{job.provider_name || 'Unassigned'}</p>
                    <p className="text-xs text-muted-foreground">{job.provider_email || '—'}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-amber-200">
                  <DetailRow label="Full Address" value={job.address} />
                  <DetailRow label="ZIP Code" value={job.zip_code} />
                  <DetailRow label="Scheduled" value={job.scheduled_date ? format(new Date(job.scheduled_date), 'EEE, MMM d, yyyy') : null} />
                </div>
              </div>
            )}

            {/* Notes */}
            {(job.customer_notes || job.provider_notes) && (
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-xs font-bold text-foreground uppercase tracking-wide mb-3">Notes</p>
                {job.customer_notes && (
                  <div className="mb-2">
                    <p className="text-xs text-muted-foreground font-medium mb-1">Customer Notes</p>
                    <p className="text-sm text-foreground">{job.customer_notes}</p>
                  </div>
                )}
                {job.provider_notes && (
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">Provider Notes</p>
                    <p className="text-sm text-foreground">{job.provider_notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Price breakdown */}
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs font-bold text-foreground uppercase tracking-wide mb-3">Pricing</p>
              <DetailRow label="Quoted Price" value={job.quoted_price ? `$${job.quoted_price}` : null} />
              <DetailRow label="Final Price" value={job.final_price ? `$${job.final_price}` : null} />
              {payment && (
                <>
                  <DetailRow label="Platform Fee" value={payment.platform_fee ? `$${payment.platform_fee.toFixed(2)}` : null} />
                  <DetailRow label="Provider Payout" value={payment.payout_amount ? `$${payment.payout_amount.toFixed(2)}` : null} />
                  <DetailRow label="Payment Status" value={payment.status} />
                </>
              )}
            </div>

            {/* Weather */}
            {job.weather_check_status && (
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-xs font-bold text-foreground uppercase tracking-wide mb-3">Weather</p>
                <DetailRow label="Weather Status" value={job.weather_check_status} />
                {job.weather_check_at && (
                  <DetailRow label="Checked At" value={format(new Date(job.weather_check_at), 'MMM d, h:mm a')} />
                )}
              </div>
            )}

            {/* Status timeline */}
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs font-bold text-foreground uppercase tracking-wide mb-4">Status Timeline</p>
              {job.status === 'cancelled' ? (
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-destructive flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-destructive">Cancelled</p>
                    {job.cancellation_reason && <p className="text-xs text-muted-foreground">{job.cancellation_reason}</p>}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {statusTimeline.map(({ status, done, current }) => (
                    <div key={status} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                        current ? 'bg-primary ring-2 ring-primary/30'
                        : done ? 'bg-primary/60'
                        : 'bg-muted'
                      }`} />
                      <span className={`text-xs capitalize ${
                        current ? 'font-bold text-primary'
                        : done ? 'text-foreground'
                        : 'text-muted-foreground'
                      }`}>
                        {status.replace('_', ' ')}
                      </span>
                      {current && <span className="text-xs text-muted-foreground ml-auto">Current</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {lightboxOpen && hasPhotos && (
        <PhotoLightbox photos={job.completion_photos} onClose={() => setLightboxOpen(false)} />
      )}
      {showPhotoModal && (
        <JobPhotoUploadModal
          job={job}
          onClose={() => setShowPhotoModal(false)}
          onComplete={handleMarkComplete}
        />
      )}
    </div>
  );
}