/**
 * Utility functions for calculating map coverage radius based on zoom levels.
 * These calculations are based on Web Mercator projection approximations.
 */

// Earth radius in meters
const EARTH_RADIUS = 6378137;

// Meters per pixel at zoom level 0 (equator)
const METERS_PER_PIXEL_ZOOM_0 = EARTH_RADIUS * 2 * Math.PI / 256;

// Standard tile size in pixels
const TILE_SIZE = 256;

// Approximate coverage radius for different zoom levels
const ZOOM_RADIUS_MAP: Record<number, number> = {
  1: 2500,  // ~2500km
  2: 1500,  // ~1500km
  3: 800,   // ~800km
  4: 500,   // ~500km
  5: 300,   // ~300km
  6: 200,   // ~200km
  7: 150,   // ~150km
  8: 100,   // ~100km
  9: 70,    // ~70km
  10: 50,   // ~50km
  11: 30,   // ~30km
  12: 15,   // ~15km
  13: 10,   // ~10km
  14: 6,    // ~6km
  15: 3,    // ~3km
  16: 1.5,  // ~1.5km
  17: 0.8,  // ~800m
  18: 0.4,  // ~400m
};

/**
 * Calculate the approximate coverage radius in kilometers based on zoom level.
 * This is an approximation based on the typical viewport size at standard resolutions.
 * 
 * @param zoom - The map zoom level (1-18)
 * @returns Approximate coverage radius in kilometers
 */
export function getRadiusFromZoom(zoom: number): number {
  // Clamp zoom to valid range
  const clampedZoom = Math.max(1, Math.min(18, Math.round(zoom)));
  
  // Return exact value if we have a mapping
  if (ZOOM_RADIUS_MAP[clampedZoom]) {
    return ZOOM_RADIUS_MAP[clampedZoom];
  }
  
  // Interpolate between known values
  const lowerZoom = Math.floor(zoom);
  const upperZoom = Math.ceil(zoom);
  const lowerRadius = ZOOM_RADIUS_MAP[lowerZoom] || ZOOM_RADIUS_MAP[1];
  const upperRadius = ZOOM_RADIUS_MAP[upperZoom] || ZOOM_RADIUS_MAP[18];
  
  // Linear interpolation
  const fraction = zoom - lowerZoom;
  return lowerRadius + (upperRadius - lowerRadius) * fraction;
}

/**
 * Calculate the approximate zoom level needed for a given coverage radius.
 * 
 * @param radiusKm - Desired coverage radius in kilometers
 * @returns Approximate zoom level (1-18)
 */
export function getZoomFromRadius(radiusKm: number): number {
  // Find the zoom level that gives us the closest radius
  let bestZoom = 10; // Default to zoom 10
  let minDiff = Infinity;
  
  for (const [zoom, radius] of Object.entries(ZOOM_RADIUS_MAP)) {
    const diff = Math.abs(radius - radiusKm);
    if (diff < minDiff) {
      minDiff = diff;
      bestZoom = parseInt(zoom);
    }
  }
  
  return bestZoom;
}

/**
 * Calculate the actual coverage in meters at a specific latitude and zoom level.
 * This provides a more accurate calculation based on the Web Mercator projection.
 * 
 * @param zoom - The map zoom level
 * @param lat - Latitude in degrees (optional, defaults to equator)
 * @param viewportWidth - Viewport width in pixels (optional, defaults to 1024)
 * @returns Coverage radius in meters
 */
export function getCoverageRadius(
  zoom: number,
  lat: number = 0,
  viewportWidth: number = 1024
): number {
  // Calculate meters per pixel at the given zoom and latitude
  const metersPerPixel = (METERS_PER_PIXEL_ZOOM_0 * Math.cos(lat * Math.PI / 180)) / Math.pow(2, zoom);
  
  // Calculate viewport width in meters
  const viewportWidthMeters = viewportWidth * metersPerPixel;
  
  // Return radius (half of viewport width)
  return viewportWidthMeters / 2;
}

/**
 * Convert meters to kilometers with appropriate precision.
 * 
 * @param meters - Distance in meters
 * @returns Distance in kilometers
 */
export function metersToKilometers(meters: number): number {
  return meters / 1000;
}

/**
 * Convert kilometers to meters.
 * 
 * @param km - Distance in kilometers
 * @returns Distance in meters
 */
export function kilometersToMeters(km: number): number {
  return km * 1000;
}

/**
 * Format radius for display.
 * 
 * @param radiusKm - Radius in kilometers
 * @returns Formatted radius string
 */
export function formatRadius(radiusKm: number): string {
  if (radiusKm >= 1000) {
    return `${(radiusKm / 1000).toFixed(1)}k km`;
  }
  if (radiusKm >= 1) {
    return `${radiusKm.toFixed(1)} km`;
  }
  return `${Math.round(radiusKm * 1000)} m`;
}

/**
 * Calculate the bounding box for a given center point and radius.
 * 
 * @param lat - Center latitude
 * @param lng - Center longitude
 * @param radiusKm - Radius in kilometers
 * @returns Bounding box coordinates
 */
export function getBoundingBoxFromRadius(
  lat: number,
  lng: number,
  radiusKm: number
): {
  north: number;
  south: number;
  east: number;
  west: number;
} {
  const latDelta = radiusKm / 111; // Approximate km per degree latitude
  const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180)); // Account for longitude compression
  
  return {
    north: lat + latDelta,
    south: lat - latDelta,
    east: lng + lngDelta,
    west: lng - lngDelta,
  };
}

/**
 * Calculate the optimal zoom level to display a given bounding box.
 * 
 * @param bounds - The bounding box to display
 * @param viewportWidth - Viewport width in pixels
 * @param viewportHeight - Viewport height in pixels
 * @returns Optimal zoom level
 */
export function getZoomForBoundingBox(
  bounds: { north: number; south: number; east: number; west: number },
  viewportWidth: number = 1024,
  viewportHeight: number = 768
): number {
  const latDiff = bounds.north - bounds.south;
  const lngDiff = bounds.east - bounds.west;
  
  // Calculate zoom for latitude
  const latZoom = Math.log2((viewportHeight * 360) / (latDiff * TILE_SIZE));
  
  // Calculate zoom for longitude (accounting for latitude)
  const centerLat = (bounds.north + bounds.south) / 2;
  const lngZoom = Math.log2((viewportWidth * 360) / (lngDiff * TILE_SIZE * Math.cos(centerLat * Math.PI / 180)));
  
  // Return the smaller zoom to ensure the entire bounds fit
  return Math.min(latZoom, lngZoom);
}

/**
 * Preset configurations for common use cases.
 */
export const ZOOM_PRESETS = {
  // City-wide view
  CITY: { zoom: 12, radius: 15, label: "City (15km)" },
  
  // Metropolitan area
  METRO: { zoom: 10, radius: 50, label: "Metro (50km)" },
  
  // Region view
  REGION: { zoom: 8, radius: 100, label: "Region (100km)" },
  
  // Country view
  COUNTRY: { zoom: 6, radius: 200, label: "Country (200km)" },
  
  // Continental view
  CONTINENT: { zoom: 4, radius: 500, label: "Continent (500km)" },
  
  // Global view
  GLOBAL: { zoom: 2, radius: 1500, label: "Global (1500km)" },
} as const;

/**
 * Get all available preset configurations.
 * 
 * @returns Array of preset configurations
 */
export function getAllZoomPresets() {
  return Object.values(ZOOM_PRESETS);
}

/**
 * Find the best preset for a given zoom level.
 * 
 * @param zoom - The current zoom level
 * @returns The closest preset configuration
 */
export function getBestPresetForZoom(zoom: number) {
  const presets = getAllZoomPresets();
  let best = presets[0];
  let minDiff = Math.abs(best.zoom - zoom);
  
  for (const preset of presets) {
    const diff = Math.abs(preset.zoom - zoom);
    if (diff < minDiff) {
      minDiff = diff;
      best = preset;
    }
  }
  
  return best;
}
