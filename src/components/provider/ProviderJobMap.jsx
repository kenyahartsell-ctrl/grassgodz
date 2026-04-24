import { useState, useRef, useEffect, useCallback } from 'react';
import Map, { Marker, NavigationControl, GeolocateControl } from 'react-map-gl';
import { MapPin, Filter, X, Loader2, MapPinned, Zap } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';
const DC_CENTER = { lat: 38.9072, lng: -77.0369 };

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function geocodeAddress(address) {
  if (!address || !MAPBOX_TOKEN) return null;
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&limit=1&country=US`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.features && data.features.length > 0) {
    const [lng, lat] = data.features[0].center;
    return { lat, lng };
  }
  return null;
}

export default function ProviderJobMap({ jobs = [], onAcceptJob, providerProfile }) {
  const mapRef = useRef(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [providerLocation, setProviderLocation] = useState(null);
  const [geolocating, setGeolocating] = useState(false);
  const [geocodedJobs, setGeocodedJobs] = useState([]);
  const [geocoding, setGeocoding] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewState, setViewState] = useState({
    longitude: DC_CENTER.lng,
    latitude: DC_CENTER.lat,
    zoom: 10,
  });
  const [filters, setFilters] = useState({
    maxDistance: 50,
    serviceType: '',
  });

  // Geolocate provider
  useEffect(() => {
    if (navigator.geolocation) {
      setGeolocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setProviderLocation(loc);
          setViewState((v) => ({ ...v, latitude: loc.lat, longitude: loc.lng, zoom: 11 }));
          setGeolocating(false);
        },
        () => setGeolocating(false),
        { timeout: 8000 }
      );
    }
  }, []);

  // Geocode all job addresses
  useEffect(() => {
    const availableJobs = Array.isArray(jobs)
      ? jobs.filter((j) => !j.provider_id && j.status === 'requested')
      : [];

    if (availableJobs.length === 0) {
      setGeocodedJobs([]);
      return;
    }

    let cancelled = false;
    setGeocoding(true);

    async function geocodeAll() {
      const results = await Promise.all(
        availableJobs.map(async (job) => {
          // If already has coords, skip geocoding
          if (job.lat && job.lng) return { ...job, payout: (job.quoted_price || 50) * 0.75 };
          const coords = await geocodeAddress(job.address);
          if (!coords) return null;
          return { ...job, lat: coords.lat, lng: coords.lng, payout: (job.quoted_price || 50) * 0.75 };
        })
      );
      if (!cancelled) {
        setGeocodedJobs(results.filter(Boolean));
        setGeocoding(false);
      }
    }

    geocodeAll();
    return () => { cancelled = true; };
  }, [jobs]);

  // Filter and sort jobs
  const filtered = geocodedJobs
    .map((job) => ({
      ...job,
      distance: providerLocation
        ? getDistance(providerLocation.lat, providerLocation.lng, job.lat, job.lng)
        : 0,
    }))
    .filter((job) => {
      if (job.distance > filters.maxDistance) return false;
      if (filters.serviceType && job.service_name !== filters.serviceType) return false;
      return true;
    })
    .sort((a, b) => a.distance - b.distance);

  // Unique service names for filter dropdown
  const serviceNames = [...new Set(geocodedJobs.map((j) => j.service_name).filter(Boolean))];

  if (!MAPBOX_TOKEN) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-background">
        <MapPin className="w-10 h-10 text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground font-medium">Map unavailable</p>
        <p className="text-xs text-muted-foreground mt-1">Mapbox token not configured.</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between gap-3 flex-shrink-0">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-foreground">Available Jobs</h2>
          <p className="text-xs text-muted-foreground">
            {geocoding ? 'Loading jobs...' : `${filtered.length} job${filtered.length !== 1 ? 's' : ''} near you`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {geocoding && <Loader2 size={14} className="animate-spin text-primary" />}
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
              showFilters ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'
            }`}
          >
            <Filter size={13} /> Filters
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-secondary/20 border-b border-border px-4 py-3 flex flex-wrap gap-4 flex-shrink-0">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Max Distance</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={5}
                max={100}
                step={5}
                value={filters.maxDistance}
                onChange={(e) => setFilters((f) => ({ ...f, maxDistance: Number(e.target.value) }))}
                className="w-28 accent-primary"
              />
              <span className="text-xs font-semibold text-foreground w-10">{filters.maxDistance}mi</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Service Type</label>
            <select
              value={filters.serviceType}
              onChange={(e) => setFilters((f) => ({ ...f, serviceType: e.target.value }))}
              className="px-2 py-1.5 border border-border rounded-lg text-xs bg-background"
            >
              <option value="">All Services</option>
              {serviceNames.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Job list sidebar */}
        <div className="w-72 border-r border-border flex flex-col overflow-hidden bg-card flex-shrink-0">
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 && !geocoding ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <MapPin className="w-10 h-10 text-muted-foreground/25 mb-2" />
                <p className="text-sm font-medium text-muted-foreground">No jobs available</p>
                <p className="text-xs text-muted-foreground mt-1">Check back soon or expand your filters.</p>
              </div>
            ) : (
              <div className="space-y-2 p-3">
                {filtered.map((job) => (
                  <button
                    key={job.id}
                    onClick={() => {
                      setSelectedJob(job);
                      setViewState((v) => ({ ...v, latitude: job.lat, longitude: job.lng, zoom: 14 }));
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      selectedJob?.id === job.id
                        ? 'bg-primary/10 border-primary shadow-sm'
                        : 'bg-background border-border hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-semibold text-sm text-foreground leading-snug">{job.service_name}</p>
                      <span className="font-bold text-primary text-sm flex-shrink-0">${job.payout.toFixed(0)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-1.5">{job.address}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Zap size={11} className="text-amber-500" />
                        {job.distance.toFixed(1)} mi
                      </span>
                      {job.scheduled_date && (
                        <span>{new Date(job.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          {geolocating && (
            <div className="absolute top-3 left-3 z-20 bg-white rounded-lg shadow px-3 py-2 flex items-center gap-2 text-xs font-medium">
              <Loader2 size={13} className="animate-spin text-primary" />
              Locating you…
            </div>
          )}

          <Map
            ref={mapRef}
            {...viewState}
            onMove={(evt) => setViewState(evt.viewState)}
            mapboxAccessToken={MAPBOX_TOKEN}
            mapStyle="mapbox://styles/mapbox/light-v11"
            style={{ width: '100%', height: '100%' }}
          >
            <NavigationControl position="top-right" />
            <GeolocateControl position="top-right" />

            {/* Provider pin */}
            {providerLocation && (
              <Marker longitude={providerLocation.lng} latitude={providerLocation.lat} anchor="center">
                <div className="w-10 h-10 bg-primary rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                  <MapPinned size={16} className="text-white" />
                </div>
              </Marker>
            )}

            {/* Job markers */}
            {filtered.map((job) => (
              <Marker key={job.id} longitude={job.lng} latitude={job.lat} anchor="bottom">
                <button
                  onClick={() => setSelectedJob(job)}
                  className={`transition-transform hover:scale-110 ${selectedJob?.id === job.id ? 'scale-125 z-10' : ''}`}
                >
                  <div
                    className={`px-2 py-1 rounded-full border-2 border-white shadow-lg text-white font-bold text-xs whitespace-nowrap ${
                      selectedJob?.id === job.id ? 'ring-2 ring-primary' : ''
                    }`}
                    style={{ backgroundColor: '#16a34a' }}
                  >
                    ${job.payout.toFixed(0)}
                  </div>
                </button>
              </Marker>
            ))}
          </Map>

          {/* Selected job detail card */}
          {selectedJob && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[22rem] max-w-[calc(100vw-2rem)] bg-card rounded-2xl shadow-xl border border-border z-20 overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-foreground text-base">{selectedJob.service_name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{selectedJob.customer_name}</p>
                  </div>
                  <button
                    onClick={() => setSelectedJob(null)}
                    className="text-muted-foreground hover:text-foreground flex-shrink-0"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="bg-primary/10 rounded-xl px-4 py-3 mb-3 text-center">
                  <p className="text-xs text-muted-foreground mb-0.5">Your Payout (75%)</p>
                  <p className="text-2xl font-bold text-primary">${selectedJob.payout.toFixed(2)}</p>
                </div>

                <div className="space-y-1.5 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Address</span>
                    <span className="font-medium text-right max-w-[180px] truncate">{selectedJob.address}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Distance</span>
                    <span className="font-medium">{selectedJob.distance.toFixed(1)} miles</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium">{selectedJob.scheduled_date || 'Flexible'}</span>
                  </div>
                </div>

                {selectedJob.customer_notes && (
                  <div className="bg-muted/40 rounded-lg p-2.5 mb-3 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">Notes: </span>
                    {selectedJob.customer_notes}
                  </div>
                )}

                <button
                  onClick={() => {
                    onAcceptJob(selectedJob);
                    setSelectedJob(null);
                  }}
                  className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors"
                >
                  Accept Job
                </button>
              </div>
            </div>
          )}

          {/* Empty overlay */}
          {filtered.length === 0 && !geocoding && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl px-6 py-4 text-center shadow">
                <MapPin className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm font-medium text-muted-foreground">No available jobs in this area</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}