import { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export default function AdminInviteModal({ onClose }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    if (!email.trim()) return toast.error('Email is required.');
    setLoading(true);
    try {
      await base44.users.inviteUser(email.trim(), role);
      toast.success(`Invitation sent to ${email} as ${role === 'admin' ? 'Admin' : role === 'user' ? 'Customer' : 'Provider'}.`);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to send invite.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus size={18} className="text-primary" />
            <h2 className="text-base font-bold text-foreground">Invite User</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Email Address *</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleInvite()}
              placeholder="user@example.com"
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Invite As</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setRole('user')}
                className={`py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                  role === 'user'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground border-input hover:bg-muted'
                }`}
              >
                Customer
              </button>
              <button
                onClick={() => setRole('provider')}
                className={`py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                  role === 'provider'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground border-input hover:bg-muted'
                }`}
              >
                Provider
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button variant="outline" onClick={onClose} className="flex-1" size="sm">Cancel</Button>
          <Button onClick={handleInvite} disabled={loading} className="flex-1" size="sm">
            {loading ? 'Sending...' : 'Send Invite'}
          </Button>
        </div>
      </div>
    </div>
  );
}