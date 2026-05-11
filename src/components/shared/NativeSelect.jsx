import { useState } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

/**
 * NativeSelect — replaces <select> with a bottom-sheet style picker on mobile.
 * Props mirror a basic <select>: value, onChange, options [{value, label}], placeholder, className
 */
export default function NativeSelect({ value, onChange, options = [], placeholder = 'Select...', className = '', disabled = false }) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={`w-full flex items-center justify-between border border-input rounded-xl px-4 py-3 text-sm bg-background text-left select-none focus:outline-none focus:ring-2 focus:ring-ring transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-ring/50'
        } ${className}`}
      >
        <span className={selected ? 'text-foreground' : 'text-muted-foreground'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={16} className="text-muted-foreground flex-shrink-0 ml-2" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />

          {/* Sheet */}
          <div className="relative bg-card rounded-t-2xl shadow-2xl max-h-[70vh] flex flex-col animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
              <span className="text-sm font-semibold text-foreground">{placeholder}</span>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-muted transition-colors">
                <X size={16} className="text-muted-foreground" />
              </button>
            </div>
            <div className="overflow-y-auto overscroll-none">
              {options.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className="w-full flex items-center justify-between px-5 py-4 text-sm text-left hover:bg-muted/50 transition-colors select-none border-b border-border/50 last:border-0"
                >
                  <span className={opt.value === value ? 'font-semibold text-primary' : 'text-foreground'}>
                    {opt.label}
                  </span>
                  {opt.value === value && <Check size={16} className="text-primary flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}