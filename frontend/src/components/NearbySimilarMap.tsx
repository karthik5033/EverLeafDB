"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import L from "leaflet";
import { Tree, WARDS } from "@/lib/db";
import { NearbySimilarResult } from "@/lib/hybrid-queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Compass,
  Plus,
  Minus,
  RotateCcw,
  Satellite,
  Moon,
  Map as MapIcon,
  Crosshair,
  Maximize2
} from "lucide-react";

interface NearbySimilarMapProps {
  targetTree: Tree;
  radiusMeters: number;
  results: NearbySimilarResult[];
  selectedResult: NearbySimilarResult | null;
  onSelectResult: (res: NearbySimilarResult) => void;
  className?: string;
}

const BASEMAP_TILES = {
  satellite: {
    id: "satellite",
    name: "Satellite",
    icon: Satellite,
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Earthstar Geographics",
    maxZoom: 19
  },
  dark: {
    id: "dark",
    name: "Dark GIS",
    icon: Moon,
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
    maxZoom: 19
  },
  streets: {
    id: "streets",
    name: "Streets",
    icon: MapIcon,
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
    maxZoom: 19
  }
};

type BasemapKey = keyof typeof BASEMAP_TILES;

export default function NearbySimilarMap({
  targetTree,
  radiusMeters,
  results,
  selectedResult,
  onSelectResult,
  className = ""
}: NearbySimilarMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const bufferCircleRef = useRef<L.Circle | null>(null);
  const targetMarkerRef = useRef<L.Marker | null>(null);
  const wardPolygonRef = useRef<L.Polygon | null>(null);
  const candidatesLayerRef = useRef<L.LayerGroup | null>(null);

  const [basemap, setBasemap] = useState<BasemapKey>("satellite");
  const [currentZoom, setCurrentZoom] = useState<number>(16);

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [targetTree.latitude, targetTree.longitude],
      zoom: 16,
      minZoom: 11,
      maxZoom: 19,
      zoomControl: false
    });

    const tileConfig = BASEMAP_TILES[basemap];
    const tileLayer = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      maxZoom: tileConfig.maxZoom
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    const candidatesGroup = L.layerGroup().addTo(map);
    candidatesLayerRef.current = candidatesGroup;

    map.on("zoomend", () => {
      setCurrentZoom(map.getZoom());
    });

    mapInstanceRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Basemap Switcher
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const tileConfig = BASEMAP_TILES[basemap];
    const newLayer = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      maxZoom: tileConfig.maxZoom
    }).addTo(map);
    tileLayerRef.current = newLayer;
    newLayer.bringToBack();
  }, [basemap]);

  // 3. Render Ward Boundary
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (wardPolygonRef.current) {
      map.removeLayer(wardPolygonRef.current);
      wardPolygonRef.current = null;
    }

    // Find ward containing targetTree
    const targetWard = WARDS.find((w) => w.ward_id === targetTree.ward_id) || WARDS[0];
    if (targetWard) {
      const latLngs: [number, number][] = targetWard.polygon.map(([lng, lat]) => [lat, lng]);
      const polygon = L.polygon(latLngs, {
        color: "#10b981",
        weight: 1.5,
        dashArray: "5, 5",
        fillColor: "#059669",
        fillOpacity: 0.1
      }).addTo(map);

      polygon.bindTooltip(
        `<span class="font-mono text-xs font-bold text-emerald-300">${targetWard.name}</span>`,
        { sticky: true, className: "ward-map-tooltip" }
      );
      wardPolygonRef.current = polygon;
    }
  }, [targetTree.ward_id]);

  // 4. Render Target Focal Tree Marker & Buffer Circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Pan to target
    map.flyTo([targetTree.latitude, targetTree.longitude], map.getZoom(), { duration: 0.8 });

    // Target Marker
    if (targetMarkerRef.current) {
      map.removeLayer(targetMarkerRef.current);
    }

    const targetIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center cursor-pointer group">
          <span class="absolute w-12 h-12 rounded-full bg-red-500/40 animate-ping"></span>
          <span class="absolute w-8 h-8 rounded-full border-2 border-amber-300 border-dashed animate-spin"></span>
          <div class="relative w-7 h-7 rounded-full bg-red-600 ring-4 ring-red-400/80 flex items-center justify-center text-white shadow-2xl border-2 border-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="22" y1="12" x2="18" y2="12"/>
              <line x1="6" y1="12" x2="2" y2="12"/>
              <line x1="12" y1="6" x2="12" y2="2"/>
              <line x1="12" y1="22" x2="12" y2="18"/>
            </svg>
          </div>
          <div class="absolute -top-7 px-2 py-0.5 rounded bg-slate-950/90 text-[10px] font-mono font-bold text-amber-300 whitespace-nowrap shadow-md pointer-events-none border border-slate-700">
            TARGET: ${targetTree.tag_number}
          </div>
        </div>
      `,
      className: "custom-tree-pin",
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -16]
    });

    const targetMarker = L.marker([targetTree.latitude, targetTree.longitude], {
      icon: targetIcon,
      zIndexOffset: 1000
    }).addTo(map);

    targetMarker.bindPopup(`
      <div class="p-1 min-w-[210px] font-sans text-slate-800">
        <div class="flex items-center justify-between pb-1 mb-1 border-b border-slate-200">
          <span class="font-mono text-xs font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded">FOCAL SPECIMEN</span>
          <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">${targetTree.health_status}</span>
        </div>
        <div class="font-bold text-sm text-slate-900">${targetTree.species_common}</div>
        <div class="text-[11px] text-slate-500 italic mb-2">${targetTree.species_scientific}</div>
        <div class="text-[11px] font-mono bg-slate-50 p-2 rounded border border-slate-100">
          <div><span class="text-slate-400">Tag:</span> <b>${targetTree.tag_number}</b></div>
          <div><span class="text-slate-400">Coords:</span> <b>${targetTree.latitude.toFixed(5)}, ${targetTree.longitude.toFixed(5)}</b></div>
          <div><span class="text-slate-400">Ward:</span> <b>${targetTree.ward_name}</b></div>
        </div>
      </div>
    `);

    targetMarkerRef.current = targetMarker;

    // Buffer Circle
    if (bufferCircleRef.current) {
      map.removeLayer(bufferCircleRef.current);
    }

    const circle = L.circle([targetTree.latitude, targetTree.longitude], {
      radius: radiusMeters,
      color: "#10b981",
      weight: 2,
      dashArray: "6, 6",
      fillColor: "#10b981",
      fillOpacity: 0.16
    }).addTo(map);

    circle.bindTooltip(
      `<span class="font-mono text-xs font-bold text-emerald-300">ST_DWithin Buffer: ${radiusMeters}m</span>`,
      { sticky: true, className: "ward-map-tooltip" }
    );

    bufferCircleRef.current = circle;
  }, [targetTree, radiusMeters]);

  // 5. Render Candidates & Vector Distance Rays
  useEffect(() => {
    const group = candidatesLayerRef.current;
    const map = mapInstanceRef.current;
    if (!group || !map) return;

    group.clearLayers();

    results.forEach((res) => {
      const isSelected = selectedResult?.tree_id === res.tree_id;
      const isCritical = res.similarity_percent >= 80;

      // Geodesic distance vector ray from target to candidate
      const ray = L.polyline(
        [
          [targetTree.latitude, targetTree.longitude],
          [res.latitude, res.longitude]
        ],
        {
          color: isSelected ? "#34d399" : isCritical ? "#f87171" : "#94a3b8",
          weight: isSelected ? 2.5 : 1.5,
          dashArray: "4, 4",
          opacity: isSelected ? 0.9 : 0.6
        }
      );
      group.addLayer(ray);

      // Distance badge at midpoint
      const midLat = (targetTree.latitude + res.latitude) / 2;
      const midLng = (targetTree.longitude + res.longitude) / 2;
      const distBadge = L.marker([midLat, midLng], {
        icon: L.divIcon({
          html: `<div class="px-1.5 py-0.5 rounded bg-slate-950/85 text-[9px] font-mono text-white font-bold whitespace-nowrap border border-slate-700 shadow-sm">${res.distance_meters}m</div>`,
          className: "custom-tree-pin",
          iconAnchor: [15, 8]
        })
      });
      group.addLayer(distBadge);

      // Candidate Specimen Marker
      const candidateIcon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center cursor-pointer group">
            ${isSelected ? '<span class="absolute w-8 h-8 rounded-full border-2 border-emerald-400 border-dashed animate-spin"></span>' : ""}
            <div class="relative w-6 h-6 rounded-full ${
              isCritical ? "bg-red-600 ring-red-400" : "bg-emerald-600 ring-emerald-400"
            } ring-4 ring-opacity-70 flex items-center justify-center text-white shadow-xl transition-transform duration-200 group-hover:scale-125 border-2 border-white">
              <span class="text-[9px] font-mono font-extrabold">${Math.round(res.similarity_percent)}%</span>
            </div>
            <div class="absolute -top-7 px-1.5 py-0.5 rounded bg-slate-950/90 text-[10px] font-mono text-white whitespace-nowrap shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              ${res.tag_number} • ${res.distance_meters}m
            </div>
          </div>
        `,
        className: "custom-tree-pin",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -14]
      });

      const marker = L.marker([res.latitude, res.longitude], { icon: candidateIcon });

      marker.bindPopup(`
        <div class="p-1 min-w-[210px] font-sans text-slate-800">
          <div class="flex items-center justify-between pb-1 mb-1 border-b border-slate-200">
            <span class="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">${res.tag_number}</span>
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded ${
              isCritical ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
            }">${res.similarity_percent.toFixed(1)}% Match</span>
          </div>
          <div class="font-bold text-sm text-slate-900">${res.species_common}</div>
          <div class="text-xs text-red-700 font-semibold mb-2">${res.disease_name}</div>
          <div class="text-[11px] font-mono bg-slate-50 p-2 rounded border border-slate-100 mb-2">
            <div><span class="text-slate-400">Distance:</span> <b>${res.distance_meters}m</b></div>
            <div><span class="text-slate-400">Cosine Dist:</span> <b>${res.cosine_distance}</b></div>
          </div>
        </div>
      `);

      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectResult(res);
      });

      group.addLayer(marker);
    });
  }, [results, selectedResult, targetTree]);

  // Helpers
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleResetTarget = () => {
    mapInstanceRef.current?.flyTo([targetTree.latitude, targetTree.longitude], 16, { duration: 0.8 });
  };
  const handleFitAll = () => {
    if (!mapInstanceRef.current) return;
    const points: [number, number][] = [
      [targetTree.latitude, targetTree.longitude],
      ...results.map((r) => [r.latitude, r.longitude] as [number, number])
    ];
    mapInstanceRef.current.flyToBounds(L.latLngBounds(points), { padding: [50, 50], duration: 1 });
  };

  return (
    <div className={`relative w-full h-[420px] rounded-xl overflow-hidden border border-border shadow-xs select-none bg-slate-950 ${className}`}>
      {/* Top Map Floating HUD */}
      <div className="absolute top-3 inset-x-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
        {/* Left: Nav Buttons & Basemap */}
        <div className="flex items-center gap-1.5">
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-lg p-1 shadow-md flex items-center gap-0.5">
            <Button variant="ghost" size="sm" onClick={handleZoomIn} className="h-7 w-7 p-0" title="Zoom In">
              <Plus className="w-3.5 h-3.5 text-slate-800" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleZoomOut} className="h-7 w-7 p-0" title="Zoom Out">
              <Minus className="w-3.5 h-3.5 text-slate-800" />
            </Button>
            <div className="h-3.5 w-px bg-slate-200 mx-0.5" />
            <Button variant="ghost" size="sm" onClick={handleResetTarget} className="h-7 w-7 p-0" title="Center Focal Tree">
              <RotateCcw className="w-3 h-3 text-slate-800" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleFitAll} className="h-7 w-7 p-0" title="Fit Target & Candidates">
              <Compass className="w-3.5 h-3.5 text-emerald-700" />
            </Button>
          </div>

          {/* Basemap Switcher */}
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-lg p-0.5 shadow-md flex items-center gap-0.5">
            {(Object.keys(BASEMAP_TILES) as BasemapKey[]).map((key) => {
              const item = BASEMAP_TILES[key];
              const Icon = item.icon;
              const isActive = basemap === key;
              return (
                <button
                  key={key}
                  onClick={() => setBasemap(key)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                    isActive
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                  title={item.name}
                >
                  <Icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{item.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Active Query HUD Pill */}
        <div className="bg-slate-950/85 backdrop-blur-md border border-slate-700/80 text-white rounded-lg px-2.5 py-1 shadow-md text-xs font-mono flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>ST_DWithin: <b>{radiusMeters}m</b></span>
          <span className="text-slate-500">•</span>
          <span className="text-emerald-300 font-bold">{results.length} Candidates</span>
        </div>
      </div>

      {/* Main Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full relative z-10 bg-slate-950 cursor-grab active:cursor-grabbing" />

      {/* Bottom Status Bar */}
      <div className="absolute bottom-2 inset-x-2 z-20 pointer-events-none flex items-center justify-between text-[10px] font-mono text-slate-300 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-bold">PostGIS GiST SRID 4326</span>
          <span className="text-slate-500">•</span>
          <span>Spatial Precision: ±0.1m</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Target: {targetTree.tag_number} ({targetTree.latitude.toFixed(4)}, {targetTree.longitude.toFixed(4)})</span>
          <span className="text-slate-500">•</span>
          <span className="text-emerald-400">Zoom: {currentZoom}x</span>
        </div>
      </div>
    </div>
  );
}

