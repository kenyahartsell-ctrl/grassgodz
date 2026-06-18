import { useState, useEffect } from 'react';
import { X, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

// We will fetch services dynamically now

const BLANK_FORM = {
  customer_id: '',
  customer_name: '',
  customer_email: '',
  service_name: '',
  address: '',
  zip_code: '',
  scheduled_date: '',
  scheduled_time: '',
  quoted_price: '',
  recurrence: 'one_time',
  customer_notes: '',
  provider_id: '',
  provider_email: '',
  provider_name: '',
  status: 'requested',
  payment_method: 'stripe',
  is_cash_job: false,
};

export default function AdminAddJobModal({ onClose, onJobAdded, providers = [], existingJobs = [] }) {
  const [services, setServices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [duplicate, setDuplicate] = useState(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    base44.entities.CustomerProfile.list().then(setCustomers).catch(() => {});
    base44.entities.Service.list().then(setServices).catch(() => {});
  }, []);

  const filteredCustomers = customers.filter(c =>
    !customerSearch ||
    (c.name || '').toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.user_email || '').toLowerCase().includes(customerSearch.toLowerCase())
  ).slice(0, 8);

  const selectCustomer = (c) => {
    setForm(f => ({
      ...f,
      customer_id: c.id,
      customer_name: c.name || '',
      customer_email: c.user_email || '',
      address: c.service_address || f.address,
      zip_code: c.zip_code || f.zip_code,
    }));
    setCustomerSearch(c.name || c.user_email);
    setShowCustomerDropdown(false);
  };

  const selectProvider = (id) => {
    if (!id) {
      setForm(f => ({ ...f, provider_id: '', provider_email: '', provider_name: '', status: 'requested' }));
      return;
    }
    const p = providers.find(p => p.id === id);
    setForm(f => ({
      ...f,
      provider_id: p?.id || '',
      provider_email: p?.user_email || '',
      provider_name: p?.name || p?.business_name || '',
      status: 'scheduled',
    }));
  };

  const checkDuplicate = () => {
    if (!form.customer_email || !form.service_name || !form.scheduled_date) return null;
    return existingJobs.find(j =>
      j.customer_email === form.customer_email &&
      j.service_name === form.service_name &&
      j.scheduled_date === form.scheduled_date &&
      !['cancelled'].includes(j.status)
    ) || null;
  };

  const doSubmit = async () => {
    if (!form.customer_id) {
      toast.error('Please select a customer from the dropdown.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        service_id: form.service_id || form.service_name,
        quoted_price: form.quoted_price ? parseFloat(form.quoted_price) : undefined,
        recurrence: form.recurrence,
      };
      if (!payload.provider_id) {
        delete payload.provider_id;
        delete payload.provider_email;
        delete payload.provider_name;
        payload.status = 'requested';
      }
      await base44.entities.Job.create(payload);

      const successMsg = form.provider_name
        ? `Job assigned to ${form.provider_name} successfully!`
        : 'Job posted to available pool — providers can now claim it';
      toast.success(successMsg);
      onJobAdded();
    } catch (err) {
      toast.error(err.message || 'Failed to create job');
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!confirming) {
      const dup = checkDuplicate();
      if (dup) {
        setDuplicate(dup);
        return;
      }
    }
    setConfirming(false);
    await doSubmit();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-base font-bold text-gray-900">Add New Job</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        {/* Duplicate Warning */}
        {duplicate && (
          <div className="mx-5 mt-4 bg-amber-50 border border-amber-300 rounded-xl p-4">
            <div className="flex items-start gap-2 mb-3">
              <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-800">Similar job already exists</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  A job for <strong>{duplicate.customer_name}</strong> ({duplicate.service_name}) on <strong>{duplicate.scheduled_date}</strong> already exists with status <strong>{duplicate.status}</strong>.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDuplicate(null)} className="flex-1 py-1.5 text-xs font-semibold bg-white border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50">
                Cancel
              </button>
              <button onClick={() => { setDuplicate(null); setConfirming(true); handleSubmit({ preventDefault: () => {} }); }}
                className="flex-1 py-1.5 text-xs font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-700">
                Create Anyway
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Customer Search */}
          <div className="relative">
            <label className="text-xs font-medium text-gray-500 mb-1 block">Customer *</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              placeholder="Search by name or email..."
              value={customerSearch}
              onChange={e => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); setForm(f => ({ ...f, customer_name: e.target.value })); }}
              onFocus={() => setShowCustomerDropdown(true)}
              onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 150)}
            />
            {showCustomerDropdown && filteredCustomers.length > 0 && (
              <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-44 overflow-y-auto">
                {filteredCustomers.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onMouseDown={() => selectCustomer(c)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 transition-colors"
                  >
                    <span className="font-medium text-gray-900">{c.name || '—'}</span>
                    <span className="text-xs text-gray-400 ml-2">{c.user_email}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {form.customer_email && (
            <p className="text-xs text-emerald-700 font-medium -mt-2">✓ {form.customer_email}</p>
          )}

          {/* Service */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Service Type *</label>
            <select
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              value={form.service_name}
              onChange={e => {
                const s = services.find(srv => srv.name === e.target.value);
                setForm(f => ({ ...f, service_name: e.target.value, service_id: s ? s.id : e.target.value }));
              }}
            >
              <option value="">Select service...</option>
              {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>

          {/* Address */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Address *</label>
            <input
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              placeholder="123 Main St"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">ZIP Code *</label>
              <input
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                value={form.zip_code}
                onChange={e => setForm(f => ({ ...f, zip_code: e.target.value }))}
                placeholder="20001"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Price ($)</label>
              <input
                type="number" min="0" step="0.01"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                value={form.quoted_price}
                onChange={e => setForm(f => ({ ...f, quoted_price: e.target.value }))}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Scheduled Date</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                value={form.scheduled_date}
                onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Scheduled Time</label>
              <input
                type="time"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                value={form.scheduled_time}
                onChange={e => setForm(f => ({ ...f, scheduled_time: e.target.value }))}
              />
            </div>
          </div>

          {/* Recurrence */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Recurrence</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              value={form.recurrence}
              onChange={e => setForm(f => ({ ...f, recurrence: e.target.value }))}
            >
              <option value="one_time">One-Time Visit</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Biweekly (Every 2 Weeks)</option>
            </select>
          </div>

          {/* Assign Provider */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Assign to Provider (optional)</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              value={form.provider_id}
              onChange={e => selectProvider(e.target.value)}
            >
              <option value="">Leave in Available Pool</option>
              {providers.filter(p => p.status === 'active').map(p => (
                <option key={p.id} value={p.id}>{p.name || p.business_name || p.user_email}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              {form.provider_id ? `Will be assigned to ${form.provider_name}` : 'Providers can claim first-come-first-served'}
            </p>
          </div>

          {/* Payment Method */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Payment Method</label>
            <div className="flex gap-2">
              {[{ value: 'stripe', label: '💳 Card (Stripe)' }, { value: 'cash', label: '💵 Cash' }].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, payment_method: opt.value, is_cash_job: opt.value === 'cash' }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                    form.payment_method === opt.value
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Notes</label>
            <textarea
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
              value={form.customer_notes}
              onChange={e => setForm(f => ({ ...f, customer_notes: e.target.value }))}
              placeholder="Special instructions..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !!duplicate}
              className="flex-1 py-2.5 rounded-xl bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : form.provider_id ? 'Assign Job' : 'Post to Pool'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}