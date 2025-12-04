import { NextRequest, NextResponse } from 'next/server';
import {
  searchNearbyHealthcare,
  getClosestHospital,
  getClosestClinic,
  getEmergencyFacilities,
  type HealthcareFacility,
} from '@/lib/healthcareService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lat, lng, type, radius, limit } = body;

    // Validate coordinates
    if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: 'Invalid coordinates. Please provide valid lat and lng values.' },
        { status: 400 }
      );
    }

    // Validate coordinates are within Malaysia bounds (approximately)
    if (lat < 0.8 || lat > 7.5 || lng < 99.5 || lng > 119.5) {
      return NextResponse.json(
        { error: 'Coordinates appear to be outside Malaysia.' },
        { status: 400 }
      );
    }

    const radiusMeters = typeof radius === 'number' ? Math.min(radius, 50000) : 5000;
    const resultLimit = typeof limit === 'number' ? Math.min(limit, 50) : 20;

    let facilities: HealthcareFacility[] = [];
    let message = '';

    switch (type) {
      case 'hospital':
        const hospital = await getClosestHospital(lat, lng, radiusMeters);
        if (hospital) {
          facilities = [hospital];
          message = `Found closest hospital: ${hospital.name}`;
        } else {
          message = 'No hospitals found within the specified radius.';
        }
        break;

      case 'clinic':
        const clinic = await getClosestClinic(lat, lng, radiusMeters);
        if (clinic) {
          facilities = [clinic];
          message = `Found closest clinic: ${clinic.name}`;
        } else {
          message = 'No clinics found within the specified radius.';
        }
        break;

      case 'emergency':
        facilities = await getEmergencyFacilities(lat, lng, radiusMeters);
        message = `Found ${facilities.length} emergency facilities`;
        break;

      default:
        // Search all types
        const result = await searchNearbyHealthcare(lat, lng, {
          radiusMeters,
          limit: resultLimit,
        });
        facilities = result.facilities;
        message = `Found ${result.totalFound} healthcare facilities within ${radiusMeters / 1000}km`;
        break;
    }

    return NextResponse.json({
      success: true,
      message,
      facilities,
      searchLocation: { lat, lng },
      searchRadius: radiusMeters,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Healthcare search error:', error);
    return NextResponse.json(
      {
        error: 'Failed to search for healthcare facilities',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const lat = parseFloat(searchParams.get('lat') || '');
  const lng = parseFloat(searchParams.get('lng') || '');
  const type = searchParams.get('type') || 'all';
  const radius = parseInt(searchParams.get('radius') || '5000');
  const limit = parseInt(searchParams.get('limit') || '20');

  // Create a mock request body and call POST handler logic
  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json(
      { error: 'Please provide valid lat and lng query parameters' },
      { status: 400 }
    );
  }

  // Reuse POST logic by creating internal request
  const mockRequest = new Request(request.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lng, type, radius, limit }),
  });

  return POST(mockRequest as NextRequest);
}
