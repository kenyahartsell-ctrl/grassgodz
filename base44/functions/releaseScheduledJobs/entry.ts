import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Called daily by automation — releases scheduled jobs whose next_release_date is today or past
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString().split('T')[0];

    // Fetch all active scheduled jobs
    const scheduledJobs = await base44.asServiceRole.entities.ScheduledJob.filter({ status: 'active' });

    let released = 0;
    let stopped = 0;

    for (const sj of scheduledJobs) {
      const releaseDate = sj.next_release_date || sj.start_date;
      if (!releaseDate || releaseDate > todayISO) continue;

      // Check if end_date passed
      if (sj.end_date && releaseDate > sj.end_date) {
        await base44.asServiceRole.entities.ScheduledJob.update(sj.id, { status: 'stopped' });
        stopped++;
        continue;
      }

      // Guard: skip if a non-cancelled job already exists for this provider + address + date
      if (sj.provider_id) {
        const existing = await base44.asServiceRole.entities.Job.filter({
          provider_id: sj.provider_id,
          scheduled_date: releaseDate,
          address: sj.service_address,
        });
        const activeStatuses = ['accepted', 'scheduled', 'in_progress', 'requested'];
        const alreadyExists = existing.some(j => activeStatuses.includes(j.status));
        if (alreadyExists) {
          console.warn(`Duplicate skipped: provider ${sj.provider_id} already has a job at ${sj.service_address} on ${releaseDate}`);
          continue;
        }
      }

      // Create the Job record
      const jobData = {
        customer_name: sj.client_name,
        customer_email: sj.client_email || '',
        customer_id: sj.client_email || sj.id,
        service_id: sj.service_id || '',
        service_name: sj.service_type,
        address: sj.service_address,
        zip_code: sj.zip_code,
        scheduled_date: releaseDate,
        status: 'requested',
        customer_notes: sj.notes || '',
        recurrence: sj.recurrence,
        payment_method: sj.payment_type === 'cash' ? 'cash' : 'stripe',
        is_cash_job: sj.payment_type === 'cash',
      };

      // If provider assigned, pre-assign it
      if (sj.provider_id) {
        jobData.provider_id = sj.provider_id;
        jobData.provider_name = sj.provider_name || '';
        jobData.provider_email = sj.provider_email || '';
        jobData.status = 'scheduled';
      }

      const createdJob = await base44.asServiceRole.entities.Job.create(jobData);

      // Track released job IDs
      const existingIds = sj.released_job_ids || [];
      const updates = {
        released_job_ids: [...existingIds, createdJob.id],
      };

      // Advance next_release_date for recurring jobs
      if (sj.recurrence === 'weekly') {
        const next = new Date(releaseDate);
        next.setDate(next.getDate() + 7);
        const nextISO = next.toISOString().split('T')[0];
        if (!sj.end_date || nextISO <= sj.end_date) {
          updates.next_release_date = nextISO;
        } else {
          updates.status = 'stopped';
        }
      } else if (sj.recurrence === 'biweekly') {
        const next = new Date(releaseDate);
        next.setDate(next.getDate() + 14);
        const nextISO = next.toISOString().split('T')[0];
        if (!sj.end_date || nextISO <= sj.end_date) {
          updates.next_release_date = nextISO;
        } else {
          updates.status = 'stopped';
        }
      } else {
        // one_time — mark completed after release
        updates.status = 'completed';
      }

      await base44.asServiceRole.entities.ScheduledJob.update(sj.id, updates);
      released++;
    }

    return Response.json({ success: true, released, stopped });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});