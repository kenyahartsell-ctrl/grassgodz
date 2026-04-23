import { useState, useRef, useEffect } from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl';
import { MapPin, Search, CheckCircle, AlertCircle, Loader2, Navigation } from 'lucide-react';
import { isInServiceArea, SERVICE_AREAS } from '@/lib/serviceAreas';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

export default function BookingMap({ onAddressConfirmed, onOutsideArea }) {
  const mapRef = useRef(null);
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [markerPos, setMarkerPos] = useState(null);
  const [inServiceArea, setInServiceArea] = useState(null);
  const [viewState, setViewState] = useState({
    longitude: -77.0369,
    latitude: 38.8951,
    zoom: 10,
  });
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Geocode address using Mapbox Geocoding API
  const geocodeAddress = async (query) => {
    if (!query.trim()) return;
    setLoading(true);

    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&proximity=-77.0369,38.8951&country=us`
      );
      const data = await res.json();

      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const { longitude, latitude } = feature.geometry;
        const fullAddress = feature.place_name;

        setMarkerPos({ lng: longitude, lat: latitude });
        setViewState({ longitude, latitude, zoom: 16 });
        setSelectedAddress({ fullAddress, lat: latitude, lng: longitude });
        setInServiceArea(isInServiceArea(latitude, longitude));
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch address suggestions
  const handleAddressInput = async (e) => {
    const value = e.target.value;
    setSearchInput(value);

    if (value.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json?access_token=${MAPBOX_TOKEN}&proximity=-77.0369,38.8951&country=us&limit=5`
      );
      const data = await res.json();
      setSuggestions(data.features || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Suggestion error:', error);
    }
  };

  // Detect user location
  const handleGeolocate = async () => {
    setLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMarkerPos({ lat: latitude, lng: longitude });
          setViewState({ longitude, latitude, zoom: 16 });

          // Reverse geocode to get address
          fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}`
          )
            .then(res => res.json())
            .then(data => {
              if (data.features && data.features.length > 0) {
                const fullAddress = data.features[0].place_name;
                setSelectedAddress({ fullAddress, lat: latitude, lng: longitude });
                setSearchInput(fullAddress);
                setInServiceArea(isInServiceArea(latitude, longitude));
              }
            })
            .finally(() => setLocating(false));
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLocating(false);
        }
      );
    }
  };

  const handleConfirm = () => {
    if (selectedAddress) {
      if (inServiceArea) {
        onAddressConfirmed(selectedAddress);
      } else {
        onOutsideArea(selectedAddress);
      }
    }
  };

  // Create GeoJSON for service areas
  const serviceAreaFeatures = SERVICE_AREAS.map((area, i) => ({
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [area.coordinates],
    },
    properties: { id: i },
  }));

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative z-10">
        <div className="relative flex items-center">
          <Search size={18} className="absolute left-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={handleAddressInput}
            placeholder="Enter your address"
            className="w-full pl-12 pr-12 py-3.5 border border-input rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
          <button
            onClick={handleGeolocate}
            disabled={locating}
            className="absolute right-3 p-2 text-muted-foreground hover:text-foreground disabled:opacity-50"
            title="Use my location"
          >
            {locating ? <Loader2 size={18} className="animate-spin" /> : <Navigation size={18} />}
          </button>
        </div>

        {/* Address Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-input rounded-xl shadow-lg z-20">
            {suggestions.map((feature) => (
              <button
                key={feature.id}
                onClick={() => {
                  setSearchInput(feature.place_name);
                  const { longitude, latitude } = feature.geometry;
                  setMarkerPos({ lng: longitude, lat: latitude });
                  setViewState({ longitude, latitude, zoom: 16 });
                  setSelectedAddress({ fullAddress: feature.place_name, lat: latitude, lng: longitude });
                  setInServiceArea(isInServiceArea(latitude, longitude));
                  setSuggestions([]);
                  setShowSuggestions(false);
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors border-b border-border last:border-b-0 flex items-center gap-2"
              >
                <MapPin size={14} className="text-muted-foreground flex-shrink-0" />
                {feature.place_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="relative rounded-2xl overflow-hidden border border-border h-96 bg-muted">
        <Map
          ref={mapRef}
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle="mapbox://styles/mapbox/light-v11"
        >
          {/* Service Area Layers */}
          {serviceAreaFeatures.map((feature, i) => (
            <Source key={`area-${i}`} id={`area-source-${i}`} type="geojson" data={feature}>
              <Layer
                id={`area-fill-${i}`}
                type="fill"
                paint={{
                  'fill-color': SERVICE_AREAS[i].color,
                  'fill-opacity': 0.15,
                }}
              />
              <Layer
                id={`area-outline-${i}`}
                type="line"
                paint={{
                  'line-color': SERVICE_AREAS[i].color,
                  'line-width': 2,
                  'line-opacity': 0.4,
                }}
              />
            </Source>
          ))}

          {/* Selected Location Marker */}
          {markerPos && (
            <Marker
              longitude={markerPos.lng}
              latitude={markerPos.lat}
              draggable
              onDragEnd={(event) => {
                const { lng, lat } = event.lngLat;
                setMarkerPos({ lng, lat });
                setInServiceArea(isInServiceArea(lat, lng));

                // Update address on marker drag
                fetch(
                  `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`
                )
                  .then(res => res.json())
                  .then(data => {
                    if (data.features && data.features.length > 0) {
                      setSelectedAddress({
                        fullAddress: data.features[0].place_name,
                        lat,
                        lng,
                      });
                    }
                  });
              }}
            >
              <div className="w-8 h-8 bg-primary rounded-full border-4 border-white shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing">
                <MapPin size={16} className="text-white" />
              </div>
            </Marker>
          )}
        </Map>
      </div>

      {/* Address Display */}
      {selectedAddress && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Selected Address</p>
          <p className="text-sm font-medium text-foreground">{selectedAddress.fullAddress}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {selectedAddress.lat.toFixed(4)}, {selectedAddress.lng.toFixed(4)}
          </p>
        </div>
      )}

      {/* Service Area Status */}
      {selectedAddress && inServiceArea !== null && (
        <div className={`rounded-xl p-4 border flex items-start gap-3 ${
          inServiceArea
            ? 'bg-green-50 border-green-200'
            : 'bg-amber-50 border-amber-200'
        }`}>
          {inServiceArea ? (
            <>
              <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-900">Great news!</p>
                <p className="text-sm text-green-800 mt-0.5">GrassGodz is available in your area. Get your instant quote below.</p>
              </div>
            </>
          ) : (
            <>
              <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-900">Not in our service area yet</p>
                <p className="text-sm text-amber-800 mt-0.5">Join our waitlist to be notified when we expand to your location.</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Continue Button */}
      {selectedAddress && (
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Confirming location...
            </>
          ) : inServiceArea ? (
            'Get My Instant Quote'
          ) : (
            'Join Waitlist'
          )}
        </button>
      )}
    </div>
  );
}