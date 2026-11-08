"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import { WARDS, SPECIES_SEED } from "@/lib/db";
import { HybridQuery2Response, WardDiseaseSearchResult } from "@/lib/hybrid-queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import {
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Clock,
  Sparkles,
  Database,
  Building2,
  Trees,
  Layers,
  ArrowRight,
  Info,
  Stethoscope,
  Filter,
  Check
} from "lucide-react";

export default function WardDiseaseSearchPage() {
  const [selectedWardId, setSelectedWardId] = useState<string>("ward_03");
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<HybridQuery2Response | null>(null);

  const fetchWardCases = async (wardId: string, speciesId: number) => {
    setLoading(true);
    try {
      const res = await fetch("/api/queries/ward-disease-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ward_id: wardId,
          species_id: speciesId,
          limit: 6
        })
      });
      const json: HybridQuery2Response = await res.json();
      setData(json);
    } catch (err) {
      console.error("Hybrid Query 2 error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWardCases(selectedWardId, selectedSpeciesId);
  }, [selectedWardId, selectedSpeciesId]);

  const activeWard = WARDS.find((w) => w.ward_id === selectedWardId) || WARDS[0];

  return (
    <DashboardShell>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700 mb-2">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Hybrid Query 2 • Ward Outbreaks &amp; Curative Precedents</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
              Ward-Level Curated Disease &amp; Treatment Search
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Filters by administrative <code>ward_id</code>, botanical <code>species_id</code>, and strictly <code>outcome_status = 'SUCCESSFUL'</code>, ranked by symptom vector cosine distance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="emerald" className="font-mono text-xs px-2.5 py-1">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              100% Curative Precedents Only
            </Badge>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* Ward Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-800" />
                Administrative Ward:
              </label>
              <select
                value={selectedWardId}
                onChange={(e) => setSelectedWardId(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm font-medium focus:ring-2 focus:ring-emerald-700/20"
              >
                {WARDS.map((w) => (
                  <option key={w.ward_id} value={w.ward_id}>
                    {w.name} ({w.zone} • {w.tree_count} trees)
                  </option>
                ))}
              </select>
            </div>

            {/* Species Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Trees className="w-3.5 h-3.5 text-emerald-800" />
                Target Botanical Species:
              </label>
              <select
                value={selectedSpeciesId}
                onChange={(e) => setSelectedSpeciesId(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm font-medium focus:ring-2 focus:ring-emerald-700/20"
              >
                {SPECIES_SEED.map((s) => (
                  <option key={s.species_id} value={s.species_id}>
                    {s.common_name} ({s.scientific_name})
                  </option>
                ))}
              </select>
            </div>

            {/* Ward Stats Pill */}
            <div className="p-3 bg-muted/40 rounded-lg border border-border/60 text-xs font-mono flex items-center justify-between">
              <div>
                <span className="text-muted-foreground block text-[10px]">Zone &amp; Cover:</span>
                <span className="font-bold text-foreground">
                  {activeWard.zone} • {activeWard.canopy_cover_percent}% Cover
                </span>
              </div>
              <Badge variant="outline" className="font-mono text-[11px]">
                {activeWard.area_sq_km} km²
              </Badge>
            </div>
          </div>
        </Card>

        {/* Efficacy Highlights Banner */}
        {data?.top_effective_treatment && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 border-emerald-300 bg-emerald-50/30">
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
                Top Prescribed Protocol
              </span>
              <div className="text-sm font-extrabold text-emerald-950 mt-1 line-clamp-2">
                {data.top_effective_treatment.name}
              </div>
              <div className="text-[10px] font-mono text-emerald-700 mt-1 uppercase font-bold">
                Protocol: {data.top_effective_treatment.type}
              </div>
            </Card>

            <Card className="p-4">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Average Cure Window
              </span>
              <div className="text-2xl font-extrabold text-foreground mt-1 flex items-center gap-1.5">
                <Clock className="w-5 h-5 text-emerald-800" />
                {data.top_effective_treatment.cure_days} Days
              </div>
              <div className="text-[10px] font-mono text-muted-foreground mt-1">
                From initial injection to stabilization
              </div>
            </Card>

            <Card className="p-4">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Average Unit Cost
              </span>
              <div className="text-2xl font-extrabold text-emerald-800 mt-1 flex items-center gap-1.5">
                <DollarSign className="w-5 h-5 text-emerald-800" />
                ${data.top_effective_treatment.avg_cost.toFixed(2)}
              </div>
              <div className="text-[10px] font-mono text-emerald-800 mt-1 font-bold">
                100% Curative Success Rate
              </div>
            </Card>

            <Card className="p-4">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Execution Latency
              </span>
              <div className="text-2xl font-extrabold text-foreground mt-1">
                {data.execution_stats.latency_ms} ms
              </div>
              <div className="text-[10px] font-mono text-emerald-800 mt-1">
                Tri-Index Acceleration
              </div>
            </Card>
          </div>
        )}

        {/* SQL Execution Terminal */}
        <Card className="p-4 bg-slate-950 text-slate-100 font-mono text-xs space-y-2 border-slate-800">
          <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Database className="w-3.5 h-3.5" />
              Hybrid Query 2 SQL Plan: Relational Filter + HNSW Cosine Rank
            </span>
            <span className="text-[10px] text-slate-500">
              {data?.execution_stats.btree_indexes}
            </span>
          </div>
          <pre className="text-[11px] text-emerald-300 leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-[170px] overflow-y-auto custom-scrollbar">
            {data?.sql_executed || "-- Executing ward disease query..."}
          </pre>
        </Card>

        {/* Curated Precedent Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-lg text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-800" />
              Curated Successful Treatment Precedents in {activeWard.name}
            </h3>
            <span className="text-xs font-mono text-muted-foreground">
              {data?.results.length || 0} Successful Cases Retrieved
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(data?.results || []).map((c, idx) => (
              <Card
                key={c.tree_id + idx}
                className="overflow-hidden border border-border shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="bg-muted/40 p-3 border-b border-border flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">
                      {c.tag_number} ({c.species_common})
                    </span>
                    <Badge variant="emerald" className="font-mono text-[10px] font-bold">
                      {c.similarity_percent.toFixed(1)}% Match
                    </Badge>
                  </div>

                  <CardContent className="p-4 space-y-3">
                    {/* Photo + Disease */}
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-md overflow-hidden bg-black/5 border border-border shrink-0">
                        <img
                          src={c.photo_url}
                          alt={c.disease_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <Badge
                          variant={c.severity_level === "CRITICAL" ? "critical" : "warning"}
                          className="text-[9px] uppercase font-bold mb-1"
                        >
                          {c.severity_level}
                        </Badge>
                        <h4 className="text-sm font-extrabold text-foreground leading-tight">
                          {c.disease_name}
                        </h4>
                        <span className="text-[10px] font-mono text-muted-foreground block mt-0.5">
                          Cosine Dist: {c.cosine_distance}
                        </span>
                      </div>
                    </div>

                    {/* Inspector Observations */}
                    <div className="p-2.5 rounded-md bg-muted/30 border border-border/40 text-xs text-muted-foreground leading-relaxed">
                      <div className="text-[9px] font-bold text-foreground uppercase tracking-wider mb-0.5 flex items-center gap-1">
                        <Info className="w-3 h-3 text-emerald-800" />
                        Field Inspector Case Summary
                      </div>
                      {c.inspector_notes}
                    </div>

                    {/* Prescribed Treatment Efficacy */}
                    <div className="p-2.5 rounded-md border border-emerald-200 bg-emerald-50/50 space-y-1.5">
                      <div className="text-[10px] font-bold text-emerald-950 uppercase tracking-wider flex items-center justify-between">
                        <span>Curative Protocol</span>
                        <span className="text-emerald-800 font-mono">{c.treatment_type}</span>
                      </div>
                      <div className="text-xs font-bold text-emerald-900">
                        {c.treatment_name}
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-200/60 text-[11px] font-mono text-emerald-800">
                        <span>Window: <strong>{c.cure_duration_days}d</strong></span>
                        <span>Cost: <strong>${c.actual_cost.toFixed(2)}</strong></span>
                      </div>
                    </div>
                  </CardContent>
                </div>

                <CardFooter className="p-4 pt-0">
                  <div className="w-full py-1.5 px-2 rounded bg-emerald-50 text-emerald-900 border border-emerald-200/80 flex items-center justify-center gap-1.5 text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Verified Cured • No Relapse Recorded</span>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

