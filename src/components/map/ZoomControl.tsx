"use client";

import { useState } from "react";
import { PlusIcon, MinusIcon } from "@heroicons/react/24/outline";
import { getRadiusFromZoom, getZoomFromRadius, formatRadius } from "../../lib/radiusUtils";

interface ZoomControlProps {
  currentZoom: number;
  onZoomChange: (zoom: number) => void;
  onRadiusChange?: (radius: number) => void;
  className?: string;
  showRadius?: boolean;
  disabled?: boolean;
}

// Preset zoom levels for common radii
const ZOOM_PRESETS = [
  { zoom: 6, radius: 500, label: "500km" },
  { zoom: 8, radius: 100, label: "100km" },
  { zoom: 10, radius: 50, label: "50km" },
  { zoom: 11, radius: 25, label: "25km" },
  { zoom: 12, radius: 10, label: "10km" },
];

export default function ZoomControl({
  currentZoom,
  onZoomChange,
  onRadiusChange,
  className = "",
  showRadius = true,
  disabled = false,
}: ZoomControlProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleZoomIn = () => {
    if (disabled || currentZoom >= 18) return;
    
    setIsAnimating(true);
    const newZoom = Math.min(currentZoom + 1, 18);
    onZoomChange(newZoom);
    
    if (onRadiusChange) {
      onRadiusChange(getRadiusFromZoom(newZoom));
    }
    
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleZoomOut = () => {
    if (disabled || currentZoom <= 1) return;
    
    setIsAnimating(true);
    const newZoom = Math.max(currentZoom - 1, 1);
    onZoomChange(newZoom);
    
    if (onRadiusChange) {
      onRadiusChange(getRadiusFromZoom(newZoom));
    }
    
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handlePresetClick = (presetZoom: number, presetRadius: number) => {
    if (disabled) return;
    
    setIsAnimating(true);
    onZoomChange(presetZoom);
    
    if (onRadiusChange) {
      onRadiusChange(presetRadius);
    }
    
    setTimeout(() => setIsAnimating(false), 300);
  };

  const currentRadius = getRadiusFromZoom(currentZoom);
  const coverageMeters = currentRadius * 1000;

  return (
    <div className={`bg-white rounded-lg shadow-lg p-3 space-y-3 relative ${className} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Zoom Level Display */}
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900">{currentZoom}</div>
        <div className="text-xs text-gray-500">Zoom Level</div>
      </div>

      {/* Radius Coverage Display */}
      {showRadius && (
        <div className="text-center border-t pt-3">
          <div className="text-lg font-semibold text-blue-600">
            {formatRadius(currentRadius)}
          </div>
          <div className="text-xs text-gray-500">Coverage Radius</div>
          <div className="text-xs text-gray-400 mt-1">
            ≈ {(coverageMeters / 1000).toFixed(1)}km diameter
          </div>
        </div>
      )}

      {/* Zoom Buttons */}
      <div className="flex flex-col gap-1">
        <button
          onClick={handleZoomIn}
          disabled={disabled || currentZoom >= 18}
          className="p-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
          title="Zoom in (+)"
        >
          <PlusIcon className="h-5 w-5" />
        </button>
        <button
          onClick={handleZoomOut}
          disabled={disabled || currentZoom <= 1}
          className="p-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
          title="Zoom out (-)"
        >
          <MinusIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Preset Buttons */}
      <div className="space-y-1">
        <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Quick Presets</div>
        <div className="grid grid-cols-2 gap-1">
          {ZOOM_PRESETS.slice(0, 4).map((preset) => (
            <button
              key={preset.zoom}
              onClick={() => handlePresetClick(preset.zoom, preset.radius)}
              className={`px-2 py-1 text-xs rounded transition-all duration-200 hover:scale-105 active:scale-95 ${
                Math.abs(currentZoom - preset.zoom) < 0.5
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
              title={`Set zoom to ${preset.zoom} (${preset.radius}km radius)`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Animation Overlay */}
      {isAnimating && (
        <div className="absolute inset-0 bg-white bg-opacity-50 rounded-lg pointer-events-none flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
}
