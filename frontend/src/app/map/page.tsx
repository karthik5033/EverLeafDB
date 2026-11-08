"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { DashboardShell } from "@/components/DashboardShell";
import { WARDS, TREES } from "@/lib/db";
import { Compass, Trees, ShieldCheck, MapPin, Layers, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const GisMapExplorer = dynamic(() => import("@/components/GisMapExplorer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[680px] flex flex-col items-center justify-center bg-slate-950 text-slate-300 rounded-2xl border border-slate-800">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mb-4" />
      <p className="font-mono text-sm text-white font-medium">Initializing PostGIS Geospatial Subsystem...</p>
      <p className="text-xs text-slate-400 mt-1">Streaming High-Resolution Satellite &amp; GIS Vector Tiles (SRID 4326)</p>
    </div>
  )
});

export default function MapPage() {
  const [selectedWardId, setSelectedWardId] = useState<string>("ward_03");

  const totalTrees = TREES.length;
  const healthyCount = TREES.filter((t) => t.health_status === "HEALTHY").length;
  const criticalCount = TREES.filter((t) => t.health_status === "CRITICAL" || t.health_status === "DISEASED").length;

  return (
    <DashboardShell>
      <div className="p-4 md:p-6 max-w-[1600px] w-full mx-auto space-y-4">
        {/* Header HUD */}
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
                <Compass className="w-5 h-5" />
              </span>
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900">
                PostGIS Geospatial Subsystem &amp; Ward Map Explorer
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                SRID 4326 GiST
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Production-grade GIS console with Esri High-Resolution Satellite &amp; Dark Vector tiles, municipal ward polygons, dynamic specimen clustering, and interactive <code className="font-mono text-emerald-800 font-medium">ST_DWithin</code> proximity buffers.
            </p>
          </div>

          {/* Quick HUD Metrics */}
          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-slate-500">Healthy:</span>
              <span className="font-bold text-slate-900">{healthyCount}</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span className="text-slate-500">Critical:</span>
              <span className="font-bold text-red-700">{criticalCount}</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
              <span className="text-slate-500">Wards:</span>
              <span className="font-bold text-slate-900">{WARDS.length}</span>
            </div>
          </div>
        </div>

        {/* Map Explorer Full Container */}
        <div className="w-full h-[calc(100vh-210px)] min-h-[660px] rounded-2xl border border-slate-200 overflow-hidden shadow-xs bg-slate-950 relative">
          <GisMapExplorer initialWardId={selectedWardId} />
        </div>
      </div>
    </DashboardShell>
  );
}
