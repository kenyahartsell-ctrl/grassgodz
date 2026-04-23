import { useState, useRef, useEffect } from 'react';
import Map, { Marker, NavigationControl, GeolocateControl } from 'react-map-gl';
import { MapPin, Briefcase, Filter, List, Map as MapIcon, Loader2, MapPinned } from 'lucide-react';
import { calculateDistance, getMarkerColor, calculatePayout, filterJobs, sortByDistance, getJobCoordinates } from '@/lib/mapUtils';
import JobFilterBar from './JobFilterBar';
import JobListView from './JobListView';
import JobMarkerCard from './JobMarkerCard';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

export default function ProviderJobMap({ jobs = [], onAcceptJob, providerProfile }) {
  const mapRef = useRef(null);
  const [viewMode, setViewMode] = useState('split'); // 'split', 'map', 'list'
  const [selectedJob, setSelectedJob] = useState(null);
  const [providerLocation, setProviderLocation] = useState(null);
  const [geolocating, setGeolocating] = useState(false);
  const [viewState, setViewState] = useState({
    longitude: -77.0369,
    latitude: 38.9072,
    zoom: 12,
  });
  const [filters, setFilters] = useState({
    priceMin: null,
    priceMax: null,
    maxDistance: null,
    serviceType: null,
    propertySize: null,
    grassHeight: null,
    frequency: null,
    status: 'requested', // Only show available jobs by default
  });

  // Attempt to get provider's current location
  useEffect(() => {
    if (navigator.geolocation && !providerLocation) {
      setGeolocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setProviderLocation(loc);
          setViewState(prev => ({
            ...prev,
            latitude: loc.lat,
            longitude: loc.lng,
            zoom: 13,
          }));
          setGeolocating(false);
        },
        () => {
          setGeolocating(false);
        }
      );
    }
  }, []);

  // Enrich jobs with location data
  const jobsWithLocations = jobs.map((job, i) => ({
    ...job,
    ...getJobCoordinates(job, i),
    payout: calculatePayout(job.quoted_price || job.base_price || 50),
  }));

  // Apply filters
  const filteredJobs = filterJobs(jobsWithLocations, filters, providerLocation);
  const sortedJobs = sortByDistance(filteredJobs, providerLocation);

  const handleSelectJob = (job) => {
    setSelectedJob(job);
    setViewState(prev => ({
      ...prev,
      latitude: job.lat,
      longitude: job.lng,
      zoom: 15,
    }));
  };

  return (
    <div className="h-full bg-background flex flex-col">
      {/* Filter bar */}
      <div className="bg-card border-b border-border p-4">
        <JobFilterBar filters={filters} onFilterChange={setFilters} />
      </div>

      {/* View mode toggle */}
      <div className="bg-card border-b border-border px-4 py-2 flex items-center gap-2 justify-end">
        <button
          onClick={() => setViewMode('split')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            viewMode === 'split' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <MapIcon size={14} /> Split
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <List size={14} /> List
        </button>
        <button
          onClick={() => setViewMode('map')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            viewMode === 'map' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <MapPin size={14} /> Map
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* List view (left side on split, full on list) */}
        {(viewMode === 'split' || viewMode === 'list') && (
          <div className={`flex flex-col ${viewMode === 'split' ? 'w-96 border-r border-border' : 'w-full'}`}>
            <JobListView
              jobs={sortedJobs}
              selectedJobId={selectedJob?.id}
              onSelectJob={handleSelectJob}
              providerLocation={providerLocation}
              onAcceptJob={onAcceptJob}
            />
          </div>
        )}

        {/* Map view (right side on split, full on map) */}
        {(viewMode === 'split' || viewMode === 'map') && (
          <div className="flex-1 flex flex-col relative">
            {geolocating && (
              <div className="absolute top-4 left-4 z-20 bg-white rounded-lg shadow-md px-3 py-2 flex items-center gap-2 text-xs">
                <Loader2 size={14} className="animate-spin text-primary" />
                Detecting location...
              </div>
            )}

            <Map
              ref={mapRef}
              {...viewState}
              onMove={evt => setViewState(evt.viewState)}
              mapboxAccessToken={MAPBOX_TOKEN}
              mapStyle="mapbox://styles/mapbox/light-v11"
            >
              <NavigationControl position="top-right" />
              <GeolocateControl position="top-right" />

              {/* Provider location marker */}
              {providerLocation && (
                <Marker
                  longitude={providerLocation.lng}
                  latitude={providerLocation.lat}
                  anchor="center"
                >
                  <div className="w-10 h-10 bg-primary rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                    <MapPinned size={18} className="text-white" />
                  </div>
                </Marker>
              )}

              {/* Job markers */}
              {sortedJobs.map(job => (
                <Marker
                  key={job.id}
                  longitude={job.lng}
                  latitude={job.lat}
                  anchor="bottom"
                  onClick={() => handleSelectJob(job)}
                >
                  <button
                    className={`group relative cursor-pointer transition-transform hover:scale-110`}
                    onClick={e => {
                      e.stopPropagation();
                      handleSelectJob(job);
                    }}
                  >
                    <div
                      className={`w-12 h-12 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white font-bold text-sm transition-all ${
                        selectedJob?.id === job.id
                          ? 'ring-4 ring-primary/50 scale-125'
                          : 'hover:ring-2 hover:ring-primary/30'
                      }`}
                      style={{ backgroundColor: getMarkerColor(job) }}
                    >
                      ${job.payout}
                    </div>
                  </button>
                </Marker>
              ))}
            </Map>

            {/* Selected job detail card overlay */}
            {selectedJob && viewMode === 'split' && (
              <div className="absolute bottom-4 left-4 right-4 max-w-sm z-10">
                <JobMarkerCard
                  job={selectedJob}
                  providerLocation={providerLocation}
                  onAccept={() => {
                    onAcceptJob(selectedJob);
                    setSelectedJob(null);
                  }}
                  onClose={() => setSelectedJob(null)}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected job modal for map-only view */}
      {selectedJob && viewMode === 'map' && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="w-full bg-card rounded-t-2xl max-h-96 overflow-y-auto">
            <JobMarkerCard
              job={selectedJob}
              providerLocation={providerLocation}
              onAccept={() => {
                onAcceptJob(selectedJob);
                setSelectedJob(null);
              }}
              onClose={() => setSelectedJob(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}