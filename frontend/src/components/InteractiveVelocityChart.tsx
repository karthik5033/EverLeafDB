"use client";

import React, { useState } from "react";
import { MoreVertical, Calendar, Sparkles, TrendingUp, Zap, CheckCircle2 } from "lucide-react";

interface DataPoint {
  label: string;
  shortLabel: string;
  commits: number;
  latencyMs: number;
  cacheHitPercent: number;
  recallPercent: number;
  isPeak?: boolean;
}

interface TimeframeData {
  timeframe: "7D" | "14D" | "30D";
  p95Latency: string;
  volumeLabel: string;
  volumeValue: string;
  avgExecTime: string;
  gistHit: string;
  pgvectorRecall: string;
  yMax: number;
  yLabels: string[];
  ticks: { idx: number; label: string }[];
  points: DataPoint[];
}

const DATA_TIMEFRAMES: Record<"7D" | "14D" | "30D", TimeframeData> = {
  "7D": {
    timeframe: "7D",
    p95Latency: "7.1ms",
    volumeLabel: "7-Day Volume",
    volumeValue: "26,410",
    avgExecTime: "7.6ms",
    gistHit: "99.5%",
    pgvectorRecall: "99.3%",
    yMax: 6000,
    yLabels: ["6.0k", "4.8k", "3.6k", "2.4k", "1.2k", "0"],
    ticks: [
      { idx: 0, label: "Nov 02" },
      { idx: 1, label: "Nov 03" },
      { idx: 2, label: "Nov 04" },
      { idx: 3, label: "Nov 05" },
      { idx: 4, label: "Nov 06" },
      { idx: 5, label: "Nov 07" },
      { idx: 6, label: "Nov 08" },
    ],
    points: [
      { label: "Saturday, Nov 02, 2026", shortLabel: "Nov 02", commits: 2140, latencyMs: 8.8, cacheHitPercent: 99.0, recallPercent: 98.9 },
      { label: "Sunday, Nov 03, 2026", shortLabel: "Nov 03", commits: 1820, latencyMs: 8.6, cacheHitPercent: 99.2, recallPercent: 99.0 },
      { label: "Monday, Nov 04, 2026", shortLabel: "Nov 04", commits: 3450, latencyMs: 7.9, cacheHitPercent: 99.3, recallPercent: 99.1 },
      { label: "Tuesday, Nov 05, 2026", shortLabel: "Nov 05", commits: 4120, latencyMs: 7.6, cacheHitPercent: 99.5, recallPercent: 99.2 },
      { label: "Wednesday, Nov 06, 2026", shortLabel: "Nov 06", commits: 5420, latencyMs: 7.1, cacheHitPercent: 99.7, recallPercent: 99.4, isPeak: true },
      { label: "Thursday, Nov 07, 2026", shortLabel: "Nov 07", commits: 4780, latencyMs: 7.3, cacheHitPercent: 99.6, recallPercent: 99.3 },
      { label: "Friday, Nov 08, 2026 (Today)", shortLabel: "Nov 08", commits: 4680, latencyMs: 7.2, cacheHitPercent: 99.6, recallPercent: 99.3 },
    ],
  },
  "14D": {
    timeframe: "14D",
    p95Latency: "7.4ms",
    volumeLabel: "14-Day Volume",
    volumeValue: "44,500",
    avgExecTime: "8.0ms",
    gistHit: "99.3%",
    pgvectorRecall: "99.0%",
    yMax: 6000,
    yLabels: ["6.0k", "4.8k", "3.6k", "2.4k", "1.2k", "0"],
    ticks: [
      { idx: 0, label: "Oct 26" },
      { idx: 2, label: "Oct 28" },
      { idx: 5, label: "Oct 31" },
      { idx: 7, label: "Nov 02" },
      { idx: 9, label: "Nov 04" },
      { idx: 11, label: "Nov 06" },
      { idx: 13, label: "Nov 08" },
    ],
    points: [
      { label: "Saturday, Oct 26, 2026", shortLabel: "Oct 26", commits: 1650, latencyMs: 9.1, cacheHitPercent: 98.7, recallPercent: 98.5 },
      { label: "Sunday, Oct 27, 2026", shortLabel: "Oct 27", commits: 1420, latencyMs: 8.9, cacheHitPercent: 98.9, recallPercent: 98.7 },
      { label: "Monday, Oct 28, 2026", shortLabel: "Oct 28", commits: 2240, latencyMs: 8.5, cacheHitPercent: 99.0, recallPercent: 98.8 },
      { label: "Tuesday, Oct 29, 2026", shortLabel: "Oct 29", commits: 2890, latencyMs: 8.2, cacheHitPercent: 99.1, recallPercent: 99.0 },
      { label: "Wednesday, Oct 30, 2026", shortLabel: "Oct 30", commits: 3180, latencyMs: 8.0, cacheHitPercent: 99.3, recallPercent: 99.1 },
      { label: "Thursday, Oct 31, 2026", shortLabel: "Oct 31", commits: 3820, latencyMs: 7.8, cacheHitPercent: 99.4, recallPercent: 99.2 },
      { label: "Friday, Nov 01, 2026", shortLabel: "Nov 01", commits: 2910, latencyMs: 8.1, cacheHitPercent: 99.2, recallPercent: 99.0 },
      { label: "Saturday, Nov 02, 2026", shortLabel: "Nov 02", commits: 2140, latencyMs: 8.8, cacheHitPercent: 99.0, recallPercent: 98.9 },
      { label: "Sunday, Nov 03, 2026", shortLabel: "Nov 03", commits: 1820, latencyMs: 8.6, cacheHitPercent: 99.2, recallPercent: 99.0 },
      { label: "Monday, Nov 04, 2026", shortLabel: "Nov 04", commits: 3450, latencyMs: 7.9, cacheHitPercent: 99.3, recallPercent: 99.1 },
      { label: "Tuesday, Nov 05, 2026", shortLabel: "Nov 05", commits: 4120, latencyMs: 7.6, cacheHitPercent: 99.5, recallPercent: 99.2 },
      { label: "Wednesday, Nov 06, 2026", shortLabel: "Nov 06", commits: 5420, latencyMs: 7.1, cacheHitPercent: 99.7, recallPercent: 99.4, isPeak: true },
      { label: "Thursday, Nov 07, 2026", shortLabel: "Nov 07", commits: 4780, latencyMs: 7.3, cacheHitPercent: 99.6, recallPercent: 99.3 },
      { label: "Friday, Nov 08, 2026 (Today)", shortLabel: "Nov 08", commits: 4680, latencyMs: 7.2, cacheHitPercent: 99.6, recallPercent: 99.3 },
    ],
  },
  "30D": {
    timeframe: "30D",
    p95Latency: "7.6ms",
    volumeLabel: "30-Day Volume",
    volumeValue: "108,200",
    avgExecTime: "8.3ms",
    gistHit: "99.1%",
    pgvectorRecall: "98.9%",
    yMax: 6500,
    yLabels: ["6.5k", "5.2k", "3.9k", "2.6k", "1.3k", "0"],
    ticks: [
      { idx: 0, label: "Oct 10" },
      { idx: 2, label: "Oct 16" },
      { idx: 4, label: "Oct 22" },
      { idx: 6, label: "Oct 28" },
      { idx: 8, label: "Nov 03" },
      { idx: 10, label: "Nov 08" },
    ],
    points: [
      { label: "Thursday, Oct 10, 2026", shortLabel: "Oct 10", commits: 2100, latencyMs: 9.2, cacheHitPercent: 98.6, recallPercent: 98.4 },
      { label: "Sunday, Oct 13, 2026", shortLabel: "Oct 13", commits: 1950, latencyMs: 9.0, cacheHitPercent: 98.8, recallPercent: 98.6 },
      { label: "Wednesday, Oct 16, 2026", shortLabel: "Oct 16", commits: 2800, latencyMs: 8.7, cacheHitPercent: 98.9, recallPercent: 98.7 },
      { label: "Saturday, Oct 19, 2026", shortLabel: "Oct 19", commits: 3200, latencyMs: 8.5, cacheHitPercent: 99.1, recallPercent: 98.9 },
      { label: "Tuesday, Oct 22, 2026", shortLabel: "Oct 22", commits: 2950, latencyMs: 8.4, cacheHitPercent: 99.0, recallPercent: 98.8 },
      { label: "Friday, Oct 25, 2026", shortLabel: "Oct 25", commits: 3600, latencyMs: 8.1, cacheHitPercent: 99.2, recallPercent: 99.0 },
      { label: "Monday, Oct 28, 2026", shortLabel: "Oct 28", commits: 3100, latencyMs: 8.2, cacheHitPercent: 99.1, recallPercent: 98.9 },
      { label: "Thursday, Oct 31, 2026", shortLabel: "Oct 31", commits: 3820, latencyMs: 7.8, cacheHitPercent: 99.4, recallPercent: 99.2 },
      { label: "Sunday, Nov 03, 2026", shortLabel: "Nov 03", commits: 3400, latencyMs: 8.0, cacheHitPercent: 99.3, recallPercent: 99.1 },
      { label: "Wednesday, Nov 06, 2026", shortLabel: "Nov 06", commits: 5420, latencyMs: 7.1, cacheHitPercent: 99.7, recallPercent: 99.4, isPeak: true },
      { label: "Friday, Nov 08, 2026 (Today)", shortLabel: "Nov 08", commits: 4680, latencyMs: 7.2, cacheHitPercent: 99.6, recallPercent: 99.3 },
    ],
  },
};

export function InteractiveVelocityChart() {
  const [activeTimeframe, setActiveTimeframe] = useState<"7D" | "14D" | "30D">("7D");
  const data = DATA_TIMEFRAMES[activeTimeframe];

  // Hover state: only show crosshair and floating card on active user hover!
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // SVG coordinate dimensions
  const svgWidth = 540;
  const svgHeight = 200;
  const padX = 18;
  const usableWidth = svgWidth - 2 * padX;
  const maxCommits = data.yMax;

  const getX = (idx: number) => padX + (idx / (data.points.length - 1)) * usableWidth;
  const getY = (val: number) => 180 - (val / maxCommits) * 150;
  const getLatencyY = (val: number) => 180 - (val / 12) * 150;

  // Generate smooth cubic bezier SVG spline path
  const generateSplinePath = () => {
    const pts = data.points.map((p, idx) => ({ x: getX(idx), y: getY(p.commits) }));
    if (pts.length < 2) return "";

    let path = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return path;
  };

  // Generate latency benchmark dashed spline
  const generateLatencyPath = () => {
    const pts = data.points.map((p, idx) => ({ x: getX(idx), y: getLatencyY(p.latencyMs) }));
    if (pts.length < 2) return "";

    let path = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const cx = (p1.x + p2.x) / 2;
      path += ` C ${cx.toFixed(1)},${p1.y.toFixed(1)} ${cx.toFixed(1)},${p2.y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return path;
  };

  const linePath = generateSplinePath();
  const latencyPath = generateLatencyPath();
  const areaPath = `${linePath} L ${getX(data.points.length - 1).toFixed(1)},200 L ${getX(0).toFixed(1)},200 Z`;

  // Find peak point for idle reference
  const peakIdx = data.points.findIndex((p) => p.isPeak);
  const peakPt = peakIdx !== -1 ? data.points[peakIdx] : data.points[0];

  // Active point when hovered
  const activePtIndex = hoveredIdx !== null ? hoveredIdx : (peakIdx !== -1 ? peakIdx : 0);
  const activePt = data.points[activePtIndex];
  const activeX = getX(activePtIndex);
  const xPercent = (activeX / svgWidth) * 100;

  const handleTimeframeChange = (tf: "7D" | "14D" | "30D") => {
    setActiveTimeframe(tf);
    setIsHovered(false);
    setHoveredIdx(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clientX / rect.width));
    const nearestIdx = Math.round(ratio * (data.points.length - 1));
    setHoveredIdx(nearestIdx);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setHoveredIdx(null);
  };

  return (
    <div className="col-span-1 lg:col-span-6 p-6 rounded-xl border border-gray-200/90 shadow-sm bg-white flex flex-col justify-between transition-all">
      <div>
        {/* Header HUD with Live Telemetry Pill */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-gray-950">Canopy Health &amp; Inspection Velocity</h3>
              <span className="text-[11px] font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 font-semibold transition-all">
                p95: {data.p95Latency}
              </span>
              <span className="hidden md:inline-flex items-center gap-1.5 text-[10px] font-medium bg-emerald-50/70 text-emerald-900 px-2 py-0.5 rounded-full border border-emerald-200/60 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Live Feed</span>
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
              <span>Weekly commit volume and query latency across municipal wards</span>
              {!isHovered && peakPt && (
                <span className="hidden sm:inline-flex text-[11px] font-mono text-emerald-800 bg-emerald-50/80 px-2 py-0.5 rounded border border-emerald-200/70">
                  Peak: {peakPt.commits.toLocaleString()} ({peakPt.shortLabel})
                </span>
              )}
            </p>
          </div>

          {/* Timeframe Selector Pill Tabs */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/80 text-xs">
              {(["7D", "14D", "30D"] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => handleTimeframeChange(tf)}
                  className={`px-3 py-1 rounded-md font-semibold text-xs transition-all duration-150 ${
                    activeTimeframe === tf
                      ? "bg-slate-950 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
            <button
              className="text-gray-400 hover:text-slate-900 p-1.5 rounded-md hover:bg-slate-50 transition-colors"
              title="Telemetry Actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 text-xs text-gray-500 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-1 bg-emerald-600 rounded-full"></span>
            <span className="font-medium text-gray-800">Spatial Commits / Day</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-[2px] border-t-2 border-dashed border-slate-400"></span>
            <span className="text-slate-600">p95 Latency Benchmark (ms)</span>
          </div>
        </div>

        {/* Interactive Smooth SVG Chart Area */}
        <div className="relative h-64 w-full select-none">
          {/* Y Axis Numeric Labels */}
          <div className="absolute left-0 top-0 bottom-6 w-9 flex flex-col justify-between text-[11px] font-mono text-gray-400 pointer-events-none">
            {data.yLabels.map((lbl, idx) => (
              <span key={idx}>{lbl}</span>
            ))}
          </div>

          {/* Chart Canvas Area */}
          <div
            className="absolute left-10 right-0 top-1 bottom-6 cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* Background Gridlines */}
            <div className="w-full h-full flex flex-col justify-between pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-full h-px border-t border-dashed border-gray-200/80"></div>
              ))}
            </div>

            {/* Live Interactive SVG */}
            <svg
              className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
              viewBox="0 0 540 200"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="velocityGradientArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#059669" stopOpacity="0.25" />
                  <stop offset="70%" stopColor="#059669" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
                </linearGradient>
                <filter id="emeraldSplineGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#059669" floodOpacity="0.25" />
                </filter>
              </defs>

              {/* Latency Benchmark Dashed Line */}
              <path
                d={latencyPath}
                fill="none"
                stroke="#94a3b8"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                className="transition-all duration-300"
              />

              {/* Gradient Area Fill */}
              <path
                d={areaPath}
                fill="url(#velocityGradientArea)"
                className="transition-all duration-300"
              />

              {/* Primary Emerald Spline Line */}
              <path
                d={linePath}
                fill="none"
                stroke="#059669"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#emeraldSplineGlow)"
                className="transition-all duration-300"
              />

              {/* Active Crosshair Line - Rendered ONLY on hover */}
              {isHovered && (
                <line
                  x1={activeX}
                  y1={10}
                  x2={activeX}
                  y2={185}
                  stroke="#059669"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  opacity="0.65"
                  className="transition-all duration-75"
                />
              )}

              {/* Data Points */}
              {data.points.map((pt, idx) => {
                const px = getX(idx);
                const py = getY(pt.commits);
                const isSelected = isHovered && idx === hoveredIdx;
                const isThePeak = !isHovered && pt.isPeak;

                if (isSelected) {
                  return (
                    <g key={idx} className="transition-all duration-150">
                      {/* Clean static halo ring - No wild animate-ping! */}
                      <circle
                        cx={px}
                        cy={py}
                        r={9}
                        fill="#059669"
                        fillOpacity="0.22"
                      />
                      <circle
                        cx={px}
                        cy={py}
                        r={4.5}
                        fill="#047857"
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    </g>
                  );
                }

                if (isThePeak) {
                  return (
                    <g key={idx}>
                      <circle
                        cx={px}
                        cy={py}
                        r={6.5}
                        fill="#059669"
                        fillOpacity="0.18"
                      />
                      <circle
                        cx={px}
                        cy={py}
                        r={3.5}
                        fill="#047857"
                        stroke="#ffffff"
                        strokeWidth={1.5}
                      />
                    </g>
                  );
                }

                return (
                  <circle
                    key={idx}
                    cx={px}
                    cy={py}
                    r={2.5}
                    fill="#059669"
                    stroke="#ffffff"
                    strokeWidth={1}
                    className="opacity-70"
                  />
                );
              })}
            </svg>

            {/* Smart Floating Tooltip - Displays ONLY when hovered and stays safely spaced from cursor */}
            {isHovered && activePt && (
              <div
                className="absolute top-2 pointer-events-none bg-white/95 backdrop-blur-md text-gray-900 rounded-xl p-3 shadow-xl border border-emerald-200/90 text-[11px] leading-tight z-30 transition-all duration-100 ease-out"
                style={{
                  left: `${xPercent}%`,
                  transform: xPercent > 55 ? "translateX(calc(-100% - 16px))" : "translateX(16px)",
                  boxShadow: "0 10px 25px -5px rgba(5, 150, 105, 0.15), 0 8px 10px -6px rgba(5, 150, 105, 0.08)",
                  minWidth: "200px",
                }}
              >
                {/* Header: Date + Peak Badge */}
                <div className="flex items-center justify-between gap-3 pb-1.5 mb-1.5 border-b border-gray-100">
                  <span className="text-gray-950 font-bold flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-emerald-600" />
                    {activePt.shortLabel}
                  </span>
                  {activePt.isPeak ? (
                    <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded-full">
                      Peak Day
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-gray-400">
                      Telemetry Point
                    </span>
                  )}
                </div>

                {/* Primary Metric */}
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-base font-extrabold font-mono text-emerald-950 tracking-tight">
                    {activePt.commits.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50/80 px-1.5 py-0.5 rounded">
                    commits / day
                  </span>
                </div>

                {/* Submetrics Grid */}
                <div className="space-y-1 text-[10px]">
                  <div className="flex items-center justify-between text-gray-600">
                    <span className="flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5 text-slate-400" /> Hybrid Latency
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {activePt.latencyMs.toFixed(1)}ms (p95)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-gray-600">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Spatial GiST Hit
                    </span>
                    <span className="font-mono font-bold text-emerald-700">
                      {activePt.cacheHitPercent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-gray-600">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-emerald-600" /> pgvector Recall
                    </span>
                    <span className="font-mono font-bold text-emerald-700">
                      {activePt.recallPercent.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* X Axis Labels */}
          <div className="absolute left-10 right-0 bottom-0 h-5 flex justify-between text-[11px] font-mono text-gray-500">
            {data.ticks.map((tick) => (
              <span
                key={tick.idx}
                className={`transition-colors cursor-pointer ${
                  hoveredIdx === tick.idx ? "font-bold text-emerald-800" : "hover:text-gray-900"
                }`}
                onClick={() => {
                  setHoveredIdx(tick.idx);
                  setIsHovered(true);
                }}
              >
                {tick.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Telemetry Strip - Dynamic across timeframes */}
      <div className="mt-5 pt-3.5 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div>
          <span className="text-gray-400 block text-[10px] uppercase font-semibold">
            {data.volumeLabel}
          </span>
          <span className="font-bold font-mono text-gray-900">{data.volumeValue}</span>
        </div>
        <div>
          <span className="text-gray-400 block text-[10px] uppercase font-semibold">Avg Exec Time</span>
          <span className="font-bold font-mono text-gray-900">{data.avgExecTime}</span>
        </div>
        <div>
          <span className="text-gray-400 block text-[10px] uppercase font-semibold">GiST Index Hit</span>
          <span className="font-bold font-mono text-emerald-800">{data.gistHit}</span>
        </div>
        <div>
          <span className="text-gray-400 block text-[10px] uppercase font-semibold">pgvector Recall</span>
          <span className="font-bold font-mono text-emerald-800">{data.pgvectorRecall}</span>
        </div>
      </div>
    </div>
  );
}
