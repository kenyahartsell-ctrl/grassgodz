import { useState, useRef, useEffect } from 'react';
import Map, { Marker, NavigationControl, Popup } from 'react-map-gl';
import mapboxgl from 'mapbox-gl';
import { MapPin, MapPinned, Loader2, X, Calendar, User } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_SECRET || '';

if (MAPBOX_TOKEN) {
  mapboxgl.accessToken = MAPBOX_TOKEN;
}

const DC_CENTER = { lat: 38.9072, lng: -77.0369 };

async function geocodeAddress(address) {
  if (!address || !MAPBOX_TOKEN) return null;
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&limit=1&proximity=${DC_CENTER.lng},${DC_CENTER.lat}&bbox=-77.6,38.7,-76.8,39.1&country=US`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      return { lat, lng };
    }
  } catch {}
  return null;
}

export default function ScheduledJobsMap({ jobs = [] }) {
  const mapRef = useRef(null);
  const [geocodedJobs, setGeocodedJobs] = useState([]);
  const [geocoding, setGeocoding] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/satellite-streets-v12');
  const isSatellite = mapStyle.includes('satellite');
  const [viewState, setViewState] = useState({
    longitude: DC_CENTER.lng,
    latitude: DC_CENTER.lat,
    zoom: 10,
  });

  useEffect(() => {
    let scheduledJobs = Array.isArray(jobs) ? jobs : [];

    scheduledJobs = Object.values(scheduledJobs.reduce((acc, job) => {
      const key = `${job.customer_id}_${job.scheduled_date}_${job.service_id}`;
      if (!acc[key] || new Date(job.updated_date || 0) > new Date(acc[key].updated_date || 0)) {
        acc[key] = job;
      }
      return acc;
    }, {}));

    scheduledJobs = scheduledJobs.filter(j => ['scheduled', 'accepted', 'in_progress'].includes(j.status));

    if (scheduledJobs.length === 0) {
      setGeocodedJobs([]);
      return;
    }
    let cancelled = false;
    setGeocoding(true);
    async function geocodeAll() {
      const results = await Promise.all(
        scheduledJobs.map(async (job) => {
          if (job.latitude && job.longitude) return { ...job, lat: job.latitude, lng: job.longitude };
          if (job.lat && job.lng) return job;
          const coords = await geocodeAddress(job.address);
          if (!coords) return null;
          return { ...job, lat: coords.lat, lng: coords.lng };
        })
      );
      if (!cancelled) {
        const valid = results.filter(Boolean);
        setGeocodedJobs(valid);
        setGeocoding(false);
        if (valid.length > 0) {
          setViewState(v => ({ ...v, latitude: valid[0].lat, longitude: valid[0].lng, zoom: 12 }));
        }
      }
    }
    geocodeAll();
    return () => { cancelled = true; };
  }, [jobs]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="h-64 flex flex-col items-center justify-center bg-muted rounded-xl">
        <MapPin className="w-8 h-8 text-muted-foreground/30 mb-2" />
        <p className="text-sm text-muted-foreground">Map unavailable — Mapbox token not configured.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border border-border shadow-sm" style={{ height: '320px' }}>
      <div className="bg-card border-b border-border px-4 py-2.5 flex items-center justify-between" style={{ flexShrink: 0 }}>
        <div className="flex items-center gap-2">
          <MapPinned size={15} className="text-primary" />
          <span className="text-sm font-semibold text-foreground">
            {geocoding ? 'Loading map…' : `${geocodedJobs.length} job${geocodedJobs.length !== 1 ? 's' : ''} on map`}
          </span>
          {geocoding && <Loader2 size={13} className="animate-spin text-primary" />}
        </div>
        <button
          onClick={() => setMapStyle(isSatellite ? 'mapbox://styles/mapbox/streets-v12' : 'mapbox://styles/mapbox/satellite-streets-v12')}
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors border border-border rounded-lg px-2.5 py-1 bg-card hover:bg-muted"
        >
          {isSatellite ? '🗺 Street' : '🛰 Satellite'}
        </button>
      </div>

      <div className="relative" style={{ height: 'calc(320px - 44px)' }}>
        {geocodedJobs.length === 0 && !geocoding && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10 pointer-events-none">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl px-5 py-3 text-center shadow">
              <MapPin className="w-7 h-7 text-muted-foreground/40 mx-auto mb-1" />
              <p className="text-sm text-muted-foreground font-medium">No scheduled jobs to map</p>
            </div>
          </div>
        )}

        <Map
          ref={mapRef}
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle={mapStyle}
          style={{ width: '100%', height: '100%' }}
        >
          <NavigationControl position="top-right" />

          {geocodedJobs.map((job) => (
            <Marker key={job.id} longitude={job.lng} latitude={job.lat} anchor="bottom">
              <button
                onClick={() => setSelectedJob(selectedJob?.id === job.id ? null : job)}
                className={`transition-transform hover:scale-110 ${selectedJob?.id === job.id ? 'scale-125 z-10' : ''}`}
              >
                <div
                  className="px-2 py-1 rounded-full border-2 border-white shadow-lg text-white font-bold text-xs whitespace-nowrap"
                  style={{ backgroundColor: job.status === 'in_progress' ? '#d97706' : '#16a34a' }}
                >
                  {job.service_name?.split(' ')[0] || 'Job'}
                </div>
              </button>
            </Marker>
          ))}

          {selectedJob && (
            <Popup
              longitude={selectedJob.lng}
              latitude={selectedJob.lat}
              anchor="bottom"
              offset={30}
              onClose={() => setSelectedJob(null)}
              closeButton={false}
            >
              <div className="p-3 min-w-[200px]">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-bold text-sm text-foreground leading-snug">{selectedJob.service_name}</p>
                  <button onClick={() => setSelectedJob(null)} className="text-muted-foreground hover:text-foreground flex-shrink-0 mt-0.5">
                    <X size={13} />
                  </button>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <User size={11} />
                    <span>{selectedJob.customer_name || 'Customer'}</span>
                  </div>
                  {selectedJob.scheduled_date && (
                    <div className="flex items-center gap-1.5">
                      <Calendar size={11} />
                      <span>{new Date(selectedJob.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <MapPin size={11} />
                    <span className="line-clamp-2">{selectedJob.address}</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-border/50">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    selectedJob.status === 'in_progress' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {selectedJob.status === 'in_progress' ? 'In Progress' : 'Scheduled'}
                  </span>
                </div>
              </div>
            </Popup>
          )}
        </Map>
      </div>
    </div>
  );
}