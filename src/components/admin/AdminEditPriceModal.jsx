import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { DollarSign, X } from 'lucide-react';

export default function AdminEditPriceModal({ job, onClose, onSaved }) {
  const [price, setPrice] = useState(job.quoted_price ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (price === '' || isNaN(Number(price))) {
      toast.error('Please enter a valid price.');
      return;
    }
    setSaving(true);
    const res = await base44.functions.invoke('adminUpdateJobPrice', { job_id: job.id, quoted_price: Number(price) });
    setSaving(false);
    if (res.data?.error) {
      toast.error(res.data.error);
      return;
    }
    toast.success('Price updated.');
    onSaved(Number(price));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-card border border-border rounded-xl shadow-lg w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-foreground">Edit Price</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors">
            <X size={16} />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Set the quoted price for <span className="font-semibold text-foreground">{job.service_name}</span> — {job.customer_name}
        </p>
        <div className="relative">
          <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={price}
            onChange={e => setPrice(e.target.value)}
            className="w-full pl-8 pr-4 py-2.5 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Price'}
          </button>
        </div>
      </div>
    </div>
  );
}