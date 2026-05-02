import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { job_id } = await req.json();

    if (!job_id) {
      return Response.json({ error: 'job_id is required' }, { status: 400 });
    }

    const jobs = await base44.asServiceRole.entities.Job.filter({ id: job_id });
    const job = jobs[0];
    if (!job) {
      return Response.json({ error: 'Job not found' }, { status: 404 });
    }

    const { provider_email, provider_name, customer_name, service_name, scheduled_date, address, zip_code, quoted_price, customer_notes } = job;

    if (!provider_email) {
      return Response.json({ error: 'No provider email on job' }, { status: 400 });
    }

    const formattedDate = scheduled_date
      ? new Date(scheduled_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
      : 'TBD';

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: provider_email,
      subject: `New job assigned to you: ${service_name} 🌿`,
      body: `
Hi ${provider_name || 'there'},

A new job has been assigned to you by Grassgodz admin. Here are the details:

<strong>Job Details:</strong>
<ul>
  <li><strong>Service:</strong> ${service_name}</li>
  <li><strong>Customer:</strong> ${customer_name}</li>
  <li><strong>Date:</strong> ${formattedDate}</li>
  <li><strong>Address:</strong> ${address || zip_code}</li>
  ${quoted_price ? `<li><strong>Quoted Price:</strong> $${quoted_price}</li>` : ''}
  ${customer_notes ? `<li><strong>Customer Notes:</strong> ${customer_notes}</li>` : ''}
</ul>

Please log in to your Grassgodz provider portal to review and confirm this job.

Thanks,<br/>
The Grassgodz Team
      `.trim(),
    });

    return Response.json({ success: true, sent_to: provider_email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});