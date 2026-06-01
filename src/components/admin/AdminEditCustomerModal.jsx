import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AdminEditCustomerModal({ customer, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: customer.name || '',
    phone: customer.phone || '',
    service_address: customer.service_address || '',
    billing_address: customer.billing_address || '',
    zip_code: customer.zip_code || '',
    description: customer.description || '',
  });
  const [saving, setSaving] = useState(false);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await base44.entities.CustomerProfile.update(customer.id, form);
      toast.success('Customer profile updated.');
      onSaved({ ...customer, ...form });
      onClose();
    } catch {
      toast.error('Failed to update customer.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-foreground">Edit Customer</h2>
            <p className="text-xs text-muted-foreground">{customer.user_email}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="overflow-y-auto p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Full Name</label>
            <input
              value={form.name}
              onChange={e => set('name', e.target.value)}
              className="mt-1 w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Phone</label>
            <input
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              placeholder="(555) 000-0000"
              className="mt-1 w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Service Address</label>
            <input
              value={form.service_address}
              onChange={e => set('service_address', e.target.value)}
              placeholder="123 Main St, City, State"
              className="mt-1 w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Billing Address</label>
            <input
              value={form.billing_address}
              onChange={e => set('billing_address', e.target.value)}
              placeholder="Same as service address"
              className="mt-1 w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">ZIP Code</label>
            <input
              value={form.zip_code}
              onChange={e => set('zip_code', e.target.value)}
              maxLength={5}
              placeholder="62701"
              className="mt-1 w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Admin Notes</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={3}
              placeholder="Internal notes about this customer..."
              className="mt-1 w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-1.5 border border-border rounded-lg py-2 text-xs font-medium hover:bg-muted transition-colors"
            >
              <X size={13} /> Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-primary-foreground rounded-lg py-2 text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-70"
            >
              <Save size={13} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}