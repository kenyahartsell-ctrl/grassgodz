import { useState, useRef, useEffect } from 'react';
import Map, { Marker, NavigationControl, GeolocateControl, Source, Layer } from 'react-map-gl';
import { MapPin, Briefcase, Filter, X, Loader2, MapPinned, DollarSign, Zap } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';
const DC_CENTER = { lat: 38.9072, lng: -77.0369 };
const SERVICE_RADIUS_MILES = 50;

// Helper: calculate distance between coordinates (Haversine formula)
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 3959; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + 
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper: get marker color based on status
function getMarkerColor(job) {
  if (job.status === 'completed' || job.status === 'cancelled') return '#9CA3AF'; // gray
  if (job.grass_height === 'Overgrown') return '#EF4444'; // red
  if (job.status === 'quoted') return '#FBBF24'; // yellow
  if (job.provider_id) return '#9CA3AF'; // gray (assigned)
  return '#22C55E'; // green (available)
}

export default function ProviderJobMap({ jobs = [], onAcceptJob, providerProfile }) {
  const mapRef = useRef(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [providerLocation, setProviderLocation] = useState(null);
  const [geolocating, setGeolocating] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewState, setViewState] = useState({
    longitude: DC_CENTER.lng,
    latitude: DC_CENTER.lat,
    zoom: 11,
  });
  const [filters, setFilters] = useState({
    maxDistance: 50,
    priceMin: 0,
    priceMax: 500,
    serviceType: null,
    grassHeight: null,
    todayOnly: false,
    recurringOnly: false,
  });
  const [mapLoaded, setMapLoaded] = useState(false);

  // Get provider's location
  useEffect(() => {
    if (navigator.geolocation && !providerLocation) {
      setGeolocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
          setProviderLocation(loc);
          setViewState(prev => ({ ...prev, latitude: loc.lat, longitude: loc.lng, zoom: 12 }));
          setGeolocating(false);
        },
        () => setGeolocating(false)
      );
    }
  }, []);

  // Only show available jobs, filter & sort
  const availableJobs = jobs.filter(j => !j.provider_id && j.status === 'requested');
  const filtered = availableJobs.filter(job => {
    const jobLat = job.lat || parseFloat(job.address?.split(',')[0]) || DC_CENTER.lat;
    const jobLng = job.lng || parseFloat(job.address?.split(',')[1]) || DC_CENTER.lng;
    const dist = providerLocation ? getDistance(providerLocation.lat, providerLocation.lng, jobLat, jobLng) : 0;
    const payout = (job.quoted_price || 50) * 0.75;
    
    if (dist > filters.maxDistance) return false;
    if (payout < filters.priceMin || payout > filters.priceMax) return false;
    if (filters.serviceType && job.service_name !== filters.serviceType) return false;
    if (filters.grassHeight && job.grass_height !== filters.grassHeight) return false;
    if (filters.todayOnly && job.scheduled_date !== new Date().toISOString().split('T')[0]) return false;
    return true;
  }).map(job => ({
    ...job,
    lat: job.lat || DC_CENTER.lat + (Math.random() - 0.5) * 0.5,
    lng: job.lng || DC_CENTER.lng + (Math.random() - 0.5) * 0.5,
    distance: providerLocation ? getDistance(providerLocation.lat, providerLocation.lng, job.lat || DC_CENTER.lat, job.lng || DC_CENTER.lng) : 0,
    payout: (job.quoted_price || 50) * 0.75,
  })).sort((a, b) => a.distance - b.distance);

  // Guard: check if Mapbox token is available
  if (!MAPBOX_TOKEN) {
    return (
      <div className="h-full bg-background flex flex-col items-center justify-center">
        <MapPin className="w-10 h-10 text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground font-medium">Map unavailable</p>
        <p className="text-xs text-muted-foreground mt-1">Mapbox token not configured.</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-background flex flex-col">
      {/* Header with filters */}
      <div className="bg-card border-b border-border p-4 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-foreground">Available Jobs in DMV</h2>
          <p className="text-xs text-muted-foreground">{filtered.length} jobs • Within {filters.maxDistance} miles</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-xs font-medium"
        >
          <Filter size={14} /> Filters
        </button>
      </div>

      {/* Expandable filter panel */}
      {showFilters && (
        <div className="bg-secondary/20 border-b border-border p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Max Distance (miles)</label>
              <input
                type="range"
                min={5}
                max={50}
                value={filters.maxDistance}
                onChange={e => setFilters({ ...filters, maxDistance: Number(e.target.value) })}
                className="w-full accent-primary"
              />
              <span className="text-xs text-foreground font-medium">{filters.maxDistance}mi</span>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Payout Range</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={500}
                  value={filters.priceMin}
                  onChange={e => setFilters({ ...filters, priceMin: Number(e.target.value) })}
                  className="w-12 px-1 py-1 border border-border rounded text-xs"
                  placeholder="Min"
                />
                <span className="text-xs text-muted-foreground">–</span>
                <input
                  type="number"
                  min={0}
                  max={500}
                  value={filters.priceMax}
                  onChange={e => setFilters({ ...filters, priceMax: Number(e.target.value) })}
                  className="w-12 px-1 py-1 border border-border rounded text-xs"
                  placeholder="Max"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <select
              value={filters.serviceType || ''}
              onChange={e => setFilters({ ...filters, serviceType: e.target.value || null })}
              className="px-2 py-1.5 border border-border rounded-lg text-xs bg-background"
            >
              <option value="">All Services</option>
              <option value="Lawn Mowing">Lawn Mowing</option>
              <option value="Leaf Removal">Leaf Removal</option>
              <option value="Hedge Trimming">Hedge Trimming</option>
              <option value="Fertilization">Fertilization</option>
              <option value="Aeration">Aeration</option>
              <option value="Snow Removal">Snow Removal</option>
            </select>
            <select
              value={filters.grassHeight || ''}
              onChange={e => setFilters({ ...filters, grassHeight: e.target.value || null })}
              className="px-2 py-1.5 border border-border rounded-lg text-xs bg-background"
            >
              <option value="">All Heights</option>
              <option value="Short">Short</option>
              <option value="Medium">Medium</option>
              <option value="Overgrown">Overgrown</option>
            </select>
          </div>

          <div className="flex gap-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={filters.todayOnly}
                onChange={e => setFilters({ ...filters, todayOnly: e.target.checked })}
              />
              <span>Available Today</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={filters.recurringOnly}
                onChange={e => setFilters({ ...filters, recurringOnly: e.target.checked })}
              />
              <span>Recurring Only</span>
            </label>
          </div>
        </div>
      )}

      {/* Map + Job list */}
      <div className="flex-1 flex overflow-hidden">
        {/* Job list sidebar */}
        <div className="w-80 border-r border-border flex flex-col overflow-hidden bg-card">
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <MapPin className="w-10 h-10 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No jobs available</p>
              </div>
            ) : (
              <div className="space-y-2 p-3">
                {filtered.map(job => (
                  <button
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedJob?.id === job.id
                        ? 'bg-primary/10 border-primary'
                        : 'bg-background border-border hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-semibold text-sm text-foreground">{job.service_name}</p>
                      <span className="font-bold text-primary">${job.payout.toFixed(0)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{job.address}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Zap size={12} className="text-amber-500" />
                      <span className="text-xs text-muted-foreground">{job.distance.toFixed(1)} miles</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative" style={{ pointerEvents: mapLoaded ? 'auto' : 'none' }}>
          {geolocating && (
            <div className="absolute top-4 left-4 z-20 bg-white rounded-lg shadow-md px-3 py-2 flex items-center gap-2 text-xs">
              <Loader2 size={14} className="animate-spin text-primary" />
              Locating...
            </div>
          )}

          <Map
            ref={mapRef}
            {...viewState}
            onMove={evt => setViewState(evt.viewState)}
            onLoad={() => {
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  setTimeout(() => setMapLoaded(true), 300);
                });
              });
            }}
            mapboxAccessToken={MAPBOX_TOKEN}
            mapStyle="mapbox://styles/mapbox/light-v11"
          >
            {mapLoaded && <NavigationControl position="top-right" />}
            {mapLoaded && <GeolocateControl position="top-right" />}

            {/* Provider location */}
            {mapLoaded && providerLocation && (
              <Marker longitude={providerLocation.lng} latitude={providerLocation.lat} anchor="center">
                <div className="w-10 h-10 bg-primary rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                  <MapPinned size={18} className="text-white" />
                </div>
              </Marker>
            )}

            {/* Job markers */}
            {mapLoaded && filtered.map(job => (
              <Marker key={job.id} longitude={job.lng} latitude={job.lat} anchor="bottom">
                <button
                  onClick={() => setSelectedJob(job)}
                  className={`group cursor-pointer transition-transform hover:scale-110 ${selectedJob?.id === job.id ? 'scale-125' : ''}`}
                >
                  <div
                    className={`w-12 h-12 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white font-bold text-sm ${
                      selectedJob?.id === job.id ? 'ring-4 ring-primary/50' : ''
                    }`}
                    style={{ backgroundColor: getMarkerColor(job) }}
                  >
                    ${job.payout.toFixed(0)}
                  </div>
                </button>
              </Marker>
            ))}
          </Map>

          {/* Job detail card */}
          {selectedJob && (
            <div className="absolute bottom-4 right-4 w-96 max-h-96 bg-card rounded-2xl shadow-lg border border-border overflow-y-auto z-10">
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-bold text-foreground">{selectedJob.service_name}</h3>
                    <p className="text-xs text-muted-foreground">{selectedJob.customer_name}</p>
                  </div>
                  <button onClick={() => setSelectedJob(null)} className="text-muted-foreground hover:text-foreground">
                    <X size={16} />
                  </button>
                </div>

                <div className="bg-primary/10 rounded-lg p-3 mb-3">
                  <p className="text-xs text-muted-foreground mb-1">Estimated Payout</p>
                  <p className="text-2xl font-bold text-primary">${selectedJob.payout.toFixed(2)}</p>
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <p><span className="text-muted-foreground">Address:</span> <span className="font-medium">{selectedJob.address}</span></p>
                  <p><span className="text-muted-foreground">Distance:</span> <span className="font-medium">{selectedJob.distance.toFixed(1)} miles</span></p>
                  <p><span className="text-muted-foreground">Scheduled:</span> <span className="font-medium">{selectedJob.scheduled_date || 'Flexible'}</span></p>
                  <p><span className="text-muted-foreground">Lawn Size:</span> <span className="font-medium">{selectedJob.property_size || 'Not specified'}</span></p>
                  <p><span className="text-muted-foreground">Grass Height:</span> <span className="font-medium">{selectedJob.grass_height || 'Not specified'}</span></p>
                </div>

                {selectedJob.customer_notes && (
                  <div className="bg-secondary/20 rounded-lg p-2 mb-4">
                    <p className="text-xs text-muted-foreground mb-1">Customer Notes</p>
                    <p className="text-xs text-foreground">{selectedJob.customer_notes}</p>
                  </div>
                )}

                <button
                  onClick={() => {
                    onAcceptJob(selectedJob);
                    setSelectedJob(null);
                  }}
                  className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Accept Job
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}