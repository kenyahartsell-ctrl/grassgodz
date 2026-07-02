import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { job_id } = await req.json();
    if (!job_id) return Response.json({ error: 'job_id required' }, { status: 400 });

    const job = await base44.asServiceRole.entities.Job.get(job_id);
    if (!job) return Response.json({ error: 'Job not found' }, { status: 404 });

    // Check auth — admin or assigned provider
    if (user.role !== 'admin') {
      let isAssignedProvider = job.provider_email === user.email;
      if (!isAssignedProvider) {
        const profiles = await base44.asServiceRole.entities.ProviderProfile.filter({ user_email: user.email });
        const profile = profiles[0];
        isAssignedProvider = profile && job.provider_id === profile.id;
      }
      if (!isAssignedProvider) {
        return Response.json({ error: 'Forbidden: Admin or assigned provider access required' }, { status: 403 });
      }
    }

    // Mark job as completed
    await base44.asServiceRole.entities.Job.update(job_id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
    });

    // Cash jobs: no Stripe processing needed
    if (job.is_cash_job || job.payment_method === 'cash') {
      const existingPayments = await base44.asServiceRole.entities.Payment.filter({ job_id });
      if (existingPayments.length === 0) {
        await base44.asServiceRole.entities.Payment.create({
          job_id: job.id,
          customer_id: job.customer_id,
          provider_id: job.provider_id,
          amount: job.final_price || job.quoted_price || 0,
          platform_fee: 0,
          payout_amount: job.final_price || job.quoted_price || 0,
          stripe_payment_intent_id: '',
          status: 'captured',
          description: 'Cash payment — collected directly by provider',
        });
      }
      return Response.json({ success: true, cash_job: true });
    }

    const price = job.final_price || job.quoted_price;
    if (!price) return Response.json({ error: 'No price on job' }, { status: 400 });

    // For deposit jobs, only charge the remaining balance at completion
    const amountDue = (job.deposit_required && job.deposit_paid && job.remaining_balance)
      ? job.remaining_balance
      : price;

    const platformFee = price * 0.10; // always based on full price
    const providerPayout = price * 0.90;

    // Create Payment record if none exists
    const existingPayments = await base44.asServiceRole.entities.Payment.filter({ job_id });
    if (existingPayments.length === 0) {
      await base44.asServiceRole.entities.Payment.create({
        job_id: job.id,
        customer_id: job.customer_id,
        provider_id: job.provider_id,
        amount: price,
        platform_fee: platformFee,
        payout_amount: providerPayout,
        stripe_payment_intent_id: '',
        status: 'authorized',
      });
    }

    const portalLink = 'https://grassgodz.com/customer';

    const depositNote = (job.deposit_required && job.deposit_paid)
      ? `<p style="background:#f0fdf4;border:1px solid #bbf7d0;padding:10px 14px;border-radius:8px;font-size:14px;color:#166534;">
          ✓ Deposit of $${job.deposit_amount?.toFixed(2)} already paid — remaining balance: $${amountDue.toFixed(2)}.
        </p>`
      : '';

    // Send customer to portal to pay
    if (job.customer_email) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: job.customer_email,
        subject: `Your ${job.service_name || 'Lawn Service'} is Complete — Payment Required`,
        body: `
<p>Hi ${job.customer_name || 'there'},</p>

<p>Your lawn service has been completed! Please log in to your Grassgodz account to complete payment of <strong>$${amountDue.toFixed(2)}</strong>.</p>

${depositNote}

<p><a href="${portalLink}" style="background:#2d6a2d;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">Complete Payment — $${amountDue.toFixed(2)}</a></p>

<p>Thank you for choosing Grassgodz.</p>

<p>The Grassgodz Team</p>
        `.trim(),
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});