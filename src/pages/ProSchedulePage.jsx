import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { CalendarDays, LayoutList, ChevronLeft, ChevronRight, Loader2, MapPin, User, Briefcase, CheckCircle, PlayCircle, ArrowLeft } from 'lucide-react';
import { startOfWeek, endOfWeek, addDays, addWeeks, subWeeks, format, isSameDay, parseISO, isToday } from 'date-fns';

const STATUS_COLORS = {
  completed:   { bg: 'bg-green-50',  border: 'border-green-200',  badge: 'bg-green-100 text-green-800',  dot: 'bg-green-500'  },
  in_progress: { bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500' },
  scheduled:   { bg: 'bg-blue-50',   border: 'border-blue-200',   badge: 'bg-blue-100 text-blue-800',    dot: 'bg-blue-500'   },
  accepted:    { bg: 'bg-blue-50',   border: 'border-blue-200',   badge: 'bg-blue-100 text-blue-800',    dot: 'bg-blue-500'   },
  cancelled:   { bg: 'bg-gray-50',   border: 'border-gray-200',   badge: 'bg-gray-100 text-gray-600',    dot: 'bg-gray-400'   },
  requested:   { bg: 'bg-gray-50',   border: 'border-gray-200',   badge: 'bg-gray-100 text-gray-600',    dot: 'bg-gray-400'   },
};

const STATUS_LABELS = {
  completed: 'Completed', in_progress: 'In Progress', scheduled: 'Scheduled',
  accepted: 'Upcoming', cancelled: 'Cancelled', requested: 'Requested',
};

function getColors(status) {
  return STATUS_COLORS[status] || STATUS_COLORS.requested;
}

function JobCard({ job, onMarkInProgress, onMarkComplete, compact = false }) {
  const colors = getColors(job.status);
  const [loading, setLoading] = useState(false);

  const handleAction = async (action) => {
    setLoading(true);
    try {
      await action();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`rounded-xl border p-3 ${colors.bg} ${colors.border} ${compact ? 'text-xs' : 'text-sm'}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colors.dot}`} />
          <span className="font-semibold text-foreground truncate">{job.service_name || 'Service'}</span>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${colors.badge}`}>
          {STATUS_LABELS[job.status] || job.status}
        </span>
      </div>

      <div className="space-y-1 mb-3">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <User size={11} className="flex-shrink-0" />
          <span className="truncate">{job.customer_name || '—'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <MapPin size={11} className="flex-shrink-0" />
          <span className="truncate">{job.address || '—'}</span>
        </div>
        {job.scheduled_date && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <CalendarDays size={11} className="flex-shrink-0" />
            <span>{format(parseISO(job.scheduled_date), 'MMM d, yyyy')}</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        {job.status === 'scheduled' && onMarkInProgress && (
          <button
            disabled={loading}
            onClick={() => handleAction(() => onMarkInProgress(job))}
            className="flex-1 flex items-center justify-center gap-1 bg-yellow-500 text-white rounded-lg py-1.5 text-xs font-semibold hover:bg-yellow-600 disabled:opacity-60 transition-colors"
          >
            {loading ? <Loader2 size={11} className="animate-spin" /> : <PlayCircle size={11} />}
            In Progress
          </button>
        )}
        {job.status === 'accepted' && onMarkInProgress && (
          <button
            disabled={loading}
            onClick={() => handleAction(() => onMarkInProgress(job))}
            className="flex-1 flex items-center justify-center gap-1 bg-yellow-500 text-white rounded-lg py-1.5 text-xs font-semibold hover:bg-yellow-600 disabled:opacity-60 transition-colors"
          >
            {loading ? <Loader2 size={11} className="animate-spin" /> : <PlayCircle size={11} />}
            Start Job
          </button>
        )}
        {job.status === 'in_progress' && onMarkComplete && (
          <button
            disabled={loading}
            onClick={() => handleAction(() => onMarkComplete(job))}
            className="flex-1 flex items-center justify-center gap-1 bg-green-600 text-white rounded-lg py-1.5 text-xs font-semibold hover:bg-green-700 disabled:opacity-60 transition-colors"
          >
            {loading ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />}
            Mark Complete
          </button>
        )}
      </div>
    </div>
  );
}

function WeeklyView({ weekStart, jobsByDay, days, onMarkInProgress, onMarkComplete }) {
  return (
    <div className="grid grid-cols-7 gap-1 mt-3">
      {days.map((day, i) => {
        const dayJobs = jobsByDay[format(day, 'yyyy-MM-dd')] || [];
        const isCurrentDay = isToday(day);
        return (
          <div key={i} className="min-w-0">
            <div className={`text-center mb-1.5 py-1 rounded-lg ${isCurrentDay ? 'bg-primary text-primary-foreground' : ''}`}>
              <p className={`text-xs font-medium ${isCurrentDay ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                {format(day, 'EEE')}
              </p>
              <p className={`text-sm font-bold ${isCurrentDay ? 'text-primary-foreground' : 'text-foreground'}`}>
                {format(day, 'd')}
              </p>
            </div>
            <div className="space-y-1">
              {dayJobs.length === 0 ? (
                <div className="h-12 rounded-lg border border-dashed border-border flex items-center justify-center">
                  <span className="text-xs text-muted-foreground/40">—</span>
                </div>
              ) : (
                dayJobs.map(job => {
                  const colors = getColors(job.status);
                  return (
                    <div
                      key={job.id}
                      className={`rounded-lg border p-1.5 cursor-default ${colors.bg} ${colors.border}`}
                      title={`${job.service_name} — ${job.customer_name}`}
                    >
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${colors.dot}`} />
                        <span className="text-xs font-semibold text-foreground truncate leading-tight">
                          {job.service_name?.split(' ')[0] || 'Job'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate leading-tight">{job.customer_name?.split(' ')[0] || '—'}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DailyView({ selectedDay, jobsByDay, onMarkInProgress, onMarkComplete }) {
  const dateKey = format(selectedDay, 'yyyy-MM-dd');
  const jobs = (jobsByDay[dateKey] || []).slice().sort((a, b) => {
    // Sort by scheduled_date string (date only for now)
    return (a.scheduled_date || '').localeCompare(b.scheduled_date || '');
  });

  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">
        {isToday(selectedDay) ? 'Today' : format(selectedDay, 'EEEE, MMMM d')}
        <span className="ml-2 text-xs font-normal text-muted-foreground">({jobs.length} job{jobs.length !== 1 ? 's' : ''})</span>
      </h3>
      {jobs.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <CalendarDays className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No jobs scheduled for this day</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => (
            <JobCard
              key={job.id}
              job={job}
              onMarkInProgress={onMarkInProgress}
              onMarkComplete={onMarkComplete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProSchedulePage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('weekly'); // 'weekly' | 'daily'
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [selectedDay, setSelectedDay] = useState(new Date());

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const me = await base44.auth.me();
      const myJobs = await base44.entities.Job.filter({ provider_email: me.email });
      setJobs(myJobs);
    } catch {
      toast.error('Failed to load schedule.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkInProgress = async (job) => {
    await base44.entities.Job.update(job.id, { status: 'in_progress' });
    setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'in_progress' } : j));
    toast.success('Job marked as in progress.');
  };

  const handleMarkComplete = async (job) => {
    try {
      const res = await base44.functions.invoke('capturePayment', { job_id: job.id, skip_photos: true });
      if (res.data?.success) {
        setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'completed' } : j));
        toast.success('Job marked complete!');
      } else {
        // Fallback: just update status
        await base44.entities.Job.update(job.id, { status: 'completed', completed_at: new Date().toISOString() });
        setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'completed' } : j));
        toast.success('Job marked complete!');
      }
    } catch {
      await base44.entities.Job.update(job.id, { status: 'completed', completed_at: new Date().toISOString() });
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'completed' } : j));
      toast.success('Job marked complete!');
    }
  };

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });

  // Jobs within this week
  const weekJobs = jobs.filter(j => {
    if (!j.scheduled_date) return false;
    const d = parseISO(j.scheduled_date);
    return d >= weekStart && d <= weekEnd;
  });

  // Group by date key
  const jobsByDay = {};
  jobs.forEach(job => {
    if (!job.scheduled_date) return;
    const key = job.scheduled_date.slice(0, 10);
    if (!jobsByDay[key]) jobsByDay[key] = [];
    jobsByDay[key].push(job);
  });

  // Summary stats for this week
  const weekTotal = weekJobs.length;
  const weekCompleted = weekJobs.filter(j => j.status === 'completed').length;
  const weekRemaining = weekJobs.filter(j => !['completed', 'cancelled'].includes(j.status)).length;

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/provider')} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft size={18} className="text-muted-foreground" />
          </button>
          <img src="https://media.base44.com/images/public/69e949497e5928c679297ebf/b2338f6dd_logo_transparent.png" alt="Grassgodz" className="h-8 w-8 object-contain" />
          <div>
            <h1 className="font-display font-bold text-base text-foreground leading-tight">My Schedule</h1>
            <p className="text-xs text-muted-foreground">
              {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}
            </p>
          </div>

          {/* View toggle */}
          <div className="ml-auto flex items-center bg-muted rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => setViewMode('weekly')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === 'weekly' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <LayoutList size={13} /> Week
            </button>
            <button
              onClick={() => setViewMode('daily')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === 'daily' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <CalendarDays size={13} /> Day
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-4 overflow-y-auto">

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{weekTotal}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total This Week</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-green-700">{weekCompleted}</p>
            <p className="text-xs text-green-600 mt-0.5">Completed</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-blue-700">{weekRemaining}</p>
            <p className="text-xs text-blue-600 mt-0.5">Remaining</p>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => { setWeekStart(w => subWeeks(w, 1)); }}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronLeft size={18} className="text-muted-foreground" />
          </button>
          <button
            onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }))}
            className="text-xs font-semibold text-primary hover:underline"
          >
            This Week
          </button>
          <button
            onClick={() => { setWeekStart(w => addWeeks(w, 1)); }}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronRight size={18} className="text-muted-foreground" />
          </button>
        </div>

        {/* Day selector (always shown for clicking) */}
        <div className="grid grid-cols-7 gap-1 mb-3">
          {days.map((day, i) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const count = (jobsByDay[dateKey] || []).length;
            const isSelected = isSameDay(day, selectedDay);
            const isCurrentDay = isToday(day);
            return (
              <button
                key={i}
                onClick={() => { setSelectedDay(day); if (viewMode === 'weekly') setViewMode('daily'); }}
                className={`flex flex-col items-center py-2 rounded-xl transition-colors ${
                  isSelected && viewMode === 'daily'
                    ? 'bg-primary text-primary-foreground'
                    : isCurrentDay
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted'
                }`}
              >
                <span className={`text-xs font-medium ${isSelected && viewMode === 'daily' ? 'text-primary-foreground' : isCurrentDay ? 'text-primary' : 'text-muted-foreground'}`}>
                  {format(day, 'EEE')}
                </span>
                <span className={`text-sm font-bold mt-0.5 ${isSelected && viewMode === 'daily' ? 'text-primary-foreground' : 'text-foreground'}`}>
                  {format(day, 'd')}
                </span>
                {count > 0 && (
                  <span className={`mt-1 text-xs font-semibold w-5 h-5 rounded-full flex items-center justify-center ${
                    isSelected && viewMode === 'daily' ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {viewMode === 'weekly' ? (
          <div className="space-y-4">
            {days.map((day, i) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayJobs = jobsByDay[dateKey] || [];
              if (dayJobs.length === 0) return null;
              return (
                <div key={i}>
                  <h3 className={`text-xs font-semibold mb-2 ${isToday(day) ? 'text-primary' : 'text-muted-foreground'}`}>
                    {isToday(day) ? '📍 Today — ' : ''}{format(day, 'EEEE, MMMM d')}
                  </h3>
                  <div className="space-y-2">
                    {dayJobs.map(job => (
                      <JobCard
                        key={job.id}
                        job={job}
                        onMarkInProgress={handleMarkInProgress}
                        onMarkComplete={handleMarkComplete}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
            {weekJobs.length === 0 && (
              <div className="text-center py-16 border border-dashed border-border rounded-xl mt-4">
                <CalendarDays className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No jobs scheduled this week</p>
                <p className="text-xs text-muted-foreground mt-1">Use the arrows to navigate weeks</p>
              </div>
            )}
          </div>
        ) : (
          <DailyView
            selectedDay={selectedDay}
            jobsByDay={jobsByDay}
            onMarkInProgress={handleMarkInProgress}
            onMarkComplete={handleMarkComplete}
          />
        )}
      </main>
    </div>
  );
}