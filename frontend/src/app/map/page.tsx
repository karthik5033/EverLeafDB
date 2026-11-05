"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import GisMapExplorer from "@/components/GisMapExplorer";
import { WARDS, TREES } from "@/lib/db";
import { Compass, Trees, ShieldCheck, MapPin, Layers, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function MapPage() {
  const [selectedWardId, setSelectedWardId] = useState<string>("ward_03");

  const totalTrees = TREES.length;
  const healthyCount = TREES.filter((t) => t.health_status === "HEALTHY").length;
  const criticalCount = TREES.filter((t) => t.health_status === "CRITICAL" || t.health_status === "DISEASED").length;

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 flex flex-col p-4 md:p-6 max-w-[1600px] w-full mx-auto gap-4">
        {/* Header HUD */}
        <div className="bg-card p-4 md:p-5 rounded-2xl border border-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
                <Compass className="w-5 h-5" />
              </span>
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-foreground">
                PostGIS Geospatial Subsystem &amp; Ward Map Explorer
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                SRID 4326 GiST
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Interactive vector tile map with dynamic marker clustering, geofence boundary layers, proximity buffer circles (<code className="font-mono text-emerald-800">ST_DWithin</code>), and specimen inspection drawers.
            </p>
          </div>

          {/* Quick HUD Metrics */}
          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="p-2.5 bg-muted/40 rounded-xl border border-border flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-muted-foreground">Healthy:</span>
              <span className="font-bold text-foreground">{healthyCount}</span>
            </div>
            <div className="p-2.5 bg-muted/40 rounded-xl border border-border flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-destructive"></span>
              <span className="text-muted-foreground">Critical:</span>
              <span className="font-bold text-destructive">{criticalCount}</span>
            </div>
            <div className="p-2.5 bg-muted/40 rounded-xl border border-border flex items-center gap-2">
              <span className="text-muted-foreground">Wards:</span>
              <span className="font-bold text-foreground">{WARDS.length}</span>
            </div>
          </div>
        </div>

        {/* Map Explorer Full Container */}
        <div className="flex-1 w-full min-h-[640px] rounded-2xl border border-border overflow-hidden shadow-xs bg-[#091b15]">
          <GisMapExplorer initialWardId={selectedWardId} />
        </div>
      </main>
    </div>
  );
}
