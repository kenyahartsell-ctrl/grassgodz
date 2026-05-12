import { useState, useEffect, useRef } from 'react';
import { Calendar, MapPin, PlayCircle, CheckCircle, Image, Navigation, ChevronDown, ClipboardList, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatusBadge from '../shared/StatusBadge';
import JobPhotoUploadModal from './JobPhotoUploadModal';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

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

export default function ProviderJobCard({ job, onMarkInProgress, onMarkComplete }) {
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  const handleComplete = async (job, photos) => {
    await onMarkComplete(job, photos);
  };

  return (
    <>
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
              <span>{new Date(job.scheduled_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
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
              ) : job.quoted_price ? (
                <><DollarSign size={12} /><span>Pending payment — expected ${(job.quoted_price * 0.75).toFixed(2)}</span></>
              ) : (
                <><DollarSign size={12} /><span>Payment pending — contact admin for payout details</span></>
              )}
            </div>
          )}

          {job.status === 'completed' && job.completion_photos && Object.keys(job.completion_photos).length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-green-600 mb-3 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <Image size={12} />
              <span>Completion photos submitted</span>
            </div>
          )}

          <div className="flex gap-2" onClick={e => e.preventDefault()}>
            {['scheduled', 'accepted'].includes(job.status) && onMarkInProgress && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMarkInProgress(job); }}
                className="flex-1 flex items-center justify-center gap-1.5 bg-orange-500 text-white rounded-lg py-2 text-xs font-semibold hover:bg-orange-600 transition-colors"
              >
                <PlayCircle size={13} />
                Mark In Progress
              </button>
            )}
            {(['in_progress', 'accepted', 'scheduled'].includes(job.status) && onMarkComplete) || job.status === 'completed' ? (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowPhotoModal(true); }}
                className="flex items-center justify-center gap-1.5 border border-primary bg-primary/10 text-primary rounded-lg px-3 py-2 text-xs font-semibold hover:bg-primary/20 transition-colors"
              >
                <Image size={13} />
                {job.status === 'completed' ? 'Add Photos' : 'Photos & Complete'}
              </button>
            ) : null}
          </div>
        </div>
      </Link>

      {showPhotoModal && (
        <JobPhotoUploadModal
          job={job}
          onClose={() => setShowPhotoModal(false)}
          onComplete={handleComplete}
        />
      )}
    </>
  );
}