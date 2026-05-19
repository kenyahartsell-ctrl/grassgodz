import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { client_id } = await req.json();
    const client = await base44.asServiceRole.entities.ManualClient.get(client_id);
    if (!client) return Response.json({ error: 'Client not found' }, { status: 404 });

    // Find or create CustomerProfile for this manual client
    const internalEmail = `manual_${client.id}@grassgodz.internal`;
    let profileId = null;
    const existing = await base44.asServiceRole.entities.CustomerProfile.filter({ user_email: internalEmail });
    if (existing.length > 0) {
      profileId = existing[0].id;
    } else {
      const profile = await base44.asServiceRole.entities.CustomerProfile.create({
        user_email: internalEmail,
        name: client.client_name,
        service_address: client.address,
        zip_code: client.zip_code,
        billing_address: client.address,
      });
      profileId = profile.id;
    }

    const job = await base44.asServiceRole.entities.Job.create({
      customer_id: profileId,
      customer_name: client.client_name,
      customer_email: null,
      service_id: 'manual',
      service_name: client.service_type,
      address: client.address,
      zip_code: client.zip_code,
      scheduled_date: client.next_job_date,
      customer_notes: client.notes || '',
      recurrence: 'biweekly',
      recurrence_parent_id: client.id,
      status: 'requested',
      is_cash_job: true,
      payment_method: 'cash',
      quoted_price: 0,
    });

    // Advance next_job_date by 2 weeks
    const nextDate = new Date(client.next_job_date);
    nextDate.setDate(nextDate.getDate() + 14);
    await base44.asServiceRole.entities.ManualClient.update(client.id, {
      last_job_created_at: new Date().toISOString(),
      next_job_date: nextDate.toISOString().split('T')[0],
    });

    return Response.json({ success: true, job_id: job.id, next_job_date: nextDate.toISOString().split('T')[0] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});