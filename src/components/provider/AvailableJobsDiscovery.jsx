import { useState } from 'react';
import { List, Map as MapIcon, MapPin, DollarSign, Banknote, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import AvailableJobCard from './AvailableJobCard';

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

function JobMapView({ jobs, providerProfile }) {
  const jobsWithCoords = jobs.filter(j => j.latitude && j.longitude);
  const center = jobsWithCoords.length > 0
    ? [jobsWithCoords[0].latitude, jobsWithCoords[0].longitude]
    : [38.9, -77.03];
  return (
    <div className="rounded-xl overflow-hidden border border-border" style={{ height: 420 }}>
      {jobsWithCoords.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full bg-muted/20 text-center px-6">
          <MapIcon className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground font-medium">No map locations available</p>
          <p className="text-xs text-muted-foreground mt-1">Switch to List view.</p>
        </div>
      ) : (
        <MapContainer center={center} zoom={11} style={{ height: '100%', width: '100%' }} zoomControl>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
          {jobsWithCoords.map(job => (
            <CircleMarker key={job.id} center={[job.latitude, job.longitude]} radius={14}
              pathOptions={{ fillColor: getPinColor(job.quoted_price), color: '#fff', weight: 2, fillOpacity: 0.9 }}>
              <Popup>
                <div className="text-sm min-w-[160px]">
                  <p className="font-bold">{job.service_name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{getCityFromAddress(job.address)}</p>
                  {job.quoted_price ? <p className="text-xs font-bold mt-1">${job.quoted_price.toFixed(2)}</p> : <p className="text-xs text-muted-foreground mt-1">Quote</p>}
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
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

  // Show only jobs for the selected day (biweekly excluded — they live on the calendar)
  const filteredJobs = jobs.filter(j => {
    if (j.recurrence === 'biweekly') return false;
    if (!j.scheduled_date) return true; // unscheduled / quote-only jobs always show
    return j.scheduled_date === selectedDate;
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

      <p className="text-sm text-muted-foreground">
        {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} available {isToday ? 'today' : 'on this day'}
      </p>

      {viewMode === 'map'
        ? <JobMapView jobs={filteredJobs} providerProfile={providerProfile} />
        : <JobListView jobs={filteredJobs} providerProfile={providerProfile} onSubmitQuote={onSubmitQuote} onAcceptCashJob={onAcceptCashJob} onboardingComplete={onboardingComplete} />
      }
    </div>
  );
}
