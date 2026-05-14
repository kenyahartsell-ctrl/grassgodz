Deno.serve(async () => {
  const txt = `User-agent: *
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