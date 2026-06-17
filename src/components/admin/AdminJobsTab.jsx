import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import {
  Plus, ChevronDown, ChevronUp, Clock, CheckCircle2, AlertCircle,
  MapPin, User, DollarSign, Calendar, Loader2, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/shared/StatusBadge';
import AdminAssignProviderModal from './AdminAssignProviderModal';
import AdminAddJobModal from './AdminAddJobModal';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtAmt(v) { return v != null ? `$${Number(v).toFixed(2)}` : '—'; }
function fmtDate(v) {
  if (!v) return '—';
  try { return new Date(v + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return v; }
}

function CountdownTimer({ job }) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    const calc = () => {
      // Deadline = accepted_at + 24h, or scheduled date+time, whichever is sooner
      let deadlines = [];
      if (job.accepted_at) {
        deadlines.push(new Date(job.accepted_at).getTime() + 24 * 60 * 60 * 1000);
      }
      if (job.scheduled_date) {
        const base = job.scheduled_date + 'T' + (job.scheduled_time || '09:00') + ':00';
        deadlines.push(new Date(base).getTime());
      }
      if (deadlines.length === 0) { setRemaining(''); return; }
      const deadline = Math.min(...deadlines);
      const diff = deadline - Date.now();
      if (diff <= 0) { setRemaining('Overdue'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setRemaining(`${h}h ${m}m`);
    };
    calc();
    const id = setInterval(calc, 60000);
    return () => clearInterval(id);
  }, [job]);

  if (!remaining) return null;
  const isOverdue = remaining === 'Overdue';
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
      isOverdue ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-100 text-amber-700 border-amber-200'
    }`}>
      <Clock size={9} /> {isOverdue ? 'Overdue' : `${remaining} left`}
    </span>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ color, title, count, collapsible, collapsed, onToggle }) {
  const styles = {
    green: 'bg-emerald-50 border-emerald-300 text-emerald-800',
    amber: 'bg-amber-50 border-amber-300 text-amber-800',
    gray: 'bg-gray-50 border-gray-300 text-gray-700',
  };
  const dot = { green: 'bg-emerald-500', amber: 'bg-amber-500', gray: 'bg-gray-400' };

  return (
    <button
      onClick={collapsible ? onToggle : undefined}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border font-bold text-sm ${styles[color]} ${collapsible ? 'cursor-pointer hover:opacity-90' : 'cursor-default'} transition-opacity`}
    >
      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dot[color]}`} />
      <span className="flex-1 text-left">{title}</span>
      <span className="font-normal opacity-70 text-xs">({count})</span>
      {collapsible && (collapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />)}
    </button>
  );
}

// ─── Available Job Card ───────────────────────────────────────────────────────
function AvailableJobCard({ job, providers, onAssigned }) {
  const [assigning, setAssigning] = useState(false);
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{job.customer_name || '—'}</p>
          <p className="text-xs text-gray-500">{job.service_name || '—'}</p>
        </div>
        <span className="text-base font-bold text-emerald-700 flex-shrink-0">{fmtAmt(job.quoted_price)}</span>
      </div>
      <div className="space-y-1 text-xs text-gray-500 mb-3">
        <div className="flex items-center gap-1.5"><MapPin size={11} /> <span className="truncate">{job.address || '—'}</span></div>
        <div className="flex items-center gap-1.5"><Calendar size={11} /> {fmtDate(job.scheduled_date)} {job.scheduled_time ? `@ ${job.scheduled_time}` : ''}</div>
        {job.customer_notes && <p className="text-gray-400 italic truncate">{job.customer_notes}</p>}
      </div>
      <div className="flex gap-2">
        <Link to={`/jobs/${job.id}`} className="flex-1 text-center py-1.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">View</Link>
        <button
          onClick={() => setShowModal(true)}
          className="flex-1 py-1.5 text-xs font-semibold bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-colors"
        >
          Assign to Provider
        </button>
      </div>
      {showModal && (
        <AdminAssignProviderModal
          job={job}
          onClose={() => setShowModal(false)}
          onAssigned={() => { setShowModal(false); onAssigned(); toast.success(`Job assigned successfully!`); }}
        />
      )}
    </div>
  );
}

// ─── Active Job Card ──────────────────────────────────────────────────────────
function ActiveJobCard({ job, onAssigned, handlers }) {
  const [showModal, setShowModal] = useState(false);
  return (
    <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{job.customer_name || '—'}</p>
          <p className="text-xs text-gray-500">{job.service_name || '—'}</p>
        </div>
        <span className="text-base font-bold text-amber-700 flex-shrink-0">{fmtAmt(job.quoted_price)}</span>
      </div>
      <div className="space-y-1 text-xs text-gray-500 mb-2">
        <div className="flex items-center gap-1.5"><User size={11} /> Provider: <span className="font-semibold text-gray-700 ml-0.5">{job.provider_name || 'Unassigned'}</span></div>
        <div className="flex items-center gap-1.5"><Calendar size={11} /> {fmtDate(job.scheduled_date)} {job.scheduled_time ? `@ ${job.scheduled_time}` : ''}</div>
        <div className="flex items-center gap-1.5"><MapPin size={11} /> <span className="truncate">{job.address || '—'}</span></div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        <StatusBadge status={job.status} />
        <CountdownTimer job={job} />
      </div>
      <div className="flex gap-2">
        <Link to={`/jobs/${job.id}`} className="flex-1 text-center py-1.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">View</Link>
        <button onClick={() => handlers.onComplete(job)} className="flex-1 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Complete</button>
        <button onClick={() => handlers.onCancel(job)} className="flex-1 py-1.5 text-xs font-semibold bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors">Cancel</button>
      </div>
    </div>
  );
}

// ─── Completed Job Row ────────────────────────────────────────────────────────
function CompletedJobRow({ job, invoices }) {
  const hasInvoice = invoices.some(inv => inv.job_id === job.id);
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-900">{job.customer_name || '—'}</p>
        <p className="text-xs text-gray-500">{job.service_name} · {job.provider_name || 'No provider'}</p>
      </div>
      <span className="text-xs text-gray-400 hidden sm:block">{fmtDate(job.completed_at || job.updated_date)}</span>
      <span className="text-xs font-bold text-gray-800">{fmtAmt(job.final_price || job.quoted_price)}</span>
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
        hasInvoice ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'
      }`}>
        {hasInvoice ? '✓ Invoice sent' : 'No invoice'}
      </span>
      <Link to={`/jobs/${job.id}`} className="text-xs text-primary underline hover:no-underline">View</Link>
    </div>
  );
}

// ─── Main Jobs Tab ────────────────────────────────────────────────────────────
export default function AdminJobsTab({ jobs, setJobs, providers, handlers }) {
  const [invoices, setInvoices] = useState([]);
  const [showAddJob, setShowAddJob] = useState(false);
  const [completedCollapsed, setCompletedCollapsed] = useState(true);

  useEffect(() => {
    base44.entities.Invoice.list('-created_date', 200).then(setInvoices).catch(() => {});
  }, []);

  const availableJobs = jobs.filter(j =>
    ['requested', 'pending_payment', 'pending_deposit'].includes(j.status) && !j.provider_id && !j.provider_email
  );
  const activeJobs = jobs.filter(j =>
    ['accepted', 'scheduled', 'in_progress', 'quoted'].includes(j.status)
  ).sort((a, b) => new Date(a.scheduled_date || 0) - new Date(b.scheduled_date || 0));
  const completedJobs = jobs.filter(j => j.status === 'completed')
    .sort((a, b) => new Date(b.completed_at || b.updated_date) - new Date(a.completed_at || a.updated_date));

  const refreshJobs = async () => {
    const all = await base44.entities.Job.list('-created_date', 100);
    setJobs(all);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Jobs</h2>
          <p className="text-sm text-muted-foreground">
            {availableJobs.length} available · {activeJobs.length} active · {completedJobs.length} completed
          </p>
        </div>
        <Button onClick={() => setShowAddJob(true)} className="flex items-center gap-2">
          <Plus size={14} /> Add Job
        </Button>
      </div>

      {/* ── Available Pool ── */}
      <div className="space-y-3">
        <SectionHeader color="green" title="Available Pool — Open for Claims" count={availableJobs.length} />
        {availableJobs.length === 0 ? (
          <div className="text-center py-10 bg-white border border-dashed border-emerald-200 rounded-xl">
            <p className="text-sm text-gray-400">No jobs in the available pool.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {availableJobs.map(j => (
              <AvailableJobCard key={j.id} job={j} providers={providers} onAssigned={refreshJobs} />
            ))}
          </div>
        )}
      </div>

      {/* ── Active / In Progress ── */}
      <div className="space-y-3">
        <SectionHeader color="amber" title="Active / In Progress" count={activeJobs.length} />
        {activeJobs.length === 0 ? (
          <div className="text-center py-10 bg-white border border-dashed border-amber-200 rounded-xl">
            <p className="text-sm text-gray-400">No active jobs right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeJobs.map(j => (
              <ActiveJobCard key={j.id} job={j} onAssigned={refreshJobs} handlers={handlers} />
            ))}
          </div>
        )}
      </div>

      {/* ── Completed ── */}
      <div className="space-y-3">
        <SectionHeader
          color="gray"
          title="Completed This History"
          count={completedJobs.length}
          collapsible
          collapsed={completedCollapsed}
          onToggle={() => setCompletedCollapsed(c => !c)}
        />
        {!completedCollapsed && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden divide-y divide-gray-100">
            {completedJobs.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">No completed jobs yet.</p>
            ) : (
              completedJobs.map(j => <CompletedJobRow key={j.id} job={j} invoices={invoices} />)
            )}
          </div>
        )}
      </div>

      {/* Add Job Modal */}
      {showAddJob && (
        <AdminAddJobModal
          providers={providers}
          existingJobs={jobs}
          onClose={() => setShowAddJob(false)}
          onJobAdded={async () => { await refreshJobs(); setShowAddJob(false); }}
        />
      )}
    </div>
  );
}