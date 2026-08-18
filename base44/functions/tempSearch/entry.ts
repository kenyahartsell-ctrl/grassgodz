import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const profiles = await base44.asServiceRole.entities.CustomerProfile.list();
  
  const addrs = profiles.map(p => p.service_address || p.street || p.billing_address).filter(Boolean);
  return Response.json({ addrs });
});