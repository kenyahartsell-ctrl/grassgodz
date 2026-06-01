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
      try {
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
      } catch {
        failed++;
      }
      // Mapbox allows high request rates, small delay to be safe
      await new Promise(r => setTimeout(r, 100));
    }

    return Response.json({ success: true, updated, failed, total: needsGeocode.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});