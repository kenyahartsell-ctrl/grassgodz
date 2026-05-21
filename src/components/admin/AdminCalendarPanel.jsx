import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus, List, Calendar, Loader2, PauseCircle, StopCircle, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import AdminCalendarJobForm from './AdminCalendarJobForm';

const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function getJobColor(sj) {
  if (sj.status === 'stopped' || sj.status === 'completed') return 'bg-gray-200 text-gray-600 border-gray-300';
  if (sj.recurrence === 'biweekly') return 'bg-blue-100 text-blue-800 border-blue-200';
  if (!sj.provider_id) return 'bg-amber-100 text-amber-800 border-amber-200';
  return 'bg-green-100 text-green-800 border-green-200';
}

function getJobDot(sj) {
  if (sj.status === 'stopped' || sj.status === 'completed') return 'bg-gray-400';
  if (sj.recurrence === 'biweekly') return 'bg-blue-500';
  if (!sj.provider_id) return 'bg-amber-500';
  return 'bg-green-500';
}

function recurrenceLabel(r) {
  if (r === 'weekly') return 'Weekly';
  if (r === 'biweekly') return 'Biweekly';
  return 'One-time';
}

// Returns all dates a scheduled job appears on in a given month/year
function getJobDatesInMonth(sj, year, month) {
  const dates = [];
  const start = new Date(sj.start_date + 'T12:00:00');
  const end = sj.end_date ? new Date(sj.end_date + 'T12:00:00') : null;
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);

  let cursor = new Date(start);
  // Fast forward to month
  while (cursor < monthStart) {
    if (sj.recurrence === 'weekly') cursor.setDate(cursor.getDate() + 7);
    else if (sj.recurrence === 'biweekly') cursor.setDate(cursor.getDate() + 14);
    else break;
  }

  while (cursor <= monthEnd) {
    if (cursor >= monthStart && (!end || cursor <= end)) {
      dates.push(cursor.getDate());
    }
    if (sj.recurrence === 'weekly') cursor.setDate(cursor.getDate() + 7);
    else if (sj.recurrence === 'biweekly') cursor.setDate(cursor.getDate() + 14);
    else break;
  }
  return dates;
}

export default function AdminCalendarPanel({ providers }) {
  const today = new Date();
  const [view, setView] = useState('month');
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [weekOffset, setWeekOffset] = useState(0);
  const [scheduledJobs, setScheduledJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [editingJob, setEditingJob] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await base44.entities.ScheduledJob.list('-start_date', 200);
      setScheduledJobs(data);
    } catch {
      toast.error('Failed to load scheduled jobs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  // --- Month helpers ---
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDow = new Date(calYear, calMonth, 1).getDay();

  const jobsByDay = {};
  scheduledJobs.forEach(sj => {
    const days = getJobDatesInMonth(sj, calYear, calMonth);
    days.forEach(d => {
      if (!jobsByDay[d]) jobsByDay[d] = [];
      jobsByDay[d].push(sj);
    });
  });

  // --- Week helpers ---
  const getWeekStart = () => {
    const d = new Date(today);
    d.setDate(today.getDate() - today.getDay() + weekOffset * 7);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(getWeekStart());
    d.setDate(d.getDate() + i);
    return d;
  });

  const jobsOnDate = (date) => {
    const y = date.getFullYear(), m = date.getMonth(), day = date.getDate();
    return scheduledJobs.filter(sj => {
      const days = getJobDatesInMonth(sj, y, m);
      return days.includes(day);
    });
  };

  const handleDayClick = (dateStr) => {
    setSelectedDate(dateStr);
    setEditingJob(null);
    setShowForm(true);
  };

  const handleJobClick = (e, sj) => {
    e.stopPropagation();
    setEditingJob(sj);
    setSelectedDate(sj.start_date);
    setShowForm(true);
  };

  const handlePause = async (sj) => {
    const newStatus = sj.status === 'paused' ? 'active' : 'paused';
    await base44.entities.ScheduledJob.update(sj.id, { status: newStatus });
    toast.success(newStatus === 'paused' ? 'Schedule paused.' : 'Schedule resumed.');
    loadJobs();
  };

  const handleStop = async (sj) => {
    if (!window.confirm('Stop this recurring schedule permanently?')) return;
    await base44.entities.ScheduledJob.update(sj.id, { status: 'stopped' });
    toast.success('Schedule stopped.');
    loadJobs();
  };

  const handleReleaseNow = async () => {
    try {
      const res = await base44.functions.invoke('releaseScheduledJobs', {});
      toast.success(`Released ${res.data?.released ?? 0} job(s) to providers.`);
      loadJobs();
    } catch {
      toast.error('Release failed.');
    }
  };

  const prevMonth = () => { if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); } else setCalMonth(m => m - 1); };
  const nextMonth = () => { if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); } else setCalMonth(m => m + 1); };

  const upcomingJobs = scheduledJobs
    .filter(sj => sj.status === 'active' || sj.status === 'paused')
    .sort((a, b) => (a.next_release_date || a.start_date).localeCompare(b.next_release_date || b.start_date));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Job Calendar</h2>
          <p className="text-sm text-muted-foreground">Schedule and manage jobs — auto-released to providers on date</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleReleaseNow}>
            <RefreshCw size={13} /> Release Today's Jobs
          </Button>
          <Button size="sm" onClick={() => { setSelectedDate(today.toISOString().split('T')[0]); setEditingJob(null); setShowForm(true); }}>
            <Plus size={13} /> New Job
          </Button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-2">
        <button onClick={() => setView('month')} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${view === 'month' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted/40'}`}>
          <Calendar size={12} /> Month
        </button>
        <button onClick={() => setView('week')} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${view === 'week' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted/40'}`}>
          <Calendar size={12} /> Week
        </button>
        <button onClick={() => setView('list')} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${view === 'list' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted/40'}`}>
          <List size={12} /> List
        </button>

        {/* Legend */}
        <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />Assigned</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />Pending</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />Biweekly</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-gray-400 inline-block" />Done/Stopped</span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (
        <>
          {/* MONTH VIEW */}
          {view === 'month' && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                <button onClick={prevMonth} className="p-1.5 hover:bg-muted rounded-lg"><ChevronLeft size={16} /></button>
                <p className="font-bold text-foreground">{MONTHS[calMonth]} {calYear}</p>
                <button onClick={nextMonth} className="p-1.5 hover:bg-muted rounded-lg"><ChevronRight size={16} /></button>
              </div>

              <div className="grid grid-cols-7 border-b border-border">
                {DOW.map(d => (
                  <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {Array.from({ length: firstDow }).map((_, i) => (
                  <div key={`e${i}`} className="min-h-[80px] border-b border-r border-border bg-muted/20" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${calYear}-${String(calMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                  const dayJobs = jobsByDay[day] || [];
                  const isToday = today.getFullYear() === calYear && today.getMonth() === calMonth && today.getDate() === day;
                  return (
                    <div
                      key={day}
                      onClick={() => handleDayClick(dateStr)}
                      className={`min-h-[80px] border-b border-r border-border p-1 cursor-pointer hover:bg-muted/30 transition-colors ${isToday ? 'bg-primary/5' : ''}`}
                    >
                      <span className={`text-xs font-semibold block mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'}`}>
                        {day}
                      </span>
                      <div className="space-y-0.5">
                        {dayJobs.slice(0, 2).map(sj => (
                          <div
                            key={sj.id}
                            onClick={e => handleJobClick(e, sj)}
                            className={`text-[10px] font-medium px-1 py-0.5 rounded border truncate cursor-pointer ${getJobColor(sj)}`}
                            title={`${sj.client_name} — ${sj.service_type} · ${recurrenceLabel(sj.recurrence)}`}
                          >
                            {sj.client_name} {sj.recurrence !== 'one_time' ? `· ${recurrenceLabel(sj.recurrence)}` : ''}
                          </div>
                        ))}
                        {dayJobs.length > 2 && (
                          <div className="text-[10px] text-muted-foreground pl-1">+{dayJobs.length - 2} more</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* WEEK VIEW */}
          {view === 'week' && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                <button onClick={() => setWeekOffset(w => w - 1)} className="p-1.5 hover:bg-muted rounded-lg"><ChevronLeft size={16} /></button>
                <p className="font-bold text-foreground text-sm">
                  Week of {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
                <button onClick={() => setWeekOffset(w => w + 1)} className="p-1.5 hover:bg-muted rounded-lg"><ChevronRight size={16} /></button>
              </div>

              <div className="grid grid-cols-7 divide-x divide-border">
                {weekDays.map(date => {
                  const isToday = date.toDateString() === today.toDateString();
                  const dateStr = date.toISOString().split('T')[0];
                  const dayJobs = jobsOnDate(date);
                  return (
                    <div
                      key={dateStr}
                      onClick={() => handleDayClick(dateStr)}
                      className={`min-h-[140px] p-2 cursor-pointer hover:bg-muted/30 transition-colors ${isToday ? 'bg-primary/5' : ''}`}
                    >
                      <div className={`text-xs font-semibold mb-2 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
                        {date.getDate()}
                      </div>
                      <div className="text-[10px] text-muted-foreground mb-1">{DOW[date.getDay()]}</div>
                      <div className="space-y-1">
                        {dayJobs.map(sj => (
                          <div
                            key={sj.id}
                            onClick={e => handleJobClick(e, sj)}
                            className={`text-[10px] font-medium px-1.5 py-1 rounded border truncate cursor-pointer ${getJobColor(sj)}`}
                          >
                            <div className="font-semibold truncate">{sj.client_name}</div>
                            <div className="opacity-70 truncate">{sj.preferred_time}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* LIST VIEW */}
          {view === 'list' && (
            <div className="space-y-3">
              {upcomingJobs.length === 0 ? (
                <div className="text-center py-16 bg-card border border-dashed border-border rounded-xl">
                  <Calendar className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-muted-foreground font-medium">No upcoming scheduled jobs</p>
                  <p className="text-sm text-muted-foreground mt-1">Click "+ New Job" to schedule your first job.</p>
                </div>
              ) : (
                upcomingJobs.map(sj => (
                  <div key={sj.id} className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${getJobDot(sj)}`} />
                        <div>
                          <p className="font-semibold text-sm text-foreground">{sj.client_name}</p>
                          <p className="text-xs text-muted-foreground">{sj.service_type} · {sj.service_address}</p>
                          <div className="flex flex-wrap gap-2 mt-1.5 text-xs">
                            <span className="bg-muted px-2 py-0.5 rounded-full">{recurrenceLabel(sj.recurrence)}</span>
                            <span className="bg-muted px-2 py-0.5 rounded-full">
                              Next: {sj.next_release_date || sj.start_date}
                            </span>
                            {sj.end_date && <span className="bg-muted px-2 py-0.5 rounded-full">Ends: {sj.end_date}</span>}
                            <span className={`px-2 py-0.5 rounded-full font-medium ${sj.payment_type === 'cash' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                              {sj.payment_type === 'cash' ? 'Cash' : 'Stripe'}
                            </span>
                            {sj.status === 'paused' && <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full font-medium">Paused</span>}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {sj.provider_name ? `Provider: ${sj.provider_name}` : 'Provider: Unassigned'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => handleJobClick({ stopPropagation: () => {} }, sj)}
                          className="px-2.5 py-1 text-xs font-medium bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                        >
                          Edit
                        </button>
                        {sj.recurrence !== 'one_time' && (
                          <button
                            onClick={() => handlePause(sj)}
                            title={sj.status === 'paused' ? 'Resume' : 'Pause'}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          >
                            <PauseCircle size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => handleStop(sj)}
                          title="Stop schedule"
                          className="p-1.5 text-destructive hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <StopCircle size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* Form Modal */}
      {showForm && (
        <AdminCalendarJobForm
          initialDate={selectedDate}
          existingJob={editingJob}
          providers={providers || []}
          onClose={() => { setShowForm(false); setEditingJob(null); }}
          onSaved={loadJobs}
        />
      )}
    </div>
  );
}