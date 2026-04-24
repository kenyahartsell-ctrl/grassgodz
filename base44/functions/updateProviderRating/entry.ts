import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { data } = body;
    const providerId = data?.provider_id;

    if (!providerId) {
      return Response.json({ skipped: true, reason: 'No provider_id in review' });
    }

    // Fetch all reviews for this provider
    const reviews = await base44.asServiceRole.entities.Review.filter({ provider_id: providerId });

    if (reviews.length === 0) {
      return Response.json({ skipped: true, reason: 'No reviews found' });
    }

    const avgRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length;
    const roundedAvg = Math.round(avgRating * 10) / 10;

    await base44.asServiceRole.entities.ProviderProfile.update(providerId, {
      avg_rating: roundedAvg,
    });

    return Response.json({ success: true, avg_rating: roundedAvg, review_count: reviews.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});