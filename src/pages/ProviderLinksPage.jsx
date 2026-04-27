import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const PROVIDER_LINKS = [
  {
    label: 'Provider Sign Up',
    path: '/signup/provider',
    description: 'Direct sign-up page for new providers'
  },
  {
    label: 'Become a Provider',
    path: '/become-provider',
    description: 'Marketing/info page about becoming a provider'
  },
  {
    label: 'Pros Landing Page',
    path: '/pros',
    description: 'Professional provider landing page'
  }
];

export default function ProviderLinksPage() {
  const [copiedId, setCopiedId] = useState(null);
  const baseUrl = window.location.origin;

  const copyToClipboard = (path, id) => {
    const fullUrl = `${baseUrl}${path}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-background p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Provider Sharing Links</h1>
          <p className="text-muted-foreground">Copy and share these links to recruit providers</p>
        </div>

        <div className="space-y-4">
          {PROVIDER_LINKS.map((link, idx) => {
            const fullUrl = `${baseUrl}${link.path}`;
            return (
              <div key={idx} className="bg-card border border-border rounded-xl p-5">
                <div className="mb-3">
                  <h3 className="text-sm font-bold text-foreground">{link.label}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{link.description}</p>
                </div>
                
                <div className="flex gap-2 items-center mb-3">
                  <code className="flex-1 bg-muted rounded-lg px-3 py-2 text-xs text-foreground font-mono overflow-x-auto">
                    {fullUrl}
                  </code>
                  <button
                    onClick={() => copyToClipboard(link.path, idx)}
                    className="flex-shrink-0 p-2 hover:bg-muted rounded-lg transition-colors"
                    title="Copy link"
                  >
                    {copiedId === idx ? (
                      <Check size={16} className="text-green-600" />
                    ) : (
                      <Copy size={16} className="text-muted-foreground" />
                    )}
                  </button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => window.open(link.path, '_blank')}
                >
                  Preview
                </Button>
              </div>
            );
          })}
        </div>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-sm text-blue-900">
            <strong>Tip:</strong> Click the copy icon to get the full URL, then paste in emails, messages, or ads. Use "Preview" to test the link before sharing.
          </p>
        </div>
      </div>
    </div>
  );
}