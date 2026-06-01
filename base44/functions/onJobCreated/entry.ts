import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

async function geocodeAddress(address) {
  const token = Deno.env.get('MAPBOX_SECRET_TOKEN');
  if (!token) throw new Error('MAPBOX_SECRET_TOKEN not set');
  const encoded = encodeURIComponent(address);
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${token}&limit=1&types=address,postcode,place`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.message) throw new Error(`Mapbox error: ${data.message}`);
  if (!data.features || data.features.length === 0) return null;
  const [longitude, latitude] = data.features[0].center;
  return { latitude, longitude };
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