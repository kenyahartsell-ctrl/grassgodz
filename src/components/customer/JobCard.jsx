import { useState } from 'react';
import { Calendar, MapPin, ChevronDown, ChevronUp, CloudRain, MessageCircle, Star, Flag } from 'lucide-react';
import StatusBadge from '../shared/StatusBadge';
import JobCompletionPhotos from './JobCompletionPhotos';
import JobQuotesPanel from './JobQuotesPanel';
import DepositBanner from './DepositBanner';
import WeatherRescheduleModal from '../shared/WeatherRescheduleModal';
import ChatDrawer from '../shared/ChatDrawer';
import CardRequiredBanner from './CardRequiredBanner';
import ReportIssueModal from './ReportIssueModal';
import { base44 } from '@/api/base44Client';

const CHAT_ENABLED_STATUSES = ['accepted', 'scheduled', 'in_progress', 'completed'];

export default function JobCard({ job, customerProfile, onAcceptQuote, onReview, reviewed, onRescheduled, user }) {
const [expanded, setExpanded] = useState(job.status === 'quoted' || job.status === 'pending_payment' || (job.status === 'completed' && !reviewed));
const isQuoted = job.status === 'quoted';
const [showWeatherModal, setShowWeatherModal] = useState(false);
const [showChat, setShowChat] = useState(false);
const [showReport, setShowReport] = useState(false);
const [cardSaved, setCardSaved] = useState(false);
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
{job.status === 'quoted' && (
<span className="text-xs font-semibold text-white bg-blue-500 rounded-full px-3 py-1 animate-pulse">
Quote Ready!
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

{/* Card required banner — shown for scheduled jobs without a card on file */}
{job.status === 'scheduled' && !cardSaved && !customerProfile?.default_payment_method_id && (
<CardRequiredBanner
customerProfile={customerProfile}
onCardSaved={() => setCardSaved(true)}
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

{/* Review prompt for completed jobs */}
{job.status === 'completed' && !reviewed && onReview && (
<div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
<p className="text-sm font-bold text-amber-900 mb-1">How did {job.provider_name || 'your provider'} do?</p>
<p className="text-xs text-amber-700 mb-3">Your feedback helps us maintain quality and rewards great providers.</p>
<button
onClick={() => onReview(job)}
className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
>
<Star size={14} className="fill-white" /> Leave a Review
</button>
</div>
)}
{job.status === 'completed' && reviewed && (
<div className="mt-3 text-center text-xs font-semibold text-green-700 border border-green-200 bg-green-50 rounded-xl px-3 py-3 flex items-center justify-center gap-2">
<Star size={13} className="fill-green-600 text-green-600" /> Review submitted — thank you!
</div>
)}

{/* Report issue link for completed jobs */}
{job.status === 'completed' && job.provider_id && (
<div className="mt-3 text-center">
<button
onClick={() => setShowReport(true)}
className="text-xs text-muted-foreground hover:text-red-500 flex items-center justify-center gap-1 mx-auto transition-colors"
>
<Flag size={10} />
Report an issue with this job
</button>
</div>
)}

{/* Finished yard photos — visible to customer once job is completed */}
{job.status === 'completed' && job.completion_photos && Object.keys(job.completion_photos).length > 0 && (
  <div className="mt-3">
    <p className="text-xs font-bold text-foreground uppercase tracking-wide mb-2">Finished Yard Photos</p>
    <JobCompletionPhotos photos={job.completion_photos} />
  </div>
)}

{/* Admin-uploaded photos — visible to customer */}
{job.status === 'completed' && job.admin_photos && job.admin_photos.length > 0 && (
  <div className="mt-3">
    <p className="text-xs font-bold text-foreground uppercase tracking-wide mb-2">Job Photos</p>
    <div className="grid grid-cols-3 gap-2">
      {job.admin_photos.map((photo, i) => (
        <a key={i} href={photo.url} target="_blank" rel="noopener noreferrer" className="aspect-square rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-all">
          <img src={photo.url} alt={`Job photo ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform" />
        </a>
      ))}
    </div>
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
{showReport && (
<ReportIssueModal
job={job}
onClose={() => setShowReport(false)}
/>
)}
</div>
);
}