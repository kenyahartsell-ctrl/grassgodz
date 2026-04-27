import { X } from 'lucide-react';
import StatusBadge from '@/components/shared/StatusBadge';

export default function CustomerDetailModal({ customer, jobs, quotes, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-foreground">{customer.name || 'Customer'}</h2>
            <p className="text-xs text-muted-foreground">{customer.user_email}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto p-5 space-y-5">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Contact</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium ml-1">{customer.phone || '—'}</span></div>
              <div><span className="text-muted-foreground">ZIP:</span> <span className="font-medium ml-1">{customer.zip_code || '—'}</span></div>
              <div className="col-span-2"><span className="text-muted-foreground">Service Address:</span> <span className="font-medium ml-1">{customer.service_address || '—'}</span></div>
              <div className="col-span-2"><span className="text-muted-foreground">Billing Address:</span> <span className="font-medium ml-1">{customer.billing_address || '—'}</span></div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Jobs ({jobs.length})</p>
            {jobs.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No jobs.</p>
            ) : (
              <div className="space-y-2">
                {jobs.map(j => {
                  const jobQuotes = quotes.filter(q => q.job_id === j.id);
                  return (
                    <div key={j.id} className="border border-border rounded-lg p-3 text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold">{j.service_name}</span>
                        <StatusBadge status={j.status} />
                      </div>
                      <p className="text-xs text-muted-foreground">{j.scheduled_date ? new Date(j.scheduled_date).toLocaleDateString() : '—'} · {j.address}</p>
                      {j.quoted_price && <p className="text-xs font-semibold text-primary mt-0.5">${j.quoted_price} quoted</p>}
                      {j.provider_name && <p className="text-xs text-muted-foreground">Provider: {j.provider_name}</p>}
                      {jobQuotes.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-border space-y-1">
                          {jobQuotes.map(q => (
                            <div key={q.id} className="flex justify-between text-xs">
                              <span>{q.provider_name}</span>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-primary">${q.price}</span>
                                <StatusBadge status={q.status} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}