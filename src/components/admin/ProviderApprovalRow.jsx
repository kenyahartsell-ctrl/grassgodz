import { CheckCircle, XCircle, Clock } from 'lucide-react';
import StatusBadge from '../shared/StatusBadge';

export default function ProviderApprovalRow({ provider, onApprove, onReject }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-0">
      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-bold text-primary">{provider.name?.[0]}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{provider.business_name}</p>
        <p className="text-xs text-muted-foreground">{provider.name} · {provider.years_experience}y exp</p>
      </div>
      <StatusBadge status={provider.status} />
      {provider.status === 'pending_approval' && (
        <div className="flex gap-1.5">
          <button
            onClick={() => onApprove(provider)}
            className="p-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 transition-colors"
            title="Approve"
          >
            <CheckCircle size={16} />
          </button>
          <button
            onClick={() => onReject(provider)}
            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
            title="Reject"
          >
            <XCircle size={16} />
          </button>
        </div>
      )}
    </div>
  );
}