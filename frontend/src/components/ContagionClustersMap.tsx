"use client";

import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import { TREES, WARDS } from "@/lib/db";
import { ContagionHazardCluster, EndangeredTree } from "@/lib/hybrid-queries";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Minus,
  RotateCcw,
  Compass,
  Satellite,
  Moon,
  Map as MapIcon,
  Flame,
  ShieldAlert
} from "lucide-react";

interface ContagionClustersMapProps {
  hazardZones: ContagionHazardCluster[];
  activeZone: ContagionHazardCluster | null;
  radiusMeters: number;
  endangeredTrees: EndangeredTree[];
  selectedTree: EndangeredTree | null;
  onSelectZone: (zone: ContagionHazardCluster) => void;
  onSelectTree: (tree: EndangeredTree) => void;
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

export default function ContagionClustersMap({
  hazardZones,
  activeZone,
  radiusMeters,
  endangeredTrees,
  selectedTree,
  onSelectZone,
  onSelectTree,
  className = ""
}: ContagionClustersMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const zonesLayerRef = useRef<L.LayerGroup | null>(null);
  const lastCenteredAlertIdRef = useRef<string | null>(null);

  const [basemap, setBasemap] = useState<BasemapKey>("satellite");
  const [currentZoom, setCurrentZoom] = useState<number>(15);

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialCenter: [number, number] = activeZone
      ? [activeZone.epicenter_lat, activeZone.epicenter_lng]
      : [12.9716, 77.5946];

    if (activeZone) {
      lastCenteredAlertIdRef.current = activeZone.alert_id;
    }

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 15,
      minZoom: 11,
      maxZoom: 19,
      zoomControl: false,
      zoomAnimation: false,
      fadeAnimation: true
    });

    const tileConfig = BASEMAP_TILES[basemap];
    const tileLayer = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      maxZoom: tileConfig.maxZoom
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    const zonesGroup = L.layerGroup().addTo(map);
    zonesLayerRef.current = zonesGroup;

    map.on("zoomend", () => {
      setCurrentZoom(Math.round(map.getZoom() * 10) / 10);
    });

    mapInstanceRef.current = map;

    // Use ResizeObserver with { pan: false } so layout settling never jerks the viewport
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize({ pan: false });
        }
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
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

  // 3. Render Contagion Hazard Zones, Epicenters & Endangered Trees
  useEffect(() => {
    const group = zonesLayerRef.current;
    const map = mapInstanceRef.current;
    if (!group || !map) return;

    group.clearLayers();

    // Only pan if activeZone is valid AND has actually changed to a different epicenter
    if (activeZone) {
      if (!lastCenteredAlertIdRef.current) {
        lastCenteredAlertIdRef.current = activeZone.alert_id;
        map.setView([activeZone.epicenter_lat, activeZone.epicenter_lng], 15, { animate: false });
      } else if (lastCenteredAlertIdRef.current !== activeZone.alert_id) {
        lastCenteredAlertIdRef.current = activeZone.alert_id;
        map.panTo([activeZone.epicenter_lat, activeZone.epicenter_lng], { animate: true, duration: 0.4 });
      }
    }

    hazardZones.forEach((zone) => {
      const isSelectedZone = activeZone?.alert_id === zone.alert_id;

      // 1. ST_Buffer Translucent Red Hazard Zone
      const circle = L.circle([zone.epicenter_lat, zone.epicenter_lng], {
        radius: zone.radius_meters || radiusMeters,
        color: isSelectedZone ? "#ef4444" : "#f87171",
        weight: isSelectedZone ? 2.5 : 1.5,
        dashArray: "6, 4",
        fillColor: "#dc2626",
        fillOpacity: isSelectedZone ? 0.22 : 0.12
      }).addTo(group);

      circle.bindTooltip(
        `<span class="font-mono text-xs font-bold text-red-300">CONTAGION BUFFER: ${zone.radius_meters}m • ${zone.epicenter_tag}</span>`,
        { sticky: true, className: "ward-map-tooltip" }
      );

      // 2. Epicenter Marker (GPU-optimized pulse, no layout thrashing)
      const epicenterIcon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <span class="absolute w-10 h-10 rounded-full bg-red-600/30 animate-pulse pointer-events-none"></span>
            <span class="absolute w-7 h-7 rounded-full border border-amber-300/80 border-dashed animate-spin pointer-events-none"></span>
            <div class="relative w-8 h-8 rounded-full bg-red-600 ring-2 ring-red-400 flex items-center justify-center text-white shadow-lg border-2 border-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
              </svg>
            </div>
            <div class="absolute -top-7 px-2 py-0.5 rounded bg-slate-950/90 text-xs font-mono font-bold text-red-300 whitespace-nowrap shadow-md pointer-events-none border border-slate-700">
              EPICENTER: ${zone.epicenter_tag}
            </div>
          </div>
        `,
        className: "custom-tree-pin",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18]
      });

      const epicenterMarker = L.marker([zone.epicenter_lat, zone.epicenter_lng], {
        icon: epicenterIcon,
        zIndexOffset: 1000
      });

      epicenterMarker.bindPopup(`
        <div class="p-1 min-w-[210px] font-sans text-slate-800">
          <div class="flex items-center justify-between pb-1 mb-1 border-b border-slate-200">
            <span class="font-mono text-xs font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded">OUTBREAK EPICENTER</span>
            <span class="text-xs font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700">CRITICAL</span>
          </div>
          <div class="font-bold text-sm text-slate-900">${zone.epicenter_tag}</div>
          <div class="text-xs text-red-700 font-semibold mb-2">${zone.detected_disease}</div>
          <div class="text-xs font-mono bg-slate-50 p-2 rounded border border-slate-100">
            <div><span class="text-slate-400">Buffer Radius:</span> <b>${zone.radius_meters}m</b></div>
            <div><span class="text-slate-400">Endangered:</span> <b>${zone.endangered_trees_count} trees</b></div>
            <div><span class="text-slate-400">Alert ID:</span> <b>${zone.alert_id}</b></div>
          </div>
        </div>
      `);

      epicenterMarker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectZone(zone);
      });

      group.addLayer(epicenterMarker);
    });

    // 3. Endangered Trees & Contagion Vector Lines
    if (activeZone) {
      endangeredTrees.forEach((t) => {
        const isSelected = selectedTree?.endangered_tree_id === t.endangered_tree_id;
        const matchingDbTree = TREES.find((dbT) => dbT.tree_id === t.endangered_tree_id);

        let lat = t.latitude || matchingDbTree?.latitude;
        let lng = t.longitude || matchingDbTree?.longitude;

        if (!lat || !lng) {
          // Deterministic trigonometric placement based on tree tag/id so pins never jump
          const hash = (t.endangered_tree_id || t.endangered_tag || "tree")
            .split("")
            .reduce((acc, c, i) => acc + c.charCodeAt(0) * (i + 1), 0);
          const angle = ((hash % 360) * Math.PI) / 180;
          const distOffset = (t.distance_to_epicenter_meters || 200) / 111000;
          lat = activeZone.epicenter_lat + Math.sin(angle) * distOffset;
          lng = activeZone.epicenter_lng + (Math.cos(angle) * distOffset) / Math.cos((activeZone.epicenter_lat * Math.PI) / 180);
        }

        // Contagion vector line
        const vectorLine = L.polyline(
          [
            [activeZone.epicenter_lat, activeZone.epicenter_lng],
            [lat, lng]
          ],
          {
            color: isSelected ? "#ef4444" : "#fca5a5",
            weight: isSelected ? 2.5 : 1.5,
            dashArray: "4, 4",
            opacity: isSelected ? 0.9 : 0.6
          }
        );
        group.addLayer(vectorLine);

        // Distance label
        const midLat = (activeZone.epicenter_lat + lat) / 2;
        const midLng = (activeZone.epicenter_lng + lng) / 2;
        const distMarker = L.marker([midLat, midLng], {
          icon: L.divIcon({
            html: `<div class="px-1.5 py-0.5 rounded bg-slate-950/85 text-xs font-mono text-red-300 font-bold whitespace-nowrap border border-slate-700 shadow-sm">${t.distance_to_epicenter_meters}m</div>`,
            className: "custom-tree-pin",
            iconAnchor: [15, 8]
          })
        });
        group.addLayer(distMarker);

        // Endangered Tree Pin
        const priorityColor =
          t.quarantine_priority === "EMERGENCY_ISOLATE"
            ? "bg-red-600 ring-red-400"
            : t.quarantine_priority === "HIGH_QUARANTINE"
            ? "bg-amber-500 ring-amber-300"
            : "bg-emerald-600 ring-emerald-400";

        const treeIcon = L.divIcon({
          html: `
            <div class="relative flex items-center justify-center cursor-pointer group">
              ${isSelected ? '<span class="absolute w-8 h-8 rounded-full border-2 border-red-500 border-dashed animate-spin"></span>' : ""}
              <div class="relative w-6 h-6 rounded-full ${priorityColor} ring-4 ring-opacity-70 flex items-center justify-center text-white shadow-xl transition-transform duration-200 group-hover:scale-125 border-2 border-white">
                <span class="text-xs font-mono font-extrabold">${Math.round(t.similarity_percent)}%</span>
              </div>
              <div class="absolute -top-7 px-1.5 py-0.5 rounded bg-slate-950/90 text-xs font-mono text-white whitespace-nowrap shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                ${t.endangered_tag} • ${t.quarantine_priority}
              </div>
            </div>
          `,
          className: "custom-tree-pin",
          iconSize: [24, 24],
          iconAnchor: [12, 12],
          popupAnchor: [0, -14]
        });

        const treeMarker = L.marker([lat, lng], { icon: treeIcon });

        treeMarker.bindPopup(`
          <div class="p-1 min-w-[210px] font-sans text-slate-800">
            <div class="flex items-center justify-between pb-1 mb-1 border-b border-slate-200">
              <span class="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">${t.endangered_tag}</span>
              <span class="text-xs font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700">${t.quarantine_priority}</span>
            </div>
            <div class="font-bold text-sm text-slate-900">${t.endangered_species}</div>
            <div class="text-xs text-red-700 font-semibold mb-2">Vector: ${t.pathogen_disease}</div>
            <div class="text-xs font-mono bg-slate-50 p-2 rounded border border-slate-100">
              <div><span class="text-slate-400">Distance to Epicenter:</span> <b>${t.distance_to_epicenter_meters}m</b></div>
              <div><span class="text-slate-400">Similarity:</span> <b>${t.similarity_percent.toFixed(1)}%</b></div>
              <div><span class="text-slate-400">Untreated Days:</span> <b>${t.days_since_last_inspection}d</b></div>
            </div>
          </div>
        `);

        treeMarker.on("click", (e) => {
          L.DomEvent.stopPropagation(e);
          onSelectTree(t);
        });

        group.addLayer(treeMarker);
      });
    }
  }, [hazardZones, activeZone, radiusMeters, endangeredTrees, selectedTree]);

  // Helpers
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleReset = () => {
    if (activeZone && mapInstanceRef.current) {
      mapInstanceRef.current.setView([activeZone.epicenter_lat, activeZone.epicenter_lng], 15, { animate: true });
    }
  };

  return (
    <div className={`relative w-full h-[420px] rounded-xl overflow-hidden border border-border shadow-xs select-none bg-slate-950 ${className}`}>
      {/* Top Floating HUD */}
      <div className="absolute top-3 inset-x-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
        <div className="flex items-center gap-1.5">
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-lg p-1 shadow-md flex items-center gap-0.5">
            <Button variant="ghost" size="sm" onClick={handleZoomIn} className="h-7 w-7 p-0" title="Zoom In">
              <Plus className="w-3.5 h-3.5 text-slate-800" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleZoomOut} className="h-7 w-7 p-0" title="Zoom Out">
              <Minus className="w-3.5 h-3.5 text-slate-800" />
            </Button>
            <div className="h-3.5 w-px bg-slate-200 mx-0.5" />
            <Button variant="ghost" size="sm" onClick={handleReset} className="h-7 w-7 p-0" title="Center Outbreak Epicenter">
              <RotateCcw className="w-3 h-3 text-slate-800" />
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
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition-all ${
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

        {/* Right Active Zone Pill */}
        <div className="bg-slate-950/85 backdrop-blur-md border border-slate-700/80 text-white rounded-lg px-2.5 py-1 shadow-md text-xs font-mono flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          <span>ST_Buffer: <b>{radiusMeters}m</b></span>
          <span className="text-slate-500">•</span>
          <span className="text-red-300 font-bold">{endangeredTrees.length} In Danger</span>
        </div>
      </div>

      {/* Main Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full relative z-10 bg-slate-950 cursor-grab active:cursor-grabbing" />

      {/* Bottom Status Bar */}
      <div className="absolute bottom-2 inset-x-2 z-20 pointer-events-none flex items-center justify-between text-xs font-mono text-slate-300 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-red-400 font-bold">PostGIS ST_Buffer (EPSG:4326)</span>
          <span className="text-slate-500">•</span>
          <span>Pathogen Danger Heat Zone</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Epicenter: {activeZone?.epicenter_tag}</span>
          <span className="text-slate-500">•</span>
          <span className="text-emerald-400">Zoom: {typeof currentZoom === "number" ? currentZoom.toFixed(1) : currentZoom}x</span>
        </div>
      </div>
    </div>
  );
}

