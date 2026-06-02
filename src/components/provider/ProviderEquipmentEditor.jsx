import { useState } from 'react';
import { Wrench, Save, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const EQUIPMENT_GROUPS = [
  {
    label: 'Lawn Mowing',
    items: [
      { id: 'push_mower_electric', label: 'Push Mower – Electric' },
      { id: 'push_mower_gas', label: 'Push Mower – Gas' },
      { id: 'riding_mower', label: 'Riding Mower' },
    ],
  },
  {
    label: 'Trimming & Edging',
    items: [
      { id: 'weed_eater_electric', label: 'Weed Eater – Electric' },
      { id: 'weed_eater_gas', label: 'Weed Eater – Gas' },
      { id: 'hedge_trimmer', label: 'Hedge Trimmer' },
    ],
  },
  {
    label: 'Blowers',
    items: [
      { id: 'leaf_blower_electric', label: 'Leaf Blower – Electric' },
      { id: 'leaf_blower_gas', label: 'Leaf Blower – Gas' },
      { id: 'backpack_blower_electric', label: 'Backpack Blower – Electric' },
      { id: 'backpack_blower_gas', label: 'Backpack Blower – Gas' },
    ],
  },
  {
    label: 'Cleanup & Landscaping',
    items: [
      { id: 'rake', label: 'Rake' },
      { id: 'shovel', label: 'Shovel' },
      { id: 'pole_saw', label: 'Pole Saw' },
      { id: 'ladder', label: 'Ladder' },
    ],
  },
  {
    label: 'Snow Removal',
    items: [
      { id: 'snow_blower', label: 'Snow Blower' },
    ],
  },
  {
    label: 'Hauling',
    items: [
      { id: 'truck', label: 'Truck' },
      { id: 'trailer', label: 'Trailer' },
    ],
  },
];

export default function ProviderEquipmentEditor({ profile, onProfileUpdated }) {
  const [selected, setSelected] = useState(new Set(profile?.equipment || []));
  const [haulingFeesApply, setHaulingFeesApply] = useState(profile?.hauling_fees_apply || false);
  const [haulingFeeType, setHaulingFeeType] = useState(profile?.hauling_fee_type || 'flat');
  const [haulingFeeValue, setHaulingFeeValue] = useState(profile?.hauling_fee_value || '');
  const [saving, setSaving] = useState(false);

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (!profile?.id) return;
    setSaving(true);
    try {
      const payload = {
        profile_id: profile.id,
        equipment: Array.from(selected),
        hauling_fees_apply: haulingFeesApply,
        hauling_fee_type: haulingFeeType,
        hauling_fee_value: haulingFeesApply ? (Number(haulingFeeValue) || 0) : null,
      };
      const res = await base44.functions.invoke('updateMyProviderProfile', payload);
      if (res.data?.error) throw new Error(res.data.error);
      toast.success('Equipment & services saved!');
      onProfileUpdated();
    } catch {
      toast.error('Failed to save equipment.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-5">
      <div className="flex items-center gap-2">
        <Wrench size={15} className="text-primary" />
        <h3 className="text-sm font-bold text-foreground">My Equipment & Services</h3>
      </div>
      <p className="text-xs text-muted-foreground -mt-3">
        Select the tools and equipment you have available. This helps factor into job quoting.
      </p>

      <div className="space-y-5">
        {EQUIPMENT_GROUPS.map(group => (
          <div key={group.label}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{group.label}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {group.items.map(item => (
                <label key={item.id} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selected.has(item.id)}
                    onChange={() => toggle(item.id)}
                    className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer"
                  />
                  <span className="text-sm text-foreground group-hover:text-primary transition-colors">{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Hauling & Dump Fees */}
      <div className="border-t border-border pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Hauling & Dump Fees Apply</p>
            <p className="text-xs text-muted-foreground mt-0.5">Automatically add your fee to applicable job quotes</p>
          </div>
          <button
            type="button"
            onClick={() => setHaulingFeesApply(v => !v)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${haulingFeesApply ? 'bg-primary' : 'bg-muted'}`}
          >
            <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition duration-200 ease-in-out ${haulingFeesApply ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        {haulingFeesApply && (
          <div className="bg-muted/40 rounded-xl p-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Fee Type</label>
              <div className="flex gap-3">
                {['flat', 'percentage'].map(type => (
                  <label key={type} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="hauling_fee_type"
                      value={type}
                      checked={haulingFeeType === type}
                      onChange={() => setHaulingFeeType(type)}
                      className="accent-primary"
                    />
                    <span className="text-sm text-foreground capitalize">{type === 'flat' ? 'Flat Rate ($)' : 'Percentage (%)'}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                {haulingFeeType === 'flat' ? 'Fee Amount ($)' : 'Fee Percentage (%)'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {haulingFeeType === 'flat' ? '$' : '%'}
                </span>
                <input
                  type="number"
                  min="0"
                  step={haulingFeeType === 'flat' ? '0.01' : '1'}
                  value={haulingFeeValue}
                  onChange={e => setHaulingFeeValue(e.target.value)}
                  placeholder={haulingFeeType === 'flat' ? '50.00' : '10'}
                  className="w-full border border-input rounded-lg pl-7 pr-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-2 text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-70"
      >
        {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
        {saving ? 'Saving...' : 'Save Equipment & Services'}
      </button>
    </div>
  );
}