import { useState } from 'react';
import { X, Calendar, MapPin, FileText, Clock, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { MOCK_SERVICES, MOCK_CUSTOMER } from '../../lib/mockData';

const TIMES = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function BookingModal({ onClose, onSubmit, preselectedService = null }) {
  const today = new Date();
  const [step, setStep] = useState(1); // 1: service, 2: date/time, 3: details, 4: confirm
  const [selectedService, setSelectedService] = useState(preselectedService);
  const [calendarDate, setCalendarDate] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [form, setForm] = useState({
    address: MOCK_CUSTOMER.service_address,
    zip_code: MOCK_CUSTOMER.zip_code,
    notes: '',
  });

  const daysInMonth = getDaysInMonth(calendarDate.year, calendarDate.month);
  const firstDay = getFirstDayOfMonth(calendarDate.year, calendarDate.month);
  const monthName = new Date(calendarDate.year, calendarDate.month).toLocaleString('default', { month: 'long' });

  const prevMonth = () => {
    setCalendarDate(d => d.month === 0
      ? { year: d.year - 1, month: 11 }
      : { ...d, month: d.month - 1 }
    );
  };

  const nextMonth = () => {
    setCalendarDate(d => d.month === 11
      ? { year: d.year + 1, month: 0 }
      : { ...d, month: d.month + 1 }
    );
  };

  const isPastDay = (day) => {
    const date = new Date(calendarDate.year, calendarDate.month, day);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return date < todayStart;
  };

  const isSelectedDay = (day) => {
    if (!selectedDate) return false;
    return selectedDate.year === calendarDate.year &&
      selectedDate.month === calendarDate.month &&
      selectedDate.day === day;
  };

  const isToday = (day) => {
    return today.getFullYear() === calendarDate.year &&
      today.getMonth() === calendarDate.month &&
      today.getDate() === day;
  };

  const selectedDateFormatted = selectedDate
    ? new Date(selectedDate.year, selectedDate.month, selectedDate.day)
        .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : null;

  const selectedDateISO = selectedDate
    ? `${selectedDate.year}-${String(selectedDate.month + 1).padStart(2, '0')}-${String(selectedDate.day).padStart(2, '0')}`
    : null;

  const handleSubmit = () => {
    onSubmit({
      service_id: selectedService.id,
      service_name: selectedService.name,
      address: form.address,
      zip_code: form.zip_code,
      scheduled_date: selectedDateISO,
      scheduled_time: selectedTime,
      customer_notes: form.notes,
    });
    onClose();
  };

  const STEPS = ['Service', 'Date & Time', 'Details', 'Confirm'];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-card rounded-t-2xl sm:rounded-2xl w-full max-w-lg shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-foreground">Book a Service</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Step {step} of 4 — {STEPS[step - 1]}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Step Progress */}
        <div className="flex gap-1 px-5 pt-4 flex-shrink-0">
          {STEPS.map((s, i) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all ${i + 1 <= step ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* Step 1: Service Selection */}
          {step === 1 && (
            <div>
              <p className="text-sm font-medium text-foreground mb-4">Which service do you need?</p>
              <div className="space-y-2">
                {MOCK_SERVICES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedService(s)}
                    className={`w-full text-left flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                      selectedService?.id === s.id
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:border-primary/40 hover:bg-muted/40'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold">{s.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                    </div>
                    <div className="flex-shrink-0 ml-3 text-right">
                      <p className="text-sm font-bold text-primary">From ${s.base_price_estimate}</p>
                      {selectedService?.id === s.id && <CheckCircle2 size={16} className="text-primary ml-auto mt-1" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Date & Time */}
          {step === 2 && (
            <div>
              {/* Calendar */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                    <ChevronLeft size={16} />
                  </button>
                  <p className="text-sm font-bold text-foreground">{monthName} {calendarDate.year}</p>
                  <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                    <ChevronRight size={16} />
                  </button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 mb-1">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                    <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
                  ))}
                </div>

                {/* Day grid */}
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const past = isPastDay(day);
                    const selected = isSelectedDay(day);
                    const todayMark = isToday(day);
                    return (
                      <button
                        key={day}
                        disabled={past}
                        onClick={() => setSelectedDate({ year: calendarDate.year, month: calendarDate.month, day })}
                        className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                          past ? 'text-muted-foreground/30 cursor-not-allowed' :
                          selected ? 'bg-primary text-primary-foreground shadow-md' :
                          todayMark ? 'border border-primary text-primary font-bold hover:bg-primary/10' :
                          'hover:bg-muted text-foreground'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time slots */}
              {selectedDate && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-1.5">
                    <Clock size={14} className="text-primary" /> Pick a time for {selectedDateFormatted}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {TIMES.map(t => (
                      <button
                        key={t}
                        onClick={() => setSelectedTime(t)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                          selectedTime === t
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-border hover:border-primary/50 hover:bg-muted/40'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Details */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-1.5">
                  <MapPin size={13} className="text-primary" /> Service Address
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">ZIP Code</label>
                <input
                  type="text"
                  value={form.zip_code}
                  onChange={e => setForm(f => ({ ...f, zip_code: e.target.value }))}
                  className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-1.5">
                  <FileText size={13} className="text-primary" /> Notes for Provider (optional)
                </label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={4}
                  placeholder="Gate code, pets, special instructions..."
                  className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 4 && (
            <div>
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 space-y-3 mb-5">
                <h3 className="text-sm font-bold text-foreground">Booking Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service</span>
                    <span className="font-semibold text-foreground">{selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-semibold text-foreground">{selectedDateFormatted}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time</span>
                    <span className="font-semibold text-foreground">{selectedTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Address</span>
                    <span className="font-semibold text-foreground text-right max-w-[55%]">{form.address}</span>
                  </div>
                  <hr className="border-border" />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estimated Price</span>
                    <span className="font-bold text-primary">From ${selectedService?.base_price_estimate}</span>
                  </div>
                </div>
              </div>
              <div className="bg-muted/40 rounded-xl p-4 text-xs text-muted-foreground">
                Providers in your area will receive this booking request. Once a provider accepts, your card will be authorized for the final quoted amount.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-border flex gap-3 flex-shrink-0">
          {step > 1 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-1.5 border border-border rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              <ChevronLeft size={15} /> Back
            </button>
          )}
          <button
            onClick={() => step < 4 ? setStep(s => s + 1) : handleSubmit()}
            disabled={
              (step === 1 && !selectedService) ||
              (step === 2 && (!selectedDate || !selectedTime)) ||
              (step === 3 && (!form.address || !form.zip_code))
            }
            className="flex-1 bg-primary text-primary-foreground rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {step === 4 ? 'Confirm Booking' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}