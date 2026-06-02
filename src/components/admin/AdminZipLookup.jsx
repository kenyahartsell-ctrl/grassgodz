import { useState } from 'react';
import { Search, MapPin, Phone, Mail, Star, X } from 'lucide-react';

export default function AdminZipLookup({ providers }) {
  const [zip, setZip] = useState('');
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState([]);

  const handleSearch = () => {
    const trimmed = zip.trim();
    if (!trimmed) return;
    const matches = providers.filter(p =>
      Array.isArray(p.service_zip_codes) && p.service_zip_codes.includes(trimmed)
    );
    setResults(matches);
    setSearched(true);
  };

  const handleClear = () => {
    setZip('');
    setResults([]);
    setSearched(false);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">Provider Zip Code Lookup</h2>
        <p className="text-sm text-muted-foreground mt-1">Find all providers who serve a specific zip code.</p>
      </div>

      {/* Search input */}
      <div className="bg-card border border-border rounded-xl p-5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
          Enter Zip Code
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={zip}
              onChange={e => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="e.g. 20001"
              maxLength={5}
              className="w-full pl-9 pr-9 py-2.5 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {zip && (
              <button onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            disabled={zip.length !== 5}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Search size={15} />
            Search
          </button>
        </div>
      </div>

      {/* Results */}
      {searched && (
        <div>
          <p className="text-xs text-muted-foreground mb-3 font-medium">
            {results.length === 0
              ? `No providers found for zip code ${zip}.`
              : `${results.length} provider${results.length !== 1 ? 's' : ''} serve${results.length === 1 ? 's' : ''} zip code ${zip}`}
          </p>

          {results.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <MapPin className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-semibold text-muted-foreground">No providers found for this zip code.</p>
              <p className="text-xs text-muted-foreground mt-1">Try a nearby zip code or check if providers have updated their service areas.</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {results.map((p, i) => (
                <div key={p.id} className={`px-5 py-4 flex flex-col gap-2 ${i < results.length - 1 ? 'border-b border-border' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {p.profile_image_url ? (
                        <img src={p.profile_image_url} alt={p.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-primary">{(p.name || p.business_name || '?')[0]}</span>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-foreground">{p.name || p.business_name || '—'}</p>
                        {p.business_name && p.name && p.business_name !== p.name && (
                          <p className="text-xs text-muted-foreground">{p.business_name}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {p.avg_rating > 0 && (
                        <>
                          <Star size={13} className="text-amber-400 fill-amber-400" />
                          <span className="text-xs font-semibold text-foreground">{p.avg_rating.toFixed(1)}</span>
                        </>
                      )}
                      <span className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full ${
                        p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {p.status || 'unknown'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {p.user_email && (
                      <span className="flex items-center gap-1">
                        <Mail size={11} className="text-primary" />
                        {p.user_email}
                      </span>
                    )}
                    {p.phone && (
                      <span className="flex items-center gap-1">
                        <Phone size={11} className="text-primary" />
                        {p.phone}
                      </span>
                    )}
                  </div>

                  {Array.isArray(p.service_zip_codes) && p.service_zip_codes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {p.service_zip_codes.map(z => (
                        <span
                          key={z}
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            z === zip ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {z}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}