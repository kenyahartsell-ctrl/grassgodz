import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Placeholder for Checkr (FCRA-compliant background check provider)
// To activate: set CHECKR_API_KEY secret and uncomment the Checkr API calls below.
// Checkr docs: https://docs.checkr.com/
// IMPORTANT: Only initiate a check AFTER explicit written consent is on record.

const ADMIN_EMAIL = 'kenyahartsell@gmail.com';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { provider_profile_id } = await req.json();

    const profiles = await base44.asServiceRole.entities.ProviderProfile.filter({ id: provider_profile_id });
    const profile = profiles[0];

    if (!profile) {
      return Response.json({ error: 'Provider not found' }, { status: 404 });
    }

    // FCRA Compliance check: must have explicit consent on record before ordering any check
    if (!profile.consented_background_check || !profile.consent_timestamp) {
      return Response.json({
        error: 'Background check cannot be initiated without recorded written consent from the applicant.',
      }, { status: 400 });
    }

    // ─── Checkr Integration (uncomment when CHECKR_API_KEY is set) ───────────────
    //
    // const CHECKR_API_KEY = Deno.env.get('CHECKR_API_KEY');
    //
    // Step 1: Create candidate
    // const candidateRes = await fetch('https://api.checkr.com/v1/candidates', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Basic ${btoa(CHECKR_API_KEY + ':')}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     first_name: profile.name?.split(' ')[0],
    //     last_name: profile.name?.split(' ').slice(1).join(' '),
    //     email: profile.user_email,
    //     phone: profile.phone,
    //     dob: profile.dob,
    //     driver_license_number: profile.dl_number,
    //     driver_license_state: profile.dl_state,
    //   }),
    // });
    // const candidate = await candidateRes.json();
    //
    // Step 2: Order report (use 'tasker_standard' or custom package)
    // const reportRes = await fetch('https://api.checkr.com/v1/reports', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Basic ${btoa(CHECKR_API_KEY + ':')}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     package: 'tasker_standard',
    //     candidate_id: candidate.id,
    //   }),
    // });
    // const report = await reportRes.json();
    //
    // Save IDs:
    // await base44.asServiceRole.entities.ProviderProfile.update(profile.id, {
    //   checkr_candidate_id: candidate.id,
    //   checkr_report_id: report.id,
    //   background_check_status: 'pending',
    //   status: 'background_check_needed',
    // });
    // ─────────────────────────────────────────────────────────────────────────────

    // Placeholder: just mark as background_check_needed and notify admin
    await base44.asServiceRole.entities.ProviderProfile.update(profile.id, {
      background_check_status: 'pending',
      status: 'background_check_needed',
    });

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: ADMIN_EMAIL,
      subject: `Background Check Initiated — ${profile.name}`,
      body: `
        <p>A background check has been queued for provider <strong>${profile.name}</strong> (${profile.user_email}).</p>
        <p>Consent was recorded at: ${profile.consent_timestamp}</p>
        <p><strong>IMPORTANT (FCRA):</strong> Before taking any adverse action based on this report, you must:</p>
        <ol>
          <li>Send a <em>pre-adverse action notice</em> with a copy of the report and Summary of Rights.</li>
          <li>Wait at least 5 business days for the applicant to respond.</li>
          <li>Send a <em>final adverse action notice</em> if you still decide not to proceed.</li>
        </ol>
        <p>Do not automatically reject based on arrests or convictions without individualized review.</p>
        <p>— Grassgodz Platform</p>
      `,
    });

    // Notify applicant the check has started
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: profile.user_email,
      subject: 'Your background check has started — Grassgodz',
      body: `
        <p>Hi ${profile.name},</p>
        <p>We've initiated your background check as part of the Grassgodz provider review process. This typically takes 1–3 business days.</p>
        <p>You'll receive an email once the review is complete. If you have questions, contact us at <a href="mailto:pros@grassgodz.com">pros@grassgodz.com</a>.</p>
        <p>— The Grassgodz Team</p>
      `,
    });

    return Response.json({ success: true, status: 'background_check_needed' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});