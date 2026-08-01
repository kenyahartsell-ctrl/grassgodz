import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { job_id, action } = await req.json();
    if (!job_id || !action) return Response.json({ error: 'job_id and action required' }, { status: 400 });

    // Verify active provider profile
    const profiles = await base44.asServiceRole.entities.ProviderProfile.filter({ user_email: user.email });
    const profile = profiles[0];
    if (!profile || profile.status !== 'active') {
      return Response.json({ error: 'Active provider profile required' }, { status: 403 });
    }

    // Get the job
    const jobs = await base44.asServiceRole.entities.Job.filter({ id: job_id });
    const job = jobs[0];
    if (!job) return Response.json({ error: 'Job not found' }, { status: 404 });

    if (action === 'accept') {
      if (job.provider_id) {
        return Response.json({ error: 'Job already claimed by another provider' }, { status: 409 });
      }

      // Check if we can authorize payment immediately (Lawn jobs / fixed price with card on file)
      let finalStatus = 'scheduled';
      let acceptedAt = new Date().toISOString();
      const jobPrice = job.quoted_price || job.base_price;

      if (!job.is_cash_job && job.payment_method !== 'cash' && jobPrice > 0 && job.customer_email) {
        const customerProfiles = await base44.asServiceRole.entities.CustomerProfile.filter({ user_email: job.customer_email });
        const customerProfile = customerProfiles[0];
        
        if (customerProfile?.stripe_customer_id && customerProfile?.default_payment_method_id && profile.stripe_connect_account_id) {
          try {
            const Stripe = (await import('npm:stripe@16.0.0')).default;
            const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
            
            const amountCents = Math.round(jobPrice * 100);
            const applicationFeeCents = Math.round(amountCents * 0.10);
            const daysUntilJob = job.scheduled_date ? Math.ceil((new Date(job.scheduled_date) - new Date()) / (1000 * 60 * 60 * 24)) : 0;
            const captureMethod = daysUntilJob > 5 ? 'automatic' : 'manual';
            
            const paymentIntentParams = {
              amount: amountCents,
              currency: 'usd',
              capture_method: captureMethod,
              confirm: true,
              off_session: true,
              customer: customerProfile.stripe_customer_id,
              payment_method: customerProfile.default_payment_method_id,
              application_fee_amount: applicationFeeCents,
              transfer_data: { destination: profile.stripe_connect_account_id },
              automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
              metadata: {
                job_id: job.id,
                customer_id: customerProfile.id,
                provider_id: profile.id,
                capture_method: captureMethod,
              },
            };
            
            let paymentIntent;
            try {
              paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);
            } catch (piErr) {
              const isInvalidDest = piErr.param === 'transfer_data[destination]' || piErr.message?.includes('has been deleted');
              if (isInvalidDest) {
                delete paymentIntentParams.transfer_data;
                delete paymentIntentParams.application_fee_amount;
                paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);
              } else {
                throw piErr;
              }
            }
            
            await base44.asServiceRole.entities.Payment.create({
              job_id: job.id,
              customer_id: customerProfile.id,
              provider_id: profile.id,
              stripe_payment_intent_id: paymentIntent.id,
              amount: jobPrice,
              platform_fee: jobPrice * 0.10,
              payout_amount: jobPrice * 0.90,
              status: captureMethod === 'automatic' ? 'captured' : 'authorized',
            });
            
            finalStatus = 'accepted'; // Payment authorized, job fully accepted
          } catch (err) {
            console.error('Failed to auto-authorize payment on accept:', err.message);
            // Fallback to scheduled, customer will need to update card
          }
        }
      }

      await base44.asServiceRole.entities.Job.update(job_id, {
        provider_id: profile.id,
        provider_name: profile.business_name || profile.name,
        provider_email: user.email,
        status: finalStatus,
        quoted_price: jobPrice,
        accepted_at: acceptedAt,
      });

      // For biweekly jobs, lock this provider onto the ScheduledJob so all future releases auto-assign them
      if (job.recurrence === 'biweekly') {
        const providerUpdate = {
          provider_id: profile.id,
          provider_name: profile.business_name || profile.name,
          provider_email: user.email,
        };
        if (job.recurrence_parent_id) {
          await base44.asServiceRole.entities.ScheduledJob.update(job.recurrence_parent_id, providerUpdate);
        } else {
          const matches = await base44.asServiceRole.entities.ScheduledJob.filter({ service_address: job.address, status: 'active' });
          if (matches.length > 0) {
            await base44.asServiceRole.entities.ScheduledJob.update(matches[0].id, providerUpdate);
          }
        }
      }

    } else if (action === 'decline') {
      // Reset job to 'requested' so other providers can claim it.
      // Track this provider in declined_by so they won't see it again.
      const currentDeclined = Array.isArray(job.declined_by) ? job.declined_by : [];
      if (!currentDeclined.includes(profile.id)) {
        currentDeclined.push(profile.id);
      }

      await base44.asServiceRole.entities.Job.update(job_id, {
        status: 'requested',
        provider_id: null,
        provider_name: null,
        provider_email: null,
        declined_by: currentDeclined,
      });

    } else {
      return Response.json({ error: 'Invalid action. Use accept or decline.' }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});