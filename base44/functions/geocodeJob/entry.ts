import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Uses Nominatim (OpenStreetMap) — free, no API key required, server-side safe
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
    const { job_id, address } = await req.json();
    if (!job_id || !address) {
      return Response.json({ error: 'job_id and address required' }, { status: 400 });
    }

    const coords = await geocodeAddress(address);
    if (!coords) {
      return Response.json({ error: 'Could not geocode address', address }, { status: 404 });
    }

    await base44.asServiceRole.entities.Job.update(job_id, {
      latitude: coords.latitude,
      longitude: coords.longitude,
    });

    return Response.json({ success: true, ...coords });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});