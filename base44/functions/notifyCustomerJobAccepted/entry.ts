import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { data, old_data } = body;

    // Only fire when status changes TO 'accepted' or 'scheduled'
    const acceptedStatuses = ['accepted', 'scheduled'];
    if (!acceptedStatuses.includes(data?.status)) {
      return Response.json({ skipped: true, reason: 'Status not accepted/scheduled' });
    }
    if (old_data && acceptedStatuses.includes(old_data?.status)) {
      return Response.json({ skipped: true, reason: 'Already was accepted' });
    }

    const { customer_email, customer_name, service_name, provider_name, scheduled_date, address, quoted_price } = data;

    if (!customer_email) {
      return Response.json({ error: 'No customer email on job' }, { status: 400 });
    }

    const formattedDate = scheduled_date
      ? new Date(scheduled_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
      : 'TBD';

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: customer_email,
      subject: `Your ${service_name} job has been accepted! ✅`,
      body: `
Hi ${customer_name || 'there'},

Great news! <strong>${provider_name}</strong> has accepted your <strong>${service_name}</strong> request and scheduled your appointment.

<strong>Job Details:</strong>
<ul>
  <li><strong>Service:</strong> ${service_name}</li>
  <li><strong>Provider:</strong> ${provider_name}</li>
  <li><strong>Date:</strong> ${formattedDate}</li>
  <li><strong>Address:</strong> ${address}</li>
  ${quoted_price ? `<li><strong>Quoted Price:</strong> $${quoted_price}</li>` : ''}
</ul>

You're all set! Your provider will arrive on the scheduled date. Payment will only be processed after the job is completed.

Log in to your Grassgodz account to view full job details.

Thanks,<br/>
The Grassgodz Team
      `.trim(),
    });

    return Response.json({ success: true, sent_to: customer_email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});