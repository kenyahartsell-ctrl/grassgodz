import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Archive, RotateCcw, Trash2, MapPin, User, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatusBadge from '@/components/shared/StatusBadge';

function fmtDate(v) {
  if (!v) return '—';
  try { return new Date(v + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return v; }
}

export default function AdminArchivedJobsPanel() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Job.filter({ status: 'cancelled' });
      setJobs(data.sort((a, b) => new Date(b.cancelled_at || b.updated_date) - new Date(a.cancelled_at || a.updated_date)));
    } catch { toast.error('Failed to load archived jobs.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleRestore = async (job) => {
    if (!window.confirm(`Restore this job for ${job.customer_name} back to "requested" status?`)) return;
    try {
      await base44.entities.Job.update(job.id, { status: 'requested', cancelled_by: null, cancelled_at: null, cancellation_reason: null });
      toast.success('Job restored.');
      setJobs(prev => prev.filter(j => j.id !== job.id));
    } catch { toast.error('Failed to restore job.'); }
  };

  const handleDelete = async (job) => {
    if (!window.confirm(`Permanently delete this job for ${job.customer_name}? This cannot be undone.`)) return;
    try {
      await base44.entities.Job.delete(job.id);
      toast.success('Job permanently deleted.');
      setJobs(prev => prev.filter(j => j.id !== job.id));
    } catch { toast.error('Failed to delete job.'); }
  };

  const filtered = jobs.filter(j => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (j.customer_name || '').toLowerCase().includes(q) ||
      (j.provider_name || '').toLowerCase().includes(q) ||
      (j.service_name || '').toLowerCase().includes(q) ||
      (j.address || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Archive size={20} className="text-muted-foreground" /> Archived Jobs
          </h2>
          <p className="text-sm text-muted-foreground">{jobs.length} cancelled job{jobs.length !== 1 ? 's' : ''} · Can be restored or permanently deleted</p>
        </div>
      </div>

      <input
        className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        placeholder="Search by customer, provider, service, or address..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-card border border-dashed border-border rounded-xl">
          <Archive className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-muted-foreground font-medium">No archived jobs{search ? ' match your search' : ''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(job => (
            <div key={job.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-semibold text-sm text-foreground">{job.customer_name || '—'}</p>
                    <StatusBadge status={job.status} />
                    {job.cancelled_by && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                        by {job.cancelled_by}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-1.5">{job.service_name || '—'}</p>
                  <div className="space-y-0.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5"><MapPin size={10} /> <span className="truncate">{job.address || '—'}</span></div>
                    <div className="flex items-center gap-1.5"><User size={10} /> {job.provider_name || 'No provider'}</div>
                    <div className="flex items-center gap-1.5"><Calendar size={10} /> Scheduled: {fmtDate(job.scheduled_date)}</div>
                    {job.cancellation_reason && <p className="italic text-muted-foreground/70 mt-1">Reason: {job.cancellation_reason}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link to={`/jobs/${job.id}`} className="px-3 py-1.5 text-xs font-medium bg-muted rounded-lg hover:bg-muted/80 transition-colors">View</Link>
                  <button
                    onClick={() => handleRestore(job)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
                  >
                    <RotateCcw size={11} /> Restore
                  </button>
                  <button
                    onClick={() => handleDelete(job)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={11} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}