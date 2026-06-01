import { useState, useRef, useEffect } from 'react';
import { Search, UserCircle, Users, MapPin, X } from 'lucide-react';

export default function AdminGlobalSearch({ customers, providers, jobs, onNavigate }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const q = query.trim().toLowerCase();

  const matchedCustomers = q.length < 2 ? [] : customers.filter(c =>
    c.name?.toLowerCase().includes(q) ||
    c.user_email?.toLowerCase().includes(q) ||
    c.phone?.includes(q) ||
    c.service_address?.toLowerCase().includes(q)
  ).slice(0, 4);

  const matchedProviders = q.length < 2 ? [] : providers.filter(p =>
    p.name?.toLowerCase().includes(q) ||
    p.user_email?.toLowerCase().includes(q) ||
    p.business_name?.toLowerCase().includes(q) ||
    p.phone?.includes(q)
  ).slice(0, 4);

  const matchedJobs = q.length < 2 ? [] : jobs.filter(j =>
    j.customer_name?.toLowerCase().includes(q) ||
    j.customer_email?.toLowerCase().includes(q) ||
    j.address?.toLowerCase().includes(q) ||
    j.zip_code?.includes(q) ||
    j.provider_name?.toLowerCase().includes(q)
  ).slice(0, 4);

  const hasResults = matchedCustomers.length > 0 || matchedProviders.length > 0 || matchedJobs.length > 0;

  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = (tab) => {
    onNavigate(tab);
    setQuery('');
    setOpen(false);
  };

  const clear = () => { setQuery(''); inputRef.current?.focus(); };

  return (
    <div ref={containerRef} className="relative flex-1 max-w-xs">
      <div className="relative">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search customers, providers, properties…"
          className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {query && (
          <button onClick={clear} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X size={12} />
          </button>
        )}
      </div>

      {open && q.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
          {!hasResults && (
            <p className="text-xs text-muted-foreground px-3 py-3 text-center">No results for "{query}"</p>
          )}

          {matchedCustomers.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide px-3 pt-2 pb-1">Customers</p>
              {matchedCustomers.map(c => (
                <button
                  key={c.id}
                  onClick={() => handleSelect('customers')}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/60 text-left transition-colors"
                >
                  <UserCircle size={13} className="text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{c.name || c.user_email}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{c.user_email}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {matchedProviders.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide px-3 pt-2 pb-1">Providers</p>
              {matchedProviders.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleSelect('providers')}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/60 text-left transition-colors"
                >
                  <Users size={13} className="text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{p.name || p.business_name || p.user_email}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{p.user_email}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {matchedJobs.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide px-3 pt-2 pb-1">Properties / Jobs</p>
              {matchedJobs.map(j => (
                <button
                  key={j.id}
                  onClick={() => handleSelect('jobs')}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/60 text-left transition-colors"
                >
                  <MapPin size={13} className="text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{j.address}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{j.customer_name} · {j.service_name}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className="h-1.5" />
        </div>
      )}
    </div>
  );
}