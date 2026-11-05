"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import { DISEASES } from "@/lib/db";
import {
  HybridQuery4Response,
  TreatmentEfficacyRecord,
  TreatmentCategoryROI
} from "@/lib/treatment-analytics";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Database,
  ShieldCheck,
  Stethoscope,
  Filter,
  Layers,
  Award,
  Zap,
  Leaf
} from "lucide-react";

export default function TreatmentEfficacyPage() {
  const [selectedDiseaseId, setSelectedDiseaseId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<HybridQuery4Response | null>(null);

  const fetchAnalytics = async (diseaseId?: number) => {
    setLoading(true);
    try {
      const url = diseaseId
        ? `/api/analytics/treatment-efficacy?disease_id=${diseaseId}`
        : "/api/analytics/treatment-efficacy";
      const res = await fetch(url);
      const json: HybridQuery4Response = await res.json();
      setData(json);
    } catch (err) {
      console.error("Treatment efficacy error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(selectedDiseaseId);
  }, [selectedDiseaseId]);

  return (
    <DashboardShell>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-mono text-emerald-800 mb-2">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Phase 19: Hybrid Query 4 (Treatment Efficacy &amp; Cost Ranking)</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
              Treatment Efficacy &amp; Municipal Financial ROI
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              SQL aggregation and window ranking (<code>DENSE_RANK() OVER (PARTITION BY disease_id ORDER BY success_rate DESC)</code>) optimizing therapeutic spend.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="emerald" className="font-mono text-xs px-2.5 py-1">
              <Award className="w-3.5 h-3.5 mr-1" />
              Evidence-Based Therapeutics
            </Badge>
          </div>
        </div>

        {/* Top Metric Cards */}
        {data && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 border-emerald-200 bg-emerald-50/20">
              <div className="text-xs text-muted-foreground">Overall Cure Success Rate</div>
              <div className="text-2xl font-extrabold text-emerald-800 mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                {data.kpis.overall_cure_rate}%
              </div>
              <div className="text-[10px] text-emerald-800 font-mono mt-1 font-bold">
                Across {data.kpis.total_treated_trees} Treated Trees
              </div>
            </Card>

            <Card className="p-4">
              <div className="text-xs text-muted-foreground">Total Municipal Spend</div>
              <div className="text-2xl font-extrabold text-foreground mt-1 flex items-center gap-1.5">
                <DollarSign className="w-5 h-5 text-emerald-800" />
                ${data.kpis.total_municipal_spend.toLocaleString()}
              </div>
              <div className="text-[10px] text-muted-foreground font-mono mt-1">
                Audited Clinical Expenditures
              </div>
            </Card>

            <Card className="p-4 border-border">
              <div className="text-xs text-muted-foreground">Top ROI Protocol</div>
              <div className="text-xs font-extrabold text-foreground mt-2 line-clamp-2">
                {data.kpis.top_roi_treatment}
              </div>
              <div className="text-[10px] text-emerald-800 font-mono mt-1 font-bold">
                Rank #1 Window Optimization
              </div>
            </Card>

            <Card className="p-4">
              <div className="text-xs text-muted-foreground">Lowest Cost / Cure</div>
              <div className="text-xs font-extrabold text-emerald-950 mt-2 line-clamp-2">
                {data.kpis.lowest_cost_cure}
              </div>
              <div className="text-[10px] text-emerald-800 font-mono mt-1 font-bold">
                Maximum Budget Efficiency
              </div>
            </Card>
          </div>
        )}

        {/* Category Breakdown Cards */}
        {data && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.categories.map((cat) => (
              <Card key={cat.category} className="p-3.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {cat.category.replace("_", " ")}
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {cat.total_applications} trees
                  </Badge>
                </div>
                <div className="text-xl font-extrabold text-foreground">
                  {cat.overall_success_rate}% Cure
                </div>
                <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
                  <span>Avg: ${cat.avg_cost.toFixed(2)}</span>
                  <span>Total: ${cat.total_spend.toLocaleString()}</span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Disease Filter Tabs */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-emerald-800" />
              Filter by Diagnosed Pathology:
            </span>
            {selectedDiseaseId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDiseaseId(undefined)}
                className="text-xs h-7 text-emerald-800"
              >
                Clear Filter (Show All)
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedDiseaseId(undefined)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                selectedDiseaseId === undefined
                  ? "bg-emerald-800 text-white shadow-xs"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              All Diseases ({data?.records.length || 0})
            </button>
            {DISEASES.slice(0, 7).map((d) => (
              <button
                key={d.disease_id}
                onClick={() => setSelectedDiseaseId(d.disease_id)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  selectedDiseaseId === d.disease_id
                    ? "bg-emerald-800 text-white shadow-xs"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {d.common_name}
              </button>
            ))}
          </div>
        </Card>

        {/* Visual ROI Bar Chart */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-800" />
                Treatment Success Rate vs. Unit Cost Matrix
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Bar height represents Cure Success Rate (%). Cost indicators show municipal expenditure per tree.
              </p>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              Sorted by: ROI Rank (Dense Rank)
            </span>
          </div>

          {/* SVG Analytical Chart */}
          <div className="relative aspect-16/7 bg-slate-950 rounded-xl p-4 overflow-hidden flex flex-col justify-end">
            <svg viewBox="0 0 800 240" className="w-full h-full select-none">
              {/* Grid Lines */}
              <line x1="50" y1="20" x2="780" y2="20" stroke="#1e293b" strokeWidth="0.8" />
              <line x1="50" y1="65" x2="780" y2="65" stroke="#1e293b" strokeWidth="0.8" />
              <line x1="50" y1="110" x2="780" y2="110" stroke="#1e293b" strokeWidth="0.8" />
              <line x1="50" y1="155" x2="780" y2="155" stroke="#1e293b" strokeWidth="0.8" />
              <line x1="50" y1="200" x2="780" y2="200" stroke="#334155" strokeWidth="1.2" />

              {/* Y Axis Labels */}
              <text x="42" y="24" textAnchor="end" fill="#64748b" fontSize="9" fontFamily="monospace">100%</text>
              <text x="42" y="69" textAnchor="end" fill="#64748b" fontSize="9" fontFamily="monospace">75%</text>
              <text x="42" y="114" textAnchor="end" fill="#64748b" fontSize="9" fontFamily="monospace">50%</text>
              <text x="42" y="159" textAnchor="end" fill="#64748b" fontSize="9" fontFamily="monospace">25%</text>
              <text x="42" y="204" textAnchor="end" fill="#64748b" fontSize="9" fontFamily="monospace">0%</text>

              {/* Bars */}
              {(data?.records || []).slice(0, 8).map((rec, i) => {
                const totalBars = Math.min(8, data!.records.length);
                const colWidth = 680 / totalBars;
                const barWidth = Math.min(48, colWidth - 20);
                const x = 70 + i * colWidth + (colWidth - barWidth) / 2;

                const barHeight = (rec.success_rate_percent / 100) * 180;
                const y = 200 - barHeight;

                const barColor =
                  rec.treatment_type === "chemical"
                    ? "#10b981"
                    : rec.treatment_type === "biological"
                    ? "#06b6d4"
                    : rec.treatment_type === "pruning"
                    ? "#f59e0b"
                    : "#a855f7";

                return (
                  <g key={rec.treatment_id + "_" + rec.disease_id + i}>
                    {/* Background Bar Slot */}
                    <rect
                      x={x}
                      y="20"
                      width={barWidth}
                      height="180"
                      fill="#1e293b"
                      fillOpacity="0.3"
                      rx="4"
                    />

                    {/* Active Success Rate Bar */}
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      fill={barColor}
                      rx="4"
                      className="transition-all hover:brightness-125"
                    />

                    {/* Top Value Label */}
                    <text
                      x={x + barWidth / 2}
                      y={y - 6}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {rec.success_rate_percent.toFixed(0)}%
                    </text>

                    {/* Bottom Cost Indicator */}
                    <text
                      x={x + barWidth / 2}
                      y="216"
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      ${rec.avg_actual_cost.toFixed(0)}
                    </text>

                    {/* Rank Badge */}
                    <text
                      x={x + barWidth / 2}
                      y="230"
                      textAnchor="middle"
                      fill={rec.roi_rank === 1 ? "#34d399" : "#64748b"}
                      fontSize="8"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      Rank #{rec.roi_rank}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground pt-1">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500"></span> Chemical
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-cyan-500"></span> Biological
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-500"></span> Pruning
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-purple-500"></span> Soil Amendment
              </span>
            </div>
            <span className="font-mono text-[11px]">
              Query Execution: {data?.execution_stats.latency_ms} ms
            </span>
          </div>
        </Card>

        {/* SQL Execution Terminal Preview */}
        <Card className="p-4 bg-slate-950 text-slate-100 font-mono text-xs space-y-2 border-slate-800">
          <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Database className="w-3.5 h-3.5" />
              Hybrid Query 4 SQL Window Function Plan
            </span>
            <span className="text-[10px] text-slate-500">
              {data?.execution_stats.aggregation_indexes}
            </span>
          </div>
          <pre className="text-[11px] text-emerald-300 leading-relaxed overflow-x-auto whitespace-pre-wrap">
            {data?.sql_executed || "-- Executing treatment efficacy analytics..."}
          </pre>
        </Card>

        {/* Comprehensive Leaderboard Table */}
        <Card className="overflow-hidden border border-border shadow-xs">
          <CardHeader className="p-4 border-b border-border bg-muted/30">
            <CardTitle className="text-sm font-extrabold flex items-center justify-between">
              <span>Evidence-Based Treatment Ranking Table</span>
              <span className="text-xs font-mono font-normal text-muted-foreground">
                Total Protocols Evaluated: {data?.records.length || 0}
              </span>
            </CardTitle>
          </CardHeader>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Target Pathology</TableHead>
                  <TableHead>Therapeutic Protocol</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-center">Administered</TableHead>
                  <TableHead className="text-right">Success Rate</TableHead>
                  <TableHead className="text-right">Avg Unit Cost</TableHead>
                  <TableHead className="text-right">Cure Window</TableHead>
                  <TableHead className="text-right">Cost / Cure</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.records || []).map((row, idx) => (
                  <TableRow key={row.treatment_id + "_" + row.disease_id + idx}>
                    <TableCell>
                      <Badge
                        variant={row.roi_rank === 1 ? "emerald" : "outline"}
                        className="font-mono text-[11px] font-bold"
                      >
                        #{row.roi_rank}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="font-bold text-xs text-foreground">
                        {row.disease_name}
                      </div>
                      <Badge
                        variant={row.severity_level === "CRITICAL" ? "critical" : "warning"}
                        className="text-[9px] uppercase font-bold mt-0.5"
                      >
                        {row.severity_level}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="font-semibold text-xs text-foreground">
                        {row.treatment_name}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Clinical trial cohort verified
                      </span>
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[10px] uppercase">
                        {row.treatment_type}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-center font-mono text-xs">
                      {row.total_administered} trees
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="font-mono text-xs font-extrabold text-emerald-800">
                        {row.success_rate_percent.toFixed(1)}%
                      </div>
                      <div className="w-20 ml-auto h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full bg-emerald-800 rounded-full"
                          style={{ width: `${row.success_rate_percent}%` }}
                        ></div>
                      </div>
                    </TableCell>

                    <TableCell className="text-right font-mono text-xs font-semibold">
                      ${row.avg_actual_cost.toFixed(2)}
                    </TableCell>

                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      {row.avg_duration_days} days
                    </TableCell>

                    <TableCell className="text-right font-mono text-xs font-bold text-emerald-950">
                      ${row.cost_per_cure.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
