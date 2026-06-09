import { useState } from 'react';
import { Calendar, MapPin, Clock, CheckCircle, XCircle, FileText, Ruler, DollarSign } from 'lucide-react';
import { YARD_SIZES, getMinimumPrice } from '@/lib/pricingFloors';

export default function BookingRequestCard({ job, onSubmitQuote, onDecline }) {
  const minPrice = getMinimumPrice(job.service_name, job.yard_size);
  const [price, setPrice] = useState(job.customer_budget ? String(job.customer_budget) : '');
  const [message, setMessage] = useState('');
  const [priceError, setPriceError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const numPrice = parseFloat(price);
    if (!price || isNaN(numPrice) || numPrice <= 0) {
      setPriceError('Please enter a valid price.');
      return;
    }
    if (minPrice && numPrice < minPrice) {
      setPriceError(`Minimum price for this service is $${minPrice}.`);
      return;
    }
    setPriceError('');
    setSubmitting(true);
    try {
      await onSubmitQuote(job, { price: numPrice, message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-card border-2 border-amber-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">New Booking Request</span>
          </div>
          <h3 className="font-bold text-foreground text-base mt-1">{job.service_name}</h3>
          <p className="text-sm text-muted-foreground font-medium">{job.customer_name}</p>
        </div>
        {job.customer_budget && (
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-muted-foreground">Customer budget</p>
            <p className="text-lg font-bold text-primary">${job.customer_budget}</p>
          </div>
        )}
      </div>

      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar size={12} className="text-primary flex-shrink-0" />
          <span className="font-medium">
            {new Date(job.scheduled_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
        </div>
        {job.scheduled_time && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock size={12} className="text-primary flex-shrink-0" />
            <span>{job.scheduled_time}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin size={12} className="text-primary flex-shrink-0" />
          <span className="truncate">{job.address}</span>
        </div>
        {job.yard_size && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Ruler size={12} className="text-primary flex-shrink-0" />
            <span>{YARD_SIZES.find(s => s.value === job.yard_size)?.label || job.yard_size}</span>
          </div>
        )}
        {job.customer_notes && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg p-2 mt-2">
            <FileText size={12} className="flex-shrink-0 mt-0.5" />
            <span>{job.customer_notes}</span>
          </div>
        )}
      </div>

      <div className="mb-3 space-y-2">
        <label className="text-xs font-semibold text-foreground flex items-center gap-1">
          <DollarSign size={12} className="text-primary" />
          Set your price for this job
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">$</span>
          <input
            type="number"
            min={minPrice || 1}
            step="1"
            value={price}
            onChange={e => { setPrice(e.target.value); setPriceError(''); }}
            placeholder={minPrice ? `Min $${minPrice}` : 'Enter price'}
            className="w-full border border-input rounded-lg pl-7 pr-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        {priceError && <p className="text-xs text-destructive">{priceError}</p>}
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Optional note to the customer..."
          rows={2}
          className="w-full border border-input rounded-lg px-3 py-2 text-xs bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onDecline(job)}
          disabled={submitting}
          className="flex-1 flex items-center justify-center gap-1.5 border border-border rounded-xl py-2.5 text-sm font-medium text-muted-foreground hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all disabled:opacity-50"
        >
          <XCircle size={15} />
          Decline
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-60"
        >
          {submitting ? (
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Submitting...
            </span>
          ) : (
            <><CheckCircle size={15} /> Submit Quote</>
          )}
        </button>
      </div>
    </div>
  );
}
