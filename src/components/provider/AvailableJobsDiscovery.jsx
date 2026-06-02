import { useState } from 'react';
import { List, Map as MapIcon, MapPin, DollarSign, Banknote } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import AvailableJobCard from './AvailableJobCard';

function getPinColor(price) {
  if (!price) return '#6b7280'; // gray for no price
  if (price < 100) return '#16a34a';  // green
  if (price <= 200) return '#ca8a04'; // yellow
  return '#dc2626'; // red
}

function getPriceLabel(price) {
  if (!price) return null;
  if (price < 100) return { label: 'Under $100', color: 'bg-green-100 text-green-800 border-green-200' };
  if (price <= 200) return { label: '$100–$200', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
  return { label: 'Deposit Req.', color: 'bg-red-100 text-red-800 border-red-200' };
}

function getCityFromAddress(address) {
  if (!address) return 'Unknown area';
  const parts = address.split(',');
  return parts.length >= 2 ? parts[parts.length - 2].trim() : parts[0].trim();
}

function JobMapView({ jobs, providerProfile }) {
  // Center on first job with coords, or provider's area fallback
  const jobsWithCoords = jobs.filter(j => j.latitude && j.longitude);

  const center = jobsWithCoords.length > 0
    ? [jobsWithCoords[0].latitude, jobsWithCoords[0].longitude]
    : [38.9, -77.03]; // DC fallback

  return (
    <div className="rounded-xl overflow-hidden border border-border" style={{ height: 420 }}>
      {jobsWithCoords.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full bg-muted/20 text-center px-6">
          <MapIcon className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground font-medium">No map locations available</p>
          <p className="text-xs text-muted-foreground mt-1">Jobs without coordinates won't appear on the map. Switch to List view.</p>
        </div>
      ) : (
        <MapContainer center={center} zoom={11} style={{ height: '100%', width: '100%' }} zoomControl>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          {jobsWithCoords.map(job => {
            const color = getPinColor(job.quoted_price);
            const city = getCityFromAddress(job.address);
            const priceTag = getPriceLabel(job.quoted_price);
            const isCash = job.is_cash_job || job.payment_method === 'cash';

            return (
              <CircleMarker
                key={job.id}
                center={[job.latitude, job.longitude]}
                radius={14}
                pathOptions={{
                  fillColor: color,
                  color: '#fff',
                  weight: 2,
                  fillOpacity: 0.9,
                }}
              >
                <Popup>
                  <div className="text-sm min-w-[160px]">
                    <p className="font-bold text-foreground">{job.service_name}</p>
                    <p className="text-muted-foreground text-xs flex items-center gap-1 mt-1">
                      <MapPin size={10} /> {city}
                    </p>
                    {isCash ? (
                      <p className="text-xs text-green-700 font-semibold mt-1 flex items-center gap-1">
                        <Banknote size={11} /> Cash Pay
                      </p>
                    ) : job.quoted_price ? (
                      <p className="text-xs font-bold mt-1" style={{ color }}>
                        ${job.quoted_price.toFixed(2)}
                        {job.quoted_price > 200 && <span className="ml-1 font-normal text-red-600">(deposit req.)</span>}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">Price TBD (quote)</p>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      )}

      {/* Legend */}
      <div className="flex items-center gap-3 px-3 py-2 bg-card border-t border-border text-xs text-muted-foreground flex-wrap">
        <span className="font-semibold text-foreground">Price:</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-600 inline-block" /> Under $100</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" /> $100–$200</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-600 inline-block" /> Over $200</span>
      </div>
    </div>
  );
}

function JobListView({ jobs, onSubmitQuote, onAcceptCashJob, onboardingComplete }) {
  const sorted = [...jobs].sort((a, b) => (b.quoted_price || 0) - (a.quoted_price || 0));

  return (
    <div className="space-y-3">
      {sorted.map(job => {
        const city = getCityFromAddress(job.address);
        const priceTag = getPriceLabel(job.quoted_price);
        const isCash = job.is_cash_job || job.payment_method === 'cash';

        return (
          <div key={job.id} className="bg-card border border-border rounded-xl overflow-hidden">
            {/* Summary header always visible */}
            <div className="px-4 py-3 flex items-center gap-3 border-b border-border/50">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-foreground">{job.service_name}</span>
                  {isCash && (
                    <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <Banknote size={10} /> Cash
                    </span>
                  )}
                  {priceTag && priceTag.label !== 'Under $100' && (
                    <span className={`text-xs border px-2 py-0.5 rounded-full font-medium ${priceTag.color}`}>
                      {priceTag.label}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <MapPin size={10} /> {city}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                {isCash ? (
                  <p className="text-sm font-bold text-green-700">Cash</p>
                ) : job.quoted_price ? (
                  <p className="text-sm font-bold text-foreground">${job.quoted_price.toFixed(2)}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Quote</p>
                )}
              </div>
            </div>
            {/* Full card below */}
            <div className="px-4 pb-4 pt-3">
              <AvailableJobCard
                job={job}
                onSubmitQuote={onSubmitQuote}
                onAcceptCashJob={onAcceptCashJob}
                onboardingComplete={onboardingComplete}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AvailableJobsDiscovery({ jobs, providerProfile, onSubmitQuote, onAcceptCashJob, onboardingComplete }) {
  const [viewMode, setViewMode] = useState('list');

  return (
    <div className="space-y-4">
      {/* View toggle */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {jobs.length} job{jobs.length !== 1 ? 's' : ''} available near you
        </p>
        <div className="flex items-center bg-muted rounded-lg p-1 gap-1">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              viewMode === 'list' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <List size={13} /> List
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              viewMode === 'map' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <MapIcon size={13} /> Map
          </button>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-16">
          <DollarSign className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No available jobs right now</p>
          <p className="text-sm text-muted-foreground mt-1">Check back soon — new jobs are posted daily.</p>
        </div>
      ) : viewMode === 'map' ? (
        <JobMapView jobs={jobs} providerProfile={providerProfile} />
      ) : (
        <JobListView
          jobs={jobs}
          onSubmitQuote={onSubmitQuote}
          onAcceptCashJob={onAcceptCashJob}
          onboardingComplete={onboardingComplete}
        />
      )}
    </div>
  );
}