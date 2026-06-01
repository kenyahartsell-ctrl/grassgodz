import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

async function geocodeAddress(address) {
  const token = Deno.env.get('VITE_MAPBOX_SECRET');
  if (!token) throw new Error('VITE_MAPBOX_SECRET not set');
  const encoded = encodeURIComponent(address);
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${token}&limit=1`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.features || data.features.length === 0) return null;
  const [longitude, latitude] = data.features[0].center;
  return { latitude, longitude };
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