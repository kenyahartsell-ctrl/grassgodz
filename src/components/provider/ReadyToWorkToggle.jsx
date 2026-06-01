import { useState } from 'react';
import { Power, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ReadyToWorkToggle({ providerProfile, onStatusChanged }) {
  const [loading, setLoading] = useState(false);
  const isActive = providerProfile?.status === 'active';

  const handleToggle = async () => {
    if (!providerProfile?.id) return;
    setLoading(true);
    try {
      const newStatus = isActive ? 'paused' : 'active';
      await base44.functions.invoke('updateMyProviderProfile', {
        profile_id: providerProfile.id,
        status: newStatus,
      });
      onStatusChanged?.(newStatus);
      if (newStatus === 'active') {
        toast.success('You\'re now Active — available jobs are visible!');
      } else {
        toast('You\'re now Inactive. Available jobs are hidden.');
      }
    } catch {
      toast.error('Failed to update status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`rounded-2xl border p-5 flex items-center gap-4 transition-all ${
      isActive
        ? 'bg-green-50 border-green-200'
        : 'bg-muted/40 border-border'
    }`}>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
        isActive ? 'bg-green-500' : 'bg-muted-foreground/20'
      }`}>
        <Power size={22} className={isActive ? 'text-white' : 'text-muted-foreground'} />
      </div>

      <div className="flex-1 min-w-0">
        <p className={`font-bold text-sm ${isActive ? 'text-green-800' : 'text-foreground'}`}>
          {isActive ? 'You are Active' : 'You are Inactive'}
        </p>
        <p className={`text-xs mt-0.5 ${isActive ? 'text-green-700' : 'text-muted-foreground'}`}>
          {isActive
            ? 'Available jobs are visible — tap to go Inactive when done for the day.'
            : 'Tap "Ready to Work" to see available jobs in your area.'}
        </p>
      </div>

      <button
        onClick={handleToggle}
        disabled={loading}
        className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
          isActive
            ? 'bg-white border border-green-300 text-green-800 hover:bg-green-100'
            : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md'
        }`}
      >
        {loading
          ? <Loader2 size={14} className="animate-spin" />
          : <Power size={14} />
        }
        {isActive ? 'Go Inactive' : 'Ready to Work'}
      </button>
    </div>
  );
}