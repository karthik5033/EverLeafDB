"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Trees,
  Activity,
  ShieldAlert,
  Clock,
  Download,
  RefreshCw,
  Building2,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  DollarSign,
  Layers,
  ArrowUpRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  ExecutiveCityKpis,
  HealthDistributionSlice,
  SpeciesBiodiversityBar
} from "@/lib/executive-analytics";
import { WardHealthSummaryRecord } from "@/lib/materialized-views";
import { DashboardShell } from "@/components/DashboardShell";

export default function ExecutiveAnalyticsDashboard() {
  const [kpis, setKpis] = useState<ExecutiveCityKpis | null>(null);
  const [healthDist, setHealthDist] = useState<HealthDistributionSlice[]>([]);
  const [speciesBio, setSpeciesBio] = useState<SpeciesBiodiversityBar[]>([]);
  const [wardSummaries, setWardSummaries] = useState<WardHealthSummaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [wardSearch, setWardSearch] = useState("");

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/analytics/overview");
      const data = await res.json();
      if (data.success) {
        setKpis(data.kpis);
        setHealthDist(data.health_distribution || []);
        setSpeciesBio(data.species_biodiversity || []);
        setWardSummaries(data.ward_summaries || []);
      }
    } catch (err) {
      console.error("Failed to load executive overview:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const handleRefreshViews = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/cron/refresh-views", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        await fetchOverviewData();
      }
    } catch (err) {
      console.error("Failed to refresh views:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDownloadCsv = () => {
    window.location.href = "/api/analytics/export";
  };

  const filteredWards = wardSummaries.filter(
    (w) =>
      w.ward_name.toLowerCase().includes(wardSearch.toLowerCase()) ||
      w.ward_id.toLowerCase().includes(wardSearch.toLowerCase())
  );

  // Donut chart calculations
  const totalTrees = kpis?.total_managed_trees || 1;
  let accumulatedAngle = 0;
  const donutSlices = healthDist.map((slice) => {
    const angle = (slice.count / totalTrees) * 360;
    const startAngle = accumulatedAngle;
    accumulatedAngle += angle;
    return {
      ...slice,
      startAngle,
      angle
    };
  });

  return (
    <DashboardShell>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Municipal Executive Analytics &amp; Canopy Intelligence
                </h1>
                <p className="text-sm text-slate-500">
                  City-wide forest health indices, species biodiversity distributions, and ward comparative analytics powered by sub-millisecond Materialized Views.
                </p>
              </div>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshViews}
              disabled={refreshing || loading}
              className="gap-1.5 text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh Materialized View
            </Button>

            <Button
              size="sm"
              onClick={handleDownloadCsv}
              className="gap-1.5 text-xs bg-slate-950 hover:bg-slate-800 text-white font-medium"
            >
              <Download className="h-3.5 w-3.5" />
              Export Municipal CSV
            </Button>
          </div>
        </div>

        {/* 4 Hero KPI Cards */}
        {kpis && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-white border-slate-200 shadow-xs">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-medium uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  Managed Canopy Trees
                  <Trees className="h-4 w-4 text-emerald-600" />
                </CardDescription>
                <CardTitle className="text-2xl font-bold text-slate-900">
                  {kpis.total_managed_trees.toLocaleString()} Trees
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500">Across {kpis.total_covered_wards} municipal wards</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-xs">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-medium uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  Forest Health Index
                  <Activity className="h-4 w-4 text-emerald-600" />
                </CardDescription>
                <CardTitle className="text-2xl font-bold text-emerald-700">
                  {kpis.forest_health_index_pct}%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500">Avg condition: {kpis.city_avg_condition_score} / 5.0</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-xs">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-medium uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  Active Contagion Alerts
                  <ShieldAlert className="h-4 w-4 text-red-600" />
                </CardDescription>
                <CardTitle className="text-2xl font-bold text-red-700">
                  {kpis.active_contagion_alerts} Outbreaks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500">Flagged by HNSW vector trigger</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-xs">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-medium uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  Overdue Inspections
                  <Clock className="h-4 w-4 text-amber-500" />
                </CardDescription>
                <CardTitle className="text-2xl font-bold text-amber-700">
                  {kpis.overdue_inspections_count} Due
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500">&gt; 180 days since last transect</p>
              </CardContent>
            </Card>
          </div>
        )}

      {/* Visualizations Grid: Health Distribution Donut & Species Biodiversity Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Health Distribution Donut Chart */}
        <Card className="lg:col-span-5 border-border/60 shadow-sm flex flex-col">
          <CardHeader className="pb-2 border-b border-border/30">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-500" />
                Canopy Health Distribution
              </span>
              <Badge variant="outline" className="text-[10px] font-mono">
                100% Census
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              Categorical breakdown of municipal specimens by pathological vigor
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
            {/* SVG Donut Visual */}
            <div className="relative flex items-center justify-center py-4">
              <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="100"
                  cy="100"
                  r="75"
                  stroke="currentColor"
                  strokeWidth="26"
                  fill="none"
                  className="text-muted/30"
                />

                {/* Donut Arcs */}
                {donutSlices.map((slice, idx) => {
                  const circumference = 2 * Math.PI * 75;
                  const strokeDasharray = `${(slice.angle / 360) * circumference} ${circumference}`;
                  const strokeDashoffset = -((slice.startAngle / 360) * circumference);

                  return (
                    <circle
                      key={slice.status}
                      cx="100"
                      cy="100"
                      r="75"
                      stroke={slice.color_hex}
                      strokeWidth="26"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      fill="none"
                      className="transition-all duration-500 hover:opacity-85"
                    />
                  );
                })}
              </svg>

              {/* Center Metric Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-extrabold text-foreground font-mono">
                  {kpis?.forest_health_index_pct}%
                </span>
                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                  Health Index
                </span>
              </div>
            </div>

            {/* Categorical Legend */}
            <div className="space-y-2 pt-2 border-t border-border/40">
              {healthDist.map((cat) => (
                <div key={cat.status} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color_hex }}
                    />
                    <span className="font-medium text-foreground">{cat.label}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-muted-foreground">{cat.count} trees</span>
                    <span className="font-bold text-foreground w-12 text-right">
                      {cat.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right Column (7 cols): Species Biodiversity Breakdown Bar Chart */}
        <Card className="lg:col-span-7 border-border/60 shadow-sm flex flex-col">
          <CardHeader className="pb-2 border-b border-border/30">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Trees className="h-4 w-4 text-emerald-500" />
                Species Biodiversity & Population Share
              </span>
              <Badge variant="outline" className="text-[10px] font-mono">
                {speciesBio.length} Botanical Taxa
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              Relative census percentages, biomass, and disease susceptibility across botanical species
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 flex-1 space-y-4">
            <div className="space-y-3.5">
              {speciesBio.map((sp) => {
                const maxPct = Math.max(...speciesBio.map((s) => s.biodiversity_percentage), 1);
                const barWidth = Math.max(8, (sp.biodiversity_percentage / maxPct) * 100);

                return (
                  <div key={sp.species_id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-foreground">{sp.common_name}</span>{" "}
                        <span className="text-[11px] text-muted-foreground italic">
                          ({sp.scientific_name})
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-mono">
                        <span className="text-muted-foreground">{sp.population_count} trees</span>
                        <span className="font-bold text-foreground w-10 text-right">
                          {sp.biodiversity_percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2.5 w-full bg-muted/40 rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                      <span>Avg DBH: {sp.avg_dbh_cm} cm</span>
                      <span>Avg Height: {sp.avg_height_m} m</span>
                      <span className={sp.diseased_count > 0 ? "text-amber-500" : "text-emerald-500"}>
                        {sp.diseased_count > 0 ? `${sp.diseased_count} under treatment` : "Zero active lesions"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ward-by-Ward Comparison Table (Materialized View) */}
      <Card className="border-slate-200 shadow-xs bg-white">
        <CardHeader className="border-b border-slate-200 py-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-600" />
                Municipal Ward Comparative Health Matrix
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Precomputed performance metrics from PostgreSQL Materialized View{" "}
                <code className="text-emerald-800 font-mono font-medium">mv_ward_health_summary</code> (<span className="text-emerald-700 font-semibold">&lt; 1ms load time</span>)
              </CardDescription>
            </div>

            {/* Ward Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search Bangalore ward..."
                value={wardSearch}
                onChange={(e) => setWardSearch(e.target.value)}
                className="pl-8 h-8 text-xs bg-background"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-[11px] bg-muted/20">
                  <TableHead className="font-semibold">Ward ID & Name</TableHead>
                  <TableHead className="font-semibold text-right">Canopy Census</TableHead>
                  <TableHead className="font-semibold">Health Index (%)</TableHead>
                  <TableHead className="font-semibold text-center">Condition</TableHead>
                  <TableHead className="font-semibold text-center">Outbreak Status</TableHead>
                  <TableHead className="font-semibold text-right">Overdue &gt;180d</TableHead>
                  <TableHead className="font-semibold text-right">Open Work Orders</TableHead>
                  <TableHead className="font-semibold text-right">Total Biomass (DBH)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWards.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6 text-xs text-muted-foreground">
                      No matching wards found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWards.map((w) => {
                    const isOutbreak = w.active_outbreak_flag;
                    const isHealthy = w.health_index_pct >= 70;

                    return (
                      <TableRow key={w.ward_id} className="text-xs hover:bg-muted/30">
                        <TableCell className="font-medium">
                          <div>
                            <span className="font-semibold text-foreground">{w.ward_name}</span>
                            <span className="block font-mono text-[10px] text-muted-foreground">
                              {w.ward_id} • {w.ward_zone}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="text-right font-mono font-medium">
                          {w.total_trees}
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1 max-w-[140px]">
                            <div className="flex justify-between text-[11px] font-mono">
                              <span className={isHealthy ? "text-emerald-500 font-bold" : "text-amber-500 font-bold"}>
                                {w.health_index_pct}%
                              </span>
                              <span className="text-muted-foreground text-[10px]">
                                {w.healthy_trees} / {w.total_trees}
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isHealthy ? "bg-emerald-500" : "bg-amber-500"
                                }`}
                                style={{ width: `${w.health_index_pct}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="text-center font-mono">
                          {w.avg_condition_score} / 5.0
                        </TableCell>

                        <TableCell className="text-center">
                          {isOutbreak ? (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
                              ACTIVE OUTBREAK
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-emerald-500 border-emerald-500/30">
                              STABLE
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-right font-mono">
                          <span className={w.overdue_inspections_count > 0 ? "text-amber-500 font-bold" : "text-muted-foreground"}>
                            {w.overdue_inspections_count}
                          </span>
                        </TableCell>

                        <TableCell className="text-right font-mono">
                          {w.open_work_orders_count}
                        </TableCell>

                        <TableCell className="text-right font-mono text-muted-foreground">
                          {w.total_dbh_biomass_cm.toLocaleString()} cm
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      </div>
    </DashboardShell>
  );
}

