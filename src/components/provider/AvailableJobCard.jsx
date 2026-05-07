import { useState } from 'react';
import { Calendar, MapPin, FileText, DollarSign, ChevronDown, ChevronUp, Send, AlertCircle } from 'lucide-react';

export default function AvailableJobCard({ job, onSubmitQuote, onboardingComplete = true }) {
  const [expanded, setExpanded] = useState(false);
  const [quoteForm, setQuoteForm] = useState({ price: '', message: '' });
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmitQuote(job, { price: Number(quoteForm.price), message: quoteForm.message });
    setShowForm(false);
    setQuoteForm({ price: '', message: '' });
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-sm">{job.service_name}</h3>
          <div className="mt-1.5 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar size={11} />
              <span>{new Date(job.scheduled_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin size={11} />
              <span className="truncate">{job.address}</span>
            </div>
          </div>
        </div>
        <button onClick={() => setExpanded(e => !e)} className="text-muted-foreground hover:text-foreground transition-colors">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-border space-y-3">
          {job.customer_notes && (
            <div className="flex gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg p-2.5">
              <FileText size={12} className="flex-shrink-0 mt-0.5" />
              <span>{job.customer_notes}</span>
            </div>
          )}

          {!onboardingComplete && (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-2">
              <AlertCircle size={12} className="flex-shrink-0" />
              <span>Complete your payment setup to receive payouts</span>
            </div>
          )}

          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <Send size={14} />
              Submit a Quote
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 bg-muted/30 rounded-xl p-3">
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">Your Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={quoteForm.price}
                  onChange={e => setQuoteForm(f => ({ ...f, price: e.target.value }))}
                  placeholder="e.g. 55.00"
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">Message to Customer</label>
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