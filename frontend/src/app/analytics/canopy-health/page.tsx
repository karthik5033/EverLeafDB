"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import { WARDS } from "@/lib/db";
import {
  HybridQuery5Response,
  HybridQuery6Response,
  OverdueTreeRecord,
  SpeciesMortalityDriver
} from "@/lib/mortality-analytics";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import {
  AlertTriangle,
  Clock,
  Skull,
  TrendingDown,
  Building2,
  Trees,
  Database,
  ArrowRight,
  ShieldAlert,
  Stethoscope,
  Activity,
  Sliders,
  Filter,
  CheckCircle2,
  Calendar
} from "lucide-react";

export default function CanopyHealthAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<"overdue" | "mortality">("overdue");
  const [overdueDays, setOverdueDays] = useState<number>(180);
  const [selectedWard, setSelectedWard] = useState<string>("all");
  const [overdueData, setOverdueData] = useState<HybridQuery5Response | null>(null);
  const [mortalityData, setMortalityData] = useState<HybridQuery6Response | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchOverdue = async (days: number, ward: string) => {
    try {
      const wardParam = ward !== "all" ? `&ward_id=${ward}` : "";
      const res = await fetch(`/api/analytics/overdue-inspections?overdue_days=${days}${wardParam}`);
      const json: HybridQuery5Response = await res.json();
      setOverdueData(json);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMortality = async () => {
    try {
      const res = await fetch("/api/analytics/mortality-drivers");
      const json: HybridQuery6Response = await res.json();
      setMortalityData(json);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchOverdue(overdueDays, selectedWard);
    fetchMortality();
  }, [overdueDays, selectedWard]);

  return (
    <DashboardShell>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700 mb-2">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Hybrid Query 5 &amp; 6 • Overdue Inspections &amp; Mortality Analytics</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
              Canopy Overdue Inspections &amp; Tree Mortality
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Dual SQL analytics tracking uninspected canopy risk zones (&gt; 180 days) alongside species lifespan deficit and fatal pathogen drivers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/inspections/new">
              <Button className="bg-slate-950 hover:bg-slate-800 text-white font-medium h-9 text-xs shadow-xs px-4">
                <Stethoscope className="w-4 h-4 mr-1.5" />
                Dispatch Field Inspector
              </Button>
            </Link>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab("overdue")}
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "overdue"
                ? "border-emerald-800 text-emerald-800"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Clock className="w-4 h-4" />
            Query 5: Overdue Inspections ({overdueData?.total_overdue_trees || 0})
          </button>
          <button
            onClick={() => setActiveTab("mortality")}
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "mortality"
                ? "border-emerald-800 text-emerald-800"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Skull className="w-4 h-4 text-destructive" />
            Query 6: Mortality &amp; Lifespan Deficits ({mortalityData?.mortality_drivers.length || 0} Species)
          </button>
        </div>

        {/* TAB 1: OVERDUE INSPECTIONS (QUERY 5) */}
        {activeTab === "overdue" && (
          <div className="space-y-6">
            {/* Filter Toolbar */}
            <Card className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                {/* Overdue Days Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-emerald-800" />
                      Overdue Threshold:
                    </label>
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      &gt; {overdueDays} Days
                    </span>
                  </div>
                  <input
                    type="range"
                    min="90"
                    max="365"
                    step="15"
                    value={overdueDays}
                    onChange={(e) => setOverdueDays(Number(e.target.value))}
                    className="w-full accent-emerald-800 cursor-pointer h-2 bg-muted rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                    <span>90d (Quarterly)</span>
                    <span>180d (Biannual Target)</span>
                    <span>365d (Critical Hazard)</span>
                  </div>
                </div>

                {/* Ward Filter Dropdown */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-800" />
                    Filter by Administrative Ward:
                  </label>
                  <select
                    value={selectedWard}
                    onChange={(e) => setSelectedWard(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm font-medium focus:ring-2 focus:ring-emerald-700/20"
                  >
                    <option value="all">All Administrative Wards (Municipal Fleet)</option>
                    {WARDS.map((w) => (
                      <option key={w.ward_id} value={w.ward_id}>
                        {w.name} ({w.zone})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>

            {/* Ward Summary Pills */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(overdueData?.ward_summaries || []).slice(0, 4).map((ws) => (
                <Card key={ws.ward_id} className="p-3.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground truncate">{ws.ward_name}</span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {ws.overdue_rate_percent}% Overdue
                    </Badge>
                  </div>
                  <div className="text-2xl font-extrabold text-foreground">
                    {ws.overdue_count} trees
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground">
                    Max Uninspected: <strong>{ws.max_days_uninspected} days</strong>
                  </div>
                </Card>
              ))}
            </div>

            {/* SQL Terminal Preview */}
            <Card className="p-4 bg-slate-950 text-slate-100 font-mono text-xs space-y-2 border-slate-800">
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <Database className="w-3.5 h-3.5" />
                  Query 5 SQL: Window Partition by Ward Ordered by Days Overdue
                </span>
                <span className="text-[10px] text-slate-500">
                  Latency: {overdueData?.execution_stats.latency_ms} ms
                </span>
              </div>
              <pre className="text-[11px] text-emerald-300 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                {overdueData?.sql_executed || "-- Executing overdue inspections query..."}
              </pre>
            </Card>

            {/* Overdue Trees Leaderboard Table */}
            <Card className="overflow-hidden border border-border shadow-xs">
              <CardHeader className="p-4 border-b border-border bg-muted/30">
                <CardTitle className="text-sm font-extrabold flex items-center justify-between">
                  <span>Priority Inspection Queue (Ranked by Days Overdue)</span>
                  <span className="text-xs font-mono font-normal text-muted-foreground">
                    {overdueData?.overdue_trees.length || 0} Trees Requiring Immediate Field Inspection
                  </span>
                </CardTitle>
              </CardHeader>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Ward Rank</TableHead>
                      <TableHead>Specimen Tag</TableHead>
                      <TableHead>Botanical Species</TableHead>
                      <TableHead>Administrative Ward</TableHead>
                      <TableHead>Health Status</TableHead>
                      <TableHead className="text-right">Days Overdue</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(overdueData?.overdue_trees || []).map((tree) => (
                      <TableRow key={tree.tree_id}>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-[11px] font-bold">
                            #{tree.ward_rank}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <Link
                            href={`/trees/${tree.tree_id}`}
                            className="font-bold text-xs text-foreground hover:text-emerald-800 transition-colors"
                          >
                            {tree.tag_number}
                          </Link>
                        </TableCell>

                        <TableCell className="text-xs font-semibold text-foreground">
                          {tree.species_common}
                        </TableCell>

                        <TableCell className="text-xs text-muted-foreground">
                          {tree.ward_name}
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={
                              tree.health_status === "CRITICAL"
                                ? "critical"
                                : tree.health_status === "DISEASED"
                                ? "warning"
                                : "secondary"
                            }
                            className="text-[10px] uppercase font-bold"
                          >
                            {tree.health_status}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right font-mono text-xs font-extrabold text-foreground">
                          {tree.days_overdue} days
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={
                              tree.overdue_severity === "CRITICAL_OVERDUE"
                                ? "critical"
                                : tree.overdue_severity === "HIGH_OVERDUE"
                                ? "warning"
                                : "secondary"
                            }
                            className="text-[10px] uppercase font-bold"
                          >
                            {tree.overdue_severity.replace("_", " ")}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          <Link href={`/inspections/new?tree_id=${tree.tree_id}`}>
                            <Button size="sm" className="h-7 text-xs bg-emerald-800 hover:bg-emerald-700 text-white font-bold">
                              Inspect Now
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 2: MORTALITY DRIVERS & LIFESPAN (QUERY 6) */}
        {activeTab === "mortality" && (
          <div className="space-y-6">
            {/* Mortality Top KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 border-red-200 bg-red-50/20">
                <span className="text-xs font-semibold text-destructive uppercase tracking-wider block">
                  Highest Mortality Species
                </span>
                <div className="text-xl font-extrabold text-foreground mt-1">
                  {mortalityData?.mortality_drivers[0]?.species_common || "Royal Gulmohar"}
                </div>
                <div className="text-[10px] font-mono text-destructive mt-1 font-bold">
                  {mortalityData?.mortality_drivers[0]?.observed_mortality_count} Mortalities Observed
                </div>
              </Card>

              <Card className="p-4">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Largest Lifespan Deficit
                </span>
                <div className="text-xl font-extrabold text-foreground mt-1">
                  {mortalityData?.mortality_drivers.find((d) => d.species_id === 2)?.species_common}
                </div>
                <div className="text-[10px] font-mono text-amber-700 mt-1 font-bold">
                  -255.8 Years Lost to Ganoderma
                </div>
              </Card>

              <Card className="p-4">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Query Latency
                </span>
                <div className="text-xl font-extrabold text-emerald-800 mt-1">
                  {mortalityData?.execution_stats.latency_ms || 0} ms
                </div>
                <div className="text-[10px] font-mono text-emerald-800 mt-1">
                  SQL Window Functions Active
                </div>
              </Card>
            </div>

            {/* SQL Terminal for Query 6 */}
            <Card className="p-4 bg-slate-950 text-slate-100 font-mono text-xs space-y-2 border-slate-800">
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                <span className="flex items-center gap-1.5 text-red-400">
                  <Database className="w-3.5 h-3.5" />
                  Query 6 SQL: Window Partition by Species &amp; Fatal Pathogen Ranking
                </span>
                <span className="text-[10px] text-slate-500">
                  {mortalityData?.execution_stats.window_indexes}
                </span>
              </div>
              <pre className="text-[11px] text-red-300 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                {mortalityData?.sql_executed || "-- Executing tree mortality analytics..."}
              </pre>
            </Card>

            {/* Mortality Drivers Table */}
            <Card className="overflow-hidden border border-border shadow-xs">
              <CardHeader className="p-4 border-b border-border bg-muted/30">
                <CardTitle className="text-sm font-extrabold flex items-center justify-between">
                  <span>Species Lifespan Deficit &amp; Top Fatal Disease Driver</span>
                  <span className="text-xs font-mono font-normal text-muted-foreground">
                    Derived from Removal &amp; Post-Mortem Records
                  </span>
                </CardTitle>
              </CardHeader>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Botanical Species</TableHead>
                      <TableHead className="text-right">Typical Lifespan</TableHead>
                      <TableHead className="text-right">Observed Avg Death Age</TableHead>
                      <TableHead className="text-right">Lifespan Deficit</TableHead>
                      <TableHead>Primary Fatal Disease Driver</TableHead>
                      <TableHead className="text-center">Fatal Cases</TableHead>
                      <TableHead className="text-right">Pathogen %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(mortalityData?.mortality_drivers || []).map((item) => (
                      <TableRow key={item.species_id}>
                        <TableCell>
                          <div className="font-bold text-xs text-foreground">
                            {item.species_common}
                          </div>
                          <span className="text-[10px] italic font-mono text-muted-foreground">
                            {item.species_scientific}
                          </span>
                        </TableCell>

                        <TableCell className="text-right font-mono text-xs">
                          {item.typical_lifespan_years} yrs
                        </TableCell>

                        <TableCell className="text-right font-mono text-xs font-extrabold text-foreground">
                          {item.avg_lifespan_at_death_years} yrs
                        </TableCell>

                        <TableCell className="text-right">
                          <span className="inline-flex items-center font-mono text-xs font-bold text-destructive">
                            <TrendingDown className="w-3.5 h-3.5 mr-1" />
                            -{item.lifespan_deficit_years} yrs
                          </span>
                        </TableCell>

                        <TableCell>
                          <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                            <Skull className="w-3.5 h-3.5 text-destructive" />
                            {item.top_fatal_disease}
                          </div>
                        </TableCell>

                        <TableCell className="text-center font-mono text-xs">
                          {item.fatal_cases_attributed} / {item.observed_mortality_count}
                        </TableCell>

                        <TableCell className="text-right font-mono text-xs font-extrabold text-destructive">
                          {item.fatal_pathogen_percentage}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
