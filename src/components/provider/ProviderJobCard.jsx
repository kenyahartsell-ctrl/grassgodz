import { useState, useEffect, useRef } from 'react';
import { Calendar, MapPin, PlayCircle, CheckCircle, Image, Navigation, ChevronDown, ClipboardList, DollarSign, CloudRain, MessageCircle, XCircle, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatusBadge from '../shared/StatusBadge';
import JobPhotoUploadModal from './JobPhotoUploadModal';
import WeatherRescheduleModal from '../shared/WeatherRescheduleModal';
import ChatDrawer from '../shared/ChatDrawer';
import JobAcceptanceTimer from './JobAcceptanceTimer';
import ProviderCancelJobModal from './ProviderCancelJobModal';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

function parseLocalDate(dateStr) {
  if (!dateStr) return new Date();
  const [y, m, d] = dateStr.split('T')[0].split('-').map(Number);
  return new Date(y, m - 1, d);
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_SECRET;

function JobMiniMap({ address }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    if (!address || !MAPBOX_TOKEN) return;
    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&limit=1`)
      .then(r => r.json())
      .then(data => {
        const feature = data.features?.[0];
        if (feature) setCoords(feature.center); // [lng, lat]
      })
      .catch(() => {});
  }, [address]);

  useEffect(() => {
    if (!coords || !containerRef.current || mapRef.current) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: coords,
      zoom: 14,
      interactive: false,
    });
    new mapboxgl.Marker({ color: '#16a34a' }).setLngLat(coords).addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, [coords]);

  if (!MAPBOX_TOKEN || !address) return null;

  return (
    <div
      ref={containerRef}
      className="w-full h-32 rounded-lg overflow-hidden border border-border mt-2 mb-3"
    />
  );
}

const CHAT_ENABLED_STATUSES = ['accepted', 'scheduled', 'in_progress', 'completed'];

export default function ProviderJobCard({ job, onMarkInProgress, onMarkComplete, onRescheduled, onJobCancelled }) {
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showWeatherModal, setShowWeatherModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showMoveTomorrow, setShowMoveTomorrow] = useState(false);
  const [movingTomorrow, setMovingTomorrow] = useState(false);
  const [chatUser, setChatUser] = useState(null);
  const chatAvailable = CHAT_ENABLED_STATUSES.includes(job.status);

  const openChat = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    let u = chatUser;
    if (!u) u = await base44.auth.me();
    setChatUser(u);
    setShowChat(true);
  };

  const handleComplete = async (job, photos) => {
    await onMarkComplete(job, photos);
  };

  const handleMoveTomorrow = async (e) => {
    e.preventDefault(); e.stopPropagation();
    setMovingTomorrow(true);
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowISO = tomorrow.toISOString().split('T')[0];
      await base44.entities.Job.update(job.id, { scheduled_date: tomorrowISO });
      setShowMoveTomorrow(false);
      toast.success('Moved to tomorrow.');
      if (onRescheduled) onRescheduled(job);
    } finally {
      setMovingTomorrow(false);
    }
  };

  return (
    <>
      <div className="relative">
      <Link to={`/jobs/${job.id}`} className="block">
        <div className="bg-card border border-border rounded-xl p-4 hover:shadow-sm transition-all relative">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="font-semibold text-foreground text-sm">{job.service_name}</h3>
                <StatusBadge status={job.status} />
              </div>
              <p className="text-xs text-muted-foreground font-medium">{job.customer_name}</p>
            </div>
            {job.quoted_price && (
              <div className="text-right">
                <p className="text-lg font-bold text-foreground">${job.quoted_price}</p>

              </div>
            )}
          </div>

          <div className="space-y-1 mb-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar size={11} />
              <span>{parseLocalDate(job.scheduled_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin size={11} />
              <span>{job.address}</span>
              {job.address && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(job.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="ml-1 flex items-center gap-1 text-primary font-semibold hover:underline"
                >
                  <Navigation size={11} />
                  Navigate
                </a>
              )}
            </div>
          </div>

          {/* Acceptance timer for accepted/scheduled jobs */}
          {['accepted', 'scheduled'].includes(job.status) && (
            <div className="mb-3">
              <JobAcceptanceTimer job={job} />
            </div>
          )}

          {/* Show mini map for active jobs */}
          {['scheduled', 'in_progress', 'accepted'].includes(job.status) && job.address && (
            <JobMiniMap address={job.address} />
          )}

          {/* Order Details Toggle */}
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); setShowOrderDetails(v => !v); }}
            className="w-full flex items-center justify-between px-3 py-2 bg-muted/30 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors mb-2"
          >
            <span className="flex items-center gap-1.5"><ClipboardList size={12} /> Order Details & Instructions</span>
            <ChevronDown size={12} className={`transition-transform ${showOrderDetails ? 'rotate-180' : ''}`} />
          </button>

          {showOrderDetails && (
            <div className="bg-muted/20 border border-border rounded-lg p-3 mb-3 space-y-3 text-xs">
              {/* Customer Instructions */}
              <div>
                <p className="font-bold text-foreground mb-1">📋 Customer Instructions</p>
                {job.customer_notes ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
                    <p className="text-amber-900 leading-relaxed">{job.customer_notes}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">No special instructions.</p>
                )}
              </div>

              {/* Pricing */}
              {job.quoted_price && (
                <div>
                  <p className="font-bold text-foreground mb-1">
                    <DollarSign size={11} className="inline" /> Pricing
                  </p>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quoted Price</span>
                    <span className="font-semibold text-foreground">${job.quoted_price}</span>
                  </div>

                </div>
              )}

              {/* Checklist */}
              <div>
                <p className="font-bold text-foreground mb-1">✅ Checklist</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Review instructions before arriving</li>
                  <li>• Take before photos on arrival</li>
                  <li>• Complete service thoroughly</li>
                  <li>• Take after photos once done</li>
                  <li>• Mark job complete in portal</li>
                </ul>
              </div>

              <Link
                to={`/jobs/${job.id}`}
                onClick={e => e.stopPropagation()}
                className="block text-center py-1.5 rounded-lg bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-colors"
              >
                View Full Job Details →
              </Link>
            </div>
          )}

          {job.status === 'completed' && (
            <div className={`flex items-center gap-1.5 text-xs mb-3 rounded-lg px-3 py-2 ${
              job.provider_payout
                ? 'text-green-600 bg-green-50 border border-green-200'
                : 'text-amber-700 bg-amber-50 border border-amber-200'
            }`}>
              {job.provider_payout ? (
                <><DollarSign size={12} /><span>Paid out ${job.provider_payout.toFixed(2)}</span></>
              ) : job.provider_payout ? (
                <><DollarSign size={12} /><span>Payout: ${job.provider_payout.toFixed(2)}</span></>
              ) : job.quoted_price ? (
                <><DollarSign size={12} /><span>Est. payout: ${(job.quoted_price * 0.90).toFixed(2)} (90%)</span></>
              ) : (
                <><DollarSign size={12} /><span>Payment pending — contact admin for payout details</span></>
              )}
            </div>
          )}

          {job.status === 'completed' && (
          <div className="flex items-center gap-1.5 text-xs text-green-600 mb-3 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <Image size={12} />
            <span>Photos submitted — visible to customer</span>
          </div>
          )}

          <div className="flex gap-2 flex-wrap" onClick={e => e.preventDefault()}>
            {chatAvailable && (
              <button
                onClick={openChat}
                className="flex items-center justify-center gap-1.5 border border-primary/30 bg-primary/10 text-primary rounded-lg px-3 py-2 text-xs font-semibold hover:bg-primary/20 transition-colors"
              >
                <MessageCircle size={13} />
                Message Customer
              </button>
            )}
            {['scheduled', 'accepted', 'in_progress'].includes(job.status) && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowWeatherModal(true); }}
                className="flex items-center justify-center gap-1.5 border border-blue-300 bg-blue-50 text-blue-700 rounded-lg px-3 py-2 text-xs font-semibold hover:bg-blue-100 transition-colors"
              >
                <CloudRain size={13} />
                Weather
              </button>
            )}
            {['scheduled', 'accepted', 'in_progress'].includes(job.status) && (
              showMoveTomorrow ? (
                <div className="flex items-center gap-1.5" onClick={e => { e.preventDefault(); e.stopPropagation(); }}>
                  <span className="text-xs text-muted-foreground">Move to tomorrow?</span>
                  <button
                    onClick={handleMoveTomorrow}
                    disabled={movingTomorrow}
                    className="text-xs font-semibold text-primary border border-primary/40 rounded-lg px-2.5 py-1.5 hover:bg-primary/10 transition-colors disabled:opacity-50"
                  >
                    Yes
                  </button>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMoveTomorrow(false); }}
                    className="text-xs font-semibold text-muted-foreground border border-border rounded-lg px-2.5 py-1.5 hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMoveTomorrow(true); }}
                  className="flex items-center justify-center gap-1.5 border border-border text-muted-foreground rounded-lg px-3 py-2 text-xs font-semibold hover:bg-muted transition-colors"
                >
                  <CalendarDays size={13} />
                  Tomorrow
                </button>
              )
            )}
            {['scheduled', 'accepted'].includes(job.status) && onMarkInProgress && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMarkInProgress(job); }}
                className="flex-1 flex items-center justify-center gap-1.5 bg-orange-500 text-white rounded-lg py-2 text-xs font-semibold hover:bg-orange-600 transition-colors"
              >
                <PlayCircle size={13} />
                Mark In Progress
              </button>
            )}
            {['accepted', 'scheduled'].includes(job.status) && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowCancelModal(true); }}
                className="flex items-center justify-center gap-1.5 border border-red-300 bg-red-50 text-red-700 rounded-lg px-3 py-2 text-xs font-semibold hover:bg-red-100 transition-colors"
              >
                <XCircle size={13} />
                Can't Make It
              </button>
            )}
            {onMarkComplete ? (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowPhotoModal(true); }}
                className="flex items-center justify-center gap-1.5 border border-primary bg-primary/10 text-primary rounded-lg px-3 py-2 text-xs font-semibold hover:bg-primary/20 transition-colors"
              >
                <Image size={13} />
                {job.status === 'completed' ? 'Upload Photos' : 'Photos & Complete'}
              </button>
            ) : null}
          </div>
        </div>
      </Link>

      </div>

      {showPhotoModal && (
        <JobPhotoUploadModal
          job={job}
          onClose={() => setShowPhotoModal(false)}
          onComplete={handleComplete}
        />
      )}
      {showWeatherModal && (
        <WeatherRescheduleModal
          job={job}
          onClose={() => setShowWeatherModal(false)}
          onRescheduled={onRescheduled}
        />
      )}
      {showCancelModal && (
        <ProviderCancelJobModal
          job={job}
          onClose={() => setShowCancelModal(false)}
          onCancelled={onJobCancelled}
        />
      )}
      {showChat && chatUser && (
        <ChatDrawer
          job={job}
          user={chatUser}
          senderRole="provider"
          otherPartyName={job.customer_name || 'Customer'}
          onClose={() => setShowChat(false)}
        />
      )}
    </>
  );
}