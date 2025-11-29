import { NextResponse } from "next/server";
import type { 
  AirQualityStation, 
  BoundingBox, 
  RadiusSearchRequest, 
  BoundingBoxSearchRequest,
  SearchResponse 
} from "../../../types/airQuality";

const token =
  process.env.WAQI_TOKEN ||
  process.env.NEXT_PUBLIC_WAQI_TOKEN ||
  "ccecee1eead62e81d67bf17540fe1ebb148346b7";

const WAQI_BASE_URL = "https://api.waqi.info";
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

// Search stations by bounding box
async function searchByBounds(bounds: BoundingBox, limit: number = 100): Promise<AirQualityStation[]> {
  const cacheKey = `waqi-bounds-${bounds.north}-${bounds.south}-${bounds.east}-${bounds.west}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  // WAQI map boundaries API
  const latlng = `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`;
  const url = `${WAQI_BASE_URL}/map/bounds/?token=${token}&latlng=${latlng}`;
  
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) return [];
  
  const data = await res.json();
  if (data?.status !== "ok") return [];
  
  const stations: AirQualityStation[] = [];
  const stationData = data?.data || [];
  
  for (const station of stationData) {
    if (!station || !station.lat || !station.lon) continue;
    
    const iaqi = station.iaqi ?? {};
    const aqi = station.aqi ?? 0;
    
    stations.push({
      id: `waqi-${station.lat}-${station.lon}`,
      name: station.station?.name || "WAQI Station",
      location: station.station?.name || "Unknown Location",
      city: station.city?.name,
      country: station.country?.name,
      lat: parseFloat(station.lat),
      lng: parseFloat(station.lon),
      aqi: typeof aqi === 'string' && aqi !== '-' ? parseInt(aqi, 10) : aqi,
      pm25: iaqi.pm25?.v,
      no2: iaqi.no2?.v,
      co: iaqi.co?.v,
      o3: iaqi.o3?.v,
      so2: iaqi.so2?.v,
      pm10: iaqi.pm10?.v,
      lastUpdated: station.time?.iso,
      source: "waqi"
    });
    
    if (stations.length >= limit) break;
  }
  
  setCachedData(cacheKey, stations);
  return stations;
}

// Search stations within radius
async function searchByRadius(lat: number, lng: number, radiusKm: number = 100, limit: number = 100): Promise<AirQualityStation[]> {
  const bounds = getBoundingBox(lat, lng, radiusKm);
  const stations = await searchByBounds(bounds, limit * 2); // Get more to filter
  
  // Filter by actual distance
  const filteredStations = stations
    .map(station => ({
      ...station,
      distance: calculateDistance(lat, lng, station.lat, station.lng)
    }))
    .filter(station => station.distance! <= radiusKm)
    .slice(0, limit);
    
  return filteredStations;
}

// Get single station data (backward compatibility)
async function getSingleStation(lat: number, lon: number): Promise<AirQualityStation | null> {
  const url = `${WAQI_BASE_URL}/feed/geo:${lat};${lon}/?token=${token}`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) return null;
  
  const data = await res.json();
  if (data?.status !== "ok") return null;
  
  const iaqi = data.data?.iaqi ?? {};
  const cityName = data.data?.city?.name ?? "WAQI station";
  
  const aqi = data.data?.aqi;
  return {
    id: `waqi-${lat}-${lon}`,
    name: cityName,
    location: cityName,
    city: data.data?.city?.name,
    country: data.data?.city?.country,
    lat,
    lng: lon,
    aqi: typeof aqi === 'string' && aqi !== '-' ? parseInt(aqi, 10) : aqi,
    pm25: iaqi.pm25?.v,
    no2: iaqi.no2?.v,
    co: iaqi.co?.v,
    o3: iaqi.o3?.v,
    so2: iaqi.so2?.v,
    pm10: iaqi.pm10?.v,
    lastUpdated: data.data?.time?.iso,
    source: "waqi"
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { lat, lon, radius, limit, mode } = body;
    
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
      const stations = await searchByRadius(lat, lon, radiusKm, stationLimit);
      
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
      const stations = await searchByBounds(bounds, stationLimit);
      
      return NextResponse.json({
        success: true,
        data: stations,
        summary: {
          centerLat: (bounds.north + bounds.south) / 2,
          centerLng: (bounds.east + bounds.west) / 2,
          radiusKm: calculateDistance(
            (bounds.north + bounds.south) / 2,
            (bounds.east + bounds.west) / 2,
            bounds.north,
            bounds.east
          ),
          totalStations: stations.length,
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
        return NextResponse.json({ error: "WAQI returned no data" }, { status: 502 });
      }
      
      return NextResponse.json({
        location: station.location,
        city: station.city,
        country: station.country,
        pm25: station.pm25,
        no2: station.no2,
        co: station.co,
        unit: "µg/m³",
        lastUpdated: station.lastUpdated,
        source: "waqi",
        aqi: station.aqi
      });
    }
  } catch (error) {
    console.error("WAQI error", error);
    return NextResponse.json(
      { error: "Unexpected error fetching WAQI data" },
      { status: 500 },
    );
  }
}