"use client";

import { useMemo, useState } from "react";
import { Circle, Popup, useMap } from "react-leaflet";
import { type Location } from "../../lib/locationService";

interface HeatmapClickLayerProps {
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
    lastUpdated?: string;
  }>;
  selectedPollutant?: 'aqi' | 'pm25' | 'no2' | 'co' | 'o3' | 'so2';
}

const getAQIColor = (aqi?: number) => {
  if (!aqi) return "#gray";
  if (aqi <= 50) return "#00e400"; // Good - Green
  if (aqi <= 100) return "#ffff00"; // Moderate - Yellow
  if (aqi <= 150) return "#ff7e00"; // Unhealthy for Sensitive - Orange
  if (aqi <= 200) return "#ff0000"; // Unhealthy - Red
  if (aqi <= 300) return "#8f3f97"; // Very Unhealthy - Purple
  return "#7e0023"; // Hazardous - Maroon
};

const getSourceIcon = (source?: string) => {
  const sourceConfig = {
    doe: {
      color: '#dc2626', // red-600
      icon: '��',
      label: 'DOE'
    },
    waqi: {
      color: '#2563eb', // blue-600
      icon: '🌐',
      label: 'WAQI'
    },
    openaq: {
      color: '#059669', // emerald-600
      icon: '📊',
      label: 'OpenAQ'
    }
  };

  const config = sourceConfig[source as keyof typeof sourceConfig] || {
    color: '#6b7280', // gray-500
    icon: '📍',
    label: 'Unknown'
  };

  return config;
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

const getPollutantUnit = (pollutant: string) => {
  switch (pollutant) {
    case 'aqi': return '';
    case 'pm25': return 'μg/m³';
    case 'pm10': return 'μg/m³';
    case 'no2': return 'ppb';
    case 'co': return 'mg/m³';
    case 'o3': return 'ppb';
    case 'so2': return 'ppb';
    default: return '';
  }
};

export default function HeatmapClickLayer({ data, selectedPollutant = 'aqi' }: HeatmapClickLayerProps) {
  const [clickedCircle, setClickedCircle] = useState<string | null>(null);

  // Convert data points to clickable circles
  const clickableCircles = useMemo(() => {
    return data
      .filter(item => item.lat && item.lng)
      .map((item, index) => {
        const value = getPollutantValue(item, selectedPollutant);
        const aqi = item.aqi || 0;
        const sourceInfo = getSourceIcon(item.source);

        // Determine circle color based on AQI
        const fillColor = aqi > 0 ? getAQIColor(aqi) : '#808080';

        // Calculate radius based on zoom level and intensity
        const intensity = Math.min(
          selectedPollutant === 'aqi' ? (aqi || 0) / 300 :
          selectedPollutant === 'pm25' ? (item.pm25 || 0) / 150 :
          selectedPollutant === 'no2' ? (item.no2 || 0) / 200 :
          selectedPollutant === 'co' ? (item.co || 0) / 10 :
          selectedPollutant === 'o3' ? (item.o3 || 0) / 180 :
          selectedPollutant === 'so2' ? (item.so2 || 0) / 100 :
          0, 1);

        const radius = 500 + (intensity * 1000); // 500-1500 meters radius

        return {
          id: `${item.lat}-${item.lng}-${index}`,
          position: [item.lat, item.lng] as [number, number],
          radius,
          fillColor,
          fillOpacity: 0.3,
          color: fillColor,
          opacity: 0.5,
          weight: 1,
          item,
          value,
          sourceInfo
        };
      });
  }, [data, selectedPollutant]);

  return (
    <>
      {clickableCircles.map((circle) => (
        <Circle
          key={circle.id}
          center={circle.position}
          radius={circle.radius}
          pathOptions={{
            fillColor: circle.fillColor,
            fillOpacity: circle.fillOpacity,
            color: circle.color,
            opacity: circle.opacity,
            weight: circle.weight,
            className: 'cursor-pointer hover:opacity-80'
          }}
          eventHandlers={{
            click: () => {
              setClickedCircle(clickedCircle === circle.id ? null : circle.id);
            }
          }}
        >
          {clickedCircle === circle.id && (
            <Popup>
              <div className="text-sm p-2 min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                    style={{ backgroundColor: circle.sourceInfo.color }}
                  >
                    {circle.sourceInfo.icon}
                  </span>
                  <span className="font-semibold capitalize">
                    {circle.sourceInfo.label} Data Source
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="font-medium">{circle.item.location || "Unknown Location"}</div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">AQI:</span>
                    <span
                      className="font-bold text-lg"
                      style={{ color: getAQIColor(circle.item.aqi) }}
                    >
                      {circle.item.aqi || 'N/A'}
                    </span>
                  </div>

                  {circle.value !== undefined && circle.value > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        {selectedPollutant.toUpperCase()}:
                      </span>
                      <span className="font-medium">
                        {circle.value.toFixed(1)} {getPollutantUnit(selectedPollutant)}
                      </span>
                    </div>
                  )}

                  <div className="pt-2 border-t space-y-1 text-xs">
                    {circle.item.pm25 !== undefined && circle.item.pm25 > 0 && (
                      <div className="flex justify-between">
                        <span>PM2.5:</span>
                        <span>{circle.item.pm25.toFixed(1)} µg/m³</span>
                      </div>
                    )}
                    {circle.item.no2 !== undefined && circle.item.no2 > 0 && (
                      <div className="flex justify-between">
                        <span>NO₂:</span>
                        <span>{circle.item.no2.toFixed(1)} ppb</span>
                      </div>
                    )}
                    {circle.item.co !== undefined && circle.item.co > 0 && (
                      <div className="flex justify-between">
                        <span>CO:</span>
                        <span>{circle.item.co.toFixed(1)} mg/m³</span>
                      </div>
                    )}
                    {circle.item.o3 !== undefined && circle.item.o3 > 0 && (
                      <div className="flex justify-between">
                        <span>O₃:</span>
                        <span>{circle.item.o3.toFixed(1)} ppb</span>
                      </div>
                    )}
                    {circle.item.so2 !== undefined && circle.item.so2 > 0 && (
                      <div className="flex justify-between">
                        <span>SO₂:</span>
                        <span>{circle.item.so2.toFixed(1)} ppb</span>
                      </div>
                    )}
                  </div>

                  {circle.item.lastUpdated && (
                    <div className="text-xs text-gray-500 pt-1">
                      Updated: {new Date(circle.item.lastUpdated).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          )}
        </Circle>
      ))}
    </>
  );
}