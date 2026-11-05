"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { WARDS, TREES, Tree, Ward, SPECIES_SEED } from "@/lib/db";
import { stDistanceMeters, stContains, LngLat } from "@/lib/gis";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Compass,
  Plus,
  Minus,
  RotateCcw,
  Trees,
  MapPin,
  Stethoscope,
  ArrowRight,
  ShieldAlert,
  Calendar,
  Ruler,
  Layers,
  Crosshair
} from "lucide-react";

interface GisMapExplorerProps {
  initialTreeId?: string;
  initialWardId?: string;
  className?: string;
}

// Bounding box for Bangalore municipal coverage
const MAP_BBOX = {
  minLng: 77.540,
  maxLng: 77.770,
  minLat: 12.900,
  maxLat: 13.060
};

export default function GisMapExplorer({
  initialTreeId,
  initialWardId = "ward_03",
  className = ""
}: GisMapExplorerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan & Zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Ward & Tree selection state
  const [selectedWardId, setSelectedWardId] = useState<string>(initialWardId);
  const [activeTree, setActiveTree] = useState<Tree | null>(
    TREES.find((t) => t.tree_id === initialTreeId) || TREES[0]
  );
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [radiusMeters, setRadiusMeters] = useState(500);
  const [hoveredWard, setHoveredWard] = useState<Ward | null>(null);

  // SVG coordinate projection
  const svgWidth = 1000;
  const svgHeight = 700;

  const projectLngLat = (lng: number, lat: number): [number, number] => {
    const x = ((lng - MAP_BBOX.minLng) / (MAP_BBOX.maxLng - MAP_BBOX.minLng)) * svgWidth;
    const y = svgHeight - ((lat - MAP_BBOX.minLat) / (MAP_BBOX.maxLat - MAP_BBOX.minLat)) * svgHeight;
    return [x, y];
  };

  // Zoom controls
  const handleZoomIn = () => setZoom((z) => Math.min(z * 1.3, 5));
  const handleZoomOut = () => setZoom((z) => Math.max(z / 1.3, 0.7));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Dynamic Marker Clustering based on zoom level
  const clustersAndMarkers = useMemo(() => {
    // When zoom is high, show individual markers
    if (zoom >= 2.5) {
      return { clusters: [], markers: TREES };
    }

    // Grid clustering at lower zoom levels
    const clusterGrid: Record<string, { trees: Tree[]; x: number; y: number }> = {};
    const gridSize = 80 / zoom; // pixel threshold

    TREES.forEach((tree) => {
      const [px, py] = projectLngLat(tree.longitude, tree.latitude);
      const gridKey = `${Math.floor(px / gridSize)}_${Math.floor(py / gridSize)}`;

      if (!clusterGrid[gridKey]) {
        clusterGrid[gridKey] = { trees: [], x: px, y: py };
      }
      clusterGrid[gridKey].trees.push(tree);
    });

    const clusters: Array<{
      id: string;
      count: number;
      x: number;
      y: number;
      trees: Tree[];
      hasCritical: boolean;
    }> = [];
    const singleMarkers: Tree[] = [];

    Object.entries(clusterGrid).forEach(([key, group]) => {
      if (group.trees.length > 1) {
        clusters.push({
          id: key,
          count: group.trees.length,
          x: group.x,
          y: group.y,
          trees: group.trees,
          hasCritical: group.trees.some(
            (t) => t.health_status === "CRITICAL" || t.health_status === "DISEASED"
          )
        });
      } else {
        singleMarkers.push(group.trees[0]);
      }
    });

    return { clusters, markers: singleMarkers };
  }, [zoom]);

  // Radius buffer in SVG pixels
  const centerTree = activeTree || TREES[0];
  const [centerPx, centerPy] = projectLngLat(centerTree.longitude, centerTree.latitude);
  // Estimate meters to pixels: latitude degree ~ 111,000 meters
  const metersToPixels = (svgHeight / (MAP_BBOX.maxLat - MAP_BBOX.minLat)) / 111000;
  const radiusPixels = radiusMeters * metersToPixels;

  const activeSpecies = SPECIES_SEED.find((s) => s.species_id === activeTree?.species_id) || SPECIES_SEED[0];

  return (
    <div className={`relative w-full h-full flex flex-col ${className}`}>
      {/* Top Map Toolbar HUD */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-md border border-gray-200/90 rounded-xl p-1.5 shadow-md flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            className="h-8 w-8 p-0"
            title="Zoom In"
          >
            <Plus className="w-4 h-4 text-gray-800" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            className="h-8 w-8 p-0"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4 text-gray-800" />
          </Button>
          <div className="h-4 w-px bg-gray-200 mx-0.5" />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-8 w-8 p-0"
            title="Reset View"
          >
            <RotateCcw className="w-3.5 h-3.5 text-gray-800" />
          </Button>
        </div>

        {/* Radius Buffer Toggle */}
        <div className="bg-white/95 backdrop-blur-md border border-gray-200/90 rounded-xl px-2.5 py-1 shadow-md flex items-center gap-1.5 text-xs">
          <span className="font-mono text-gray-500 text-[11px] flex items-center gap-1">
            <Crosshair className="w-3 h-3 text-emerald-700" />
            ST_DWithin:
          </span>
          {[200, 500, 1000].map((r) => (
            <button
              key={r}
              onClick={() => setRadiusMeters(r)}
              className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold transition-colors ${
                radiusMeters === r
                  ? "bg-emerald-800 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {r}m
            </button>
          ))}
        </div>

        {/* Selected Ward Badge */}
        {hoveredWard && (
          <div className="bg-black/85 backdrop-blur-md border border-white/10 text-white rounded-xl px-3 py-1 shadow-md text-xs font-mono flex items-center gap-2 animate-in fade-in-50">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>{hoveredWard.name}</span>
            <span className="text-gray-400">({hoveredWard.area_sq_km} km² • {hoveredWard.canopy_cover_percent}% Canopy)</span>
          </div>
        )}
      </div>

      {/* Main Map Viewport Canvas */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`w-full flex-1 bg-[#091b15] overflow-hidden select-none relative cursor-grab active:cursor-grabbing ${
          isDragging ? "cursor-grabbing" : ""
        }`}
      >
        {/* Subtle Map Grid Pattern */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]" />

        {/* Pan & Zoom Transform Container */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            transition: isDragging ? "none" : "transform 0.15s ease-out"
          }}
          className="w-full h-full flex items-center justify-center"
        >
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-full max-h-[85vh] overflow-visible"
          >
            {/* 1. Municipal Ward Polygons (SRID 4326) */}
            <g id="wards-layer">
              {WARDS.map((ward) => {
                const isSelected = ward.ward_id === selectedWardId;
                const pathData = ward.polygon
                  .map(([lng, lat], idx) => {
                    const [px, py] = projectLngLat(lng, lat);
                    return `${idx === 0 ? "M" : "L"}${px},${py}`;
                  })
                  .join(" ") + " Z";

                const [cx, cy] = projectLngLat(ward.centroid[0], ward.centroid[1]);

                return (
                  <g
                    key={ward.ward_id}
                    onMouseEnter={() => setHoveredWard(ward)}
                    onMouseLeave={() => setHoveredWard(null)}
                    onClick={() => setSelectedWardId(ward.ward_id)}
                    className="cursor-pointer group"
                  >
                    <path
                      d={pathData}
                      fill={isSelected ? "#10b981" : "#059669"}
                      fillOpacity={isSelected ? 0.28 : 0.12}
                      stroke={isSelected ? "#34d399" : "#10b981"}
                      strokeWidth={isSelected ? 2.5 : 1.2}
                      strokeDasharray={isSelected ? "none" : "4 4"}
                      className="transition-all duration-300 group-hover:fill-opacity-35"
                    />

                    {/* Ward Centroid & Label */}
                    <text
                      x={cx}
                      y={cy}
                      textAnchor="middle"
                      className="text-[10px] font-mono fill-emerald-200/90 font-bold pointer-events-none select-none tracking-wider uppercase drop-shadow"
                    >
                      {ward.name}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* 2. Proximity Buffer Radius Circle (ST_DWithin) */}
            {activeTree && (
              <g id="radius-buffer">
                <circle
                  cx={centerPx}
                  cy={centerPy}
                  r={radiusPixels}
                  fill="#10b981"
                  fillOpacity="0.12"
                  stroke="#34d399"
                  strokeWidth="1.5"
                  strokeDasharray="5 3"
                  className="animate-pulse"
                />
              </g>
            )}

            {/* 3. High-Density Marker Clusters */}
            <g id="clusters-layer">
              {clustersAndMarkers.clusters.map((cluster) => (
                <g
                  key={cluster.id}
                  transform={`translate(${cluster.x}, ${cluster.y})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Click cluster opens first tree and zoom in
                    setActiveTree(cluster.trees[0]);
                    setIsSheetOpen(true);
                  }}
                  className="cursor-pointer group"
                >
                  <circle
                    r="20"
                    fill={cluster.hasCritical ? "#e11d48" : "#059669"}
                    fillOpacity="0.3"
                    className="animate-ping"
                  />
                  <circle
                    r="16"
                    fill={cluster.hasCritical ? "#be123c" : "#047857"}
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="shadow-md transition-transform group-hover:scale-110"
                  />
                  <text
                    textAnchor="middle"
                    dy="4"
                    className="text-[11px] font-extrabold fill-white font-mono pointer-events-none"
                  >
                    {cluster.count}
                  </text>
                </g>
              ))}
            </g>

            {/* 4. Individual Tree Pins */}
            <g id="trees-layer">
              {clustersAndMarkers.markers.map((tree) => {
                const [px, py] = projectLngLat(tree.longitude, tree.latitude);
                const isSelected = activeTree?.tree_id === tree.tree_id;
                const isCritical = tree.health_status === "CRITICAL" || tree.health_status === "DISEASED";
                const isMonitor = tree.health_status === "MONITOR";

                return (
                  <g
                    key={tree.tree_id}
                    transform={`translate(${px}, ${py})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTree(tree);
                      setIsSheetOpen(true);
                    }}
                    className="cursor-pointer group"
                  >
                    {/* Pulsing Target Halo if Selected */}
                    {isSelected && (
                      <circle
                        r="18"
                        fill="none"
                        stroke="#34d399"
                        strokeWidth="2"
                        strokeDasharray="3 3"
                        className="animate-spin origin-center"
                      />
                    )}

                    {/* Health State Pin */}
                    <circle
                      r={isSelected ? "9" : "6.5"}
                      fill={
                        isCritical
                          ? "#ef4444"
                          : isMonitor
                          ? "#f59e0b"
                          : "#10b981"
                      }
                      stroke="#ffffff"
                      strokeWidth={isSelected ? "2.5" : "1.5"}
                      className="transition-transform group-hover:scale-125 shadow-lg"
                    />

                    {/* Tag Number Label on Hover */}
                    <text
                      x="0"
                      y="-12"
                      textAnchor="middle"
                      className="text-[9px] font-mono fill-white font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-1 pointer-events-none drop-shadow"
                    >
                      {tree.tag_number}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Bottom Status Bar */}
        <div className="absolute bottom-3 inset-x-3 pointer-events-none flex items-center justify-between text-xs text-emerald-200/90 font-mono bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>PostGIS GiST R-Tree Active</span>
            <span className="text-gray-400">•</span>
            <span>SRID: 4326 (WGS 84)</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Clusters: {clustersAndMarkers.clusters.length}</span>
            <span>Visible Trees: {TREES.length}</span>
            <span className="text-emerald-400 font-bold">Zoom: {zoom.toFixed(1)}x</span>
          </div>
        </div>
      </div>

      {/* Slide-over Drawer (shadcn Sheet): Specimen Details */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto space-y-6">
          {activeTree && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="font-mono text-xs">
                    {activeTree.tag_number}
                  </Badge>
                  {activeTree.health_status === "CRITICAL" ? (
                    <Badge variant="critical">CRITICAL HAZARD</Badge>
                  ) : activeTree.health_status === "MONITOR" ? (
                    <Badge variant="warning">MONITORING</Badge>
                  ) : (
                    <Badge variant="emerald">HEALTHY</Badge>
                  )}
                </div>
                <SheetTitle className="text-xl font-extrabold text-foreground">
                  {activeTree.species_common}
                </SheetTitle>
                <SheetDescription className="italic font-serif">
                  {activeTree.species_scientific}
                </SheetDescription>
              </SheetHeader>

              {/* Dendrometric Measurements */}
              <div className="p-4 bg-muted/50 rounded-xl border border-border space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Height:</span>
                  <span className="font-bold text-foreground">{activeTree.height_m} meters</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">DBH Girth:</span>
                  <span className="font-bold text-foreground">{activeTree.dbh_cm} cm</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Condition Score:</span>
                  <span className="font-bold text-emerald-800">{activeTree.condition_score} / 5</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Planted Date:</span>
                  <span className="text-foreground">{activeTree.planted_at}</span>
                </div>
              </div>

              {/* Spatial Geofence Verification */}
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Jurisdiction Ward:</span>
                  <span className="font-bold text-emerald-950">{activeTree.ward_name}</span>
                </div>
                <div className="flex items-center justify-between font-mono">
                  <span className="text-muted-foreground">Coordinates:</span>
                  <span className="text-emerald-800 font-bold">
                    {activeTree.latitude.toFixed(6)}, {activeTree.longitude.toFixed(6)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-emerald-200/60">
                  <span className="text-muted-foreground">PostGIS Containment:</span>
                  <span className="text-emerald-800 font-bold">ST_Contains = TRUE</span>
                </div>
              </div>

              {/* Botanical Profile */}
              <div className="space-y-2 text-xs">
                <div className="text-[10px] font-mono uppercase text-muted-foreground">Taxon Attributes:</div>
                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div className="p-2.5 bg-muted/30 rounded-lg border border-border">
                    <div className="text-[10px] text-muted-foreground">Growth Rate</div>
                    <div className="font-bold text-foreground">{activeSpecies.growth_rate}</div>
                  </div>
                  <div className="p-2.5 bg-muted/30 rounded-lg border border-border">
                    <div className="text-[10px] text-muted-foreground">Lifespan</div>
                    <div className="font-bold text-foreground">{activeSpecies.typical_lifespan_years} yrs</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4">
                <Link href={`/inspections/new?tree_id=${activeTree.tree_id}`} className="w-full block">
                  <Button className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-bold h-10 shadow-xs">
                    <Stethoscope className="w-4 h-4 mr-2" />
                    Record Field Inspection
                  </Button>
                </Link>

                <Link href={`/trees/${activeTree.tree_id}`} className="w-full block">
                  <Button variant="outline" className="w-full text-xs font-semibold h-9">
                    Full Specimen Dossier
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5 text-emerald-700" />
                  </Button>
                </Link>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
