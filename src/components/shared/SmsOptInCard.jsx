import { useState } from 'react';
import { MessageSquare, CheckCircle2, XCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function SmsOptInCard({ profile, onSaved, entityName }) {
  const [saving, setSaving] = useState(false);
  const isOptedIn = profile?.sms_opt_in === true;
  const hasConsented = profile?.sms_opt_in !== undefined && profile?.sms_opt_in !== null;

  const handleOptIn = async () => {
    if (!profile?.id) return;
    setSaving(true);
    try {
      await base44.entities[entityName].update(profile.id, {
        sms_opt_in: true,
        sms_opt_in_date: new Date().toISOString(),
      });
      toast.success('SMS notifications enabled!');
      onSaved();
    } catch {
      toast.error('Failed to update SMS preference.');
    } finally {
      setSaving(false);
    }
  };

  const handleOptOut = async () => {
    if (!profile?.id) return;
    setSaving(true);
    try {
      await base44.entities[entityName].update(profile.id, {
        sms_opt_in: false,
        sms_opt_in_date: new Date().toISOString(),
      });
      toast.success('SMS notifications disabled.');
      onSaved();
    } catch {
      toast.error('Failed to update SMS preference.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-1">
        <MessageSquare size={15} className="text-primary" />
        <h3 className="text-sm font-bold text-foreground">SMS Notifications</h3>
      </div>

      {isOptedIn ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <CheckCircle2 size={14} className="flex-shrink-0" />
            <p className="text-xs font-medium">You are opted in to SMS notifications.</p>
          </div>
          {profile?.sms_opt_in_date && (
            <p className="text-xs text-muted-foreground">
              Consented on {new Date(profile.sms_opt_in_date).toLocaleDateString()}
            </p>
          )}
          <button
            onClick={handleOptOut}
            disabled={saving}
            className="w-full border border-border rounded-lg py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors disabled:opacity-70"
          >
            {saving ? 'Saving...' : 'Opt Out of SMS'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {hasConsented && profile?.sms_opt_in === false ? (
            <div className="flex items-center gap-2 text-muted-foreground bg-muted/40 border border-border rounded-lg px-3 py-2">
              <XCircle size={14} className="flex-shrink-0" />
              <p className="text-xs font-medium">You have opted out of SMS notifications.</p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Receive job alerts, chat notifications, and account updates via text message.
            </p>
          )}
          <p className="text-xs text-muted-foreground/70 leading-relaxed">
            By opting in, you agree to receive SMS notifications from Grassgodz including job alerts, chat message notifications, and account updates. Message and data rates may apply. Reply STOP at any time to opt out.
          </p>
          <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
            Grassgodz is a brand operated by Tradegodz LLC.
          </p>
          <button
            onClick={handleOptIn}
            disabled={saving}
            className="w-full bg-primary text-primary-foreground rounded-lg py-2 text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-70"
          >
            {saving ? 'Saving...' : 'Opt In to SMS Notifications'}
          </button>
        </div>
      )}
    </div>
  );
}