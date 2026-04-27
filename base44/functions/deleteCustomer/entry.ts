import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { customer_id } = await req.json();

    if (!customer_id) {
      return Response.json({ error: 'Missing customer_id' }, { status: 400 });
    }

    // Delete customer profile
    await base44.asServiceRole.entities.CustomerProfile.delete(customer_id);

    return Response.json({ success: true, message: 'Customer deleted' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});