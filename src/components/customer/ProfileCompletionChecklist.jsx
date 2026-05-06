import { CheckCircle2, Circle, ChevronRight } from 'lucide-react';

export default function ProfileCompletionChecklist({ profile, onGoToProfile }) {
  const steps = [
    { label: 'Add your service address', done: !!(profile?.service_address) },
    { label: 'Confirm your phone number', done: !!(profile?.phone) },
    { label: 'Add your ZIP code', done: !!(profile?.zip_code) },
    { label: 'Request your first service', done: false }, // dynamic — passed as prop if needed
  ];

  const completed = steps.filter(s => s.done).length;
  const total = steps.length;
  const pct = Math.round((completed / total) * 100);

  if (completed === total) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-5 mb-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-bold text-foreground">Complete your profile</h3>
        <span className="text-xs font-semibold text-primary">{completed}/{total} done</span>
      </div>
      <div className="w-full h-1.5 bg-muted rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="space-y-2.5">
        {steps.map(({ label, done }) => (
          <div key={label} className="flex items-center gap-2.5 text-sm">
            {done
              ? <CheckCircle2 size={16} className="text-primary flex-shrink-0" />
              : <Circle size={16} className="text-muted-foreground flex-shrink-0" />}
            <span className={done ? 'text-muted-foreground line-through' : 'text-foreground'}>{label}</span>
          </div>
        ))}
      </div>
      <button
        onClick={onGoToProfile}
        className="mt-4 w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 rounded-lg py-2 hover:bg-primary/5 transition-colors"
      >
        Complete profile <ChevronRight size={13} />
      </button>
    </div>
  );
}