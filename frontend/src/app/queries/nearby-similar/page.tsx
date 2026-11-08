"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import { TREES, SPECIES_SEED, Tree } from "@/lib/db";
import { NearbySimilarResult, HybridQuery1Response } from "@/lib/hybrid-queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Compass,
  Layers,
  Sparkles,
  Sliders,
  MapPin,
  Trees,
  Database,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  Info,
  Clock,
  Zap,
  Activity
} from "lucide-react";

const NearbySimilarMap = dynamic(() => import("@/components/NearbySimilarMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[420px] rounded-xl flex flex-col items-center justify-center bg-slate-950 text-slate-300 border border-slate-800">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-3" />
      <p className="font-mono text-xs text-white">Initializing PostGIS Spatial Buffer Map...</p>
      <p className="text-[11px] text-slate-400 mt-0.5">Projecting SRID 4326 GIS Coordinates &amp; Vector Precedents</p>
    </div>
  )
});

export default function NearbySimilarQueryPage() {
  const [selectedTreeId, setSelectedTreeId] = useState<string>("tree_1084");
  const [radiusMeters, setRadiusMeters] = useState<number>(500);
  const [loading, setLoading] = useState<boolean>(false);
  const [queryData, setQueryData] = useState<HybridQuery1Response | null>(null);
  const [selectedResult, setSelectedResult] = useState<NearbySimilarResult | null>(null);

  const selectedTree = useMemo(() => {
    return TREES.find((t) => t.tree_id === selectedTreeId || (t as any).id === selectedTreeId) || TREES[0];
  }, [selectedTreeId]);

  const fetchNearbySimilar = async (treeId: string, radius: number) => {
    setLoading(true);
    try {
      const res = await fetch("/api/queries/nearby-similar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tree_id: treeId,
          radius_meters: radius,
          limit: 6
        })
      });
      const data: HybridQuery1Response = await res.json();
      setQueryData(data);
      if (data.results && data.results.length > 0) {
        setSelectedResult(data.results[0]);
      }
    } catch (err) {
      console.error("Hybrid Query 1 error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNearbySimilar(selectedTreeId, radiusMeters);
  }, [selectedTreeId, radiusMeters]);

  // Scaled coordinates for SVG mini-map rendering
  const mapCenter = useMemo(() => {
    return { lat: selectedTree.latitude, lng: selectedTree.longitude };
  }, [selectedTree]);

  return (
    <DashboardShell>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700 mb-2">
              <Compass className="w-3.5 h-3.5 text-slate-500" />
              <span>Hybrid Query 1 • Spatial GiST + pgvector</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
              Nearby Visually Similar Species Query
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Evaluates <code>ST_DWithin(geom, $target, radius)</code> combined with <code>img.image_embedding &lt;=&gt; $vec</code> on identical species.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="emerald" className="font-mono text-xs px-2.5 py-1">
              <Zap className="w-3 h-3 mr-1" />
              Dual-Index Acceleration (GiST + HNSW)
            </Badge>
          </div>
        </div>

        {/* Split Screen Control Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Query Parameters & SQL Terminal (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Query 1 Parameters
                </span>
                <span className="text-[11px] font-mono text-emerald-800 font-bold">
                  {selectedTree.species_common}
                </span>
              </div>

              {/* Target Tree Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Target Focal Tree:</label>
                <select
                  value={selectedTreeId}
                  onChange={(e) => setSelectedTreeId(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm font-medium focus:ring-2 focus:ring-emerald-700/20"
                >
                  {TREES.slice(0, 8).map((t) => (
                    <option key={t.tree_id || (t as any).id} value={t.tree_id || (t as any).id}>
                      {t.tag_number} — {t.species_common} ({t.ward_name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Radius Slider */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-emerald-800" />
                    Spatial Buffer Radius (ST_DWithin):
                  </label>
                  <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {radiusMeters} meters
                  </span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="2000"
                  step="50"
                  value={radiusMeters}
                  onChange={(e) => setRadiusMeters(Number(e.target.value))}
                  className="w-full accent-emerald-800 cursor-pointer h-2 bg-muted rounded-lg"
                />
                <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                  <span>100m (Immediate Stand)</span>
                  <span>500m (Default Buffer)</span>
                  <span>2000m (Ward Sector)</span>
                </div>
              </div>

              {/* Vector Details */}
              <div className="p-3 bg-muted/40 rounded-lg border border-border/60 text-xs font-mono space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Vector Metric:</span>
                  <span className="text-emerald-800 font-bold">&lt;=&gt; Cosine Distance</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Target Coordinates:</span>
                  <span className="text-foreground font-bold">
                    {selectedTree.latitude.toFixed(4)}, {selectedTree.longitude.toFixed(4)}
                  </span>
                </div>
              </div>

              {/* Execution Telemetry Stats */}
              {queryData && (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-200/80">
                    <span className="text-[10px] text-emerald-800 font-mono block">Query Latency</span>
                    <span className="text-lg font-extrabold text-emerald-950">
                      {queryData.execution_stats.latency_ms} ms
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/50 border border-border">
                    <span className="text-[10px] text-muted-foreground font-mono block">Candidates Filtered</span>
                    <span className="text-lg font-extrabold text-foreground">
                      {queryData.spatial_filter_count} Specimens
                    </span>
                  </div>
                </div>
              )}
            </Card>

            {/* SQL Terminal Preview */}
            <Card className="p-4 bg-slate-950 text-slate-100 font-mono text-xs space-y-2 border-slate-800">
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <Database className="w-3.5 h-3.5" />
                  PostGIS + pgvector Query Plan
                </span>
                <span className="text-[10px] text-slate-500">Hybrid Optimization</span>
              </div>
              <pre className="text-[11px] text-emerald-300 leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-[160px] overflow-y-auto custom-scrollbar">
                {queryData?.sql_executed || "-- Executing hybrid query..."}
              </pre>
            </Card>
          </div>

          {/* Right Column: Interactive Spatial Buffer Map & Results (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Production Leaflet GIS Map with Real Satellite/Dark/Street Tiles */}
            <NearbySimilarMap
              targetTree={selectedTree}
              radiusMeters={radiusMeters}
              results={queryData?.results || []}
              selectedResult={selectedResult}
              onSelectResult={setSelectedResult}
            />

            {/* Selected Specimen Preview Card */}
            {selectedResult && (
              <Card className="p-4 border-emerald-300 bg-emerald-50/20 shadow-xs">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-md overflow-hidden bg-black/5 border border-border shrink-0">
                      <img
                        src={selectedResult.photo_url}
                        alt={selectedResult.disease_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-foreground text-sm">
                          {selectedResult.tag_number} — {selectedResult.species_common}
                        </h4>
                        <Badge
                          variant={selectedResult.similarity_percent >= 82 ? "critical" : "emerald"}
                          className="font-mono text-[10px]"
                        >
                          {selectedResult.similarity_percent.toFixed(1)}% Match
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">
                        Distance: <strong>{selectedResult.distance_meters}m away</strong> • Cosine Dist: {selectedResult.cosine_distance}
                      </div>
                      <div className="text-xs text-foreground font-semibold mt-1">
                        Diagnosis: {selectedResult.disease_name}
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-background rounded-md border border-border text-xs text-muted-foreground max-w-xs">
                    <span className="text-[10px] font-bold text-foreground uppercase tracking-wider block mb-0.5">
                      Field Inspector Notes
                    </span>
                    {selectedResult.inspector_notes}
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Results Ranking Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-800" />
              Retrieved Neighbors Ranked by Visual Similarity
            </h3>
            <span className="text-xs text-muted-foreground font-mono">
              Ordered by: <code>img.image_embedding &lt;=&gt; $vec ASC</code>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(queryData?.results || []).map((item, idx) => (
              <Card
                key={item.tree_id + idx}
                onClick={() => setSelectedResult(item)}
                className={`p-4 cursor-pointer transition-all border ${
                  selectedResult?.tree_id === item.tree_id
                    ? "border-emerald-700 ring-2 ring-emerald-700/20 shadow-xs bg-emerald-50/10"
                    : "border-border hover:border-emerald-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-md overflow-hidden bg-black/5 border border-border shrink-0">
                    <img
                      src={item.photo_url}
                      alt={item.disease_name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-xs text-foreground truncate">
                        {item.tag_number}
                      </span>
                      <span className="text-xs font-mono font-extrabold text-emerald-800">
                        {item.similarity_percent.toFixed(1)}%
                      </span>
                    </div>

                    <div className="text-[11px] text-muted-foreground truncate">
                      {item.disease_name}
                    </div>

                    <div className="flex items-center gap-2 mt-2 text-[10px] font-mono text-muted-foreground">
                      <span className="px-1.5 py-0.5 rounded bg-muted">
                        {item.distance_meters}m away
                      </span>
                      <span>Dist: {item.cosine_distance}</span>
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

