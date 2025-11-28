import { NextResponse } from "next/server";

const token =
  process.env.WAQI_TOKEN ||
  process.env.NEXT_PUBLIC_WAQI_TOKEN ||
  "ccecee1eead62e81d67bf17540fe1ebb148346b7";

export async function POST(req: Request) {
  try {
    const { lat, lon } = await req.json();
    if (typeof lat !== "number" || typeof lon !== "number") {
      return NextResponse.json(
        { error: "lat and lon are required numbers" },
        { status: 400 },
      );
    }

    const url = `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${token}`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) {
      return NextResponse.json({ error: "Unable to reach WAQI" }, { status: res.status });
    }

    const data = await res.json();
    if (data?.status !== "ok") {
      return NextResponse.json({ error: "WAQI returned no data" }, { status: 502 });
    }

    const iaqi = data.data?.iaqi ?? {};
    const cityName = data.data?.city?.name ?? "WAQI station";

    return NextResponse.json({
      location: cityName,
      city: cityName,
      country: data.data?.city?.country ?? "",
      pm25: iaqi.pm25?.v ?? null,
      no2: iaqi.no2?.v ?? null,
      co: iaqi.co?.v ?? null,
      unit: "µg/m³",
      lastUpdated: data.data?.time?.iso ?? null,
      source: "waqi",
    });
  } catch (error) {
    console.error("WAQI error", error);
    return NextResponse.json(
      { error: "Unexpected error fetching WAQI data" },
      { status: 500 },
    );
  }
}
