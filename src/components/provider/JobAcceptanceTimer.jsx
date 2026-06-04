import { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

/**
 * Shows a live countdown timer for provider job acceptance windows.
 * - Immediate jobs: 2 hours from accepted_at
 * - Scheduled jobs (with scheduled_time): 30 min buffer from scheduled start
 */
export default function JobAcceptanceTimer({ job }) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [expired, setExpired] = useState(false);

  const getDeadline = () => {
    if (job.scheduled_date && job.scheduled_time) {
      const [h, m] = job.scheduled_time.split(':').map(Number);
      const start = new Date(job.scheduled_date);
      start.setHours(h, m, 0, 0);
      return new Date(start.getTime() + 30 * 60 * 1000);
    }
    if (job.accepted_at) {
      return new Date(new Date(job.accepted_at).getTime() + 2 * 60 * 60 * 1000);
    }
    return null;
  };

  useEffect(() => {
    const deadline = getDeadline();
    if (!deadline) return;

    const tick = () => {
      const diff = deadline - new Date();
      if (diff <= 0) {
        setExpired(true);
        setTimeLeft(null);
        return;
      }
      const totalSecs = Math.floor(diff / 1000);
      const h = Math.floor(totalSecs / 3600);
      const m = Math.floor((totalSecs % 3600) / 60);
      const s = totalSecs % 60;
      setTimeLeft({ h, m, s, totalSecs });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [job.accepted_at, job.scheduled_date, job.scheduled_time]);

  if (!getDeadline()) return null;

  const isUrgent = timeLeft && timeLeft.totalSecs < 900; // < 15 min

  if (expired || job.acceptance_timer_flagged) {
    return (
      <div className="flex items-center gap-2 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-700">
        <AlertTriangle size={12} className="flex-shrink-0" />
        <span className="font-semibold">Arrival window expired — admin has been notified.</span>
      </div>
    );
  }

  if (!timeLeft) return null;

  const label = job.scheduled_time
    ? '30-min arrival buffer'
    : '2-hr arrival window';

  const fmt = (n) => String(n).padStart(2, '0');

  return (
    <div className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2 border ${
      isUrgent
        ? 'bg-red-50 border-red-300 text-red-700'
        : 'bg-amber-50 border-amber-200 text-amber-800'
    }`}>
      <Clock size={12} className="flex-shrink-0 animate-pulse" />
      <span>
        <span className="font-semibold">{label}:</span>{' '}
        {timeLeft.h > 0 && <span>{fmt(timeLeft.h)}h </span>}
        <span>{fmt(timeLeft.m)}m {fmt(timeLeft.s)}s</span>
        {isUrgent && <span className="font-bold"> — Act now!</span>}
      </span>
    </div>
  );
}