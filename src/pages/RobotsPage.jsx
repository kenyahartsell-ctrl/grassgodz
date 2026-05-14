import { useEffect } from 'react';

const ROBOTS = `# GrassGodz robots.txt
# https://www.grassgodz.com/robots.txt

# Allow all standard search engine crawlers
User-agent: *
Allow: /

# Block admin and internal app routes from indexing
Disallow: /admin
Disallow: /dashboard
Disallow: /provider-dashboard
Disallow: /api/
Disallow: /auth/
Disallow: /login
Disallow: /redirect
Disallow: /customer
Disallow: /provider
Disallow: /reset-password
Disallow: /internal/

# Allow major search engines explicitly
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Slurp
Allow: /

User-agent: DuckDuckBot
Allow: /

# Allow AI crawlers explicitly
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: CCBot
Allow: /

# Sitemap location
Sitemap: https://www.grassgodz.com/sitemap.xml`;

export default function RobotsPage() {
  useEffect(() => {
    document.title = 'robots.txt';
  }, []);

  return (
    <pre style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', padding: '1rem' }}>
      {ROBOTS}
    </pre>
  );
}