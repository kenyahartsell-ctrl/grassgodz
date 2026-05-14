Deno.serve(async () => {
  const txt = `# GrassGodz robots.txt
# https://www.grassgodz.com/robots.txt

User-agent: *
Allow: /

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

User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

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

Sitemap: https://www.grassgodz.com/sitemap.xml`;

  return new Response(txt, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});