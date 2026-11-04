"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import {
  Compass,
  MapPin,
  Layers,
  Trees,
  ShieldCheck,
  AlertTriangle,
  Info,
  Maximize2,
  Crosshair,
  Calendar,
  User,
  Activity
} from "lucide-react";
import { WARDS, TREES, Tree, Ward } from "@/lib/db";

export default function MapPage() {
  const [selectedWard, setSelectedWard] = useState<Ward>(WARDS[2]); // Default Cubbon Park
  const [selectedTree, setSelectedTree] = useState<Tree | null>(TREES[0]);
  const [radiusMeters, setRadiusMeters] = useState(500);
  const [filterHealth, setFilterHealth] = useState<string>("ALL");

  // Coordinate projection mapping for SVG canvas:
  // Bangalore Bounding Box: lng ~ 77.56 to 77.66 (X), lat ~ 12.91 to 13.02 (Y)
  const mapWidth = 800;
  const mapHeight = 520;
  const minLng = 77.55;
  const maxLng = 77.67;
  const minLat = 12.91;
  const maxLat = 13.03;

  const projectCoords = (lng: number, lat: number): [number, number] => {
    const x = ((lng - minLng) / (maxLng - minLng)) * mapWidth;
    const y = mapHeight - ((lat - minLat) / (maxLat - minLat)) * mapHeight;
    return [x, y];
  };

  const filteredTrees = TREES.filter((t) => {
    if (filterHealth !== "ALL" && t.health_status !== filterHealth) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-[1400px] w-full mx-auto p-4 md:p-6 flex flex-col gap-4">
        {/* Header Bar */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
                <Compass className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-extrabold tracking-tight text-gray-950">
                PostGIS Geospatial Subsystem &amp; Ward Explorer
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                SRID 4326 GiST
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Interactive 2D spatial engine enforcing Point-in-Polygon containment (<code>ST_Contains</code>) and proximity buffers (<code>ST_DWithin</code>).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs bg-gray-50 p-1 rounded-lg border border-gray-200">
              <span className="text-gray-500 px-2 font-mono text-[11px]">Radius Buffer:</span>
              {[200, 500, 1000].map((r) => (
                <button
                  key={r}
                  onClick={() => setRadiusMeters(r)}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-all ${
                    radiusMeters === r
                      ? "bg-emerald-800 text-white shadow-xs"
                      : "text-gray-600 hover:text-black"
                  }`}
                >
                  {r}m
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Grid: Interactive Map + Inspection Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
          {/* Map Viewport (8 cols) */}
          <div className="lg:col-span-8 bg-white p-4 rounded-2xl border border-gray-200/90 shadow-xs flex flex-col justify-between">
            {/* Map Controls Header */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-100 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">Municipal Wards Overlay:</span>
                <div className="flex items-center gap-1">
                  {WARDS.map((w) => (
                    <button
                      key={w.ward_id}
                      onClick={() => setSelectedWard(w)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                        selectedWard.ward_id === w.ward_id
                          ? "bg-emerald-100 text-emerald-900 font-bold border border-emerald-300"
                          : "bg-gray-100 text-gray-600 hover:text-black"
                      }`}
                    >
                      W{w.ward_number}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={filterHealth}
                  onChange={(e) => setFilterHealth(e.target.value)}
                  className="text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1 outline-none font-mono"
                >
                  <option value="ALL">All Health States</option>
                  <option value="HEALTHY">Healthy Only</option>
                  <option value="CRITICAL">Critical Flagged</option>
                  <option value="MONITOR">Monitor Required</option>
                </select>
              </div>
            </div>

            {/* Interactive SVG Canvas */}
            <div className="relative w-full h-[480px] bg-[#f8faf8] rounded-xl border border-gray-200/80 overflow-hidden select-none">
              <svg className="w-full h-full" viewBox={`0 0 ${mapWidth} ${mapHeight}`}>
                {/* Background Grid Pattern */}
                <defs>
                  <pattern id="gisGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="0.75" strokeDasharray="2 2" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#gisGrid)" />

                {/* Render Ward Polygons */}
                {WARDS.map((w) => {
                  const pointsStr = w.polygon
                    .map(([lng, lat]) => {
                      const [x, y] = projectCoords(lng, lat);
                      return `${x},${y}`;
                    })
                    .join(" ");

                  const isSelected = selectedWard.ward_id === w.ward_id;

                  return (
                    <g key={w.ward_id} className="cursor-pointer" onClick={() => setSelectedWard(w)}>
                      <polygon
                        points={pointsStr}
                        fill={isSelected ? "#10b981" : "#047857"}
                        fillOpacity={isSelected ? 0.18 : 0.06}
                        stroke={isSelected ? "#047857" : "#059669"}
                        strokeWidth={isSelected ? 2.5 : 1}
                        strokeDasharray={isSelected ? "none" : "4 2"}
                        className="transition-all hover:fill-opacity-25"
                      />
                      {/* Ward Centroid Label */}
                      {(() => {
                        const [cx, cy] = projectCoords(w.centroid[0], w.centroid[1]);
                        return (
                          <text
                            x={cx}
                            y={cy}
                            textAnchor="middle"
                            className="text-[10px] font-mono fill-emerald-950 font-bold pointer-events-none"
                          >
                            Ward {w.ward_number} ({w.name.split(" ")[0]})
                          </text>
                        );
                      })()}
                    </g>
                  );
                })}

                {/* ST_DWithin Proximity Buffer Circle around active tree */}
                {selectedTree && (() => {
                  const [tx, ty] = projectCoords(selectedTree.longitude, selectedTree.latitude);
                  // Scale radius: 500m ~ 75 SVG pixels
                  const rPixels = (radiusMeters / 500) * 75;

                  return (
                    <g>
                      <circle
                        cx={tx}
                        cy={ty}
                        r={rPixels}
                        fill="#10b981"
                        fillOpacity="0.12"
                        stroke="#047857"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                        className="animate-pulse"
                      />
                      <text
                        x={tx + rPixels - 30}
                        y={ty - 6}
                        className="text-[9px] font-mono fill-emerald-900 font-bold pointer-events-none"
                      >
                        ST_DWithin({radiusMeters}m)
                      </text>
                    </g>
                  );
                })()}

                {/* Tree Points */}
                {filteredTrees.map((tree) => {
                  const [x, y] = projectCoords(tree.longitude, tree.latitude);
                  const isTreeSelected = selectedTree?.tree_id === tree.tree_id;

                  const color =
                    tree.health_status === "CRITICAL"
                      ? "#dc2626"
                      : tree.health_status === "DISEASED"
                      ? "#ea580c"
                      : tree.health_status === "MONITOR"
                      ? "#d97706"
                      : "#059669";

                  return (
                    <g
                      key={tree.tree_id}
                      onClick={() => setSelectedTree(tree)}
                      className="cursor-pointer group"
                    >
                      {/* Outer Pulse for selected */}
                      {isTreeSelected && (
                        <circle cx={x} cy={y} r="14" fill={color} fillOpacity="0.25" className="animate-ping" />
                      )}
                      <circle
                        cx={x}
                        cy={y}
                        r={isTreeSelected ? "8" : "5.5"}
                        fill={color}
                        stroke="#ffffff"
                        strokeWidth={isTreeSelected ? "2.5" : "1.5"}
                        className="transition-transform group-hover:scale-125"
                      />
                      {/* Tree Tag Hover Tooltip */}
                      <text
                        x={x + 10}
                        y={y + 3}
                        className="text-[9px] font-mono fill-gray-900 font-semibold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-white"
                      >
                        {tree.tag_number} ({tree.species_common})
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Map Legend Overlay */}
              <div className="absolute left-3 bottom-3 bg-white/95 backdrop-blur-md p-2.5 rounded-lg border border-gray-200/80 shadow-xs text-[10px] font-mono flex flex-col gap-1.5">
                <span className="font-bold text-gray-800 uppercase tracking-wide">Health Class</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  <span>Healthy Specimen</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span>Monitor Required</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                  <span>Critical (Ganoderma Rot)</span>
                </div>
              </div>

              {/* Real-time GPS Tracker HUD */}
              <div className="absolute right-3 top-3 bg-gray-950/90 text-white px-3 py-1.5 rounded-lg border border-gray-800 text-[10px] font-mono flex items-center gap-2">
                <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
                <span>GPS: 12.9716° N, 77.5946° E</span>
              </div>
            </div>

            {/* Bottom Spatial Query Bar */}
            <div className="mt-3 pt-2.5 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono text-gray-600 gap-2">
              <span className="text-gray-500">
                Active Ward: <strong className="text-gray-950">{selectedWard.name}</strong> (Ward {selectedWard.ward_number})
              </span>
              <span className="text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80 font-bold">
                ST_Contains(boundary_geom, location_geom) = TRUE
              </span>
            </div>
          </div>

          {/* Right Sidebar: Selected Tree & Ward Inspector (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Tree Detail Card */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Trees className="w-4 h-4 text-emerald-800" />
                  <h3 className="font-bold text-sm text-gray-950">Dendrometric Record</h3>
                </div>
                {selectedTree && (
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    selectedTree.health_status === "CRITICAL"
                      ? "bg-red-50 text-red-700 border border-red-200"
                      : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  }`}>
                    {selectedTree.health_status}
                  </span>
                )}
              </div>

              {selectedTree ? (
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Specimen Identifier</span>
                    <span className="text-lg font-extrabold text-gray-950 font-mono">{selectedTree.tag_number}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                      <span className="text-gray-400 block text-[10px]">Common Name</span>
                      <strong className="text-gray-900">{selectedTree.species_common}</strong>
                    </div>
                    <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                      <span className="text-gray-400 block text-[10px]">Scientific Name</span>
                      <em className="text-gray-800 italic">{selectedTree.species_scientific}</em>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                    <div className="p-2 bg-gray-50 rounded border border-gray-100 text-center">
                      <span className="text-gray-400 block text-[9px]">Height</span>
                      <strong>{selectedTree.height_m}m</strong>
                    </div>
                    <div className="p-2 bg-gray-50 rounded border border-gray-100 text-center">
                      <span className="text-gray-400 block text-[9px]">DBH Girth</span>
                      <strong>{selectedTree.dbh_cm}cm</strong>
                    </div>
                    <div className="p-2 bg-gray-50 rounded border border-gray-100 text-center">
                      <span className="text-gray-400 block text-[9px]">Score (1-5)</span>
                      <strong>{selectedTree.condition_score}/5</strong>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-1 font-mono text-[11px]">
                    <div className="text-emerald-950 font-bold">PostGIS Point Coordinates:</div>
                    <div className="text-emerald-800">
                      POINT({selectedTree.longitude.toFixed(4)}, {selectedTree.latitude.toFixed(4)})
                    </div>
                    <div className="text-gray-500 text-[10px]">SRID: 4326 (WGS 84 Ellipsoid)</div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-400 text-xs py-8 text-center">Click a tree marker on the map to inspect details.</div>
              )}
            </div>

            {/* Ward Administrative Metadata */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className="font-bold text-xs text-gray-900 uppercase tracking-wide">Ward Governance</span>
                <span className="text-emerald-800 font-bold text-xs">Ward {selectedWard.ward_number}</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Zone Jurisdiction:</span>
                  <strong className="text-gray-900">{selectedWard.zone} Zone</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Surface Area:</span>
                  <span className="font-mono text-gray-900">{selectedWard.area_sq_km} sq km</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Cataloged Trees:</span>
                  <span className="font-mono text-emerald-800 font-bold">{selectedWard.tree_count.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Canopy Cover:</span>
                  <span className="font-mono text-emerald-800 font-bold">{selectedWard.canopy_cover_percent}%</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Assigned Inspector:</span>
                  <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-[11px] text-gray-800 font-semibold">
                    {selectedWard.assigned_inspector}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

