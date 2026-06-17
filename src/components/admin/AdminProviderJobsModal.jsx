import { useState, useEffect } from 'react';
import { X, MapPin, Calendar, CheckCircle2, Clock, Image, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import StatusBadge from '@/components/shared/StatusBadge';
import JobPhotoUploadModal from '@/components/provider/JobPhotoUploadModal';

function fmtDate(v) {
  if (!v) return '—';
  try { return new Date(v + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return v; }
}

export default function AdminProviderJobsModal({ provider, onClose, onJobUpdated }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completingJob, setCompletingJob] = useState(null);
  const [photoJob, setPhotoJob] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const all = await base44.entities.Job.filter({ provider_email: provider.user_email });
        // Sort: active first, then by scheduled date
        const order = { in_progress: 0, accepted: 1, scheduled: 2, requested: 3, completed: 4, cancelled: 5 };
        all.sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9) || new Date(a.scheduled_date || 0) - new Date(b.scheduled_date || 0));
        setJobs(all);
      } catch { toast.error('Failed to load jobs'); }
      finally { setLoading(false); }
    };
    load();
  }, [provider.user_email]);

  const handleComplete = async (job, photos) => {
    try {
      const updates = { status: 'completed', completed_at: new Date().toISOString() };
      if (photos && Object.keys(photos).length > 0) updates.completion_photos = photos;
      await base44.entities.Job.update(job.id, updates);
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, ...updates } : j));
      toast.success('Job marked complete!');
      setPhotoJob(null);
      onJobUpdated?.();
    } catch { toast.error('Failed to complete job'); }
  };

  const handleMarkComplete = async (job) => {
    setCompletingJob(job.id);
    try {
      await base44.entities.Job.update(job.id, { status: 'completed', completed_at: new Date().toISOString() });
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'completed', completed_at: new Date().toISOString() } : j));
      toast.success('Job marked complete!');
      onJobUpdated?.();
    } catch { toast.error('Failed to complete job'); }
    finally { setCompletingJob(null); }
  };

  const activeJobs = jobs.filter(j => !['completed', 'cancelled'].includes(j.status));
  const doneJobs = jobs.filter(j => j.status === 'completed');

  return (
    <>
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-base font-bold text-gray-900">{provider.name || provider.business_name || provider.user_email}</h2>
            <p className="text-xs text-gray-500">{provider.user_email} · {jobs.length} total jobs</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-emerald-600" />
            </div>
          ) : (
            <>
              {/* Active / Scheduled Jobs */}
              {activeJobs.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Active & Scheduled ({activeJobs.length})</p>
                  <div className="space-y-3">
                    {activeJobs.map(job => (
                      <div key={job.id} className="border border-gray-200 rounded-xl p-4 bg-white">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{job.customer_name || '—'}</p>
                            <p className="text-xs text-gray-500">{job.service_name || '—'}</p>
                          </div>
                          <StatusBadge status={job.status} />
                        </div>
                        <div className="space-y-1 text-xs text-gray-500 mb-3">
                          <div className="flex items-center gap-1.5"><MapPin size={11} /> <span className="truncate">{job.address || '—'}</span></div>
                          <div className="flex items-center gap-1.5"><Calendar size={11} /> {fmtDate(job.scheduled_date)} {job.scheduled_time ? `@ ${job.scheduled_time}` : ''}</div>
                          {job.quoted_price && <div className="font-semibold text-emerald-700">${job.quoted_price}</div>}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setPhotoJob(job)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary/10 text-primary border border-primary/30 rounded-lg hover:bg-primary/20 transition-colors"
                          >
                            <Image size={12} /> Upload Photos & Complete
                          </button>
                          <button
                            onClick={() => handleMarkComplete(job)}
                            disabled={completingJob === job.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                          >
                            {completingJob === job.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                            Mark Complete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Jobs */}
              {doneJobs.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Completed ({doneJobs.length})</p>
                  <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
                    {doneJobs.map(job => (
                      <div key={job.id} className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50">
                        <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{job.customer_name}</p>
                          <p className="text-xs text-gray-400 truncate">{job.address}</p>
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">{fmtDate(job.completed_at || job.scheduled_date)}</span>
                        {job.quoted_price && <span className="text-xs font-bold text-gray-700">${job.quoted_price}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {jobs.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-10">No jobs found for this provider.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>

    {photoJob && (
      <JobPhotoUploadModal
        job={photoJob}
        onClose={() => setPhotoJob(null)}
        onComplete={(job, photos) => handleComplete(job, photos)}
      />
    )}
    </>
  );
}