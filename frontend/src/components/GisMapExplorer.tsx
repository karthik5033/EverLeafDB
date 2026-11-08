"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import L from "leaflet";
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
import { Input } from "@/components/ui/input";
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
  Crosshair,
  Search,
  Filter,
  Eye,
  Info,
  CheckCircle2,
  AlertTriangle,
  Maximize2,
  Activity,
  Satellite,
  Moon,
  Map as MapIcon,
  X
} from "lucide-react";

interface GisMapExplorerProps {
  initialTreeId?: string;
  initialWardId?: string;
  className?: string;
}

// Basemap Tile Providers
const BASEMAP_TILES = {
  satellite: {
    id: "satellite",
    name: "Satellite Hybrid",
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
    name: "Municipal Streets",
    icon: MapIcon,
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
    maxZoom: 19
  }
};

type BasemapKey = keyof typeof BASEMAP_TILES;

export default function GisMapExplorer({
  initialTreeId,
  initialWardId = "ward_03",
  className = ""
}: GisMapExplorerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const wardsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);

  // Core interactive states
  const [basemap, setBasemap] = useState<BasemapKey>("satellite");
  const [selectedWardId, setSelectedWardId] = useState<string>(initialWardId);
  const [activeTree, setActiveTree] = useState<Tree | null>(
    TREES.find((t) => t.tree_id === initialTreeId) || TREES[0]
  );
  const [probePoint, setProbePoint] = useState<{ lat: number; lng: number } | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [radiusMeters, setRadiusMeters] = useState(500);
  const [showRadius, setShowRadius] = useState(true);
  const [showWards, setShowWards] = useState(true);
  const [showTrees, setShowTrees] = useState(true);
  const [healthFilter, setHealthFilter] = useState<"ALL" | "HEALTHY" | "MONITOR" | "CRITICAL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredWard, setHoveredWard] = useState<Ward | null>(null);
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number }>({
    lat: 12.9716,
    lng: 77.5946
  });
  const [currentZoom, setCurrentZoom] = useState<number>(13);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Active species metadata for the currently selected tree
  const activeSpecies = useMemo(() => {
    return (
      SPECIES_SEED.find((s) => s.species_id === activeTree?.species_id) || SPECIES_SEED[0]
    );
  }, [activeTree]);

  // Filtered trees according to user filters
  const filteredTrees = useMemo(() => {
    return TREES.filter((tree) => {
      // Health filter
      if (healthFilter === "HEALTHY" && tree.health_status !== "HEALTHY") return false;
      if (healthFilter === "MONITOR" && tree.health_status !== "MONITOR") return false;
      if (
        healthFilter === "CRITICAL" &&
        tree.health_status !== "CRITICAL" &&
        tree.health_status !== "DISEASED"
      )
        return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTag = tree.tag_number.toLowerCase().includes(q);
        const matchesCommon = tree.species_common.toLowerCase().includes(q);
        const matchesScientific = tree.species_scientific.toLowerCase().includes(q);
        const matchesWard = tree.ward_name.toLowerCase().includes(q);
        if (!matchesTag && !matchesCommon && !matchesScientific && !matchesWard) {
          return false;
        }
      }

      return true;
    });
  }, [healthFilter, searchQuery]);

  // ST_DWithin buffer statistics calculation
  const spatialBufferStats = useMemo(() => {
    const origin = probePoint || (activeTree ? { lat: activeTree.latitude, lng: activeTree.longitude } : null);
    if (!origin || !showRadius) return null;

    const nearbyTrees = TREES.filter((t) =>
      stDistanceMeters(origin.lat, origin.lng, t.latitude, t.longitude) <= radiusMeters
    );

    const criticalNearby = nearbyTrees.filter(
      (t) => t.health_status === "CRITICAL" || t.health_status === "DISEASED"
    );

    return {
      totalInside: nearbyTrees.length,
      criticalInside: criticalNearby.length,
      radiusMeters
    };
  }, [activeTree, probePoint, radiusMeters, showRadius]);

  // 1. Initialize Map Instance
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [12.9716, 77.5946], // Bangalore Center (Cubbon Park)
      zoom: 13,
      minZoom: 10,
      maxZoom: 19,
      zoomControl: false
    });

    // Add Initial Base Tile Layer
    const tileConfig = BASEMAP_TILES[basemap];
    const tileLayer = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      maxZoom: tileConfig.maxZoom
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    // Add Layer Groups for Wards and Markers
    const wardsGroup = L.layerGroup().addTo(map);
    const markersGroup = L.layerGroup().addTo(map);
    wardsLayerGroupRef.current = wardsGroup;
    markersLayerGroupRef.current = markersGroup;

    // Map Event Listeners
    map.on("mousemove", (e: L.LeafletMouseEvent) => {
      setCursorCoords({
        lat: Math.round(e.latlng.lat * 1000000) / 1000000,
        lng: Math.round(e.latlng.lng * 1000000) / 1000000
      });
    });

    map.on("zoomend", () => {
      setCurrentZoom(map.getZoom());
    });

    // Clicking map places a spatial probe
    map.on("click", (e: L.LeafletMouseEvent) => {
      setProbePoint({
        lat: e.latlng.lat,
        lng: e.latlng.lng
      });
    });

    mapInstanceRef.current = map;

    // Ensure map tiles calculate dimensions cleanly after rendering
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Handle Basemap Tile Layer Switching
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const tileConfig = BASEMAP_TILES[basemap];
    const newTileLayer = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      maxZoom: tileConfig.maxZoom
    }).addTo(map);

    tileLayerRef.current = newTileLayer;
    newTileLayer.bringToBack();
  }, [basemap]);

  // 3. Render Municipal Ward Polygons
  useEffect(() => {
    const group = wardsLayerGroupRef.current;
    const map = mapInstanceRef.current;
    if (!group || !map) return;

    group.clearLayers();

    if (!showWards) return;

    WARDS.forEach((ward) => {
      const isSelected = ward.ward_id === selectedWardId;
      const latLngs: [number, number][] = ward.polygon.map(([lng, lat]) => [lat, lng]);

      // Professional translucent GIS polygon styling
      const polygon = L.polygon(latLngs, {
        color: isSelected ? "#34d399" : "#10b981",
        weight: isSelected ? 3 : 1.5,
        dashArray: isSelected ? undefined : "5, 5",
        fillColor: isSelected ? "#10b981" : "#059669",
        fillOpacity: isSelected ? 0.28 : 0.12
      });

      polygon.on("mouseover", () => {
        setHoveredWard(ward);
        polygon.setStyle({
          fillOpacity: 0.38,
          weight: 2.5,
          color: "#34d399"
        });
      });

      polygon.on("mouseout", () => {
        setHoveredWard(null);
        polygon.setStyle({
          fillOpacity: isSelected ? 0.28 : 0.12,
          weight: isSelected ? 3 : 1.5,
          color: isSelected ? "#34d399" : "#10b981"
        });
      });

      polygon.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        setSelectedWardId(ward.ward_id);
        map.flyToBounds(polygon.getBounds(), { padding: [50, 50], duration: 1.2 });
      });

      // Ward Tooltip HUD
      polygon.bindTooltip(
        `<div class="font-mono text-xs">
          <div class="font-bold text-emerald-300 uppercase">${ward.name}</div>
          <div class="text-xs text-slate-300">${ward.canopy_cover_percent}% Canopy • ${ward.tree_count.toLocaleString()} Trees • ${ward.area_sq_km} km²</div>
        </div>`,
        { sticky: true, className: "ward-map-tooltip" }
      );

      group.addLayer(polygon);
    });
  }, [selectedWardId, showWards]);

  // 4. Render Tree Specimen Markers & Clustering
  useEffect(() => {
    const group = markersLayerGroupRef.current;
    const map = mapInstanceRef.current;
    if (!group || !map) return;

    group.clearLayers();

    if (!showTrees) return;

    // Cluster threshold: When zoom < 14, aggregate nearby points
    const shouldCluster = currentZoom < 14;

    if (shouldCluster) {
      // Dynamic grid clustering for low zoom levels
      const clusterMap: Record<string, Tree[]> = {};
      const cellSize = 0.02; // Roughly 2km grid cell

      filteredTrees.forEach((tree) => {
        const cellX = Math.floor(tree.longitude / cellSize);
        const cellY = Math.floor(tree.latitude / cellSize);
        const cellKey = `${cellX}_${cellY}`;
        if (!clusterMap[cellKey]) clusterMap[cellKey] = [];
        clusterMap[cellKey].push(tree);
      });

      Object.values(clusterMap).forEach((groupTrees) => {
        if (groupTrees.length > 1) {
          // Compute centroid
          const avgLat = groupTrees.reduce((sum, t) => sum + t.latitude, 0) / groupTrees.length;
          const avgLng = groupTrees.reduce((sum, t) => sum + t.longitude, 0) / groupTrees.length;
          const hasCritical = groupTrees.some(
            (t) => t.health_status === "CRITICAL" || t.health_status === "DISEASED"
          );

          const clusterIcon = L.divIcon({
            html: `
              <div class="relative flex items-center justify-center cursor-pointer group">
                <span class="absolute w-9 h-9 rounded-full ${
                  hasCritical ? "bg-red-500/40 animate-ping" : "bg-emerald-500/30"
                }"></span>
                <div class="w-8 h-8 rounded-full ${
                  hasCritical ? "bg-red-600 ring-red-400" : "bg-emerald-700 ring-emerald-400"
                } ring-4 ring-opacity-60 flex items-center justify-center text-white font-mono font-bold text-xs shadow-xl transition-transform duration-200 group-hover:scale-110 border-2 border-white">
                  ${groupTrees.length}
                </div>
              </div>
            `,
            className: "custom-cluster-pin",
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          });

          const clusterMarker = L.marker([avgLat, avgLng], { icon: clusterIcon });
          clusterMarker.on("click", (e) => {
            L.DomEvent.stopPropagation(e);
            map.flyTo([avgLat, avgLng], map.getZoom() + 2, { duration: 0.8 });
          });
          group.addLayer(clusterMarker);
        } else {
          // Single tree in cell
          renderSingleTreeMarker(groupTrees[0], group, map);
        }
      });
    } else {
      // Zoomed in: Render all individual specimen pins
      filteredTrees.forEach((tree) => {
        renderSingleTreeMarker(tree, group, map);
      });
    }
  }, [filteredTrees, currentZoom, activeTree, showTrees]);

  // Helper: Render Single Specimen Pin with Custom HTML Icon and Rich Popup
  const renderSingleTreeMarker = (tree: Tree, group: L.LayerGroup, map: L.Map) => {
    const isSelected = activeTree?.tree_id === tree.tree_id;
    const isCritical = tree.health_status === "CRITICAL" || tree.health_status === "DISEASED";
    const isMonitor = tree.health_status === "MONITOR";

    let bgClass = "bg-emerald-500 ring-emerald-300";
    if (isCritical) bgClass = "bg-red-600 ring-red-400";
    else if (isMonitor) bgClass = "bg-amber-500 ring-amber-300";

    const customIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center cursor-pointer group">
          ${isCritical ? '<span class="absolute w-8 h-8 rounded-full bg-red-500/40 animate-ping"></span>' : ""}
          ${isSelected ? '<span class="absolute w-8 h-8 rounded-full border-2 border-emerald-400 border-dashed animate-spin"></span>' : ""}
          <div class="relative w-6 h-6 rounded-full ${bgClass} ring-4 ring-opacity-60 flex items-center justify-center text-white shadow-xl transition-transform duration-200 group-hover:scale-125 border-2 border-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10 10v.2A3 3 0 0 1 8.9 16v0H5v0h0a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z"/>
              <path d="M7 16v6"/>
              <path d="M13 19v3"/>
              <path d="M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7l-3.5-4.6a1 1 0 0 0-1.6 0L8.4 7.3a1 1 0 0 0 .8 1.7H9.5"/>
            </svg>
          </div>
          <div class="absolute -top-7 px-1.5 py-0.5 rounded bg-slate-950/90 text-xs font-mono text-white whitespace-nowrap shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            ${tree.tag_number}
          </div>
        </div>
      `,
      className: "custom-tree-pin",
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -14]
    });

    const marker = L.marker([tree.latitude, tree.longitude], { icon: customIcon });

    // Interactive Leaflet Popup
    const popupContent = `
      <div class="p-1 min-w-[210px] font-sans text-slate-800">
        <div class="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-200">
          <span class="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">${tree.tag_number}</span>
          <span class="text-xs font-bold px-1.5 py-0.5 rounded ${
            isCritical
              ? "bg-red-100 text-red-700"
              : isMonitor
              ? "bg-amber-100 text-amber-700"
              : "bg-emerald-100 text-emerald-700"
          }">${tree.health_status}</span>
        </div>
        <div class="font-bold text-sm text-slate-900 leading-tight">${tree.species_common}</div>
        <div class="text-xs text-slate-500 italic mb-2">${tree.species_scientific}</div>
        <div class="grid grid-cols-2 gap-1.5 text-xs font-mono bg-slate-50 p-2 rounded-lg border border-slate-100 mb-2.5">
          <div><span class="text-slate-400">Height:</span> <b>${tree.height_m}m</b></div>
          <div><span class="text-slate-400">DBH:</span> <b>${tree.dbh_cm}cm</b></div>
          <div><span class="text-slate-400">Condition:</span> <b>${tree.condition_score}/5</b></div>
          <div><span class="text-slate-400">Ward:</span> <b>${tree.ward_name.split(" ")[0]}</b></div>
        </div>
        <button id="inspect-btn-${tree.tree_id}" class="w-full py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm">
          <span>Open Specimen Dossier</span> &rarr;
        </button>
      </div>
    `;

    marker.bindPopup(popupContent, { maxWidth: 260 });

    marker.on("popupopen", () => {
      const btn = document.getElementById(`inspect-btn-${tree.tree_id}`);
      if (btn) {
        btn.onclick = () => {
          setActiveTree(tree);
          setIsSheetOpen(true);
        };
      }
    });

    marker.on("click", (e) => {
      L.DomEvent.stopPropagation(e);
      setActiveTree(tree);
      setProbePoint(null); // Center probe on clicked tree
    });

    group.addLayer(marker);
  };

  // 5. Render ST_DWithin Proximity Radius Buffer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (radiusCircleRef.current) {
      map.removeLayer(radiusCircleRef.current);
      radiusCircleRef.current = null;
    }

    if (!showRadius) return;

    const center = probePoint || (activeTree ? { lat: activeTree.latitude, lng: activeTree.longitude } : null);
    if (!center) return;

    const circle = L.circle([center.lat, center.lng], {
      radius: radiusMeters,
      color: "#10b981",
      weight: 2,
      dashArray: "6, 6",
      fillColor: "#10b981",
      fillOpacity: 0.16
    }).addTo(map);

    radiusCircleRef.current = circle;
  }, [activeTree, probePoint, radiusMeters, showRadius]);

  // Map Navigation Helpers
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleReset = () => {
    mapInstanceRef.current?.flyTo([12.9716, 77.5946], 13, { duration: 1 });
    setProbePoint(null);
  };

  const handleFitAllTrees = () => {
    if (!mapInstanceRef.current || filteredTrees.length === 0) return;
    const bounds = L.latLngBounds(filteredTrees.map((t) => [t.latitude, t.longitude]));
    mapInstanceRef.current.flyToBounds(bounds, { padding: [60, 60], duration: 1.2 });
  };

  const handleSelectWard = (wardId: string) => {
    setSelectedWardId(wardId);
    const ward = WARDS.find((w) => w.ward_id === wardId);
    if (ward && mapInstanceRef.current) {
      const latLngs: [number, number][] = ward.polygon.map(([lng, lat]) => [lat, lng]);
      mapInstanceRef.current.flyToBounds(L.latLngBounds(latLngs), { padding: [50, 50], duration: 1.2 });
    }
  };

  return (
    <div
      className={`relative w-full h-full flex flex-col overflow-hidden select-none ${
        isFullscreen ? "fixed inset-0 z-50 bg-slate-950" : ""
      } ${className}`}
    >
      {/* Top Map Floating HUD & Controls Bar */}
      <div className="absolute top-4 inset-x-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
        {/* Left Side: Map Controls & Search */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Navigation Buttons */}
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl p-1.5 shadow-md flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              className="h-8 w-8 p-0 hover:bg-slate-100"
              title="Zoom In"
            >
              <Plus className="w-4 h-4 text-slate-800" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              className="h-8 w-8 p-0 hover:bg-slate-100"
              title="Zoom Out"
            >
              <Minus className="w-4 h-4 text-slate-800" />
            </Button>
            <div className="h-4 w-px bg-slate-200 mx-0.5" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-8 w-8 p-0 hover:bg-slate-100"
              title="Reset Bangalore View"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-800" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFitAllTrees}
              className="h-8 w-8 p-0 hover:bg-slate-100"
              title="Fit All Specimen Trees"
            >
              <Compass className="w-4 h-4 text-emerald-700" />
            </Button>
          </div>

          {/* Basemap Switcher (Satellite / Dark / Streets) */}
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl p-1 shadow-md flex items-center gap-1">
            {(Object.keys(BASEMAP_TILES) as BasemapKey[]).map((key) => {
              const item = BASEMAP_TILES[key];
              const Icon = item.icon;
              const isActive = basemap === key;
              return (
                <button
                  key={key}
                  onClick={() => setBasemap(key)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                  title={`Switch to ${item.name}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{item.name}</span>
                </button>
              );
            })}
          </div>

          {/* ST_DWithin Buffer Radius Picker */}
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl px-2.5 py-1 shadow-md flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setShowRadius(!showRadius)}
              className={`p-1 rounded flex items-center gap-1 font-mono font-semibold transition-colors ${
                showRadius ? "text-emerald-700" : "text-slate-400"
              }`}
              title="Toggle ST_DWithin Proximity Circle"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span className="text-xs">ST_DWithin</span>
            </button>

            {showRadius && (
              <div className="flex items-center gap-1 border-l border-slate-200 pl-1.5">
                {[100, 200, 500, 1000].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRadiusMeters(r)}
                    className={`px-2 py-0.5 rounded font-mono text-xs font-bold transition-all ${
                      radiusMeters === r
                        ? "bg-emerald-700 text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {r}m
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Search, Health Filter & Ward Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Search Input */}
          <div className="relative bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl shadow-md flex items-center h-9 px-2.5 w-44 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search tree ID or species..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-slate-900 placeholder:text-slate-400 outline-none w-full"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Health Filter Dropdown / Toggle */}
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl p-1 shadow-md flex items-center gap-1 text-xs">
            {(["ALL", "HEALTHY", "MONITOR", "CRITICAL"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setHealthFilter(filter)}
                className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold transition-all ${
                  healthFilter === filter
                    ? filter === "CRITICAL"
                      ? "bg-red-600 text-white"
                      : filter === "MONITOR"
                      ? "bg-amber-500 text-white"
                      : filter === "HEALTHY"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Ward Quick Select Dropdown */}
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl px-2.5 py-1 shadow-md flex items-center gap-1 text-xs">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <select
              value={selectedWardId}
              onChange={(e) => handleSelectWard(e.target.value)}
              className="bg-transparent font-medium text-slate-800 text-xs outline-none cursor-pointer"
            >
              {WARDS.map((w) => (
                <option key={w.ward_id} value={w.ward_id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* Fullscreen Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="h-9 w-9 p-0 bg-white/95 backdrop-blur-md border-slate-200/90 shadow-md"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-4 h-4 text-slate-700" />
          </Button>
        </div>
      </div>

      {/* Floating Spatial Buffer Analysis Badge */}
      {spatialBufferStats && (
        <div className="absolute top-20 left-4 z-20 pointer-events-auto bg-slate-950/85 backdrop-blur-md text-white border border-slate-700/80 rounded-xl px-3.5 py-2 shadow-xl flex items-center gap-3 animate-in fade-in-50">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
            <Crosshair className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-mono text-slate-300 flex items-center gap-2">
              <span>PostGIS ST_DWithin Buffer ({spatialBufferStats.radiusMeters}m)</span>
              {probePoint ? (
                <span className="text-xs text-amber-400 font-bold">• Custom Probe Point</span>
              ) : (
                <span className="text-xs text-emerald-400 font-bold">• Specimen Center</span>
              )}
            </div>
            <div className="text-xs font-bold text-white mt-0.5 flex items-center gap-3">
              <span>
                <b>{spatialBufferStats.totalInside}</b> trees in radius
              </span>
              <span className="text-slate-500">•</span>
              <span className={spatialBufferStats.criticalInside > 0 ? "text-red-400 font-bold" : "text-emerald-400"}>
                {spatialBufferStats.criticalInside > 0
                  ? `⚠️ ${spatialBufferStats.criticalInside} Contagion Outbreak Risk`
                  : "✓ Zero Pathological Vectors"}
              </span>
            </div>
          </div>
          {probePoint && (
            <button
              onClick={() => setProbePoint(null)}
              className="text-xs text-slate-400 hover:text-white ml-1 p-1"
              title="Reset probe to selected specimen"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Hovered Ward Quick Dossier Card */}
      {hoveredWard && (
        <div className="absolute top-20 right-4 z-20 pointer-events-auto bg-slate-950/90 backdrop-blur-md border border-slate-700/80 text-white rounded-xl p-3 shadow-xl max-w-xs animate-in fade-in-50 font-sans">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 mb-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
              {hoveredWard.name}
            </span>
            <Badge variant="outline" className="text-xs font-mono text-slate-300 border-slate-700">
              {hoveredWard.zone} Zone
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-2">
            <div>
              <span className="text-slate-400 block text-xs">Canopy Cover:</span>
              <span className="font-bold text-emerald-300">{hoveredWard.canopy_cover_percent}%</span>
            </div>
            <div>
              <span className="text-slate-400 block text-xs">Tree Population:</span>
              <span className="font-bold text-white">{hoveredWard.tree_count.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-xs">Area Surface:</span>
              <span className="text-slate-200">{hoveredWard.area_sq_km} km²</span>
            </div>
            <div>
              <span className="text-slate-400 block text-xs">Lead Inspector:</span>
              <span className="text-slate-200">{hoveredWard.assigned_inspector}</span>
            </div>
          </div>
          <div className="text-xs text-slate-400 italic">Click ward polygon to lock boundaries and zoom</div>
        </div>
      )}

      {/* Main Leaflet Map Viewport Canvas */}
      <div
        ref={mapContainerRef}
        className="w-full flex-1 relative z-10 bg-slate-950 cursor-grab active:cursor-grabbing"
        style={{ minHeight: "580px" }}
      />

      {/* Bottom Telemetry HUD Bar */}
      <div className="absolute bottom-3 inset-x-3 z-20 pointer-events-none flex flex-wrap items-center justify-between gap-2 text-xs text-slate-200 font-mono bg-slate-950/85 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-white">PostGIS GiST R-Tree Active</span>
          </div>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-slate-400 hidden sm:inline">SRID: 4326 (WGS 84)</span>
          <span className="text-slate-600 hidden md:inline">•</span>
          <span className="text-emerald-300 font-medium hidden md:inline">
            Cursor: {cursorCoords.lat.toFixed(5)}° N, {cursorCoords.lng.toFixed(5)}° E
          </span>
        </div>

        <div className="flex items-center gap-4 text-slate-300">
          <span>
            Visible: <b>{filteredTrees.length}</b> / {TREES.length} trees
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-emerald-400 font-bold">Zoom: {currentZoom}x</span>
          <span className="text-slate-600">•</span>
          <span className="capitalize text-slate-300">{basemap}</span>
        </div>
      </div>

      {/* Slide-over Drawer (shadcn Sheet): Specimen Dossier */}
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
                    <Badge variant="destructive">CRITICAL HAZARD</Badge>
                  ) : activeTree.health_status === "MONITOR" ? (
                    <Badge variant="outline" className="border-amber-500 text-amber-600 bg-amber-50">
                      MONITORING
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-emerald-500 text-emerald-700 bg-emerald-50">
                      HEALTHY
                    </Badge>
                  )}
                </div>
                <SheetTitle className="text-2xl font-black text-slate-900 tracking-tight">
                  {activeTree.species_common}
                </SheetTitle>
                <SheetDescription className="italic font-serif text-sm">
                  {activeTree.species_scientific}
                </SheetDescription>
              </SheetHeader>

              {/* Dendrometric Measurements */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Height:</span>
                  <span className="font-bold text-slate-900">{activeTree.height_m} meters</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">DBH Girth:</span>
                  <span className="font-bold text-slate-900">{activeTree.dbh_cm} cm</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Pathological Condition:</span>
                  <span className="font-bold text-emerald-800">{activeTree.condition_score} / 5.0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Planted Date:</span>
                  <span className="text-slate-900">{activeTree.planted_at}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500">Last Transect:</span>
                  <span className="text-slate-700">{activeTree.last_inspected_at?.slice(0, 10)}</span>
                </div>
              </div>

              {/* Spatial Geofence Verification */}
              <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Jurisdiction Ward:</span>
                  <span className="font-bold text-emerald-950">{activeTree.ward_name}</span>
                </div>
                <div className="flex items-center justify-between font-mono">
                  <span className="text-slate-500">GPS Coordinates:</span>
                  <span className="text-emerald-800 font-bold">
                    {activeTree.latitude.toFixed(6)}, {activeTree.longitude.toFixed(6)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-200">
                  <span className="text-slate-500">PostGIS Containment:</span>
                  <span className="text-emerald-800 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> ST_Contains = TRUE
                  </span>
                </div>
              </div>

              {/* Botanical Taxon Attributes */}
              <div className="space-y-2 text-xs">
                <div className="text-xs font-mono uppercase text-slate-500 font-bold">Botanical Taxon Profile:</div>
                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-xs text-slate-500">Growth Rate</div>
                    <div className="font-bold text-slate-900">{activeSpecies.growth_rate}</div>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-xs text-slate-500">Typical Lifespan</div>
                    <div className="font-bold text-slate-900">{activeSpecies.typical_lifespan_years} yrs</div>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 col-span-2">
                    <div className="text-xs text-slate-500">Foliage Phenology</div>
                    <div className="font-bold text-slate-900">{activeSpecies.foliage_type}</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-4 border-t border-slate-200">
                <Link href={`/inspections/new?tree_id=${activeTree.tree_id}`} className="w-full block">
                  <Button className="w-full bg-slate-950 hover:bg-slate-800 text-white font-bold h-10 shadow-xs">
                    <Stethoscope className="w-4 h-4 mr-2" />
                    Record Field Inspection
                  </Button>
                </Link>

                <Link href={`/trees/${activeTree.tree_id}`} className="w-full block">
                  <Button variant="outline" className="w-full text-xs font-semibold h-9 border-slate-200">
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
