import { useState, useRef } from 'react';
import Map, { Marker, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
const DC_CENTER = { lat: 38.9072, lng: -77.0369 };

export default function TestMapboxPage() {
  const [popupOpen, setPopupOpen] = useState(true);
  const [mapError, setMapError] = useState(null);

  const tokenPresent = !!MAPBOX_TOKEN;
  const tokenLength = MAPBOX_TOKEN?.length || 0;
  const tokenPreview = MAPBOX_TOKEN?.substring(0, 10) || '';

  const handleMapError = (e) => {
    console.error('Map error:', e);
    setMapError(e.message || 'Map failed to load. Check your token\'s URL restrictions in Mapbox account settings.');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Alert banner */}
      <div className="bg-amber-100 border-b border-amber-200 px-4 py-3 text-center">
        <p className="text-sm font-bold text-amber-800">🚨 TEMPORARY TEST PAGE — DELETE BEFORE LAUNCH</p>
      </div>

      {/* Status panel */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-lg font-bold text-foreground mb-3">Mapbox Integration Test</h1>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground font-medium mb-1">Token Detected</p>
              <p className="font-semibold text-foreground">
                {tokenPresent ? '✓ Yes' : '✗ No'}
              </p>
            </div>
            
            {tokenPresent && (
              <>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Token Length</p>
                  <p className="font-semibold text-foreground">{tokenLength} characters</p>
                </div>
                
                <div className="col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Token Preview (first 10 chars)</p>
                  <p className="font-mono text-sm text-blue-700 break-all">{tokenPreview}</p>
                </div>
              </>
            )}
          </div>

          {!tokenPresent && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-red-800 mb-1">⚠️ Token Not Found</p>
              <p className="text-xs text-red-700 leading-relaxed">
                VITE_MAPBOX_ACCESS_TOKEN is not set in environment variables. Check that it's configured in Base44 secrets.
              </p>
            </div>
          )}

          {mapError && (
            <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-orange-800 mb-1">⚠️ Map Load Error</p>
              <p className="text-xs text-orange-700 leading-relaxed mb-1">{mapError}</p>
              <p className="text-xs text-orange-600">Check your token's URL restrictions in Mapbox account settings.</p>
            </div>
          )}
        </div>
      </div>

      {/* Map container */}
      <div className="flex-1 relative bg-gray-100">
        {tokenPresent ? (
          <Map
            initialViewState={{
              longitude: DC_CENTER.lng,
              latitude: DC_CENTER.lat,
              zoom: 11,
            }}
            style={{ width: '100%', height: '100%' }}
            mapStyle="mapbox://styles/mapbox/streets-v12"
            mapboxAccessToken={MAPBOX_TOKEN}
            onError={handleMapError}
          >
            <Marker longitude={DC_CENTER.lng} latitude={DC_CENTER.lat}>
              <div
                className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer font-bold text-sm"
                onClick={() => setPopupOpen(!popupOpen)}
              >
                📍
              </div>
            </Marker>

            {popupOpen && (
              <Popup
                longitude={DC_CENTER.lng}
                latitude={DC_CENTER.lat}
                anchor="bottom"
                closeButton={false}
                className="!bg-white !border !border-border !rounded-lg !shadow-lg"
              >
                <div className="p-2">
                  <p className="text-sm font-semibold text-foreground">✓ Mapbox is working!</p>
                  <p className="text-xs text-muted-foreground mt-1">Washington, DC</p>
                </div>
              </Popup>
            )}
          </Map>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted/50">
            <div className="text-center">
              <p className="text-muted-foreground font-medium mb-2">Cannot render map — token missing</p>
              <p className="text-sm text-muted-foreground">Add VITE_MAPBOX_ACCESS_TOKEN to secrets to proceed</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}