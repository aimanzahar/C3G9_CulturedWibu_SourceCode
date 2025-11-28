"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat/dist/leaflet-heat.js";

// Fix for default markers
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface Location {
  lat: number;
  lng: number;
}

interface AirQualityData {
  lat?: number;
  lng?: number;
  pm25?: number;
  no2?: number;
  co?: number;
  aqi?: number;
  location: string;
}

interface AirQualityMapProps {
  center: Location;
  userLocation?: Location;
  airQualityData?: AirQualityData[];
  nearbyStations?: any[];
  className?: string;
}

// Dynamic import to avoid SSR issues
const HeatmapLayer = dynamic(
  () => import("./HeatmapLayer"),
  { ssr: false }
);

const MapController = ({ center, zoom }: { center: Location; zoom: number }) => {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  return null;
};

export default function AirQualityMap({
  center,
  userLocation,
  airQualityData = [],
  nearbyStations = [],
  className = "",
}: AirQualityMapProps) {
  const [mapLayer, setMapLayer] = useState("street");
  const [zoom, setZoom] = useState(13);
  const [showHeatmap, setShowHeatmap] = useState(true);

  const tileLayers = {
    street: {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
    satellite: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
    },
    terrain: {
      url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    },
  };

  const getAQIColor = (aqi?: number) => {
    if (!aqi) return "#gray";
    if (aqi <= 50) return "#00e400"; // Good - Green
    if (aqi <= 100) return "#ffff00"; // Moderate - Yellow
    if (aqi <= 150) return "#ff7e00"; // Unhealthy for Sensitive - Orange
    if (aqi <= 200) return "#ff0000"; // Unhealthy - Red
    if (aqi <= 300) return "#8f3f97"; // Very Unhealthy - Purple
    return "#7e0023"; // Hazardous - Maroon
  };

  const createAirQualityIcon = (aqi?: number) => {
    return new Icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(`
        <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="15" fill="${getAQIColor(aqi)}" opacity="0.7" stroke="white" stroke-width="2"/>
          <text x="20" y="25" font-family="Arial" font-size="12" font-weight="bold" text-anchor="middle" fill="white">${aqi || 'N/A'}</text>
        </svg>
      `)}`,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
  };

  return (
    <div className={`relative ${className}`}>
      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-lg p-2 space-y-2">
        {/* Layer Toggle */}
        <div className="flex flex-col gap-1">
          <button
            onClick={() => setMapLayer("street")}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              mapLayer === "street"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            Street
          </button>
          <button
            onClick={() => setMapLayer("satellite")}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              mapLayer === "satellite"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            Satellite
          </button>
          <button
            onClick={() => setMapLayer("terrain")}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              mapLayer === "terrain"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            Terrain
          </button>
        </div>

        {/* Heatmap Toggle */}
        <div className="border-t pt-2">
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={showHeatmap}
              onChange={(e) => setShowHeatmap(e.target.checked)}
              className="rounded"
            />
            Heatmap
          </label>
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-lg p-2 flex flex-col gap-1">
        <button
          onClick={() => setZoom(z => Math.min(z + 1, 18))}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
        >
          +
        </button>
        <button
          onClick={() => setZoom(z => Math.max(z - 1, 1))}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
        >
          −
        </button>
      </div>

      {/* Map */}
      <MapContainer
        center={center}
        zoom={zoom}
        className="w-full h-full"
        zoomControl={false}
      >
        <MapController center={center} zoom={zoom} />

        <TileLayer
          url={tileLayers[mapLayer as keyof typeof tileLayers].url}
          attribution={tileLayers[mapLayer as keyof typeof tileLayers].attribution}
        />

        {/* User Location Marker */}
        {userLocation && (
          <Marker position={userLocation}>
            <Popup>
              <div className="text-sm">
                <strong>Your Location</strong>
                <br />
                Lat: {userLocation.lat.toFixed(4)}
                <br />
                Lng: {userLocation.lng.toFixed(4)}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Air Quality Station Markers */}
        {nearbyStations?.map((station, index) => (
          <Marker
            key={index}
            position={[station.lat, station.lng]}
            icon={createAirQualityIcon(station.aqi)}
          >
            <Popup>
              <div className="text-sm p-2">
                <h3 className="font-bold">{station.name || "Air Quality Station"}</h3>
                <p className="text-gray-600">{station.location || "Unknown Location"}</p>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between">
                    <span>AQI:</span>
                    <span className="font-bold" style={{ color: getAQIColor(station.aqi) }}>
                      {station.aqi || "N/A"}
                    </span>
                  </div>
                  {station.pm25 && (
                    <div className="flex justify-between">
                      <span>PM2.5:</span>
                      <span>{station.pm25} μg/m³</span>
                    </div>
                  )}
                  {station.no2 && (
                    <div className="flex justify-between">
                      <span>NO₂:</span>
                      <span>{station.no2} ppb</span>
                    </div>
                  )}
                  {station.co && (
                    <div className="flex justify-between">
                      <span>CO:</span>
                      <span>{station.co} mg/m³</span>
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Heatmap Layer */}
        {showHeatmap && airQualityData && airQualityData.length > 0 && (
          <HeatmapLayer data={airQualityData} />
        )}
      </MapContainer>
    </div>
  );
}