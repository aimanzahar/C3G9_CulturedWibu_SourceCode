/**
 * Hospital and Clinic Finder Service for Malaysia
 * Uses OpenStreetMap Overpass API to find nearby healthcare facilities
 */

export interface HealthcareFacility {
  id: string;
  name: string;
  type: 'hospital' | 'clinic' | 'pharmacy' | 'health_center';
  lat: number;
  lng: number;
  distance: number; // in meters
  address?: string;
  phone?: string;
  website?: string;
  openingHours?: string;
  emergency?: boolean;
  amenity?: string;
}

export interface HealthcareSearchResult {
  facilities: HealthcareFacility[];
  searchRadius: number;
  totalFound: number;
  timestamp: Date;
}

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: {
    name?: string;
    'name:en'?: string;
    'name:ms'?: string;
    amenity?: string;
    healthcare?: string;
    'addr:full'?: string;
    'addr:street'?: string;
    'addr:city'?: string;
    'addr:postcode'?: string;
    phone?: string;
    website?: string;
    opening_hours?: string;
    emergency?: string;
    operator?: string;
  };
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Format distance for display
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

// Build Overpass query for healthcare facilities
function buildOverpassQuery(lat: number, lng: number, radiusMeters: number): string {
  return `
    [out:json][timeout:25];
    (
      // Hospitals
      node["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
      way["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
      relation["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
      
      // Clinics
      node["amenity"="clinic"](around:${radiusMeters},${lat},${lng});
      way["amenity"="clinic"](around:${radiusMeters},${lat},${lng});
      
      // Doctors/Medical centers
      node["amenity"="doctors"](around:${radiusMeters},${lat},${lng});
      way["amenity"="doctors"](around:${radiusMeters},${lat},${lng});
      
      // Healthcare facilities
      node["healthcare"](around:${radiusMeters},${lat},${lng});
      way["healthcare"](around:${radiusMeters},${lat},${lng});
      
      // Pharmacies (optional, useful for medication)
      node["amenity"="pharmacy"](around:${radiusMeters},${lat},${lng});
      way["amenity"="pharmacy"](around:${radiusMeters},${lat},${lng});
    );
    out center;
  `;
}

// Determine facility type
function getFacilityType(tags: OverpassElement['tags']): HealthcareFacility['type'] {
  if (!tags) return 'clinic';
  
  const amenity = tags.amenity?.toLowerCase();
  const healthcare = tags.healthcare?.toLowerCase();
  
  if (amenity === 'hospital' || healthcare === 'hospital') return 'hospital';
  if (amenity === 'pharmacy') return 'pharmacy';
  if (healthcare === 'centre' || healthcare === 'center') return 'health_center';
  
  return 'clinic';
}

// Build address from tags
function buildAddress(tags: OverpassElement['tags']): string | undefined {
  if (!tags) return undefined;
  
  if (tags['addr:full']) return tags['addr:full'];
  
  const parts: string[] = [];
  if (tags['addr:street']) parts.push(tags['addr:street']);
  if (tags['addr:city']) parts.push(tags['addr:city']);
  if (tags['addr:postcode']) parts.push(tags['addr:postcode']);
  
  return parts.length > 0 ? parts.join(', ') : undefined;
}

// Parse Overpass response
function parseOverpassResponse(
  elements: OverpassElement[],
  userLat: number,
  userLng: number
): HealthcareFacility[] {
  const facilities: HealthcareFacility[] = [];
  const seen = new Set<string>(); // Avoid duplicates

  for (const element of elements) {
    // Get coordinates
    const lat = element.lat || element.center?.lat;
    const lon = element.lon || element.center?.lon;
    
    if (!lat || !lon) continue;
    
    const tags = element.tags || {};
    const name = tags.name || tags['name:en'] || tags['name:ms'] || tags.operator || 'Unknown Facility';
    
    // Create unique key
    const key = `${name}-${lat.toFixed(4)}-${lon.toFixed(4)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    
    const distance = calculateDistance(userLat, userLng, lat, lon);
    
    facilities.push({
      id: `osm-${element.type}-${element.id}`,
      name,
      type: getFacilityType(tags),
      lat,
      lng: lon,
      distance,
      address: buildAddress(tags),
      phone: tags.phone,
      website: tags.website,
      openingHours: tags.opening_hours,
      emergency: tags.emergency === 'yes',
      amenity: tags.amenity || tags.healthcare,
    });
  }

  // Sort by distance
  return facilities.sort((a, b) => a.distance - b.distance);
}

// Cache for search results
const searchCache = new Map<string, { result: HealthcareSearchResult; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

/**
 * Search for nearby healthcare facilities
 */
export async function searchNearbyHealthcare(
  lat: number,
  lng: number,
  options: {
    radiusMeters?: number;
    limit?: number;
    types?: HealthcareFacility['type'][];
  } = {}
): Promise<HealthcareSearchResult> {
  const { radiusMeters = 5000, limit = 20, types } = options;
  
  // Check cache
  const cacheKey = `${lat.toFixed(3)}-${lng.toFixed(3)}-${radiusMeters}`;
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    let facilities = cached.result.facilities;
    if (types && types.length > 0) {
      facilities = facilities.filter(f => types.includes(f.type));
    }
    return {
      ...cached.result,
      facilities: facilities.slice(0, limit),
    };
  }

  try {
    const query = buildOverpassQuery(lat, lng, radiusMeters);
    
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`);
    }

    const data = await response.json();
    const elements: OverpassElement[] = data.elements || [];
    
    let facilities = parseOverpassResponse(elements, lat, lng);
    
    // Cache all results
    const result: HealthcareSearchResult = {
      facilities,
      searchRadius: radiusMeters,
      totalFound: facilities.length,
      timestamp: new Date(),
    };
    searchCache.set(cacheKey, { result, timestamp: Date.now() });
    
    // Filter by type if specified
    if (types && types.length > 0) {
      facilities = facilities.filter(f => types.includes(f.type));
    }
    
    return {
      facilities: facilities.slice(0, limit),
      searchRadius: radiusMeters,
      totalFound: result.totalFound,
      timestamp: result.timestamp,
    };
  } catch (error) {
    console.error('Error searching healthcare facilities:', error);
    throw error;
  }
}

/**
 * Get the closest hospital
 */
export async function getClosestHospital(
  lat: number,
  lng: number,
  maxRadius: number = 10000
): Promise<HealthcareFacility | null> {
  const result = await searchNearbyHealthcare(lat, lng, {
    radiusMeters: maxRadius,
    limit: 1,
    types: ['hospital'],
  });
  
  return result.facilities[0] || null;
}

/**
 * Get the closest clinic
 */
export async function getClosestClinic(
  lat: number,
  lng: number,
  maxRadius: number = 5000
): Promise<HealthcareFacility | null> {
  const result = await searchNearbyHealthcare(lat, lng, {
    radiusMeters: maxRadius,
    limit: 1,
    types: ['clinic', 'health_center'],
  });
  
  return result.facilities[0] || null;
}

/**
 * Get emergency facilities (hospitals with emergency services)
 */
export async function getEmergencyFacilities(
  lat: number,
  lng: number,
  maxRadius: number = 15000
): Promise<HealthcareFacility[]> {
  const result = await searchNearbyHealthcare(lat, lng, {
    radiusMeters: maxRadius,
    types: ['hospital'],
  });
  
  // Prioritize those marked as emergency
  return result.facilities.sort((a, b) => {
    if (a.emergency && !b.emergency) return -1;
    if (!a.emergency && b.emergency) return 1;
    return a.distance - b.distance;
  });
}

/**
 * Generate Google Maps directions URL
 */
export function getDirectionsUrl(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${fromLat},${fromLng}&destination=${toLat},${toLng}&travelmode=driving`;
}

/**
 * Generate Waze directions URL
 */
export function getWazeUrl(lat: number, lng: number): string {
  return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
}
