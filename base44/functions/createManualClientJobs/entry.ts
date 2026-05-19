import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // This is called by a scheduled automation — use service role
    const clients = await base44.asServiceRole.entities.ManualClient.filter({ status: 'active' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let created = 0;
    for (const client of clients) {
      const nextDate = client.next_job_date ? new Date(client.next_job_date) : null;

      if (!nextDate || nextDate <= today) {
        const scheduledDate = nextDate || today;
        const scheduledDateStr = scheduledDate.toISOString().split('T')[0];

        // Find or create a CustomerProfile for this manual client
        const internalEmail = `manual_${client.id}@grassgodz.internal`;
        let profileId = null;
        const existingProfiles = await base44.asServiceRole.entities.CustomerProfile.filter({ user_email: internalEmail });
        if (existingProfiles.length > 0) {
          profileId = existingProfiles[0].id;
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

        await base44.asServiceRole.entities.Job.create({
          customer_id: profileId,
          customer_name: client.client_name,
          customer_email: null,
          service_id: 'manual',
          service_name: client.service_type,
          address: client.address,
          zip_code: client.zip_code,
          scheduled_date: scheduledDateStr,
          customer_notes: client.notes || '',
          recurrence: 'biweekly',
          recurrence_parent_id: client.id,
          status: 'requested',
          is_cash_job: true,
          payment_method: 'cash',
          quoted_price: 0,
        });

        // Set next job date to 2 weeks from scheduled date
        const next = new Date(scheduledDate);
        next.setDate(next.getDate() + 14);

        await base44.asServiceRole.entities.ManualClient.update(client.id, {
          last_job_created_at: new Date().toISOString(),
          next_job_date: next.toISOString().split('T')[0],
        });

        created++;
      }
    }

    return Response.json({ success: true, created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});