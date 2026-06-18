import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let user;
    try {
      user = await base44.auth.me();
    } catch (e) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { primary_id, duplicate_ids } = body;

    if (!primary_id || !duplicate_ids || duplicate_ids.length === 0) {
      return Response.json({ error: 'Missing primary_id or duplicate_ids' }, { status: 400 });
    }

    const admin = base44.asServiceRole;

    // Get primary profile
    const primary = await admin.entities.CustomerProfile.get(primary_id);
    if (!primary) {
      return Response.json({ error: 'Primary profile not found' }, { status: 404 });
    }

    const results = {
      jobs_updated: 0,
      invoices_updated: 0,
      payments_updated: 0,
      messages_updated: 0,
      reviews_updated: 0,
      duplicates_deleted: 0
    };

    for (const dupId of duplicate_ids) {
      const dup = await admin.entities.CustomerProfile.get(dupId);
      if (!dup) continue;

      // 1. Jobs
      const jobsByEmail = await admin.entities.Job.filter({ customer_email: dup.user_email });
      const jobsById = await admin.entities.Job.filter({ customer_id: dup.id });
      
      const jobsToUpdate = [...jobsByEmail, ...jobsById].reduce((acc, current) => {
        if (!acc.find(item => item.id === current.id)) {
          acc.push(current);
        }
        return acc;
      }, []);

      for (const job of jobsToUpdate) {
        await admin.entities.Job.update(job.id, {
          customer_id: primary.id,
          customer_email: primary.user_email,
          customer_name: primary.name
        });
        results.jobs_updated++;
      }

      // 2. Invoices
      const invoices = await admin.entities.Invoice.filter({ customer_email: dup.user_email });
      for (const inv of invoices) {
        await admin.entities.Invoice.update(inv.id, {
          customer_email: primary.user_email,
          customer_name: primary.name
        });
        results.invoices_updated++;
      }

      // 3. Payments
      const payments = await admin.entities.Payment.filter({ customer_id: dup.id });
      for (const payment of payments) {
        await admin.entities.Payment.update(payment.id, { customer_id: primary.id });
        results.payments_updated++;
      }

      // 4. Messages (Chat History)
      const messages = await admin.entities.Message.filter({ sender_id: dup.user_email });
      for (const msg of messages) {
        await admin.entities.Message.update(msg.id, { sender_id: primary.user_email });
        results.messages_updated++;
      }

      // 5. Reviews
      const reviews = await admin.entities.Review.filter({ customer_id: dup.id });
      for (const rev of reviews) {
        await admin.entities.Review.update(rev.id, {
          customer_id: primary.id,
          customer_name: primary.name
        });
        results.reviews_updated++;
      }

      // 6. ScheduledJobs
      const scheduledJobs = await admin.entities.ScheduledJob.filter({ client_email: dup.user_email });
      for (const sj of scheduledJobs) {
        await admin.entities.ScheduledJob.update(sj.id, {
          client_email: primary.user_email,
          client_name: primary.name
        });
      }

      // Delete the duplicate customer profile
      await admin.entities.CustomerProfile.delete(dup.id);
      results.duplicates_deleted++;
    }

    return Response.json({ success: true, results });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});