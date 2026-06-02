// Centralized pricing floor constants — used in both frontend and backend

export const YARD_SIZES = [
  { value: 'small',             label: 'Small (up to 2,500 sq ft)' },
  { value: 'medium',            label: 'Medium (2,500–5,000 sq ft)' },
  { value: 'large',             label: 'Large (5,000–10,000 sq ft)' },
  { value: 'xl',                label: 'XL (10,000–20,000 sq ft)' },
  { value: 'commercial_small',  label: 'Commercial Small (20,000–50,000 sq ft)' },
  { value: 'commercial_large',  label: 'Commercial Large (50,000+ sq ft)' },
];

// Minimum price floors keyed by [service_keyword][yard_size]
// service_keyword is matched against service_name (lowercase)
export const PRICE_FLOORS = {
  'lawn mowing':    { small: 45,  medium: 65,  large: 95,  xl: 140, commercial_small: 220, commercial_large: 400 },
  'leaf removal':   { small: 150, medium: 250, large: 375, xl: 500, commercial_small: 700, commercial_large: 1200 },
  'core aeration':  { small: 85,  medium: 120, large: 165, xl: 220, commercial_small: 350, commercial_large: 600 },
  'hedge trimming': { small: 75,  medium: 120, large: 175, xl: 250, commercial_small: 400, commercial_large: 700 },
  'fertilization':  { small: 75,  medium: 100, large: 150, xl: 200, commercial_small: 325, commercial_large: 550 },
  'snow removal':   { small: 60,  medium: 90,  large: 130, xl: 180, commercial_small: 275, commercial_large: 500 },
};

/**
 * Returns the minimum price for a given service name and yard size.
 * Falls back to null if no match found.
 */
export function getMinimumPrice(serviceName, yardSize) {
  if (!serviceName || !yardSize) return null;
  const key = Object.keys(PRICE_FLOORS).find(k =>
    serviceName.toLowerCase().includes(k)
  );
  if (!key) return null;
  return PRICE_FLOORS[key][yardSize] ?? null;
}