import { useState } from 'react';
import { RefreshCw, X, CalendarDays } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';

export default function BiweeklyPrompt({ job, onDismiss }) {
  const [loading, setLoading] = useState(false);

  const handleSchedule = async () => {
    setLoading(true);
    try {
      // Create a new ScheduledJob for bi-weekly recurrence
      const nextDate = format(addDays(new Date(), 14), 'yyyy-MM-dd');
      await base44.entities.ScheduledJob.create({
        client_name: job.customer_name || '',
        client_email: job.customer_email || '',
        service_address: job.address || '',
        zip_code: job.zip_code || '',
        service_type: job.service_name || '',
        service_id: job.service_id || '',
        recurrence: 'biweekly',
        start_date: nextDate,
        next_release_date: nextDate,
        status: 'active',
        payment_type: job.payment_method === 'cash' ? 'cash' : 'stripe',
        notes: `Auto-created from completed job #${job.id}`,
        released_job_ids: [],
      });
      toast.success(`Bi-weekly schedule created for ${job.customer_name} starting ${nextDate}`);
      onDismiss();
    } catch (err) {
      toast.error('Failed to create schedule: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5 flex items-center gap-3">
      <CalendarDays size={14} className="text-blue-600 flex-shrink-0" />
      <p className="text-xs text-blue-800 font-medium flex-1">Schedule bi-weekly?</p>
      <button
        onClick={handleSchedule}
        disabled={loading}
        className="px-2.5 py-1 text-[11px] font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1"
      >
        <RefreshCw size={10} /> Yes
      </button>
      <button
        onClick={onDismiss}
        className="px-2.5 py-1 text-[11px] font-semibold bg-white text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
      >
        No
      </button>
    </div>
  );
}