import { useState, useEffect, useRef } from 'react';
import { List, Map as MapIcon, MapPin, DollarSign, Banknote, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import AvailableJobCard from './AvailableJobCard';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_SECRET;

function todayStr() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function fmtDay(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const today = todayStr();
  const tomorrow = addDays(today, 1);
  if (dateStr === today) return 'Today';
  if (dateStr === tomorrow) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function getPinColor(price) {
  if (!price) return '#6b7280';
  if (price < 100) return '#16a34a';
  if (price <= 200) return '#ca8a04';
  return '#dc2626';
}

function getCityFromAddress(address) {
  if (!address) return 'Unknown area';
  const parts = address.split(',');
  return parts.length >= 2 ? parts[parts.length - 2].trim() : parts[0].trim();
}

function JobMapView({ jobs }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const jobsWithCoords = jobs.filter(j => j.latitude && j.longitude);

  useEffect(() => {
    if (!MAPBOX_TOKEN || !containerRef.current) return;
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }

    const center = jobsWithCoords.length > 0
      ? [jobsWithCoords[0].longitude, jobsWithCoords[0].latitude]
      : [-77.03, 38.9];

    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center,
      zoom: 11,
    });
    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.on('load', () => {
      jobsWithCoords.forEach(job => {
        const el = document.createElement('div');
        el.style.cssText = `width:36px;height:36px;border-radius:50%;background:${getPinColor(job.quoted_price)};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:10px;font-weight:700;cursor:pointer;`;
        el.textContent = job.quoted_price ? `$${Math.round(job.quoted_price)}` : '?';

        const popup = new mapboxgl.Popup({ offset: 20, closeButton: false })
          .setHTML(`<div style="font-size:13px;min-width:140px"><strong>${job.service_name || ''}</strong><br/><span style="color:#666;font-size:11px">${getCityFromAddress(job.address)}</span>${job.quoted_price ? `<br/><strong style="color:#16a34a">$${job.quoted_price.toFixed(2)}</strong>` : '<br/><span style="color:#999;font-size:11px">Quote needed</span>'}</div>`);

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([job.longitude, job.latitude])
          .setPopup(popup)
          .addTo(map);
        markersRef.current.push(marker);
      });

      if (jobsWithCoords.length > 1) {
        const bounds = jobsWithCoords.reduce((b, j) => b.extend([j.longitude, j.latitude]), new mapboxgl.LngLatBounds([jobsWithCoords[0].longitude, jobsWithCoords[0].latitude], [jobsWithCoords[0].longitude, jobsWithCoords[0].latitude]));
        map.fitBounds(bounds, { padding: 60 });
      }
    });

    return () => { map.remove(); mapRef.current = null; markersRef.current = []; };
  }, [jobs]);

  if (!MAPBOX_TOKEN) return (
    <div className="flex items-center justify-center h-64 bg-muted/20 rounded-xl border border-border">
      <p className="text-sm text-muted-foreground">Map not configured.</p>
    </div>
  );

  return (
    <div className="rounded-xl overflow-hidden border border-border" style={{ height: 420 }}>
      {jobsWithCoords.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full bg-muted/20 text-center px-6">
          <MapIcon className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground font-medium">No map locations available</p>
          <p className="text-xs text-muted-foreground mt-1">Switch to List view.</p>
        </div>
      ) : (
        <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
      )}
    </div>
  );
}

function JobListView({ jobs, providerProfile, onSubmitQuote, onAcceptCashJob, onboardingComplete }) {
  const sorted = [...jobs].sort((a, b) => (b.quoted_price || 0) - (a.quoted_price || 0));
  if (sorted.length === 0) return (
    <div className="text-center py-12">
      <CalendarDays className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
      <p className="text-muted-foreground font-medium">No jobs available for this day</p>
      <p className="text-sm text-muted-foreground mt-1">Try another date or check back later.</p>
    </div>
  );
  return (
    <div className="space-y-3">
      {sorted.map(job => (
        <div key={job.id} className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 flex items-center gap-3 border-b border-border/50">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm text-foreground">{job.service_name}</span>
                {(job.is_cash_job || job.payment_method === 'cash') && (
                  <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <Banknote size={10} /> Cash
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <MapPin size={10} /> {getCityFromAddress(job.address)}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              {job.quoted_price
                ? <p className="text-sm font-bold text-foreground">${job.quoted_price.toFixed(2)}</p>
                : <p className="text-xs text-muted-foreground">Quote</p>}
            </div>
          </div>
          <div className="px-4 pb-4 pt-3">
            <AvailableJobCard job={job} providerProfile={providerProfile} onSubmitQuote={onSubmitQuote} onAcceptCashJob={onAcceptCashJob} onboardingComplete={onboardingComplete} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AvailableJobsDiscovery({ jobs, providerProfile, onSubmitQuote, onAcceptCashJob, onboardingComplete }) {
  const [viewMode, setViewMode] = useState('list');
  const [selectedDate, setSelectedDate] = useState(todayStr());

  const yesterday = addDays(selectedDate, -1);

  // Show jobs for the selected day + missed cuts from yesterday (still unaccepted/requested)
  const filteredJobs = jobs.filter(j => {
    if (!j.scheduled_date) return true; // unscheduled / quote-only jobs always show
    if (j.scheduled_date === selectedDate) return true;
    // Missed cuts: yesterday's jobs that were never accepted
    if (j.scheduled_date === yesterday && ['requested', 'scheduled'].includes(j.status)) return true;
    return false;
  });

  const today = todayStr();
  const isToday = selectedDate === today;

  return (
    <div className="space-y-4">
      {/* Date navigator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
          <button onClick={() => setSelectedDate(d => addDays(d, -1))}
            className="p-1.5 rounded-lg hover:bg-card transition-colors">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setSelectedDate(today)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${isToday ? 'bg-primary text-primary-foreground' : 'hover:bg-card text-muted-foreground'}`}>
            Today
          </button>
          <span className="px-2 text-sm font-semibold text-foreground">{fmtDay(selectedDate)}</span>
          <button onClick={() => setSelectedDate(d => addDays(d, 1))}
            className="p-1.5 rounded-lg hover:bg-card transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="flex items-center bg-muted rounded-lg p-1 gap-1">
          <button onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${ viewMode === 'list' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground' }`}>
            <List size={13} /> List
          </button>
          <button onClick={() => setViewMode('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${ viewMode === 'map' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground' }`}>
            <MapIcon size={13} /> Map
          </button>
        </div>
      </div>

      {(() => {
        const missedCuts = filteredJobs.filter(j => j.scheduled_date === yesterday);
        return (
          <div className="space-y-0.5">
            <p className="text-sm text-muted-foreground">
              {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} available {isToday ? 'today' : 'on this day'}
            </p>
            {missedCuts.length > 0 && (
              <p className="text-xs text-amber-600 font-medium">
                ⚠ {missedCuts.length} missed cut{missedCuts.length !== 1 ? 's' : ''} from yesterday still available
              </p>
            )}
          </div>
        );
      })()}

      {viewMode === 'map'
        ? <JobMapView jobs={filteredJobs} providerProfile={providerProfile} />
        : <JobListView jobs={filteredJobs} providerProfile={providerProfile} onSubmitQuote={onSubmitQuote} onAcceptCashJob={onAcceptCashJob} onboardingComplete={onboardingComplete} />
      }
    </div>
  );
}