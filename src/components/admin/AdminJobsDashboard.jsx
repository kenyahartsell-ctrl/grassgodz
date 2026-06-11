import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { format, isBefore, isToday, isFuture, startOfDay, parseISO, differenceInCalendarDays, addDays } from 'date-fns';
import {
  CheckCircle2, AlertCircle, Clock, RefreshCw, ChevronLeft, ChevronRight,
  Plus, DollarSign, CloudRain, CheckCircle, Trash2, Camera, MessageSquare, ImagePlus,
  Banknote, CreditCard, CalendarDays, Sun, Receipt,
} from 'lucide-react';
import BiweeklyPrompt from '@/components/admin/BiweeklyPrompt';
import AdminPhotoUploadModal from '@/components/admin/AdminPhotoUploadModal';
import AdminProviderPayoutModal from '@/components/admin/AdminProviderPayoutModal';
import StatusBadge from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// ─── Helpers ────────────────────────────────────────────────────────────────
function isPaid(job) {
  return !!(job.final_payment_intent_id || job.is_cash_job || (job.final_price && job.platform_fee));
}

function fmtDate(val) {
  if (!val) return '—';
  try { return format(new Date(val), 'MMM d, yyyy'); } catch { return val; }
}

function fmtAmt(val) {
  if (val == null) return '—';
  return `$${Number(val).toFixed(2)}`;
}

// ─── Due Today / Upcoming ────────────────────────────────────────────────────
function ScheduledJobsAtAGlance({ jobs }) {
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const dueToday = jobs.filter(j =>
    !['completed', 'cancelled'].includes(j.status) &&
    j.scheduled_date === todayStr
  );

  const upcoming = jobs
    .filter(j =>
      !['completed', 'cancelled'].includes(j.status) &&
      j.scheduled_date &&
      j.scheduled_date > todayStr
    )
    .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));

  if (dueToday.length === 0 && upcoming.length === 0) return null;

  return (
    <div className="space-y-4 pb-2">
      {/* Due Today */}
      {dueToday.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sun size={15} className="text-amber-500" />
            <h3 className="text-sm font-bold text-foreground">Due Today <span className="font-normal text-muted-foreground ml-1">({dueToday.length})</span></h3>
          </div>
          <div className="bg-card border border-amber-200 rounded-xl overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-amber-100 text-muted-foreground bg-amber-50/50">
                  <th className="text-left px-4 py-2 font-semibold">Customer</th>
                  <th className="text-left px-4 py-2 font-semibold hidden sm:table-cell">Address</th>
                  <th className="text-left px-4 py-2 font-semibold hidden md:table-cell">Provider</th>
                  <th className="text-left px-4 py-2 font-semibold">Service</th>
                  <th className="text-center px-4 py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {dueToday.map((j, i) => (
                  <tr key={j.id} className={`${i < dueToday.length - 1 ? 'border-b border-border' : ''} hover:bg-amber-50/40 transition-colors`}>
                    <td className="px-4 py-2.5 font-medium text-foreground">
                      <Link to={`/jobs/${j.id}`} className="hover:text-primary hover:underline">{j.customer_name || '—'}</Link>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground hidden sm:table-cell max-w-[160px] truncate">{j.address || '—'}</td>
                    <td className="px-4 py-2.5 text-muted-foreground hidden md:table-cell">{j.provider_name || 'Unassigned'}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{j.service_name || '—'}</td>
                    <td className="px-4 py-2.5 text-center"><span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-semibold">{j.status?.replace(/_/g, ' ')}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Completed Jobs ──────────────────────────────────────────────────────────
function AdminPaymentToggle({ job }) {
  const current = job.admin_payment_status || (isPaid(job) ? 'paid' : 'payment_pending');
  const [status, setStatus] = useState(current);
  const [saving, setSaving] = useState(false);

  const toggle = async () => {
    const next = status === 'paid' ? 'payment_pending' : 'paid';
    setSaving(true);
    try {
      await base44.entities.Job.update(job.id, { admin_payment_status: next });
      setStatus(next);
      job.admin_payment_status = next;
      toast.success(`Payment status set to ${next === 'paid' ? 'Paid' : 'Payment Pending'}`);
    } catch {
      toast.error('Failed to update payment status');
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={saving}
      title="Click to toggle payment status"
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[10px] border transition-opacity ${saving ? 'opacity-50' : 'hover:opacity-80 cursor-pointer'} ${
        status === 'paid'
          ? 'bg-green-100 text-green-700 border-green-200'
          : 'bg-amber-100 text-amber-700 border-amber-200'
      }`}
    >
      {status === 'paid' ? <><CheckCircle2 size={10} /> Paid</> : <><Clock size={10} /> Payment Pending</>}
    </button>
  );
}

function CompletedJobsSection({ jobs }) {
  const [uploadJob, setUploadJob] = useState(null);
  const [localJobs, setLocalJobs] = useState(jobs);

  // Keep in sync when parent jobs prop changes
  useState(() => { setLocalJobs(jobs); }, [jobs]);

  const sorted = [...localJobs].sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));

  const handleUploaded = (jobId, newAdminPhotos) => {
    setLocalJobs(prev => prev.map(j => j.id === jobId ? { ...j, admin_photos: newAdminPhotos } : j));
  };

  return (
    <div>
      <h3 className="text-base font-bold text-foreground mb-3">All Completed Jobs ({sorted.length})</h3>
      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">No completed jobs yet.</p>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left px-4 py-2 font-semibold">Customer</th>
                <th className="text-left px-4 py-2 font-semibold hidden sm:table-cell">Address</th>
                <th className="text-left px-4 py-2 font-semibold hidden md:table-cell">Provider</th>
                <th className="text-left px-4 py-2 font-semibold">Completed</th>
                <th className="text-right px-4 py-2 font-semibold">Amount</th>
                <th className="text-center px-4 py-2 font-semibold">Payment Status</th>
                <th className="text-center px-4 py-2 font-semibold">Photos</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((j, i) => (
                <tr key={j.id} className={`${i < sorted.length - 1 ? 'border-b border-border' : ''} hover:bg-muted/30 transition-colors`}>
                  <td className="px-4 py-3 font-medium text-foreground">
                    <Link to={`/jobs/${j.id}`} className="hover:text-primary hover:underline">{j.customer_name || j.customer_email || '—'}</Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell max-w-[160px] truncate">{j.address || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{j.provider_name || 'Unassigned'}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{fmtDate(j.completed_at)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-foreground">{fmtAmt(j.final_price || j.quoted_price)}</td>
                  <td className="px-4 py-3 text-center">
                    <AdminPaymentToggle job={j} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setUploadJob(j)}
                      title="Add admin photos"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                    >
                      <ImagePlus size={10} />
                      {j.admin_photos?.length ? `${j.admin_photos.length}` : 'Add'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {uploadJob && (
        <AdminPhotoUploadModal
          job={uploadJob}
          onClose={() => setUploadJob(null)}
          onUploaded={(newPhotos) => { handleUploaded(uploadJob.id, newPhotos); setUploadJob(null); }}
        />
      )}
    </div>
  );
}

// ─── Outstanding Invoices ────────────────────────────────────────────────────
function OutstandingInvoicesSection({ jobs }) {
  const unpaid = jobs
    .filter(j => !isPaid(j))
    .sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at));

  return (
    <div>
      <h3 className="text-base font-bold text-foreground mb-1">Outstanding Invoices</h3>
      <p className="text-xs text-muted-foreground mb-3">Sorted oldest first — most overdue at top.</p>
      {unpaid.length === 0 ? (
        <div className="flex flex-col items-center py-14 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle2 className="w-8 h-8 text-green-500 mb-2" />
          <p className="font-semibold text-green-700">All jobs are paid!</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left px-4 py-2 font-semibold">Customer</th>
                <th className="text-left px-4 py-2 font-semibold hidden sm:table-cell">Address</th>
                <th className="text-left px-4 py-2 font-semibold hidden md:table-cell">Provider</th>
                <th className="text-left px-4 py-2 font-semibold">Completed</th>
                <th className="text-right px-4 py-2 font-semibold">Amount Due</th>
              </tr>
            </thead>
            <tbody>
              {unpaid.map((j, i) => (
                <tr key={j.id} className={`${i < unpaid.length - 1 ? 'border-b border-border' : ''} bg-amber-50/40 hover:bg-amber-50/80 transition-colors`}>
                  <td className="px-4 py-3 font-medium text-foreground">
                    <Link to={`/jobs/${j.id}`} className="hover:text-primary hover:underline">{j.customer_name || j.customer_email || '—'}</Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell max-w-[160px] truncate">{j.address || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{j.provider_name || 'Unassigned'}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{fmtDate(j.completed_at)}</td>
                  <td className="px-4 py-3 text-right font-bold text-amber-700">{fmtAmt(j.final_price || j.quoted_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Recurring Customers ─────────────────────────────────────────────────────
function RecurringCustomersSection({ scheduledJobs, completedJobs }) {
  const today = startOfDay(new Date());
  const rows = scheduledJobs
    .filter(s => s.status === 'active')
    .map(s => {
      const relatedJobs = completedJobs.filter(j =>
        j.customer_email?.toLowerCase() === s.client_email?.toLowerCase() &&
        j.address?.toLowerCase().includes(s.service_address?.toLowerCase()?.split(' ')[0] || '__')
      );
      const lastJob = relatedJobs.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))[0];
      const nextDate = s.next_release_date ? parseISO(s.next_release_date) : null;
      const isOverdue = nextDate && isBefore(nextDate, today);
      return { s, lastJob, nextDate, isOverdue };
    })
    .sort((a, b) => (a.isOverdue ? -1 : 1));

  return (
    <div>
      <h3 className="text-base font-bold text-foreground mb-1">Recurring Customers ({rows.length})</h3>
      <p className="text-xs text-muted-foreground mb-3">
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-400 mr-1 align-middle"></span>
        Red rows = next scheduled date has passed with no confirmed cut.
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">No active recurring schedules.</p>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left px-4 py-2 font-semibold">Customer</th>
                <th className="text-left px-4 py-2 font-semibold hidden sm:table-cell">Address</th>
                <th className="text-left px-4 py-2 font-semibold">Frequency</th>
                <th className="text-left px-4 py-2 font-semibold hidden md:table-cell">Last Service</th>
                <th className="text-left px-4 py-2 font-semibold">Next Scheduled</th>
                <th className="text-center px-4 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ s, lastJob, nextDate, isOverdue }, i) => (
                <tr key={s.id} className={`${i < rows.length - 1 ? 'border-b border-border' : ''} transition-colors ${isOverdue ? 'bg-red-50 hover:bg-red-50/80' : 'hover:bg-muted/30'}`}>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {isOverdue && <AlertCircle size={11} className="inline text-red-500 mr-1" />}
                    {s.client_name || s.client_email || '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell max-w-[160px] truncate">{s.service_address || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">{s.recurrence?.replace('_', ' ') || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{lastJob ? fmtDate(lastJob.completed_at) : '—'}</td>
                  <td className={`px-4 py-3 font-semibold whitespace-nowrap ${isOverdue ? 'text-red-600' : 'text-foreground'}`}>
                    {nextDate ? fmtDate(nextDate) : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {isOverdue ? (
                      <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold text-[10px]">
                        <AlertCircle size={9} /> Overdue
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold text-[10px]">
                        <RefreshCw size={9} /> On Track
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Provider Payouts Summary ───────────────────────────────────────────────
function ProviderPayoutsSummary({ jobs }) {
  const [payoutJob, setPayoutJob] = useState(null);
  const [localJobs, setLocalJobs] = useState(jobs);
  useState(() => { setLocalJobs(jobs); }, [jobs]);

  const completed = [...localJobs]
    .filter(j => j.status === 'completed')
    .sort((a, b) => (a.provider_name || '').localeCompare(b.provider_name || ''));

  const paidOut   = completed.filter(j => j.provider_payout_status === 'paid_out').length;
  const notPaidOut = completed.filter(j => j.provider_payout_status !== 'paid_out').length;

  const handleSaved = (updated) => {
    setLocalJobs(prev => prev.map(j => j.id === updated.id ? { ...j, ...updated } : j));
  };

  return (
    <div>
      <h3 className='text-base font-bold text-foreground mb-1'>Provider Payouts</h3>
      <div className='flex gap-3 mb-4'>
        <div className='flex-1 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-center'>
          <p className='text-2xl font-bold text-green-700'>{paidOut}</p>
          <p className='text-xs text-green-600 font-semibold mt-0.5'>Paid Out</p>
        </div>
        <div className='flex-1 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-center'>
          <p className='text-2xl font-bold text-amber-700'>{notPaidOut}</p>
          <p className='text-xs text-amber-600 font-semibold mt-0.5'>Not Paid Out</p>
        </div>
      </div>
      {completed.length === 0 ? (
        <p className='text-sm text-muted-foreground text-center py-10'>No completed jobs yet.</p>
      ) : (
        <div className='bg-card border border-border rounded-xl overflow-x-auto'>
          <table className='w-full text-xs'>
            <thead>
              <tr className='border-b border-border text-muted-foreground'>
                <th className='text-left px-4 py-2 font-semibold'>Provider</th>
                <th className='text-left px-4 py-2 font-semibold hidden sm:table-cell'>Customer</th>
                <th className='text-left px-4 py-2 font-semibold hidden md:table-cell'>Completed</th>
                <th className='text-right px-4 py-2 font-semibold'>Job Amount</th>
                <th className='text-right px-4 py-2 font-semibold'>Provider Share</th>
                <th className='text-center px-4 py-2 font-semibold'>Payout Status</th>
                <th className='text-center px-4 py-2 font-semibold'>Receipt</th>
                <th className='text-center px-4 py-2 font-semibold'>Action</th>
              </tr>
            </thead>
            <tbody>
              {completed.map((j, i) => {
                const amount = j.final_price || j.quoted_price;
                const share  = amount ? (Number(amount) * 0.9).toFixed(2) : null;
                const isPaidOut = j.provider_payout_status === 'paid_out';
                return (
                  <tr key={j.id} className={`${i < completed.length - 1 ? 'border-b border-border' : ''} ${isPaidOut ? 'hover:bg-muted/20' : 'bg-amber-50/30 hover:bg-amber-50/60'} transition-colors`}>
                    <td className='px-4 py-3 font-semibold text-foreground'>{j.provider_name || 'Unassigned'}</td>
                    <td className='px-4 py-3 text-muted-foreground hidden sm:table-cell'>{j.customer_name || '—'}</td>
                    <td className='px-4 py-3 text-muted-foreground hidden md:table-cell whitespace-nowrap'>{j.completed_at ? new Date(j.completed_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '—'}</td>
                    <td className='px-4 py-3 text-right font-semibold text-foreground'>{amount ? `$${Number(amount).toFixed(2)}` : '—'}</td>
                    <td className='px-4 py-3 text-right font-bold text-green-700'>{share ? `$${share}` : '—'}</td>
                    <td className='px-4 py-3 text-center'>
                      {isPaidOut ? (
                        <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold text-[10px] border border-green-200'>
                          <CheckCircle2 size={9} /> Paid Out
                        </span>
                      ) : (
                        <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold text-[10px] border border-amber-200'>
                          <Clock size={9} /> Pending
                        </span>
                      )}
                      {isPaidOut && j.provider_payout_date && (
                        <p className='text-[10px] text-muted-foreground mt-0.5'>{new Date(j.provider_payout_date).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</p>
                      )}
                    </td>
                    <td className='px-4 py-3 text-center'>
                      {j.provider_payout_receipt?.url ? (
                        <a href={j.provider_payout_receipt.url} target='_blank' rel='noopener noreferrer'
                          className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-200 hover:bg-blue-100'>
                          <Receipt size={9} /> View
                        </a>
                      ) : (
                        <span className='text-[10px] text-muted-foreground'>—</span>
                      )}
                    </td>
                    <td className='px-4 py-3 text-center'>
                      <button
                        onClick={() => setPayoutJob(j)}
                        className='px-2 py-1 text-[10px] font-semibold bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors'
                      >
                        {isPaidOut ? 'Edit' : 'Record Payout'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {payoutJob && (
        <AdminProviderPayoutModal
          job={payoutJob}
          onClose={() => setPayoutJob(null)}
          onSaved={(updated) => { handleSaved(updated); setPayoutJob(null); }}
        />
      )}
    </div>
  );
}
// ─── Calendar ────────────────────────────────────────────────────────────────
function CalendarSection({ scheduledJobs, allJobs }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const eventMap = {};
  scheduledJobs.filter(s => s.status === 'active').forEach(s => {
    if (s.next_release_date) {
      const key = s.next_release_date;
      if (!eventMap[key]) eventMap[key] = [];
      eventMap[key].push({ label: s.client_name || s.client_email, type: 'scheduled', color: 'bg-blue-100 text-blue-700' });
    }
  });
  allJobs.filter(j => j.status === 'completed' && j.recurrence !== 'one_time').forEach(j => {
    if (j.scheduled_date) {
      const key = j.scheduled_date;
      if (!eventMap[key]) eventMap[key] = [];
      eventMap[key].push({ label: j.customer_name || j.customer_email, type: 'completed', color: 'bg-green-100 text-green-700' });
    }
  });
  allJobs.filter(j => !['completed', 'cancelled'].includes(j.status) && j.recurrence !== 'one_time').forEach(j => {
    if (j.scheduled_date) {
      const key = j.scheduled_date;
      if (!eventMap[key]) eventMap[key] = [];
      eventMap[key].push({ label: j.customer_name || j.customer_email, type: 'pending', color: 'bg-amber-100 text-amber-700' });
    }
  });

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-foreground">{format(currentMonth, 'MMMM yyyy')}</h3>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><ChevronLeft size={16} /></button>
          <button onClick={() => setCurrentMonth(new Date())} className="text-xs px-2 py-1 rounded-lg border border-input hover:bg-muted transition-colors">Today</button>
          <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><ChevronRight size={16} /></button>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 text-[10px] mb-3">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-100 border border-blue-200 inline-block"></span> Scheduled</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-green-100 border border-green-200 inline-block"></span> Completed</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-100 border border-amber-200 inline-block"></span> Pending</span>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-2">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="min-h-[64px] border-b border-r border-border/40 bg-muted/10" />;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const events = eventMap[dateStr] || [];
            const isToday = dateStr === todayStr;
            return (
              <div key={dateStr} className={`min-h-[64px] p-1.5 border-b border-r border-border/40 ${isToday ? 'bg-primary/5' : ''}`}>
                <span className={`text-[11px] font-semibold inline-flex w-5 h-5 rounded-full items-center justify-center ${isToday ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>{day}</span>
                <div className="space-y-0.5 mt-0.5">
                  {events.slice(0, 3).map((ev, ei) => (
                    <div key={ei} className={`text-[9px] font-medium px-1 py-0.5 rounded truncate ${ev.color}`}>{ev.label}</div>
                  ))}
                  {events.length > 3 && <div className="text-[9px] text-muted-foreground px-1">+{events.length - 3} more</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Job Card (shared between columns) ───────────────────────────────────────
function JobCard({ job: j, handlers, isCompleted }) {
  const [showBiweekly, setShowBiweekly] = useState(isCompleted);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [localPayoutStatus, setLocalPayoutStatus] = useState(j.provider_payout_status || 'pending');
  const isCash = j.cash_paid || j.payment_method === 'cash';
  const price = j.final_price || j.quoted_price;
  const payStatus = j.admin_payment_status || (isPaid(j) ? 'paid' : 'payment_pending');

  return (
    <div className="bg-card border border-border rounded-xl px-4 py-3 flex flex-col gap-2 shadow-sm">
      {/* Top row: customer + payment type badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{j.service_name || '—'}</p>
          <p className="text-xs text-muted-foreground truncate">{j.customer_name || '—'}</p>
        </div>
        {isCash
          ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold text-[10px] flex-shrink-0"><Banknote size={9} /> Cash</span>
          : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold text-[10px] flex-shrink-0"><CreditCard size={9} /> Card</span>
        }
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
        <span>{j.provider_name || 'Unassigned'}</span>
        <span>·</span>
        <span>{j.scheduled_date ? new Date(j.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</span>
        {price != null && <><span>·</span><span className="font-semibold text-foreground">{fmtAmt(price)}</span></>}
      </div>

      {/* Status badges */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <StatusBadge status={j.status} />
        {isCompleted && (
                  <AdminPaymentToggle job={j} />
                )}
                {isCompleted && (
                  <button
                    onClick={() => setShowPayoutModal(true)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[10px] border transition-colors cursor-pointer hover:opacity-80 ${localPayoutStatus === 'paid_out' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-orange-100 text-orange-700 border-orange-200'}`}
                  >
                    <Receipt size={10} />
                    {localPayoutStatus === 'paid_out' ? 'Payout ✓' : 'Payout Pending'}
                  </button>
                )}
      </div>

      {j.status === 'cancelled' && j.cancellation_reason && (
        <p className="text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-2 py-1">
          <span className="font-semibold">Reason:</span> {j.cancellation_reason}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <Link to={`/jobs/${j.id}`} className="px-2 py-1 text-[11px] font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors">View</Link>
        <button onClick={() => handlers.onEdit(j)} className="px-2 py-1 text-[11px] font-medium bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors">Edit</button>
        <button onClick={() => handlers.onEditPrice(j)} className="px-2 py-1 text-[11px] font-medium bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1">
          <DollarSign size={11} /> {price ? fmtAmt(price) : 'Price'}
        </button>
        {!isCompleted && (
          <>
            <button onClick={() => handlers.onAssign(j)} className="px-2 py-1 text-[11px] font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">Assign</button>
            {j.provider_id && (
              <button onClick={() => handlers.onUnassign(j)} className="px-2 py-1 text-[11px] font-medium bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors">Unassign</button>
            )}
            {!['requested'].includes(j.status) && (
              <button onClick={() => handlers.onWeather(j)} className="px-2 py-1 text-[11px] font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1">
                <CloudRain size={11} /> Weather
              </button>
            )}
            <button onClick={() => handlers.onComplete(j)} className="px-2 py-1 text-[11px] font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-1">
              <CheckCircle size={11} /> Complete
            </button>
            <button onClick={() => handlers.onCancel(j)} className="px-2 py-1 text-[11px] font-medium bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors">Cancel</button>
          </>
        )}
        {isCompleted && j.completion_photos && Object.keys(j.completion_photos).length > 0 && (
          <button onClick={() => handlers.onPhotos(j.completion_photos)} className="px-2 py-1 text-[11px] font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1">
            <Camera size={11} /> Photos
          </button>
        )}
        <button onClick={() => handlers.onChat(j)} className="px-2 py-1 text-[11px] font-medium bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors flex items-center gap-1">
          <MessageSquare size={11} /> Chat
        </button>
        <button onClick={() => handlers.onDelete(j)} className="px-2 py-1 text-[11px] font-medium bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-1">
          <Trash2 size={11} /> Delete
        </button>
      </div>

      {/* Provider payout modal */}
            {showPayoutModal && (
              <AdminProviderPayoutModal
                job={j}
                onClose={() => setShowPayoutModal(false)}
                onSaved={(updated) => { setLocalPayoutStatus(updated.provider_payout_status || 'pending'); setShowPayoutModal(false); }}
              />
            )}
      
            {/* Bi-weekly prompt for newly completed jobs */}
      {isCompleted && showBiweekly && (
        <BiweeklyPrompt job={j} onDismiss={() => setShowBiweekly(false)} />
      )}
    </div>
  );
}

// ─── Extra TABS (below columns) ───────────────────────────────────────────────
const EXTRA_TABS = [
  { key: 'outstanding', label: 'Outstanding' },
  { key: 'recurring', label: 'Recurring' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'payouts', label: 'Payouts' },
];

// ─── Main Export ─────────────────────────────────────────────────────────────
export default function AdminJobsDashboard({ jobs, setJobs, handlers }) {
  const [activeTab, setActiveTab] = useState(null);
  const [scheduledJobs, setScheduledJobs] = useState([]);
  const [loadingScheduled, setLoadingScheduled] = useState(true);
  const [pendingFilter, setPendingFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    base44.entities.ScheduledJob.list('-created_date', 100)
      .then(setScheduledJobs)
      .finally(() => setLoadingScheduled(false));
  }, []);

  const pendingStatuses = ['pending_deposit', 'pending_payment', 'requested', 'quoted', 'accepted', 'scheduled', 'in_progress', 'cancelled'];
  const pendingJobs = jobs
    .filter(j => j.status !== 'completed')
    .filter(j => {
      // Biweekly jobs only appear after release
      if (j.recurrence === 'biweekly' && !j.biweekly_released) return false;
      // Date filter: show jobs for selected date, or unscheduled jobs
      if (j.scheduled_date && j.scheduled_date !== selectedDate) return false;
      return pendingFilter === 'all' || j.status === pendingFilter;
    })
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  const biweeklyHiddenCount = jobs.filter(j => j.recurrence === 'biweekly' && !j.biweekly_released && !['completed','cancelled'].includes(j.status)).length;
  const completedJobs = jobs
    .filter(j => j.status === 'completed')
    .sort((a, b) => new Date(b.completed_at || b.updated_date) - new Date(a.completed_at || a.updated_date));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-foreground">Jobs</h2>
          <p className="text-sm text-muted-foreground">{pendingJobs.length} pending · {completedJobs.length} completed</p>
        </div>
        <Button size="sm" onClick={handlers.onAddJob} className="flex items-center gap-2 flex-shrink-0">
          <Plus size={14} /> Add Job
        </Button>
      </div>

      {/* Due Today + Upcoming */}
      <ScheduledJobsAtAGlance jobs={jobs} />

      {/* Two-column board */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

        {/* Date navigator */}
            <div className="col-span-full flex items-center gap-2 bg-muted/50 border border-border rounded-xl px-4 py-2.5">
              <button onClick={() => setSelectedDate(d => format(addDays(new Date(d + "T12:00:00"), -1), "yyyy-MM-dd"))}
                className="p-1.5 rounded-lg hover:bg-card transition-colors"><ChevronLeft size={16} /></button>
              <button onClick={() => setSelectedDate(format(new Date(), "yyyy-MM-dd"))}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${selectedDate === format(new Date(),"yyyy-MM-dd") ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}>
                Today
              </button>
              <span className="flex-1 text-center text-sm font-bold text-foreground">
                {format(new Date(selectedDate + "T12:00:00"), "EEEE, MMMM d")}
              </span>
              <button onClick={() => setSelectedDate(d => format(addDays(new Date(d + "T12:00:00"), 1), "yyyy-MM-dd"))}
                className="p-1.5 rounded-lg hover:bg-card transition-colors"><ChevronRight size={16} /></button>
            </div>
            {biweeklyHiddenCount > 0 && (
              <button onClick={() => setActiveTab("calendar")} className="w-full text-xs text-center text-primary font-semibold py-1.5 bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors">
                {biweeklyHiddenCount} biweekly job{biweeklyHiddenCount > 1 ? "s" : ""} hidden — view & release on Calendar ↗
              </button>
            )}
      
            {/* ── Pending Column ── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wide flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
              Pending <span className="font-normal text-muted-foreground normal-case tracking-normal ml-1">({pendingJobs.length})</span>
            </h3>
          </div>
          {/* Sub-filter pills */}
          <div className="flex flex-wrap gap-1">
            {['all', ...pendingStatuses].map(s => (
              <button
                key={s}
                onClick={() => setPendingFilter(s)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize transition-colors ${
                  pendingFilter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {s === 'all' ? 'All' : s.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 max-h-[calc(100vh-260px)] overflow-y-auto pr-0.5">
            {pendingJobs.length === 0 ? (
              <div className="text-center py-10 bg-card border border-border rounded-xl">
                <p className="text-sm text-muted-foreground">No pending jobs.</p>
              </div>
            ) : (
              pendingJobs.map(j => <JobCard key={j.id} job={j} handlers={handlers} isCompleted={false} />)
            )}
          </div>
        </div>

        {/* ── Completed Column ── */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wide flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"></span>
            Completed <span className="font-normal text-muted-foreground normal-case tracking-normal ml-1">({completedJobs.length})</span>
          </h3>
          <div className="flex flex-col gap-2 max-h-[calc(100vh-260px)] overflow-y-auto pr-0.5">
            {completedJobs.length === 0 ? (
              <div className="text-center py-10 bg-card border border-border rounded-xl">
                <p className="text-sm text-muted-foreground">No completed jobs yet.</p>
              </div>
            ) : (
              completedJobs.map(j => <JobCard key={j.id} job={j} handlers={handlers} isCompleted={true} />)
            )}
          </div>
        </div>
      </div>

      {/* Extra tools (Outstanding / Recurring / Calendar) */}
      <div className="border-t border-border pt-4">
        <div className="flex gap-1 bg-muted/40 p-1 rounded-xl w-full overflow-x-auto mb-4">
          {EXTRA_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(activeTab === t.key ? null : t.key)}
              className={`flex-1 whitespace-nowrap text-xs font-semibold px-3 py-2 rounded-lg transition-all ${
                activeTab === t.key ? 'bg-card shadow text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {activeTab === 'outstanding' && <OutstandingInvoicesSection jobs={completedJobs} />}
        {activeTab === 'recurring' && !loadingScheduled && (
          <RecurringCustomersSection scheduledJobs={scheduledJobs} completedJobs={completedJobs} />
        )}
        {activeTab === 'payouts' && <ProviderPayoutsSummary jobs={jobs} />}
        {activeTab === 'calendar' && !loadingScheduled && (
          <CalendarSection scheduledJobs={scheduledJobs} allJobs={jobs} />
        )}
        {(activeTab === 'recurring' || activeTab === 'calendar') && loadingScheduled && (
          <p className="text-sm text-muted-foreground text-center py-10">Loading…</p>
        )}
      </div>
    </div>
  );
}