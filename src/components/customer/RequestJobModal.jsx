import { useState } from 'react';
import { X, MapPin, Calendar, FileText } from 'lucide-react';

export default function RequestJobModal({ service, onClose, onSubmit, customerProfile }) {
  const [form, setForm] = useState({
    address: customerProfile?.service_address || '',
    zip_code: customerProfile?.zip_code || '',
    scheduled_date: '',
    customer_notes: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, service_id: service.id, service_name: service.name });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground">Request a Quote</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{service.name}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-1.5">
              <MapPin size={13} className="text-primary" /> Service Address
            </label>
            <input
              type="text"
              value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">ZIP Code</label>
            <input
              type="text"
              value={form.zip_code}
              onChange={e => setForm(f => ({ ...f, zip_code: e.target.value }))}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-1.5">
              <Calendar size={13} className="text-primary" /> Preferred Date
            </label>
            <input
              type="date"
              value={form.scheduled_date}
              onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              required
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-1.5">
              <FileText size={13} className="text-primary" /> Notes for Provider (optional)
            </label>
            <textarea
              value={form.customer_notes}
              onChange={e => setForm(f => ({ ...f, customer_notes: e.target.value }))}
              rows={3}
              placeholder="Any special instructions, gate codes, pets, etc."
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
          {/* Quote disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-xs text-amber-800 leading-relaxed">
            <strong>Please note:</strong> This quote is not a guaranteed price. It allows lawn care professionals in your area to review your request and respond with their availability and final pricing.
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 border border-border rounded-lg px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors">
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}