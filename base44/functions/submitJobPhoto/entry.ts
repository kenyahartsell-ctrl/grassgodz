import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { job_id, photos } = body;
    if (!job_id || !photos) return Response.json({ error: 'job_id and photos required' }, { status: 400 });

    // Verify the requesting user is the assigned provider on this job
    const jobs = await base44.asServiceRole.entities.Job.filter({ id: job_id });
    const job = jobs[0];
    if (!job) return Response.json({ error: 'Job not found' }, { status: 404 });

    const isAssignedProvider =
      job.provider_email === user.email ||
      job.provider_id === user.id;

    if (!isAssignedProvider) {
      return Response.json({ error: 'Forbidden: you are not the assigned provider for this job' }, { status: 403 });
    }

    // Merge new photos with any existing ones
    const mergedPhotos = { ...(job.completion_photos || {}), ...photos };

    await base44.asServiceRole.entities.Job.update(job_id, { completion_photos: mergedPhotos });

    return Response.json({ success: true, completion_photos: mergedPhotos });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});