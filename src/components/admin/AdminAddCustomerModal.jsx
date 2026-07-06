import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AdminAddCustomerModal({ onClose, onAdded }) {
  const [form, setForm] = useState({
    user_email: '',
    name: '',
    phone: '',
    service_address: '',
    city: '',
    state: '',
    zip_code: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.user_email) {
      toast.error('Email is required.');
      return;
    }

    setSaving(true);
    try {
      // First, create the customer via the backend function or directly to entities.
      // Wait, there's a backend function `createCustomerProfile` - let's check if we can invoke it or just create the entity record.
      // We can just create the CustomerProfile entity record.
      const payload = {
        ...form,
        created_by: 'admin',
      };
      await base44.entities.CustomerProfile.create(payload);
      toast.success('Customer created successfully!');
      onAdded();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to create customer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-base font-bold text-gray-900">Add New Customer</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Email *</label>
            <input
              required
              type="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              value={form.user_email}
              onChange={e => setForm(f => ({ ...f, user_email: e.target.value }))}
              placeholder="customer@example.com"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Full Name</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Phone</label>
            <input
              type="tel"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="(555) 123-4567"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Service Address</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              value={form.service_address}
              onChange={e => setForm(f => ({ ...f, service_address: e.target.value }))}
              placeholder="123 Main St"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="text-xs font-medium text-gray-500 mb-1 block">City</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                placeholder="City"
              />
            </div>
            <div className="col-span-1">
              <label className="text-xs font-medium text-gray-500 mb-1 block">State</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                value={form.state}
                onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                placeholder="State"
              />
            </div>
            <div className="col-span-1">
              <label className="text-xs font-medium text-gray-500 mb-1 block">ZIP Code</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                value={form.zip_code}
                onChange={e => setForm(f => ({ ...f, zip_code: e.target.value }))}
                placeholder="12345"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Add Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}