import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

/**
 * SmartRedirect — shown after login.
 * Checks user role + provider profile status, then routes to the right portal.
 *
 * Routing logic:
 *   admin role       → /admin
 *   provider (active)   → /provider
 *   provider (pending)  → /provider/pending
 *   provider (suspended)→ /provider/suspended
 *   everyone else    → /customer
 */
export default function SmartRedirect() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Signing you in...');

  useEffect(() => {
    async function redirect() {
      try {
        const user = await base44.auth.me();

        // Admin goes straight to admin portal
        if (user.role === 'admin') {
          navigate('/admin', { replace: true });
          return;
        }

        // Check if this user has a provider profile
        setStatus('Loading your profile...');
        const profiles = await base44.entities.ProviderProfile.filter({ user_email: user.email });

        if (profiles && profiles.length > 0) {
          const profile = profiles[0];
          if (profile.status === 'suspended') {
            navigate('/provider/suspended', { replace: true });
          } else if (['pending_review', 'pending_approval', 'background_check_needed', 'more_info_needed'].includes(profile.status)) {
            navigate('/provider/pending', { replace: true });
          } else {
            // active or paused — go to provider portal
            navigate('/provider', { replace: true });
          }
          return;
        }

        // Default: customer
        navigate('/customer', { replace: true });
      } catch {
        // If auth fails, go to homepage
        navigate('/', { replace: true });
      }
    }

    redirect();
  }, [navigate]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background gap-4">
      <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground">{status}</p>
    </div>
  );
}