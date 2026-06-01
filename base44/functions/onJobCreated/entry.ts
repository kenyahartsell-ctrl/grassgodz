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
    const payload = await req.json();
    const { event, data } = payload;

    if (event?.type !== 'create') return Response.json({ skipped: true });

    const job = data;
    if (!job?.address) return Response.json({ skipped: 'no address' });
    if (job.latitude && job.longitude) return Response.json({ skipped: 'already geocoded' });

    const coords = await geocodeAddress(job.address);
    if (!coords) return Response.json({ skipped: 'geocode failed', address: job.address });

    const base44 = createClientFromRequest(req);
    await base44.asServiceRole.entities.Job.update(job.id, {
      latitude: coords.latitude,
      longitude: coords.longitude,
    });

    return Response.json({ success: true, ...coords });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});