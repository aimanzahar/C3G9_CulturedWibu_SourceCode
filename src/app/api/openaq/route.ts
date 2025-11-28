import { NextResponse } from "next/server";
import type { 
  AirQualityStation, 
  BoundingBox, 
  RadiusSearchRequest, 
  BoundingBoxSearchRequest,
  SearchResponse 
} from "../../../types/airQuality";

const OPENAQ_BASE_URL = "https://api.openaq.org/v2";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();

function getCachedData(key: string): any | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCachedData(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// Calculate distance between two points in kilometers
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Convert radius to lat/lng bounding box
function getBoundingBox(lat: number, lng: number, radiusKm: number): BoundingBox {
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));
  
  return {
    north: lat + latDelta,
    south: lat - latDelta,
    east: lng + lngDelta,
    west: lng - lngDelta
  };
}

// Search stations by bounding box with pagination
async function searchByBounds(
  bounds: BoundingBox, 
  limit: number = 100,
  page: number = 1,
  parameters: string[] = ["pm25", "no2", "co"]
): Promise<{ stations: AirQualityStation[], total: number, hasMore: boolean }> {
  const cacheKey = `openaq-bounds-${bounds.north}-${bounds.south}-${bounds.east}-${bounds.west}-${limit}-${page}-${parameters.join(",")}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  // Convert bounds to OpenAQ format
  const bbox = [bounds.west, bounds.south, bounds.east, bounds.north].join(",");
  const params = new URLSearchParams({
    bbox,
    limit: limit.toString(),
    page: page.toString(),
    parameter: parameters.join(","),
    order_by: "distance",
    sort: "asc"
  });

  const url = `${OPENAQ_BASE_URL}/latest?${params}`;
  
  try {
    const res = await fetch(url, { 
      next: { revalidate: 300 },
      headers: {
        'X-API-Key': process.env.OPENAQ_API_KEY || ''
      }
    });
    
    if (!res.ok) return { stations: [], total: 0, hasMore: false };
    
    const data = await res.json();
    const stations: AirQualityStation[] = [];
    
    for (const result of data.results || []) {
      const location = result.location;
      const city = result.city;
      const country = result.country;
      const measurements = result.measurements || [];
      
      // Extract measurements by parameter
      const measurementsMap = new Map();
      measurements.forEach((m: any) => {
        measurementsMap.set(m.parameter, {
          value: m.value,
          unit: m.unit,
          lastUpdated: m.lastUpdated
        });
      });
      
      stations.push({
        id: `openaq-${location}-${result.coordinates.latitude}-${result.coordinates.longitude}`,
        name: location || "OpenAQ Station",
        location: location || "Unknown Location",
        city: city || "",
        country: country || "",
        lat: result.coordinates.latitude,
        lng: result.coordinates.longitude,
        pm25: measurementsMap.get("pm25")?.value,
        no2: measurementsMap.get("no2")?.value,
        co: measurementsMap.get("co")?.value,
        lastUpdated: measurementsMap.get("pm25")?.lastUpdated || 
                    measurementsMap.get("no2")?.lastUpdated || 
                    measurementsMap.get("co")?.lastUpdated,
        source: "openaq"
      });
    }
    
    const response = {
      stations,
      total: data.meta?.found || 0,
      hasMore: (data.meta?.page || 1) * (data.meta?.limit || 100) < (data.meta?.found || 0)
    };
    
    setCachedData(cacheKey, response);
    return response;
  } catch (error) {
    console.error("OpenAQ bounds search error:", error);
    return { stations: [], total: 0, hasMore: false };
  }
}

// Search stations within radius
async function searchByRadius(
  lat: number, 
  lng: number, 
  radiusKm: number = 100, 
  limit: number = 100,
  maxPages: number = 5
): Promise<AirQualityStation[]> {
  const bounds = getBoundingBox(lat, lng, radiusKm);
  const allStations: AirQualityStation[] = [];
  
  // Fetch multiple pages if needed
  for (let page = 1; page <= maxPages; page++) {
    const { stations, hasMore } = await searchByBounds(bounds, limit, page);
    allStations.push(...stations);
    
    if (!hasMore || allStations.length >= limit * 2) break;
  }
  
  // Filter by actual distance and limit
  const filteredStations = allStations
    .map(station => ({
      ...station,
      distance: calculateDistance(lat, lng, station.lat, station.lng)
    }))
    .filter(station => station.distance! <= radiusKm)
    .sort((a, b) => (a.distance || 0) - (b.distance || 0))
    .slice(0, limit);
    
  return filteredStations;
}

// Get single station data (backward compatibility)
async function getSingleStation(lat: number, lon: number): Promise<AirQualityStation | null> {
  const params = new URLSearchParams({
    coordinates: `${lat},${lon}`,
    radius: "7000",
    limit: "3",
    parameter: "pm25,no2,co",
  });

  const res = await fetch(`${OPENAQ_BASE_URL}/latest?${params}`, {
    next: { revalidate: 300 },
    headers: {
      'X-API-Key': process.env.OPENAQ_API_KEY || ''
    }
  });
  
  if (!res.ok) return null;
  
  const data = await res.json();
  const primary = data?.results?.[0];
  if (!primary) return null;
  
  type Measurement = {
    parameter: string;
    value: number;
    unit?: string;
    lastUpdated?: string;
  };
  const measurements: Record<string, Measurement> = {};
  (primary?.measurements ?? []).forEach((m: unknown) => {
    const measure = m as Measurement;
    if (measure?.parameter) {
      measurements[measure.parameter] = measure;
    }
  });

  return {
    id: `openaq-${primary.location}-${lat}-${lon}`,
    name: primary?.location ?? "OpenAQ Station",
    location: primary?.location ?? "Unknown Station",
    city: primary?.city ?? "",
    country: primary?.country ?? "",
    lat,
    lng: lon,
    pm25: measurements.pm25?.value,
    no2: measurements.no2?.value,
    co: measurements.co?.value,
    lastUpdated: measurements.pm25?.lastUpdated ??
                 measurements.no2?.lastUpdated ??
                 primary?.lastUpdated,
    source: "openaq"
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { lat, lon, radius, limit, mode, page, maxPages } = body;
    
    if (typeof lat !== "number" || typeof lon !== "number") {
      return NextResponse.json(
        { error: "lat and lon are required numbers" },
        { status: 400 },
      );
    }
    
    // Handle different modes
    if (mode === "radius" || radius) {
      const radiusKm = radius || 100;
      const stationLimit = limit || 100;
      const pages = maxPages || 5;
      const stations = await searchByRadius(lat, lon, radiusKm, stationLimit, pages);
      
      return NextResponse.json({
        success: true,
        data: stations,
        summary: {
          centerLat: lat,
          centerLng: lon,
          radiusKm,
          totalStations: stations.length,
          averageAQI: stations.reduce((acc, s) => acc + (s.aqi || 0), 0) / stations.length || 0,
          highestAQI: Math.max(...stations.map(s => s.aqi || 0)),
          lowestAQI: Math.min(...stations.map(s => s.aqi || Infinity)),
        }
      });
    }
    else if (mode === "bounds" || body.bounds) {
      const bounds: BoundingBox = body.bounds;
      if (!bounds) {
        return NextResponse.json(
          { error: "bounds are required for bounds mode" },
          { status: 400 }
        );
      }
      
      const stationLimit = limit || 100;
      const pageNum = page || 1;
      const { stations, total, hasMore } = await searchByBounds(bounds, stationLimit, pageNum);
      
      return NextResponse.json({
        success: true,
        data: stations,
        pagination: {
          page: pageNum,
          limit: stationLimit,
          total,
          hasMore
        },
        summary: {
          centerLat: (bounds.north + bounds.south) / 2,
          centerLng: (bounds.east + bounds.west) / 2,
          radiusKm: calculateDistance(
            (bounds.north + bounds.south) / 2,
            (bounds.east + bounds.west) / 2,
            bounds.north,
            bounds.east
          ),
          totalStations: total,
          averageAQI: stations.reduce((acc, s) => acc + (s.aqi || 0), 0) / stations.length || 0,
          highestAQI: Math.max(...stations.map(s => s.aqi || 0)),
          lowestAQI: Math.min(...stations.map(s => s.aqi || Infinity)),
        }
      });
    }
    else {
      // Default: single station (backward compatibility)
      const station = await getSingleStation(lat, lon);
      if (!station) {
        return NextResponse.json({ error: "OpenAQ returned no data" }, { status: 502 });
      }
      
      return NextResponse.json({
        location: station.location,
        city: station.city,
        country: station.country,
        pm25: station.pm25,
        no2: station.no2,
        co: station.co,
        unit: station.pm25 ? "µg/m³" : "µg/m³",
        lastUpdated: station.lastUpdated,
        source: "openaq",
      });
    }
  } catch (error) {
    console.error("OpenAQ error", error);
    return NextResponse.json(
      { error: "Unexpected error fetching air data" },
      { status: 500 },
    );
  }
}