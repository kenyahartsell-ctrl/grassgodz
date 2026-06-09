import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

async function geocodeAddress(address) {
  const token = Deno.env.get('MAPBOX_SECRET_TOKEN');
  if (!token) throw new Error('MAPBOX_SECRET_TOKEN not set');
  const encoded = encodeURIComponent(address);
  const url = 'https://api.mapbox.com/geocoding/v5/mapbox.places/' + encoded + '.json?access_token=' + token + '&limit=1&types=address,postcode,place';
  const res = await fetch(url);
  const data = await res.json();
  if (data.message) throw new Error('Mapbox error: ' + data.message);
  if (!data.features || data.features.length === 0) return null;
  const [longitude, latitude] = data.features[0].center;
  return { latitude, longitude };
}

async function sendSMSAlert(to, body) {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken  = Deno.env.get('TWILIO_AUTH_TOKEN');
  const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');
  if (!accountSid || !authToken || !fromNumber) return;
  const url = 'https://api.twilio.com/2010-04-01/Accounts/' + accountSid + '/Messages.json';
  const credentials = btoa(accountSid + ':' + authToken);
  const params = new URLSearchParams({ From: fromNumber, To: to, Body: body });
  await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': 'Basic ' + credentials, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const { event, data } = payload;

    if (event?.type !== 'create') return Response.json({ skipped: true });

    const job = data;
    if (!job?.address) return Response.json({ skipped: 'no address' });
    if (job.latitude && job.longitude) return Response.json({ skipped: 'already geocoded' });

    const base44 = createClientFromRequest(req);

    const coords = await geocodeAddress(job.address);
    if (coords) {
      await base44.asServiceRole.entities.Job.update(job.id, {
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
    }

    // Alert active providers in the same ZIP via SMS
    if (job.zip_code) {
      try {
        const providers = await base44.asServiceRole.entities.ProviderProfile.list('-created_date', 500);
        const matching = providers.filter(p =>
          p.status === 'active' &&
          p.phone &&
          Array.isArray(p.service_zip_codes) &&
          p.service_zip_codes.includes(job.zip_code)
        );
        const serviceName = job.service_name || 'Lawn service';
        const zip = job.zip_code;
        await Promise.all(matching.map(p =>
          sendSMSAlert(p.phone, 'New Grassgodz job in ' + zip + '! ' + serviceName + ' is available. Log in to quote or accept it: grassgodz.com')
        ));
      } catch {}
    }

    return Response.json({ success: true, ...(coords || {}) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
