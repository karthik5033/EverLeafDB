"use client";

import React, { useState } from "react";
import { WARDS, Ward } from "@/lib/db";
import {
  Compass,
  MapPin,
  ChevronDown,
  Trees,
  Check,
  Maximize2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface WardSelectorProps {
  selectedWardId?: string;
  onSelectWard?: (ward: Ward) => void;
  className?: string;
}

/**
 * Mini SVG Polygon Boundary Renderer for Ward Geofences
 */
const WardPolygonThumbnail = ({ polygon }: { polygon: [number, number][] }) => {
  if (!polygon || polygon.length < 3) return null;

  // Compute local BBox for SVG viewbox
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const [x, y] of polygon) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  const paddingX = (maxX - minX) * 0.15 || 0.001;
  const paddingY = (maxY - minY) * 0.15 || 0.001;

  const viewBox = `${minX - paddingX} ${minY - paddingY} ${maxX - minX + paddingX * 2} ${maxY - minY + paddingY * 2}`;
  // SVG Y-axis points down, while latitude points up, so invert Y
  const pointsStr = polygon.map(([x, y]) => `${x},${maxY - (y - minY)}`).join(" ");

  return (
    <div className="w-10 h-10 rounded-md bg-emerald-50/70 border border-emerald-200/60 flex items-center justify-center p-1 shrink-0 overflow-hidden">
      <svg
        viewBox={viewBox}
        className="w-full h-full text-emerald-700 overflow-visible"
        fill="currentColor"
        fillOpacity="0.25"
        stroke="currentColor"
        strokeWidth="0.001"
      >
        <polygon points={pointsStr} />
      </svg>
    </div>
  );
};

export default function WardSelector({
  selectedWardId = "ward_03",
  onSelectWard,
  className = ""
}: WardSelectorProps) {
  const [currentId, setCurrentId] = useState(selectedWardId);
  const [isOpen, setIsOpen] = useState(false);

  const selectedWard = WARDS.find((w) => w.ward_id === currentId) || WARDS[0];

  const handleSelect = (ward: Ward) => {
    setCurrentId(ward.ward_id);
    setIsOpen(false);
    if (onSelectWard) onSelectWard(ward);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left bg-white border border-gray-200 hover:border-emerald-300 rounded-xl p-3 shadow-xs flex items-center justify-between gap-3 transition-all focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
      >
        <div className="flex items-center gap-3 min-w-0">
          <WardPolygonThumbnail polygon={selectedWard.polygon} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-gray-950 truncate">
                {selectedWard.name}
              </span>
              <Badge variant="outline" className="text-xs px-1.5 py-0 h-4 font-mono bg-emerald-50 text-emerald-800 border-emerald-200">
                WARD-{String(selectedWard.ward_number).padStart(2, "0")}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
              <span className="flex items-center gap-1">
                <Compass className="w-3 h-3 text-emerald-700" />
                {selectedWard.zone} Zone
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Trees className="w-3 h-3 text-emerald-700" />
                {selectedWard.tree_count.toLocaleString()} trees
              </span>
              <span>•</span>
              <span>{selectedWard.area_sq_km} km²</span>
            </div>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-emerald-800" : ""
          }`}
        />
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1.5 p-2 bg-white/95 backdrop-blur-md border border-gray-200 shadow-xl rounded-xl max-h-80 overflow-y-auto">
          <div className="px-2 py-1 text-xs font-mono uppercase tracking-wider text-gray-400 border-b border-gray-100 mb-1 flex items-center justify-between">
            <span>PostGIS Geofenced Wards (SRID 4326)</span>
            <span>{WARDS.length} Registered</span>
          </div>

          <div className="space-y-1">
            {WARDS.map((ward) => {
              const isSelected = ward.ward_id === currentId;
              return (
                <div
                  key={ward.ward_id}
                  onClick={() => handleSelect(ward)}
                  className={`p-2.5 rounded-lg cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                    isSelected
                      ? "bg-emerald-50/80 border border-emerald-200 text-emerald-950 font-semibold"
                      : "hover:bg-gray-50 text-gray-800"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <WardPolygonThumbnail polygon={ward.polygon} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold truncate">{ward.name}</span>
                        <span className="text-xs font-mono px-1 py-0.5 rounded bg-gray-100 text-gray-600">
                          #{ward.ward_number}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                        <span>{ward.zone} Zone</span>
                        <span>•</span>
                        <span>{ward.area_sq_km} km²</span>
                        <span>•</span>
                        <span className="text-emerald-800 font-medium">{ward.canopy_cover_percent}% Canopy</span>
                      </div>
                    </div>
                  </div>

                  {isSelected && <Check className="w-4 h-4 text-emerald-700 shrink-0" />}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

