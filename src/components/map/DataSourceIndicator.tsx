"use client";

import { useMemo } from "react";
import { useMap } from "react-leaflet";
import { Marker, Tooltip } from "react-leaflet";
import { Icon } from "leaflet";
import "./DataSourceIndicator.css";

interface DataSourceIndicatorProps {
  data: Array<{
    lat?: number;
    lng?: number;
    pm25?: number;
    no2?: number;
    co?: number;
    o3?: number;
    so2?: number;
    pm10?: number;
    aqi?: number;
    location?: string;
    source?: string;
  }>;
  selectedPollutant?: 'aqi' | 'pm25' | 'no2' | 'co' | 'o3' | 'so2';
}

// Helper function to properly encode UTF-8 strings to base64
const utf8ToBase64 = (str: string): string => {
  // Convert UTF-8 string to bytes
  const utf8Bytes = new TextEncoder().encode(str);
  // Convert bytes to base64
  return btoa(String.fromCharCode(...utf8Bytes));
};

const getSourceIcon = (source?: string) => {
  const sourceConfig = {
    doe: {
      color: '#dc2626', // red-600
      icon: '🏢',
      label: 'DOE',
      size: 32
    },
    waqi: {
      color: '#2563eb', // blue-600
      icon: '🌐',
      label: 'WAQI',
      size: 28
    },
    openaq: {
      color: '#059669', // emerald-600
      icon: '📊',
      label: 'OpenAQ',
      size: 28
    }
  };

  const config = sourceConfig[source as keyof typeof sourceConfig] || {
    color: '#6b7280', // gray-500
    icon: '📍',
    label: 'Unknown',
    size: 24
  };

  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${utf8ToBase64(`
      <svg width="${config.size}" height="${config.size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${config.size/2}" cy="${config.size/2}" r="${config.size/2 - 2}"
                fill="${config.color}" stroke="white" stroke-width="2" opacity="0.9"/>
        <text x="${config.size/2}" y="${config.size/2 + 5}"
              font-family="Arial" font-size="${config.size/2 - 2}"
              font-weight="bold" text-anchor="middle" fill="white">
          ${config.icon}
        </text>
      </svg>
    `)}`,
    iconSize: [config.size, config.size],
    iconAnchor: [config.size/2, config.size/2],
  });
};

const getPollutantValue = (item: any, pollutant: string) => {
  switch (pollutant) {
    case 'aqi': return item.aqi;
    case 'pm25': return item.pm25;
    case 'no2': return item.no2;
    case 'co': return item.co;
    case 'o3': return item.o3;
    case 'so2': return item.so2;
    default: return item.aqi;
  }
};

export default function DataSourceIndicator({ data, selectedPollutant = 'aqi' }: DataSourceIndicatorProps) {
  const map = useMap();

  // Filter and group data points by source and location
  const sourceMarkers = useMemo(() => {
    return data
      .filter(item => item.lat && item.lng && item.source)
      .map((item, index) => {
        const value = getPollutantValue(item, selectedPollutant);
        const icon = getSourceIcon(item.source);

        return {
          id: `${item.source}-${index}-${item.lat}-${item.lng}`,
          position: [item.lat, item.lng] as [number, number],
          source: item.source,
          location: item.location || 'Unknown Location',
          value,
          icon
        };
      });
  }, [data, selectedPollutant]);

  if (sourceMarkers.length === 0) return null;

  return (
    <>
      {sourceMarkers.map((marker) => (
        <Marker
          key={marker.id}
          position={marker.position}
          icon={marker.icon}
          zIndexOffset={1000} // Ensure markers appear above heatmap
        >
          <Tooltip
            permanent={false}
            direction="top"
            offset={[0, -20]}
            className="custom-tooltip"
          >
            <div className="text-sm p-1">
              <div className="font-semibold capitalize">
                {marker.source?.toUpperCase()} Source
              </div>
              <div className="text-xs text-gray-600">
                {marker.location}
              </div>
              {marker.value && (
                <div className="text-xs mt-1">
                  <span className="font-medium">
                    {selectedPollutant.toUpperCase()}:
                  </span> {marker.value.toFixed(1)}
                </div>
              )}
            </div>
          </Tooltip>
        </Marker>
      ))}
    </>
  );
}