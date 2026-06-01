import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

async function geocodeAddress(address) {
  const encoded = encodeURIComponent(address);
  const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'GrassGodz/1.0 (grassgodz.com)' }
  });
  const data = await res.json();
  if (!data || data.length === 0) return null;
  return {
    latitude: parseFloat(data[0].lat),
    longitude: parseFloat(data[0].lon),
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const allJobs = await base44.asServiceRole.entities.Job.list();
    const needsGeocode = allJobs.filter(j => j.address && (!j.latitude || !j.longitude));

    let updated = 0;
    let failed = 0;

    for (const job of needsGeocode) {
      const coords = await geocodeAddress(job.address);
      if (coords) {
        await base44.asServiceRole.entities.Job.update(job.id, {
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
        updated++;
      } else {
        failed++;
      }
      // Nominatim rate limit: max 1 req/sec
      await new Promise(r => setTimeout(r, 1100));
    }

    return Response.json({ success: true, updated, failed, total: needsGeocode.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});