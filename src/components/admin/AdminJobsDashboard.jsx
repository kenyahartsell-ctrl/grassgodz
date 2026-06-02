import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { format, isBefore, startOfDay, parseISO } from 'date-fns';
import {
  CheckCircle2, AlertCircle, Clock, RefreshCw, ChevronLeft, ChevronRight,
  Plus, DollarSign, CloudRain, CheckCircle, Trash2, Camera, MessageSquare,
} from 'lucide-react';
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

// ─── All Jobs (management) ───────────────────────────────────────────────────
function AllJobsSection({ jobs, setJobs, handlers }) {
  const [statusFilter, setStatusFilter] = useState('all');

  const statuses = ['all', 'pending_deposit', 'requested', 'quoted', 'accepted', 'scheduled', 'in_progress', 'completed', 'cancelled'];

  const filtered = statusFilter === 'all' ? jobs : jobs.filter(j => j.status === statusFilter);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-foreground">All Jobs ({filtered.length})</h3>
        <Button size="sm" onClick={handlers.onAddJob} className="flex items-center gap-2">
          <Plus size={14} /> Add Job
        </Button>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize transition-colors ${
              statusFilter === s
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {s === 'all' ? 'All' : s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">No jobs found.</p>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {filtered.map((j, i) => (
            <div key={j.id} className={`px-5 py-4 flex flex-col gap-2 ${i < filtered.length - 1 ? 'border-b border-border' : ''}`}>
              {/* Header row */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground">{j.service_name}</p>
                  <p className="text-xs text-muted-foreground">{j.customer_name}</p>
                </div>
                {/* Payment pill */}
                <div className="flex-shrink-0">
                  {j.status === 'completed' ? (
                    isPaid(j) ? (
                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold text-[10px]">
                        <CheckCircle2 size={10} /> Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold text-[10px]">
                        <Clock size={10} /> Outstanding
                      </span>
                    )
                  ) : null}
                </div>
              </div>

              {/* Status badges */}
              <div className="flex flex-wrap gap-1.5">
                <StatusBadge status={j.status} />
                {j.cash_paid && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-green-100 text-green-800 border-green-200">
                    💵 Cash Paid
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to={`/jobs/${j.id}`}
                  className="px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                >
                  View
                </Link>
                <button onClick={() => handlers.onEdit(j)} className="px-2.5 py-1 text-xs font-medium bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors">Edit</button>
                <button
                  onClick={() => handlers.onEditPrice(j)}
                  className="px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1"
                >
                  <DollarSign size={12} /> {j.quoted_price ? `$${j.quoted_price}` : 'Set Price'}
                </button>
                {!['completed', 'cancelled'].includes(j.status) && (
                  <button onClick={() => handlers.onAssign(j)} className="px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">Assign</button>
                )}
                {j.provider_id && !['completed', 'cancelled'].includes(j.status) && (
                  <button
                    onClick={() => handlers.onUnassign(j)}
                    className="px-2.5 py-1 text-xs font-medium bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors"
                  >
                    Unassign
                  </button>
                )}
                {!['completed', 'cancelled', 'requested'].includes(j.status) && (
                  <button
                    onClick={() => handlers.onWeather(j)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <CloudRain size={12} /> Weather
                  </button>
                )}
                {!['completed', 'cancelled'].includes(j.status) && (
                  <button onClick={() => handlers.onComplete(j)} className="px-2.5 py-1 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-1">
                    <CheckCircle size={12} /> Complete
                  </button>
                )}
                {!['completed', 'cancelled'].includes(j.status) && (
                  <button onClick={() => handlers.onCancel(j)} className="px-2.5 py-1 text-xs font-medium bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors">Cancel</button>
                )}
                <button onClick={() => handlers.onDelete(j)} className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-1">
                  <Trash2 size={12} /> Delete
                </button>
                {j.status === 'completed' && j.completion_photos && Object.keys(j.completion_photos).length > 0 && (
                  <button
                    onClick={() => handlers.onPhotos(j.completion_photos)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Camera size={12} /> Photos
                  </button>
                )}
                <button
                  onClick={() => handlers.onChat(j)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <MessageSquare size={12} /> Chat
                </button>
              </div>

              {/* Footer meta */}
              <p className="text-xs text-muted-foreground">
                {j.provider_name || 'Unassigned'} · {j.scheduled_date ? new Date(j.scheduled_date).toLocaleDateString() : '—'} · {j.zip_code || '—'}
                {j.final_price || j.quoted_price ? ` · ${fmtAmt(j.final_price || j.quoted_price)}` : ''}
              </p>
              {j.status === 'cancelled' && j.cancellation_reason && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-2.5 py-1.5 mt-1">
                  <span className="font-semibold">Reason:</span> {j.cancellation_reason}
                  {j.cancelled_by && <span className="text-red-400 ml-1">· by {j.cancelled_by}</span>}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Completed Jobs ──────────────────────────────────────────────────────────
function CompletedJobsSection({ jobs }) {
  const sorted = [...jobs].sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));
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
                <th className="text-center px-4 py-2 font-semibold">Payment</th>
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
                    {isPaid(j) ? (
                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold text-[10px]">
                        <CheckCircle2 size={10} /> Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold text-[10px]">
                        <Clock size={10} /> Outstanding
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

// ─── TABS ─────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'all', label: 'All Jobs' },
  { key: 'completed', label: 'Completed' },
  { key: 'outstanding', label: 'Outstanding' },
  { key: 'recurring', label: 'Recurring' },
  { key: 'calendar', label: 'Calendar' },
];

// ─── Main Export ─────────────────────────────────────────────────────────────
export default function AdminJobsDashboard({ jobs, setJobs, handlers }) {
  const [activeTab, setActiveTab] = useState('all');
  const [scheduledJobs, setScheduledJobs] = useState([]);
  const [loadingScheduled, setLoadingScheduled] = useState(true);

  useEffect(() => {
    base44.entities.ScheduledJob.list('-created_date', 100)
      .then(setScheduledJobs)
      .finally(() => setLoadingScheduled(false));
  }, []);

  const completedJobs = jobs.filter(j => j.status === 'completed');

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-foreground">Jobs & Invoices</h2>
        <p className="text-sm text-muted-foreground">Manage all jobs, outstanding invoices, recurring schedules, and calendar.</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-muted/40 p-1 rounded-xl w-full overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-1 whitespace-nowrap text-xs font-semibold px-3 py-2 rounded-lg transition-all ${
              activeTab === t.key ? 'bg-card shadow text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'all' && <AllJobsSection jobs={jobs} setJobs={setJobs} handlers={handlers} />}
      {activeTab === 'completed' && <CompletedJobsSection jobs={completedJobs} />}
      {activeTab === 'outstanding' && <OutstandingInvoicesSection jobs={completedJobs} />}
      {activeTab === 'recurring' && !loadingScheduled && (
        <RecurringCustomersSection scheduledJobs={scheduledJobs} completedJobs={completedJobs} />
      )}
      {activeTab === 'calendar' && !loadingScheduled && (
        <CalendarSection scheduledJobs={scheduledJobs} allJobs={jobs} />
      )}
      {(activeTab === 'recurring' || activeTab === 'calendar') && loadingScheduled && (
        <p className="text-sm text-muted-foreground text-center py-10">Loading…</p>
      )}
    </div>
  );
}