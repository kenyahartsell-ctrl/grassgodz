import { useState } from 'react';
import { X, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AdminEditProviderModal({ provider, onClose, onSaved }) {
  const [formData, setFormData] = useState({
    name: provider.name || '',
    business_name: provider.business_name || '',
    phone: provider.phone || '',
    user_email: provider.user_email || '',
    home_address: provider.home_address || '',
    bio: provider.bio || '',
    years_experience: provider.years_experience || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await base44.entities.ProviderProfile.update(provider.id, {
        ...formData,
        years_experience: formData.years_experience ? Number(formData.years_experience) : 0,
      });
      toast.success('Provider updated successfully');
      onSaved();
    } catch (error) {
      toast.error(error.message || 'Failed to update provider');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-bold text-foreground">Edit Provider</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition-colors text-muted-foreground"><X size={18} /></button>
        </div>
        
        <div className="p-4 overflow-y-auto flex-1">
          <form id="edit-provider-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-background"
                required
              />
            </div>
            
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Business Name (Optional)</label>
              <input
                type="text"
                value={formData.business_name}
                onChange={e => setFormData({ ...formData, business_name: e.target.value })}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-background"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Email</label>
              <input
                type="email"
                value={formData.user_email}
                onChange={e => setFormData({ ...formData, user_email: e.target.value })}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-background"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-background"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Years Experience</label>
                <input
                  type="number"
                  min="0"
                  value={formData.years_experience}
                  onChange={e => setFormData({ ...formData, years_experience: e.target.value })}
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-background"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Home Address</label>
              <input
                type="text"
                value={formData.home_address}
                onChange={e => setFormData({ ...formData, home_address: e.target.value })}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-background"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Bio / Notes</label>
              <textarea
                value={formData.bio}
                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                rows={3}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-background resize-none"
              />
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-border flex justify-end gap-2 bg-muted/20">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" form="edit-provider-form" disabled={saving} className="gap-2">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}