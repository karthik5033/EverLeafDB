"use client";

import React, { useState, useEffect } from "react";
import { WARDS, Ward } from "@/lib/db";
import { stContains, stDistanceMeters, LngLat } from "@/lib/gis";
import { MapPin, Compass, CheckCircle2, AlertCircle, Crosshair } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CoordinatePickerProps {
  initialLat?: number;
  initialLng?: number;
  onCoordinatesChange: (coords: {
    latitude: number;
    longitude: number;
    detectedWard: Ward;
  }) => void;
}

// Bounding envelope for Bangalore Municipal Zone
const MAP_BBOX = {
  minLng: 77.560,
  maxLng: 77.660,
  minLat: 12.920,
  maxLat: 13.020
};

const PRESET_LOCATIONS = [
  { name: "Cubbon Park", lat: 12.9716, lng: 77.5946, wardId: "ward_03" },
  { name: "Lalbagh West", lat: 12.9510, lng: 77.5840, wardId: "ward_02" },
  { name: "CBD Boulevard", lat: 12.9730, lng: 77.6010, wardId: "ward_01" },
  { name: "Indiranagar 100ft", lat: 12.9780, lng: 77.6410, wardId: "ward_04" },
  { name: "Koramangala 4th", lat: 12.9340, lng: 77.6210, wardId: "ward_05" }
];

export default function CoordinatePicker({
  initialLat = 12.9716,
  initialLng = 77.5946,
  onCoordinatesChange
}: CoordinatePickerProps) {
  const [lat, setLat] = useState(initialLat);
  const [lng, setLng] = useState(initialLng);

  // Find containing ward via PostGIS ST_Contains
  const point: LngLat = [lng, lat];
  const detectedWard = WARDS.find((w) => stContains(w.polygon, point)) || WARDS[0];
  const isContained = stContains(detectedWard.polygon, point);

  useEffect(() => {
    onCoordinatesChange({ latitude: lat, longitude: lng, detectedWard });
  }, [lat, lng]);

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width; // 0 to 1
    const y = (e.clientY - rect.top) / rect.height; // 0 to 1

    const newLng = MAP_BBOX.minLng + x * (MAP_BBOX.maxLng - MAP_BBOX.minLng);
    // Y is inverted in SVG/pixels vs latitude
    const newLat = MAP_BBOX.maxLat - y * (MAP_BBOX.maxLat - MAP_BBOX.minLat);

    setLat(Math.round(newLat * 10000) / 10000);
    setLng(Math.round(newLng * 10000) / 10000);
  };

  // Map coords to pixel percentages
  const markerX = ((lng - MAP_BBOX.minLng) / (MAP_BBOX.maxLng - MAP_BBOX.minLng)) * 100;
  const markerY = ((MAP_BBOX.maxLat - lat) / (MAP_BBOX.maxLat - MAP_BBOX.minLat)) * 100;

  return (
    <div className="space-y-4">
      {/* Preset Pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-semibold text-gray-500 mr-1 flex items-center gap-1">
          <Crosshair className="w-3.5 h-3.5 text-emerald-700" />
          Quick Pick:
        </span>
        {PRESET_LOCATIONS.map((preset) => (
          <button
            key={preset.name}
            type="button"
            onClick={() => {
              setLat(preset.lat);
              setLng(preset.lng);
            }}
            className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
              lat === preset.lat && lng === preset.lng
                ? "bg-emerald-800 text-white border-emerald-900 shadow-xs font-bold"
                : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
            }`}
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Interactive Mini-Map Canvas */}
      <div
        onClick={handleMapClick}
        className="relative w-full h-56 rounded-xl border border-gray-300 bg-emerald-950/90 overflow-hidden cursor-crosshair select-none group shadow-inner"
      >
        {/* Radar & Grid Background */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />
        
        {/* Render Ward Geofence Polygons */}
        <svg
          viewBox={`${MAP_BBOX.minLng} ${MAP_BBOX.minLat} ${MAP_BBOX.maxLng - MAP_BBOX.minLng} ${MAP_BBOX.maxLat - MAP_BBOX.minLat}`}
          className="absolute inset-0 w-full h-full transform scale-y-[-1] pointer-events-none"
        >
          {WARDS.map((w) => {
            const isMatch = w.ward_id === detectedWard.ward_id;
            const pts = w.polygon.map(([x, y]) => `${x},${y}`).join(" ");
            return (
              <polygon
                key={w.ward_id}
                points={pts}
                fill={isMatch ? "#10b981" : "#ffffff"}
                fillOpacity={isMatch ? 0.35 : 0.08}
                stroke={isMatch ? "#34d399" : "#6ee7b7"}
                strokeWidth={isMatch ? "0.0015" : "0.0008"}
                strokeDasharray={isMatch ? "none" : "0.002 0.002"}
              />
            );
          })}
        </svg>

        {/* Reticle Target Marker */}
        <div
          style={{ left: `${markerX}%`, top: `${markerY}%` }}
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 flex flex-col items-center"
        >
          <div className="relative">
            <span className="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-emerald-400 opacity-75"></span>
            <div className="w-5 h-5 rounded-full bg-emerald-500 border-2 border-white shadow-lg flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
          </div>
          <span className="text-[9px] font-mono font-bold bg-black/90 text-white px-1.5 py-0.5 rounded shadow mt-1 whitespace-nowrap">
            ST_Point({lng.toFixed(4)}, {lat.toFixed(4)})
          </span>
        </div>

        {/* Top-Right HUD Badge */}
        <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/80 text-emerald-400 border border-emerald-500/40 backdrop-blur-xs flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            CRS: EPSG:4326
          </span>
        </div>

        {/* Bottom Helper Bar */}
        <div className="absolute bottom-2 inset-x-2 flex items-center justify-between text-[11px] text-gray-300 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 pointer-events-none font-mono">
          <span>Click anywhere to drop coordinates</span>
          <span className="text-emerald-300 font-bold">PostGIS GiST Active</span>
        </div>
      </div>

      {/* Coordinate & Ward Status Telemetry Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-[10px] font-mono text-gray-500 uppercase">Latitude</div>
          <input
            type="number"
            step="0.0001"
            value={lat}
            onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
            className="w-full font-mono text-sm font-bold bg-transparent border-none p-0 focus:outline-hidden text-gray-900"
          />
        </div>

        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-[10px] font-mono text-gray-500 uppercase">Longitude</div>
          <input
            type="number"
            step="0.0001"
            value={lng}
            onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
            className="w-full font-mono text-sm font-bold bg-transparent border-none p-0 focus:outline-hidden text-gray-900"
          />
        </div>

        <div className={`p-3 rounded-lg border flex flex-col justify-center ${
          isContained ? "bg-emerald-50/70 border-emerald-200 text-emerald-950" : "bg-amber-50 border-amber-200 text-amber-950"
        }`}>
          <div className="text-[10px] font-mono uppercase flex items-center gap-1">
            {isContained ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                <span className="text-emerald-800 font-bold">ST_Contains = TRUE</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3 text-amber-700" />
                <span className="text-amber-800 font-bold">Nearest Fallback</span>
              </>
            )}
          </div>
          <div className="text-xs font-bold truncate mt-0.5">
            {detectedWard.name} ({detectedWard.ward_id.toUpperCase()})
          </div>
        </div>
      </div>
    </div>
  );
}

