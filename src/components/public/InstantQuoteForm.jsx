import { useState, useMemo } from 'react';
import { CheckCircle, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const PROPERTY_SIZES = [
  { label: 'Small', sublabel: 'Up to ¼ acre', price: 40 },
  { label: 'Medium', sublabel: '¼ – ½ acre', price: 60 },
  { label: 'Large', sublabel: '½ acre+', price: 80 },
];

const GRASS_HEIGHTS = [
  { label: 'Short', sublabel: 'Under 4"', extra: 0 },
  { label: 'Medium', sublabel: '4" – 8"', extra: 10 },
  { label: 'Overgrown', sublabel: 'Over 8"', extra: 25 },
];

const SERVICE_TYPES = [
  { label: 'Mowing', sublabel: 'Cut & collect', extra: 0 },
  { label: 'Mowing + Edging', sublabel: 'Clean borders', extra: 10 },
  { label: 'Full Service', sublabel: 'Mow, edge & blow', extra: 25 },
];

const ADDONS = [
  { key: 'hedge', label: 'Hedge Trimming', price: 20 },
  { key: 'leaf', label: 'Leaf Cleanup', price: 30 },
];

const FREQUENCIES = [
  { key: 'one-time', label: 'One-Time', discount: 0 },
  { key: 'biweekly', label: 'Biweekly', discount: 0.10 },
  { key: 'weekly', label: 'Weekly', discount: 0.10 },
];

function OptionButton({ selected, onClick, label, sublabel, price }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-col items-start text-left px-4 py-3.5 rounded-xl border-2 transition-all w-full ${
        selected
          ? 'border-primary bg-primary/5 text-foreground'
          : 'border-border bg-card text-foreground hover:border-primary/40'
      }`}
    >
      {selected && (
        <CheckCircle size={14} className="absolute top-2.5 right-2.5 text-primary" />
      )}
      <span className="font-semibold text-sm">{label}</span>
      {sublabel && <span className="text-xs text-muted-foreground mt-0.5">{sublabel}</span>}
      {price !== undefined && (
        <span className={`text-xs font-bold mt-1 ${selected ? 'text-primary' : 'text-muted-foreground'}`}>
          {price === 0 ? 'Included' : `+$${price}`}
        </span>
      )}
    </button>
  );
}

export default function InstantQuoteForm({ onBookingSubmit }) {
  const [address, setAddress] = useState('');
  const [size, setSize] = useState(0);
  const [height, setHeight] = useState(0);
  const [service, setService] = useState(0);
  const [addons, setAddons] = useState({ hedge: false, leaf: false });
  const [frequency, setFrequency] = useState('one-time');
  
  const [lookupLoading, setLookupLoading] = useState(false);
  const [detectedSize, setDetectedSize] = useState(null);
  const [lookupStatus, setLookupStatus] = useState(null); // 'success', 'warning', or null

  const toggleAddon = (key) => setAddons(a => ({ ...a, [key]: !a[key] }));

  const handleAddressBlur = async () => {
    if (!address.trim()) {
      setDetectedSize(null);
      setLookupStatus(null);
      return;
    }

    setLookupLoading(true);
    try {
      const response = await base44.functions.invoke('getPropertySize', {
        address: address.trim(),
      });

      if (response.data.success) {
        const propSize = response.data.propertySize;
        const sizeIndex = PROPERTY_SIZES.findIndex(s => s.label === propSize);
        
        setDetectedSize({
          size: propSize,
          lotSize: response.data.lotSize,
          source: response.data.source,
        });
        
        if (sizeIndex >= 0) {
          setSize(sizeIndex);
        }
        
        setLookupStatus(response.data.source === 'api' ? 'success' : 'warning');
      } else {
        setDetectedSize(null);
        setLookupStatus('warning');
      }
    } catch (error) {
      console.error('Property lookup failed:', error);
      setDetectedSize(null);
      setLookupStatus('warning');
    } finally {
      setLookupLoading(false);
    }
  };

  const { subtotal, discount, total, savings } = useMemo(() => {
    const base = PROPERTY_SIZES[size].price;
    const heightExtra = GRASS_HEIGHTS[height].extra;
    const serviceExtra = SERVICE_TYPES[service].extra;
    const addonTotal = ADDONS.reduce((sum, a) => sum + (addons[a.key] ? a.price : 0), 0);
    const sub = base + heightExtra + serviceExtra + addonTotal;
    const freq = FREQUENCIES.find(f => f.key === frequency);
    const disc = freq.discount;
    const sav = Math.round(sub * disc);
    return { subtotal: sub, discount: disc, total: sub - sav, savings: sav };
  }, [size, height, service, addons, frequency]);

  const breakdown = [
    { label: `Property size — ${PROPERTY_SIZES[size].label}`, amount: PROPERTY_SIZES[size].price },
    ...(GRASS_HEIGHTS[height].extra > 0 ? [{ label: `Grass height — ${GRASS_HEIGHTS[height].label}`, amount: GRASS_HEIGHTS[height].extra }] : []),
    ...(SERVICE_TYPES[service].extra > 0 ? [{ label: SERVICE_TYPES[service].label, amount: SERVICE_TYPES[service].extra }] : []),
    ...ADDONS.filter(a => addons[a.key]).map(a => ({ label: a.label, amount: a.price })),
    ...(savings > 0 ? [{ label: `${frequency === 'weekly' ? 'Weekly' : 'Biweekly'} discount (10%)`, amount: -savings, green: true }] : []),
  ];

  const handleBooking = () => {
    if (!address.trim()) {
      alert('Please enter your address');
      return;
    }
    onBookingSubmit({
      address: address.trim(),
      size: PROPERTY_SIZES[size].label,
      height: GRASS_HEIGHTS[height].label,
      service: SERVICE_TYPES[service].label,
      addons: ADDONS.filter(a => addons[a.key]).map(a => a.label),
      frequency,
      total,
    });
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-primary px-6 py-5">
        <span className="text-xs font-semibold text-primary-foreground/80 uppercase tracking-wide block mb-1">Instant Quote Calculator</span>
        <p className="text-primary-foreground font-display font-bold text-xl">What will it cost?</p>
      </div>

      <div className="p-5 space-y-6">
        {/* Address */}
        <div>
          <label className="text-xs font-bold text-foreground uppercase tracking-wide mb-2.5 block">Your Address</label>
          <div className="relative">
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              onBlur={handleAddressBlur}
              placeholder="123 Main St, Washington, DC 20001"
              className="w-full border border-input rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {lookupLoading && (
              <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary animate-spin" />
            )}
          </div>
          
          {/* Lookup status messages */}
          {lookupStatus === 'success' && detectedSize && (
            <div className="mt-2 bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
              <CheckCircle size={14} className="text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="text-green-800 font-medium">Property detected: {detectedSize.size}</p>
                <p className="text-green-700 text-xs">~{detectedSize.lotSize?.toLocaleString()} sq ft</p>
              </div>
            </div>
          )}
          
          {lookupStatus === 'warning' && (
            <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">Could not verify property size. Please select your property size below.</p>
            </div>
          )}
        </div>

        {/* Property Size */}
        <div>
          <label className="text-xs font-bold text-foreground uppercase tracking-wide mb-2.5 block">
            Property Size
            {detectedSize && <span className="ml-2 text-green-600 font-semibold">(Detected: {detectedSize.size})</span>}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {PROPERTY_SIZES.map((opt, i) => (
              <OptionButton key={opt.label} selected={size === i} onClick={() => setSize(i)}
                label={opt.label} sublabel={opt.sublabel} price={opt.price} />
            ))}
          </div>
        </div>

        {/* Grass Height */}
        <div>
          <label className="text-xs font-bold text-foreground uppercase tracking-wide mb-2.5 block">Grass Height</label>
          <div className="grid grid-cols-3 gap-2">
            {GRASS_HEIGHTS.map((opt, i) => (
              <OptionButton key={opt.label} selected={height === i} onClick={() => setHeight(i)}
                label={opt.label} sublabel={opt.sublabel} price={opt.extra} />
            ))}
          </div>
        </div>

        {/* Service Type */}
        <div>
          <label className="text-xs font-bold text-foreground uppercase tracking-wide mb-2.5 block">Service Type</label>
          <div className="grid grid-cols-1 gap-2">
            {SERVICE_TYPES.map((opt, i) => (
              <OptionButton key={opt.label} selected={service === i} onClick={() => setService(i)}
                label={opt.label} sublabel={opt.sublabel} price={opt.extra} />
            ))}
          </div>
        </div>

        {/* Add-ons */}
        <div>
          <label className="text-xs font-bold text-foreground uppercase tracking-wide mb-2.5 block">Add-Ons <span className="text-muted-foreground font-normal normal-case">(optional)</span></label>
          <div className="grid grid-cols-2 gap-2">
            {ADDONS.map(a => (
              <OptionButton key={a.key} selected={addons[a.key]} onClick={() => toggleAddon(a.key)}
                label={a.label} price={a.price} />
            ))}
          </div>
        </div>

        {/* Frequency */}
        <div>
          <label className="text-xs font-bold text-foreground uppercase tracking-wide mb-2.5 block">Frequency</label>
          <div className="grid grid-cols-3 gap-2">
            {FREQUENCIES.map(f => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFrequency(f.key)}
                className={`flex flex-col items-center justify-center px-3 py-3 rounded-xl border-2 transition-all ${
                  frequency === f.key
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card hover:border-primary/40'
                }`}
              >
                <span className="text-sm font-semibold text-foreground">{f.label}</span>
                {f.discount > 0 ? (
                  <span className="text-xs font-bold text-green-600 mt-0.5">10% off</span>
                ) : (
                  <span className="text-xs text-muted-foreground mt-0.5">No discount</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Price Display */}
        <div className="bg-foreground rounded-2xl p-5 text-white">
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-xs text-white/60 uppercase tracking-wide font-semibold mb-1">
                {frequency === 'one-time' ? 'Estimated Total' : `Per Visit (${frequency})`}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-display font-bold">${total}</span>
                {savings > 0 && (
                  <span className="text-sm line-through text-white/40">${subtotal}</span>
                )}
              </div>
              {savings > 0 && (
                <p className="text-xs font-semibold text-green-400 mt-1">You save ${savings}/visit</p>
              )}
            </div>
            {savings > 0 && (
              <div className="bg-green-500/20 border border-green-500/30 rounded-xl px-3 py-2 text-center">
                <p className="text-xs text-green-300 font-semibold">10% OFF</p>
                <p className="text-xs text-green-400">{frequency}</p>
              </div>
            )}
          </div>

          {/* Breakdown */}
          <div className="border-t border-white/10 pt-3 space-y-1.5 mb-4">
            {breakdown.map((line, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span className={line.green ? 'text-green-400' : 'text-white/60'}>{line.label}</span>
                <span className={`font-semibold ${line.green ? 'text-green-400' : 'text-white/80'}`}>
                  {line.amount < 0 ? `-$${Math.abs(line.amount)}` : `$${line.amount}`}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={handleBooking}
            className="w-full bg-green-400 hover:bg-green-300 text-green-950 font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-base"
          >
            Book Now <ArrowRight size={16} />
          </button>
          <p className="text-center text-xs text-white/40 mt-2">No charge until the job is done</p>
        </div>
      </div>
    </div>
  );
}