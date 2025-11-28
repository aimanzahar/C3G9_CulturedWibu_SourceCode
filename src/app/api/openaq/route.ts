import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { lat, lon } = await req.json();
    if (typeof lat !== "number" || typeof lon !== "number") {
      return NextResponse.json(
        { error: "lat and lon are required numbers" },
        { status: 400 },
      );
    }

    const params = new URLSearchParams({
      coordinates: `${lat},${lon}`,
      radius: "7000",
      limit: "3",
      parameter: "pm25,no2,co",
    });

    const res = await fetch(`https://api.openaq.org/v2/latest?${params}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Unable to reach OpenAQ" },
        { status: res.status },
      );
    }

    const data = await res.json();
    const primary = data?.results?.[0];
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

    return NextResponse.json({
      location: primary?.location ?? "Unknown station",
      city: primary?.city ?? "",
      country: primary?.country ?? "",
      pm25: measurements.pm25?.value ?? null,
      no2: measurements.no2?.value ?? null,
      co: measurements.co?.value ?? null,
      unit: measurements.pm25?.unit ?? "µg/m³",
      lastUpdated:
        measurements.pm25?.lastUpdated ??
        measurements.no2?.lastUpdated ??
        primary?.lastUpdated ??
        null,
      source: "openaq",
    });
  } catch (error) {
    console.error("OpenAQ error", error);
    return NextResponse.json(
      { error: "Unexpected error fetching air data" },
      { status: 500 },
    );
  }
}
