import { X, MessageCircle } from 'lucide-react';
import JobChat from './JobChat';

export default function ChatDrawer({ job, user, senderRole, otherPartyName, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-sm">
      <div
        className="absolute inset-0"
        onClick={onClose}
      />
      <div className="relative bg-card rounded-t-2xl shadow-2xl flex flex-col"
        style={{ height: '75vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <MessageCircle size={16} className="text-primary" />
            <div>
              <p className="text-sm font-bold text-foreground">
                {job.service_name || 'Job Chat'}
              </p>
              <p className="text-xs text-muted-foreground">
                {otherPartyName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            <X size={18} />
          </button>
        </div>

        {/* Chat */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <JobChat
            job={job}
            user={user}
            senderRole={senderRole}
            otherPartyName={otherPartyName}
          />
        </div>
      </div>
    </div>
  );
}