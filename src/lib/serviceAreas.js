// Service area polygons for DC, Maryland, and Virginia
// These define the coverage zones for GrassGodz

export const SERVICE_AREAS = [
  {
    name: 'Washington DC',
    color: '#16A34A',
    coordinates: [
      [-77.1197, 38.9072], // NW
      [-76.9093, 38.9072], // NE
      [-76.9093, 38.7919], // SE
      [-77.1197, 38.7919], // SW
      [-77.1197, 38.9072], // Close polygon
    ],
  },
  {
    name: 'Northern Virginia',
    color: '#15803D',
    coordinates: [
      [-77.6, 38.9],
      [-77.0, 38.9],
      [-77.0, 38.5],
      [-77.6, 38.5],
      [-77.6, 38.9],
    ],
  },
  {
    name: 'Maryland',
    color: '#166534',
    coordinates: [
      [-77.5, 39.5],
      [-75.8, 39.5],
      [-75.8, 37.8],
      [-77.5, 37.8],
      [-77.5, 39.5],
    ],
  },
];

// Check if a point (lat, lng) is inside any service area
export function isInServiceArea(lat, lng) {
  return SERVICE_AREAS.some(area => isPointInPolygon(lat, lng, area.coordinates));
}

// Point-in-polygon algorithm (ray casting)
function isPointInPolygon(lat, lng, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    const intersect = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}