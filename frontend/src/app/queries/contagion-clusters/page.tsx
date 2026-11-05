"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import { HybridQuery3Response, ContagionHazardCluster, EndangeredTree } from "@/lib/hybrid-queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import {
  ShieldAlert,
  AlertTriangle,
  Flame,
  Radio,
  Sliders,
  Database,
  MapPin,
  Clock,
  Layers,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  Info,
  Zap,
  CheckCircle2
} from "lucide-react";

export default function ContagionClustersPage() {
  const [radiusMeters, setRadiusMeters] = useState<number>(500);
  const [threshold, setThreshold] = useState<number>(0.82);
  const [untreatedDays, setUntreatedDays] = useState<number>(365);
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<HybridQuery3Response | null>(null);
  const [selectedTree, setSelectedTree] = useState<EndangeredTree | null>(null);

  const fetchClusters = async (r: number, th: number, days: number) => {
    setLoading(true);
    try {
      const res = await fetch("/api/queries/contagion-clusters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          danger_radius_meters: r,
          similarity_threshold: th,
          untreated_days: days
        })
      });
      const json: HybridQuery3Response = await res.json();
      setData(json);
      if (json.endangered_trees && json.endangered_trees.length > 0) {
        setSelectedTree(json.endangered_trees[0]);
      }
    } catch (err) {
      console.error("Hybrid Query 3 error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClusters(radiusMeters, threshold, untreatedDays);
  }, [radiusMeters, threshold, untreatedDays]);

  const activeZone = data?.hazard_zones[0];

  return (
    <DashboardShell>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-xs font-mono text-red-800 mb-2">
              <Flame className="w-3.5 h-3.5 text-red-600 animate-pulse" />
              <span>Phase 18: Hybrid Query 3 (Contagion Cluster Detection)</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
              Contagion Risk Clusters &amp; Hazard Heat Zones
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Autonomous outbreak contagion detection isolating trees within <code>ST_DWithin({radiusMeters}m)</code> of confirmed epicenters with matching visual symptoms and no recent treatment.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="critical" className="font-mono text-xs px-2.5 py-1">
              <Radio className="w-3 h-3 mr-1 animate-pulse" />
              Active Pathogen Alert Triggered
            </Badge>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 border-red-200 bg-red-50/20">
            <div className="text-xs text-muted-foreground">Active Outbreak Epicenters</div>
            <div className="text-2xl font-extrabold text-destructive mt-1 flex items-center gap-1.5">
              <Flame className="w-5 h-5 text-destructive" />
              {data?.total_hazard_zones || 0} Epicenters
            </div>
            <div className="text-[10px] text-destructive font-mono mt-1 font-bold">CRITICAL Outbreaks</div>
          </Card>

          <Card className="p-4 border-amber-200 bg-amber-50/20">
            <div className="text-xs text-muted-foreground">Endangered Trees in Buffer</div>
            <div className="text-2xl font-extrabold text-amber-700 mt-1">
              {data?.total_endangered_trees || 0} Specimens
            </div>
            <div className="text-[10px] text-amber-800 font-mono mt-1">&lt; {radiusMeters}m Radius</div>
          </Card>

          <Card className="p-4">
            <div className="text-xs text-muted-foreground">Bio-Barrier Priority</div>
            <div className="text-2xl font-extrabold text-foreground mt-1">
              {data?.endangered_trees.filter((t) => t.quarantine_priority === "EMERGENCY_ISOLATE").length || 0}
            </div>
            <div className="text-[10px] text-destructive font-mono mt-1 font-bold">Immediate Containment</div>
          </Card>

          <Card className="p-4">
            <div className="text-xs text-muted-foreground">Tri-Index Latency</div>
            <div className="text-2xl font-extrabold text-emerald-800 mt-1">
              {data?.execution_stats.latency_ms || 0} ms
            </div>
            <div className="text-[10px] text-emerald-800 font-mono mt-1 font-bold">GiST + HNSW + B-Tree</div>
          </Card>
        </div>

        {/* Split-Screen Interactive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Parameter Sliders & SQL (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Outbreak Cluster Parameters
                </span>
                <span className="text-[11px] font-mono text-red-600 font-bold">
                  {activeZone?.detected_disease || "Ganoderma Root Rot"}
                </span>
              </div>

              {/* Danger Radius Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-red-600" />
                    Hazard Buffer Radius (ST_DWithin):
                  </label>
                  <span className="font-mono text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                    {radiusMeters}m
                  </span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="1500"
                  step="50"
                  value={radiusMeters}
                  onChange={(e) => setRadiusMeters(Number(e.target.value))}
                  className="w-full accent-red-600 cursor-pointer h-2 bg-muted rounded-lg"
                />
                <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                  <span>200m (Immediate)</span>
                  <span>500m (Standard Danger)</span>
                  <span>1500m (Macro Ring)</span>
                </div>
              </div>

              {/* Vector Similarity Cutoff */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-800" />
                    Symptom Vector Cutoff (&tau;):
                  </label>
                  <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    &ge; {(threshold * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.70"
                  max="0.90"
                  step="0.02"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-full accent-emerald-800 cursor-pointer h-2 bg-muted rounded-lg"
                />
              </div>

              {/* Untreated Interval */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    Untreated Interval Threshold:
                  </label>
                  <span className="font-mono text-xs font-bold text-foreground bg-muted px-2 py-0.5 rounded">
                    &gt; {untreatedDays} days
                  </span>
                </div>
                <input
                  type="range"
                  min="180"
                  max="730"
                  step="30"
                  value={untreatedDays}
                  onChange={(e) => setUntreatedDays(Number(e.target.value))}
                  className="w-full accent-slate-800 cursor-pointer h-2 bg-muted rounded-lg"
                />
              </div>
            </Card>

            {/* SQL Terminal */}
            <Card className="p-4 bg-slate-950 text-slate-100 font-mono text-xs space-y-2 border-slate-800">
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                <span className="flex items-center gap-1.5 text-red-400">
                  <Database className="w-3.5 h-3.5" />
                  PostGIS ST_Buffer + HNSW Cluster Plan
                </span>
                <span className="text-[10px] text-slate-500">GiST Accelerated</span>
              </div>
              <pre className="text-[11px] text-red-300 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                {data?.sql_executed || "-- Executing contagion cluster detection..."}
              </pre>
            </Card>
          </div>

          {/* Right Column: Interactive Translucent Red Hazard Map (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            <Card className="overflow-hidden border border-border shadow-xs">
              <div className="bg-muted/40 px-4 py-2.5 border-b border-border flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-red-600" />
                  Translucent Hazard Heat Zone ({radiusMeters}m ST_Buffer)
                </span>
                <span className="text-[11px] font-mono text-muted-foreground">
                  Epicenter: {activeZone?.epicenter_tag}
                </span>
              </div>

              {/* Map Canvas */}
              <div className="relative aspect-16/10 bg-slate-950 overflow-hidden flex items-center justify-center p-4">
                <svg viewBox="-300 -200 600 400" className="w-full h-full select-none">
                  {/* Grid Lines */}
                  <defs>
                    <radialGradient id="heatGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity="0.5" />
                      <stop offset="60%" stopColor="#dc2626" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#991b1b" stopOpacity="0.0" />
                    </radialGradient>
                  </defs>

                  {/* Translucent Red Hazard Heat Zone Circle */}
                  {(() => {
                    const scaledRadius = 35 + (radiusMeters / 1500) * 155;
                    return (
                      <>
                        <circle
                          cx="0"
                          cy="0"
                          r={scaledRadius}
                          fill="url(#heatGlow)"
                          stroke="#ef4444"
                          strokeWidth="2"
                          strokeDasharray="6 4"
                          className="animate-pulse"
                        />
                        <text
                          x="0"
                          y={-scaledRadius - 8}
                          textAnchor="middle"
                          fill="#ef4444"
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          DANGER CONTAGION ZONE ({radiusMeters}m BUFFER)
                        </text>
                      </>
                    );
                  })()}

                  {/* Epicenter Target */}
                  <g>
                    <circle cx="0" cy="0" r="14" fill="#ef4444" fillOpacity="0.4" className="animate-ping" />
                    <circle cx="0" cy="0" r="9" fill="#dc2626" />
                    <circle cx="0" cy="0" r="4" fill="#ffffff" />
                    <text x="0" y="24" textAnchor="middle" fill="#fca5a5" fontSize="10" fontWeight="bold">
                      {activeZone?.epicenter_tag} (CRITICAL EPICENTER)
                    </text>
                  </g>

                  {/* Endangered Trees inside Danger Zone */}
                  {(data?.endangered_trees || []).map((t, idx) => {
                    const angle = (idx * (360 / Math.max(1, data!.endangered_trees.length)) * Math.PI) / 180;
                    const r = 30 + (t.distance_to_epicenter_meters / Math.max(1, radiusMeters)) * 130;
                    const cx = Math.cos(angle) * r;
                    const cy = Math.sin(angle) * r;
                    const isSelected = selectedTree?.endangered_tree_id === t.endangered_tree_id;

                    const color =
                      t.quarantine_priority === "EMERGENCY_ISOLATE"
                        ? "#ef4444"
                        : t.quarantine_priority === "HIGH_QUARANTINE"
                        ? "#f59e0b"
                        : "#10b981";

                    return (
                      <g
                        key={t.endangered_tree_id + idx}
                        className="cursor-pointer transition-all"
                        onClick={() => setSelectedTree(t)}
                      >
                        <line
                          x1="0"
                          y1="0"
                          x2={cx}
                          y2={cy}
                          stroke="#ef4444"
                          strokeWidth="0.8"
                          strokeOpacity="0.4"
                          strokeDasharray="2 2"
                        />
                        <circle
                          cx={cx}
                          cy={cy}
                          r={isSelected ? 9 : 6}
                          fill={color}
                          stroke={isSelected ? "#ffffff" : "#450a0a"}
                          strokeWidth={isSelected ? "2" : "1"}
                        />
                        <text
                          x={cx}
                          y={cy - 10}
                          textAnchor="middle"
                          fill="#fecaca"
                          fontSize="8"
                          fontFamily="monospace"
                        >
                          {t.endangered_tag} ({t.distance_to_epicenter_meters}m)
                        </text>
                      </g>
                    );
                  })}
                </svg>

                <div className="absolute bottom-2 right-2 bg-red-950/80 backdrop-blur-xs px-2.5 py-1 rounded text-[10px] font-mono text-red-300 border border-red-800">
                  PostGIS ST_Buffer Polygon • HNSW Vector Scan Active
                </div>
              </div>
            </Card>

            {/* Selected Endangered Specimen Card */}
            {selectedTree && (
              <Card className="p-4 border-red-300 bg-red-50/20 shadow-xs">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-md overflow-hidden bg-black/5 border border-border shrink-0">
                      <img
                        src={selectedTree.photo_url}
                        alt={selectedTree.endangered_tag}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-foreground text-sm">
                          {selectedTree.endangered_tag} — {selectedTree.endangered_species}
                        </h4>
                        <Badge
                          variant={selectedTree.quarantine_priority === "EMERGENCY_ISOLATE" ? "critical" : "warning"}
                          className="font-mono text-[10px]"
                        >
                          {selectedTree.quarantine_priority}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">
                        Distance to Epicenter: <strong>{selectedTree.distance_to_epicenter_meters}m</strong> • Untreated for {selectedTree.days_since_last_inspection}d
                      </div>
                      <div className="text-xs font-semibold text-destructive mt-1">
                        Symptom Similarity to Outbreak: {selectedTree.similarity_percent.toFixed(1)}% Match
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-background rounded-md border border-border text-xs text-muted-foreground max-w-xs">
                    <span className="text-[10px] font-bold text-foreground uppercase tracking-wider block mb-0.5">
                      Field Inspector Quarantine Order
                    </span>
                    {selectedTree.inspector_notes}
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Endangered Trees Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-destructive" />
              Prioritized List of Endangered Trees in Contagion Radius
            </h3>
            <span className="text-xs text-muted-foreground font-mono">
              Ordered by: Quarantine Priority + Proximity (meters)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(data?.endangered_trees || []).map((tree, idx) => (
              <Card
                key={tree.endangered_tree_id + idx}
                onClick={() => setSelectedTree(tree)}
                className={`p-4 cursor-pointer transition-all border ${
                  selectedTree?.endangered_tree_id === tree.endangered_tree_id
                    ? "border-red-600 ring-2 ring-red-600/20 shadow-xs bg-red-50/10"
                    : "border-border hover:border-red-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-md overflow-hidden bg-black/5 border border-border shrink-0">
                    <img
                      src={tree.photo_url}
                      alt={tree.endangered_tag}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-xs text-foreground truncate">
                        {tree.endangered_tag}
                      </span>
                      <Badge
                        variant={tree.quarantine_priority === "EMERGENCY_ISOLATE" ? "critical" : "warning"}
                        className="text-[9px] uppercase font-bold"
                      >
                        {tree.quarantine_priority === "EMERGENCY_ISOLATE" ? "Isolate" : "Quarantine"}
                      </Badge>
                    </div>

                    <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {tree.endangered_species}
                    </div>

                    <div className="flex items-center gap-2 mt-2 text-[10px] font-mono text-muted-foreground">
                      <span className="px-1.5 py-0.5 rounded bg-muted text-red-700 font-bold">
                        {tree.distance_to_epicenter_meters}m away
                      </span>
                      <span>{tree.similarity_percent.toFixed(1)}% Match</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
