import { useState, useEffect } from 'react';
import { X, Loader2, UserCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AdminAssignProviderModal({ job, onClose, onAssigned }) {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState(job.provider_id || '');

  useEffect(() => {
    base44.entities.ProviderProfile.filter({ status: 'active' })
      .then(setProviders)
      .finally(() => setLoading(false));
  }, []);

  const handleAssign = async () => {
    if (!selectedId) return;
    setSaving(true);
    const provider = providers.find(p => p.id === selectedId);
    await base44.entities.Job.update(job.id, {
      provider_id: provider.id,
      provider_email: provider.user_email,
      provider_name: provider.name || provider.business_name,
      status: job.status === 'requested' ? 'accepted' : job.status,
    });

    // Send notification email to provider
    await base44.functions.invoke('notifyProviderJobAssigned', { job_id: job.id });

    toast.success(`Job assigned to ${provider.name || provider.business_name}`);
    onAssigned();
    onClose();
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-base font-bold text-foreground">Assign Provider</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{job.service_name} · {job.customer_name}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted">
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : providers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No active providers available.</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {providers.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
                    selectedId === p.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/40 hover:bg-muted/30'
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">
                      {(p.name || p.business_name || '?')[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{p.business_name || p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.user_email}</p>
                    <p className="text-xs text-muted-foreground">
                      ZIPs: {(p.service_zip_codes || []).join(', ') || '—'} · {p.years_experience || 0} yrs exp
                    </p>
                  </div>
                  {selectedId === p.id && <UserCheck size={16} className="text-primary flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={!selectedId || saving}
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <><Loader2 size={14} className="animate-spin" /> Assigning...</> : 'Assign Provider'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}