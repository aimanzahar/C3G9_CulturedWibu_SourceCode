"use client";

import { useEffect, useMemo } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

interface HeatmapData {
  lat: number;
  lng: number;
  intensity?: number;
}

interface HeatmapLayerProps {
  data: Array<{
    lat?: number;
    lng?: number;
    pm25?: number;
    no2?: number;
    co?: number;
    aqi?: number;
    location?: string;
  }>;
}

export default function HeatmapLayer({ data }: HeatmapLayerProps) {
  const map = useMap();

  // Convert air quality data to heatmap format
  const heatmapData = useMemo(() => {
    return data.map(item => {
      if (!item.lat || !item.lng) return null;

      // Calculate intensity based on pollutant levels
      let intensity = 0;

      // Use AQI if available, otherwise calculate from individual pollutants
      if (item.aqi) {
        intensity = Math.min(item.aqi / 300, 1); // Normalize to 0-1
      } else {
        // Calculate composite intensity from pollutants
        const pm25Intensity = item.pm25 ? Math.min(item.pm25 / 150, 1) : 0; // PM2.5: 0-150 µg/m³
        const no2Intensity = item.no2 ? Math.min(item.no2 / 200, 1) : 0; // NO2: 0-200 ppb
        const coIntensity = item.co ? Math.min(item.co / 10, 1) : 0; // CO: 0-10 mg/m³

        intensity = Math.max(pm25Intensity, no2Intensity, coIntensity);
      }

      return [item.lat, item.lng, intensity];
    }).filter(Boolean) as [number, number, number][];
  }, [data]);

  useEffect(() => {
    if (!map || !heatmapData || heatmapData.length === 0) return;

    // Create heatmap layer
    const heatLayer = (L as any).heatLayer(heatmapData, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      max: 1.0,
      gradient: {
        0.0: '#00ff00', // Green (Good)
        0.2: '#ffff00', // Yellow (Moderate)
        0.4: '#ff7e00', // Orange (Unhealthy for Sensitive)
        0.6: '#ff0000', // Red (Unhealthy)
        0.8: '#8f3f97', // Purple (Very Unhealthy)
        1.0: '#7e0023', // Maroon (Hazardous)
      },
    });

    // Add layer to map
    heatLayer.addTo(map);

    // Cleanup
    return () => {
      if (map.hasLayer(heatLayer)) {
        map.removeLayer(heatLayer);
      }
    };
  }, [map, heatmapData]);

  return null;
}