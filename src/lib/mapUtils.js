// Helper functions for map-based job finder

// Calculate distance between two coordinates in miles
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Determine marker color based on job properties
export function getMarkerColor(job) {
  if (job.status === 'requested') return '#10b981'; // Green - available
  if (job.status === 'quoted') return '#f59e0b'; // Yellow - pending
  if (job.status === 'accepted' || job.status === 'scheduled') return '#d1d5db'; // Gray - assigned
  if (job.grass_height === 'overgrown' || job.property_size === 'large') return '#ef4444'; // Red - priority
  return '#10b981'; // Default green
}

// Calculate estimated provider payout (75% of quoted price)
export function calculatePayout(quotedPrice) {
  return Math.round(quotedPrice * 0.75);
}

// Filter jobs based on criteria
export function filterJobs(jobs, filters, providerLocation) {
  return jobs.filter(job => {
    // Price range filter
    if (filters.priceMin || filters.priceMax) {
      const payout = calculatePayout(job.quoted_price || job.base_price || 50);
      if (filters.priceMin && payout < filters.priceMin) return false;
      if (filters.priceMax && payout > filters.priceMax) return false;
    }

    // Distance filter
    if (filters.maxDistance && providerLocation) {
      const distance = calculateDistance(
        providerLocation.lat,
        providerLocation.lng,
        job.location_lat || 38.9072,
        job.location_lng || -77.0369
      );
      if (distance > filters.maxDistance) return false;
    }

    // Service type filter
    if (filters.serviceType && job.service_name !== filters.serviceType) return false;

    // Property size filter
    if (filters.propertySize && job.property_size !== filters.propertySize) return false;

    // Grass condition filter
    if (filters.grassHeight && job.grass_height !== filters.grassHeight) return false;

    // Frequency filter
    if (filters.frequency && job.frequency !== filters.frequency) return false;

    // Status filter
    if (filters.status && job.status !== filters.status) return false;

    return true;
  });
}

// Sort jobs by distance
export function sortByDistance(jobs, providerLocation) {
  if (!providerLocation) return jobs;
  return [...jobs].sort((a, b) => {
    const distA = calculateDistance(
      providerLocation.lat,
      providerLocation.lng,
      a.location_lat || 38.9072,
      a.location_lng || -77.0369
    );
    const distB = calculateDistance(
      providerLocation.lat,
      providerLocation.lng,
      b.location_lat || 38.9072,
      b.location_lng || -77.0369
    );
    return distA - distB;
  });
}

// Mock location data for jobs (can be replaced with real coordinates)
export function getJobCoordinates(job, index) {
  // Generate consistent mock coordinates based on zip code
  const baseLatitude = 38.9072; // DC area
  const baseLongitude = -77.0369;
  const offset = (index * 0.015) % 0.5;
  return {
    lat: baseLatitude + (Math.random() - 0.5) * 0.08 + offset,
    lng: baseLongitude + (Math.random() - 0.5) * 0.08 - offset,
  };
}