import { useState, useEffect } from 'react';
import { Flag, AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const REASON_LABELS = {
  no_show: 'No-show',
  incomplete_work: 'Incomplete / poor work',
  damage: 'Property damage',
  unprofessional_behavior: 'Unprofessional behavior',
  other: 'Other',
};

export default function AdminComplaintsPanel({ providers = [] }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    base44.entities.Complaint.list('-created_date', 200)
      .then(setComplaints)
      .catch(() => toast.error('Failed to load complaints'))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await base44.entities.Complaint.update(id, { status });
      setComplaints(prev => prev.map(c => c.id === id ? { ...c, status } : c));
      toast.success('Complaint ' + status + '.');
    } catch (err) {
      toast.error('Failed to update: ' + err.message);
    }
  };

  const openComplaints = complaints.filter(c => c.status === 'open');
  const resolvedComplaints = complaints.filter(c => c.status !== 'open');
  const warnedProviders = providers.filter(p => p.warning_issued);

  if (loading) return <div className="text-sm text-muted-foreground py-10 text-center">Loading complaints…</div>;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">Complaints</h2>
        <p className="text-sm text-muted-foreground">{openComplaints.length} open · {resolvedComplaints.length} resolved</p>
      </div>

      {warnedProviders.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={15} className="text-red-600" />
            <p className="text-sm font-bold text-red-800">{warnedProviders.length} Provider{warnedProviders.length > 1 ? 's' : ''} Auto-Flagged</p>
          </div>
          {warnedProviders.map(p => (
            <div key={p.id} className="text-xs text-red-700 flex items-center gap-2 mt-1">
              <span className="font-medium">{p.business_name}</span>
              <span>· {p.complaint_count} complaints · warning #{p.warning_count}</span>
            </div>
          ))}
        </div>
      )}

      {openComplaints.length === 0 && (
        <div className="text-sm text-muted-foreground text-center py-10 border border-border rounded-xl">
          No open complaints.
        </div>
      )}

      <div className="space-y-3">
        {openComplaints.map(c => (
          <ComplaintRow
            key={c.id}
            complaint={c}
            onUpdateStatus={updateStatus}
            expanded={!!expanded[c.id]}
            onToggle={() => setExpanded(e => ({ ...e, [c.id]: !e[c.id] }))}
          />
        ))}
      </div>

      {resolvedComplaints.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Resolved</p>
          <div className="space-y-2 opacity-60">
            {resolvedComplaints.map(c => (
              <ComplaintRow
                key={c.id}
                complaint={c}
                onUpdateStatus={updateStatus}
                expanded={!!expanded[c.id]}
                onToggle={() => setExpanded(e => ({ ...e, [c.id]: !e[c.id] }))}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ComplaintRow({ complaint: c, onUpdateStatus, expanded, onToggle }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button onClick={onToggle} className="w-full text-left p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Flag size={12} className="text-red-500 flex-shrink-0" />
              <p className="text-sm font-semibold text-foreground truncate">
                {REASON_LABELS[c.reason] || c.reason}
              </p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                c.status === 'open' ? 'bg-red-100 text-red-700' :
                c.status === 'escalated' ? 'bg-orange-100 text-orange-700' :
                'bg-gray-100 text-gray-600'
              }`}>{c.status}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">{c.customer_name}</span> → {c.provider_name || 'Provider'}
              {c.service_name && ` · ${c.service_name}`}
            </p>
          </div>
          <div className="flex-shrink-0 text-xs text-muted-foreground text-right">
            {c.created_date ? new Date(c.created_date).toLocaleDateString() : ''}
            <span className="ml-1">{expanded ? <ChevronUp size={13} className="inline" /> : <ChevronDown size={13} className="inline" />}</span>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
          {c.description && (
            <p className="text-sm text-foreground italic">"{c.description}"</p>
          )}
          <p className="text-xs text-muted-foreground">Customer: {c.customer_email}</p>
          {c.status === 'open' && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => onUpdateStatus(c.id, 'dismissed')}
                className="flex items-center gap-1.5 text-xs font-semibold border border-border text-muted-foreground rounded-lg px-3 py-2 hover:bg-muted transition-colors"
              >
                <XCircle size={12} /> Dismiss
              </button>
              <button
                onClick={() => onUpdateStatus(c.id, 'escalated')}
                className="flex items-center gap-1.5 text-xs font-semibold bg-orange-50 border border-orange-200 text-orange-700 rounded-lg px-3 py-2 hover:bg-orange-100 transition-colors"
              >
                <AlertTriangle size={12} /> Escalate
              </button>
              <button
                onClick={() => onUpdateStatus(c.id, 'resolved')}
                className="flex items-center gap-1.5 text-xs font-semibold bg-green-50 border border-green-200 text-green-700 rounded-lg px-3 py-2 hover:bg-green-100 transition-colors"
              >
                <CheckCircle size={12} /> Resolve
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
