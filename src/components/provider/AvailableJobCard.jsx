import { useState } from 'react';
import { Calendar, MapPin, FileText, DollarSign, ChevronDown, ChevronUp, Send, AlertCircle, Banknote, Check, Ruler } from 'lucide-react';
import { getMinimumPrice, YARD_SIZES } from '@/lib/pricingFloors';

export default function AvailableJobCard({ job, providerProfile, onSubmitQuote, onAcceptCashJob, onboardingComplete = true }) {
  const isCash = job.is_cash_job || job.payment_method === 'cash';
  const serviceName = job.service_name?.toLowerCase() || '';
  const isLawnCut = serviceName.includes('lawn');
  const adminPrice = job.quoted_price; // set by admin — provider cannot change
  const minPrice = getMinimumPrice(job.service_name, job.yard_size);
  const yardSizeLabel = YARD_SIZES.find(s => s.value === job.yard_size)?.label || null;
  const suggestedPrice = job.customer_budget && (!minPrice || job.customer_budget >= minPrice) ? String(job.customer_budget) : '';
  const [expanded, setExpanded] = useState(false);
  const [quoteForm, setQuoteForm] = useState({ price: suggestedPrice, message: '' });
  const [showForm, setShowForm] = useState(false);
  const [priceError, setPriceError] = useState('');

  const haulingApplies = providerProfile?.hauling_fees_apply;
  const haulingFeeType = providerProfile?.hauling_fee_type || 'flat';
  const haulingFeeValue = providerProfile?.hauling_fee_value || 0;
  const computeHaulingFee = (basePrice) => {
    if (!haulingApplies || !haulingFeeValue) return 0;
    return haulingFeeType === 'percentage' ? (basePrice * haulingFeeValue / 100) : haulingFeeValue;
  };

  // Lawn cuts and cash jobs: direct accept (no quote)
  const isDirectAccept = isCash || isLawnCut;

  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-foreground text-sm">{job.service_name}</h3>
            {isCash && (
              <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <Banknote size={10} /> Cash Pay
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-muted-foreground mt-0.5">{job.customer_name || 'Customer'}</p>
          <div className="mt-1.5 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar size={11} />
              <span>{new Date(job.scheduled_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}{job.scheduled_time ? ` · ${job.scheduled_time}` : ''}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin size={11} />
              <span className="truncate">{job.address}</span>
            </div>
            {yardSizeLabel && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Ruler size={11} />
                <span>{yardSizeLabel}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 text-right">
          <div className="flex flex-col items-end">
            {adminPrice ? (
              <p className="text-lg font-bold text-emerald-800">${adminPrice.toFixed(2)}</p>
            ) : (
              <p className="text-sm font-semibold text-muted-foreground">Quote</p>
            )}
          </div>
          <button onClick={() => setExpanded(e => !e)} className="text-muted-foreground hover:text-foreground transition-colors">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-border space-y-3">
          {job.customer_notes && (
            <div className="flex gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg p-2.5">
              <FileText size={12} className="flex-shrink-0 mt-0.5" />
              <span>{job.customer_notes}</span>
            </div>
          )}

          {job.customer_budget && (
            <div className="flex items-center gap-2 text-xs bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              <DollarSign size={12} className="text-blue-700 flex-shrink-0" />
              <span className="text-blue-800">Customer's budget: <strong>${job.customer_budget}</strong></span>
            </div>
          )}

          {!onboardingComplete && !isCash && (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <AlertCircle size={12} className="flex-shrink-0" />
              <span>Complete your payment setup to receive payouts</span>
            </div>
          )}

          {adminPrice && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 space-y-1">
              <div className="flex items-center gap-2 text-xs text-blue-800">
                <DollarSign size={12} className="flex-shrink-0" />
                <span>Fixed price: <strong>${adminPrice.toFixed(2)}</strong> — set by admin, cannot be changed.</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-green-700 font-semibold">
                <DollarSign size={12} className="flex-shrink-0" />
                <span>Your payout: <strong>${(adminPrice * 0.90).toFixed(2)}</strong> <span className="font-normal text-green-600">(90% of job price)</span></span>
              </div>
            </div>
          )}

          {isDirectAccept ? (
            <div className="space-y-2">
              {isCash && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-800">
                  <strong>Cash payment</strong> — collect payment directly from the client after completing the job.
                </div>
              )}
              <button
                onClick={() => onAcceptCashJob && onAcceptCashJob(job)}
                className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <Check size={14} />
                Accept Job
              </button>
            </div>
          ) : !showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <Send size={14} />
              {adminPrice ? 'Accept Job at Fixed Price' : 'Submit a Quote'}
            </button>
          ) : (
            <form onSubmit={(e) => {
              e.preventDefault();
              setPriceError('');
              const basePrice = adminPrice ? adminPrice : Number(quoteForm.price);
              if (!adminPrice && minPrice && basePrice < minPrice) {
                setPriceError(`Your quote is below the minimum rate for this service and yard size. Minimum for this job is $${minPrice}.`);
                return;
              }
              const haulingFee = computeHaulingFee(basePrice);
              const finalPrice = basePrice + haulingFee;
              onSubmitQuote(job, { price: finalPrice, message: quoteForm.message });
              setShowForm(false);
              setQuoteForm({ price: '', message: '' });
            }} className="space-y-3 bg-muted/30 rounded-xl p-3">
              {!adminPrice && (
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">
                    Your Price ($){minPrice ? <span className="text-muted-foreground font-normal ml-1">— min ${minPrice}</span> : ''}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={minPrice || 1}
                    value={quoteForm.price}
                    onChange={e => { setQuoteForm(f => ({ ...f, price: e.target.value })); setPriceError(''); }}
                    placeholder={minPrice ? `min $${minPrice}` : 'e.g. 55.00'}
                    className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                  {priceError && (
                    <p className="text-xs text-red-600 mt-1 flex items-start gap-1">
                      <AlertCircle size={11} className="flex-shrink-0 mt-0.5" />
                      {priceError}
                    </p>
                  )}
                  {haulingApplies && quoteForm.price && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 mt-1.5">
                      Hauling fee ({haulingFeeType === 'percentage' ? `${haulingFeeValue}%` : `$${haulingFeeValue}`}) will be added → Total: <strong>${(Number(quoteForm.price) + computeHaulingFee(Number(quoteForm.price))).toFixed(2)}</strong>
                    </p>
                  )}
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">{adminPrice ? 'Message to Customer (optional)' : 'Message to Customer'}</label>
                <textarea
                  value={quoteForm.message}
                  onChange={e => setQuoteForm(f => ({ ...f, message: e.target.value }))}
                  rows={2}
                  placeholder="Introduce yourself and explain your quote..."
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-border rounded-lg py-2 text-xs font-medium hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 bg-primary text-primary-foreground rounded-lg py-2 text-xs font-semibold hover:bg-primary/90 transition-colors">
                  Send Quote
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}