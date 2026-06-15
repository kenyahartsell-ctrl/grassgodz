import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Auth check — prevent open SMS relay
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { to, body } = await req.json();

    if (!to || !body) {
      return Response.json({ error: 'Missing to or body' }, { status: 400 });
    }

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken  = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !fromNumber) {
      return Response.json({ error: 'Twilio env vars not configured' }, { status: 500 });
    }

    const url = 'https://api.twilio.com/2010-04-01/Accounts/' + accountSid + '/Messages.json';
    const credentials = btoa(accountSid + ':' + authToken);

    const params = new URLSearchParams();
    params.set('From', fromNumber);
    params.set('To', to);
    params.set('Body', body);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + credentials,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const result = await res.json();

    if (!res.ok) {
      return Response.json({ error: result.message || 'Twilio error', code: result.code }, { status: 500 });
    }

    return Response.json({ success: true, sid: result.sid });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});