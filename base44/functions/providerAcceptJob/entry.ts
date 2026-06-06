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
                                                                    if (job.provider_id && action === 'accept') {
                                                                          return Response.json({ error: 'Job already claimed by another provider' }, { status: 409 });
                                                                              }

                                                                                  if (action === 'accept') {
                                                                                        await base44.asServiceRole.entities.Job.update(job_id, {
                                                                                                provider_id: profile.id,
                                                                                                        provider_name: profile.business_name || profile.name,
                                                                                                                provider_email: user.email,
                                                                                                                        status: 'scheduled',
                                                                                                                                quoted_price: job.quoted_price || job.base_price,
                                                                                                                                        accepted_at: new Date().toISOString(),
                                                                                                                                              });
                                                                                                                                                  } else if (action === 'decline') {
                                                                                                                                                        await base44.asServiceRole.entities.Job.update(job_id, { status: 'cancelled' });
                                                                                                                                                            } else {
                                                                                                                                                                  return Response.json({ error: 'Invalid action. Use accept or decline.' }, { status: 400 });
                                                                                                                                                                      }
                                                                                                                                                                      
                                                                                                                                                                          return Response.json({ success: true });
                                                                                                                                                                            } catch (error) {
                                                                                                                                                                                return Response.json({ error: error.message }, { status: 500 });
                                                                                                                                                                                  }
                                                                                                                                                                                  });
