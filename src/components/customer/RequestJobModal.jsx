import { useState } from 'react';
import { X, MapPin, Calendar, FileText, RefreshCw, Ruler } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { YARD_SIZES } from '@/lib/pricingFloors';

const LAWN_KEYWORDS = ['mow', 'mowing', 'grass', 'lawn', 'cut'];
const isLawnService = (name) => LAWN_KEYWORDS.some(k => name?.toLowerCase().includes(k));

export default function RequestJobModal({ service, onClose, onSubmit, customerProfile }) {
  const { t } = useLanguage();
  const showRecurrence = isLawnService(service.name);
  const [form, setForm] = useState({
    address: customerProfile?.service_address || '',
    zip_code: customerProfile?.zip_code || '',
    scheduled_date: '',
    customer_notes: '',
    recurrence: 'one_time',
    yard_size: '',
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
            <h2 className="text-lg font-bold text-foreground">{t('request_quote')}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{service.name}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-1.5">
              <MapPin size={13} className="text-primary" /> {t('service_address')}
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
            <label className="text-sm font-medium text-foreground mb-1.5 block">{t('zip_code')}</label>
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
              <Calendar size={13} className="text-primary" /> {t('preferred_date')}
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
          {showRecurrence && (
            <div>
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-2">
                <RefreshCw size={13} className="text-primary" /> {t('how_often')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'one_time', label: t('one_time') },
                  { value: 'weekly', label: t('weekly') },
                  { value: 'biweekly', label: t('biweekly') },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, recurrence: opt.value }))}
                    className={`py-2.5 rounded-lg text-sm font-medium border transition-all ${
                      form.recurrence === opt.value
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-foreground border-input hover:border-primary/50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {form.recurrence !== 'one_time' && (
                <p className="text-xs text-muted-foreground mt-2">
                  {form.recurrence === 'weekly' ? t('recurrence_note_weekly') : t('recurrence_note_biweekly')}
                </p>
              )}
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-1.5">
              <FileText size={13} className="text-primary" /> {t('notes_for_provider')}
            </label>
            <textarea
              value={form.customer_notes}
              onChange={e => setForm(f => ({ ...f, customer_notes: e.target.value }))}
              rows={3}
              placeholder={t('notes_placeholder')}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-1.5">
              <Ruler size={13} className="text-primary" /> Yard Size *
            </label>
            <select
              value={form.yard_size}
              onChange={e => setForm(f => ({ ...f, yard_size: e.target.value }))}
              required
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select yard size…</option>
              {YARD_SIZES.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          {/* Quote disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-xs text-amber-800 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: t('quote_disclaimer') }} />
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 border border-border rounded-lg px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
              {t('cancel')}
            </button>
            <button type="submit" className="flex-1 bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors">
              {t('submit_request')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}