import { useState } from 'react';
import { Calendar, MapPin, ChevronDown, ChevronUp, CloudRain, MessageCircle } from 'lucide-react';
import StatusBadge from '../shared/StatusBadge';
import JobCompletionPhotos from './JobCompletionPhotos';
import JobQuotesPanel from './JobQuotesPanel';
import DepositBanner from './DepositBanner';
import WeatherRescheduleModal from '../shared/WeatherRescheduleModal';
import ChatDrawer from '../shared/ChatDrawer';
import { base44 } from '@/api/base44Client';

const CHAT_ENABLED_STATUSES = ['accepted', 'scheduled', 'in_progress', 'completed'];

export default function JobCard({ job, customerProfile, onAcceptQuote, onReview, reviewed, onRescheduled, user }) {
  const [expanded, setExpanded] = useState(job.status === 'quoted');
  const [showWeatherModal, setShowWeatherModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatUser, setChatUser] = useState(null);
  const chatAvailable = CHAT_ENABLED_STATUSES.includes(job.status) && !!job.provider_id;

  const openChat = async (e) => {
    e.stopPropagation();
    let u = user;
    if (!u) u = await base44.auth.me();
    setChatUser(u);
    setShowChat(true);
  };

  return (
    <div className={`bg-card border rounded-xl overflow-hidden transition-all ${job.status === 'quoted' ? 'border-blue-300 shadow-sm' : 'border-border'}`}>
      {/* Header row — always visible, tap to expand */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full text-left p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="font-semibold text-foreground text-sm truncate">{job.service_name || 'Service Request'}</h3>
              <StatusBadge status={job.status} />
            </div>
            <div className="space-y-1">
              {job.scheduled_date && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar size={12} />
                  <span>{new Date(job.scheduled_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                </div>
              )}
              {job.address && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin size={12} />
                  <span className="truncate">{job.address}</span>
                </div>
              )}
              {job.provider_name && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Provider:</span> {job.provider_name}
                </p>
              )}
            </div>
          </div>
          <div className="flex-shrink-0 flex flex-col items-end gap-1">
            {job.quoted_price && (
              <p className="text-base font-bold text-foreground">${job.quoted_price}</p>
            )}
            {chatAvailable && (
              <button
                onClick={openChat}
                className="flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5 hover:bg-primary/20 transition-colors"
              >
                <MessageCircle size={11} /> Chat
              </button>
            )}
            {job.status === 'quoted' && !expanded && (
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
                Respond →
              </span>
            )}
            {expanded ? <ChevronUp size={15} className="text-muted-foreground mt-1" /> : <ChevronDown size={15} className="text-muted-foreground mt-1" />}
          </div>
        </div>
      </button>

      {/* Deposit banner — shown when deposit is required and not yet paid */}
      {job.status === 'pending_deposit' && job.deposit_required && !job.deposit_paid && (
        <DepositBanner
          job={job}
          customerProfile={customerProfile}
          onDepositPaid={onAcceptQuote}
        />
      )}

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-border pt-3">
          {/* Quotes panel — for active (non-completed/cancelled) jobs */}
          {!['completed', 'cancelled', 'pending_deposit'].includes(job.status) && (
            <JobQuotesPanel
              job={job}
              customerProfile={customerProfile}
              onAcceptQuote={onAcceptQuote}
            />
          )}

          {/* Weather reschedule button for active jobs */}
          {['scheduled', 'accepted', 'in_progress'].includes(job.status) && (
            <button
              onClick={() => setShowWeatherModal(true)}
              className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs font-medium text-blue-700 border border-blue-200 bg-blue-50 rounded-lg px-3 py-2 hover:bg-blue-100 transition-colors"
            >
              <CloudRain size={12} />
              Request Weather Reschedule
            </button>
          )}

          {/* Review button for completed jobs */}
          {job.status === 'completed' && !reviewed && onReview && (
            <button
              onClick={() => onReview(job)}
              className="mt-2 w-full text-xs font-medium text-amber-700 border border-amber-200 bg-amber-50 rounded-lg px-3 py-2 hover:bg-amber-100 transition-colors"
            >
              Leave a Review
            </button>
          )}
          {job.status === 'completed' && reviewed && (
            <div className="mt-2 text-center text-xs font-medium text-green-700 border border-green-200 bg-green-50 rounded-lg px-3 py-2">
              ✓ Review submitted
            </div>
          )}

          {/* Completion photos */}
          {job.status === 'completed' && job.completion_photos && (
            <div className="mt-3">
              <JobCompletionPhotos photos={job.completion_photos} />
            </div>
          )}
        </div>
      )}
      {showWeatherModal && (
        <WeatherRescheduleModal
          job={job}
          onClose={() => setShowWeatherModal(false)}
          onRescheduled={onRescheduled}
        />
      )}
      {showChat && chatUser && (
        <ChatDrawer
          job={job}
          user={chatUser}
          senderRole="customer"
          otherPartyName={job.provider_name || 'Your Provider'}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
}