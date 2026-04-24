import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Property data lookup - uses a free/trial property data API
// Falls back gracefully if API unavailable or returns no data
async function fetchPropertyData(address) {
  try {
    // Option 1: Google Maps API via Geocoding (free tier available)
    // For production, configure your own Google Maps API key via secrets
    // This is a placeholder that can be configured per deployment
    
    // For now, return null to trigger manual selection fallback
    // User can configure this with their preferred property data API:
    // - SmartClient API
    // - Redfin API
    // - OpenStreetMap property data
    // - Local county tax assessor data
    
    return null;
  } catch (error) {
    console.error('Property data lookup failed:', error.message);
    return null;
  }
}

function estimateLotSizeFromAddress(address) {
  // Simple heuristic: estimate based on address patterns
  // In production, this would be replaced with actual API data
  
  // This is purely a fallback estimation for demo purposes
  // Real implementation should use property data API
  if (!address) return null;
  
  const lowerAddr = address.toLowerCase();
  
  // Very basic heuristics (for demo only - not accurate)
  if (lowerAddr.includes('apartment') || lowerAddr.includes('apt') || lowerAddr.includes('unit')) {
    return 2000; // Typical small condo/apartment
  }
  if (lowerAddr.includes('estate') || lowerAddr.includes('manor') || lowerAddr.includes('farm')) {
    return 25000; // Likely larger property
  }
  
  // Default: assume standard suburban lot
  return 6500;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { address } = await req.json();

    if (!address || typeof address !== 'string' || address.trim().length === 0) {
      return Response.json({ error: 'Address required' }, { status: 400 });
    }

    const cleanAddress = address.trim();

    // Try to fetch real property data from API
    const apiData = await fetchPropertyData(cleanAddress);

    let lotSize = null;
    let source = 'manual'; // 'api' or 'manual'

    if (apiData && apiData.lotSize) {
      lotSize = apiData.lotSize;
      source = 'api';
    } else {
      // Fallback: use heuristic estimation
      lotSize = estimateLotSizeFromAddress(cleanAddress);
      source = 'estimate';
    }

    // Determine property size tier
    let propertySize = 'Standard'; // default
    if (lotSize <= 3000) {
      propertySize = 'Rowhome';
    } else if (lotSize <= 5000) {
      propertySize = 'Small';
    } else if (lotSize <= 8000) {
      propertySize = 'Standard';
    } else if (lotSize <= 12000) {
      propertySize = 'Large';
    } else if (lotSize <= 20000) {
      propertySize = 'XL';
    } else {
      propertySize = 'Estate';
    }

    return Response.json({
      success: true,
      address: cleanAddress,
      lotSize,
      propertySize,
      source,
      confidence: source === 'api' ? 'high' : source === 'estimate' ? 'low' : 'none',
    });
  } catch (error) {
    console.error('Error in getPropertySize:', error.message);
    // Always return success=false with graceful fallback
    // Client will show manual selection UI
    return Response.json({
      success: false,
      error: 'Could not retrieve property data',
      lotSize: null,
      propertySize: null,
      source: 'none',
    });
  }
});