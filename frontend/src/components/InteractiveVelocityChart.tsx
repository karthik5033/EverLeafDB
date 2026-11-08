"use client";

import React, { useState } from "react";
import { MoreVertical } from "lucide-react";

interface DataPoint {
  label: string;
  shortLabel: string;
  commits: number;
  latencyMs: number;
  cacheHitPercent: number;
  isPeak?: boolean;
}

interface TimeframeData {
  timeframe: "7D" | "14D" | "30D";
  p95Latency: string;
  weeklyVolume: string;
  avgExecTime: string;
  gistHit: string;
  pgvectorRecall: string;
  yMax: number;
  yLabels: string[];
  points: DataPoint[];
}

const DATA_TIMEFRAMES: Record<"7D" | "14D" | "30D", TimeframeData> = {
  "7D": {
    timeframe: "7D",
    p95Latency: "7.2ms",
    weeklyVolume: "32,840",
    avgExecTime: "7.8ms",
    gistHit: "99.4%",
    pgvectorRecall: "99.1%",
    yMax: 6000,
    yLabels: ["6.0k", "4.8k", "3.6k", "2.4k", "1.2k", "0"],
    points: [
      { label: "Monday, Oct 28", shortLabel: "Mon 28", commits: 1480, latencyMs: 8.9, cacheHitPercent: 98.8 },
      { label: "Tuesday, Oct 29", shortLabel: "Tue 29", commits: 2240, latencyMs: 8.4, cacheHitPercent: 99.1 },
      { label: "Wednesday, Oct 30", shortLabel: "Wed 30", commits: 3180, latencyMs: 7.9, cacheHitPercent: 99.3 },
      { label: "Thursday, Oct 31", shortLabel: "Thu 31", commits: 3820, latencyMs: 7.6, cacheHitPercent: 99.5 },
      { label: "Friday, Nov 01", shortLabel: "Fri 01", commits: 2910, latencyMs: 7.8, cacheHitPercent: 99.2 },
      { label: "Saturday Peak, Nov 02", shortLabel: "Sat 02", commits: 5140, latencyMs: 7.2, cacheHitPercent: 99.7, isPeak: true },
      { label: "Sunday, Nov 03", shortLabel: "Sun 03", commits: 4680, latencyMs: 7.1, cacheHitPercent: 99.6 },
    ],
  },
  "14D": {
    timeframe: "14D",
    p95Latency: "7.5ms",
    weeklyVolume: "68,420",
    avgExecTime: "8.1ms",
    gistHit: "99.2%",
    pgvectorRecall: "98.9%",
    yMax: 6000,
    yLabels: ["6.0k", "4.8k", "3.6k", "2.4k", "1.2k", "0"],
    points: [
      { label: "Mon, Oct 21", shortLabel: "21", commits: 1250, latencyMs: 9.1, cacheHitPercent: 98.6 },
      { label: "Tue, Oct 22", shortLabel: "22", commits: 1890, latencyMs: 8.8, cacheHitPercent: 98.9 },
      { label: "Wed, Oct 23", shortLabel: "23", commits: 2420, latencyMs: 8.4, cacheHitPercent: 99.0 },
      { label: "Thu, Oct 24", shortLabel: "24", commits: 3100, latencyMs: 8.2, cacheHitPercent: 99.2 },
      { label: "Fri, Oct 25", shortLabel: "25", commits: 2800, latencyMs: 8.0, cacheHitPercent: 99.1 },
      { label: "Sat, Oct 26", shortLabel: "26", commits: 4520, latencyMs: 7.6, cacheHitPercent: 99.4 },
      { label: "Sun, Oct 27", shortLabel: "27", commits: 3950, latencyMs: 7.5, cacheHitPercent: 99.3 },
      { label: "Mon, Oct 28", shortLabel: "28", commits: 1480, latencyMs: 8.9, cacheHitPercent: 98.8 },
      { label: "Tue, Oct 29", shortLabel: "29", commits: 2240, latencyMs: 8.4, cacheHitPercent: 99.1 },
      { label: "Wed, Oct 30", shortLabel: "30", commits: 3180, latencyMs: 7.9, cacheHitPercent: 99.3 },
      { label: "Thu, Oct 31", shortLabel: "31", commits: 3820, latencyMs: 7.6, cacheHitPercent: 99.5 },
      { label: "Fri, Nov 01", shortLabel: "01", commits: 2910, latencyMs: 7.8, cacheHitPercent: 99.2 },
      { label: "Sat Peak, Nov 02", shortLabel: "02", commits: 5140, latencyMs: 7.2, cacheHitPercent: 99.7, isPeak: true },
      { label: "Sun, Nov 03", shortLabel: "03", commits: 4680, latencyMs: 7.1, cacheHitPercent: 99.6 },
    ],
  },
  "30D": {
    timeframe: "30D",
    p95Latency: "7.6ms",
    weeklyVolume: "142,650",
    avgExecTime: "8.4ms",
    gistHit: "99.1%",
    pgvectorRecall: "98.8%",
    yMax: 6500,
    yLabels: ["6.5k", "5.2k", "3.9k", "2.6k", "1.3k", "0"],
    points: [
      { label: "Week 1 - Mon", shortLabel: "W1", commits: 2100, latencyMs: 8.9, cacheHitPercent: 98.7 },
      { label: "Week 1 - Thu", shortLabel: "W1-T", commits: 3400, latencyMs: 8.5, cacheHitPercent: 99.0 },
      { label: "Week 1 - Sat", shortLabel: "W1-S", commits: 4200, latencyMs: 8.2, cacheHitPercent: 99.2 },
      { label: "Week 2 - Tue", shortLabel: "W2", commits: 2800, latencyMs: 8.4, cacheHitPercent: 99.1 },
      { label: "Week 2 - Fri", shortLabel: "W2-F", commits: 3600, latencyMs: 8.0, cacheHitPercent: 99.3 },
      { label: "Week 2 - Sun", shortLabel: "W2-S", commits: 4700, latencyMs: 7.8, cacheHitPercent: 99.4 },
      { label: "Week 3 - Wed", shortLabel: "W3", commits: 3100, latencyMs: 8.1, cacheHitPercent: 99.2 },
      { label: "Week 3 - Sat", shortLabel: "W3-S", commits: 4950, latencyMs: 7.5, cacheHitPercent: 99.5 },
      { label: "Week 4 - Mon", shortLabel: "W4", commits: 2900, latencyMs: 7.9, cacheHitPercent: 99.3 },
      { label: "Week 4 - Thu", shortLabel: "W4-T", commits: 3820, latencyMs: 7.6, cacheHitPercent: 99.5 },
      { label: "Week 4 - Sat Peak", shortLabel: "W4-S", commits: 5480, latencyMs: 7.2, cacheHitPercent: 99.7, isPeak: true },
      { label: "Week 4 - Sun", shortLabel: "W4-U", commits: 4680, latencyMs: 7.1, cacheHitPercent: 99.6 },
    ],
  },
};

export function InteractiveVelocityChart() {
  const [activeTimeframe, setActiveTimeframe] = useState<"7D" | "14D" | "30D">("7D");
  const data = DATA_TIMEFRAMES[activeTimeframe];

  // Default to peak point
  const defaultHoverIdx = data.points.findIndex((p) => p.isPeak) !== -1
    ? data.points.findIndex((p) => p.isPeak)
    : data.points.length - 1;

  const [hoveredIdx, setHoveredIdx] = useState<number>(defaultHoverIdx);

  // SVG coordinate calculations
  const svgWidth = 540;
  const svgHeight = 200;
  const padX = 14;
  const usableWidth = svgWidth - 2 * padX;
  const maxCommits = data.yMax;

  const getX = (idx: number) => padX + (idx / (data.points.length - 1)) * usableWidth;
  const getY = (val: number) => 185 - (val / maxCommits) * 155;
  const getLatencyY = (val: number) => 185 - (val / 12) * 155;

  // Generate smooth cubic bezier SVG path
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

  // Generate smooth latency benchmark dashed path
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

  // Active hovered point
  const activePt = data.points[hoveredIdx] || data.points[0];
  const activeX = getX(hoveredIdx);
  const activeY = getY(activePt.commits);

  // Position tooltip safely so it doesn't clip on the right
  const isRightSide = activeX > svgWidth * 0.62;

  const handleTimeframeChange = (tf: "7D" | "14D" | "30D") => {
    setActiveTimeframe(tf);
    const newTfData = DATA_TIMEFRAMES[tf];
    const newPeakIdx = newTfData.points.findIndex((p) => p.isPeak);
    setHoveredIdx(newPeakIdx !== -1 ? newPeakIdx : newTfData.points.length - 1);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, (clientX - padX) / usableWidth));
    const nearestIdx = Math.round(ratio * (data.points.length - 1));
    setHoveredIdx(nearestIdx);
  };

  return (
    <div className="col-span-1 lg:col-span-6 p-6 rounded-xl border border-gray-200/90 shadow-sm bg-white flex flex-col justify-between transition-all">
      <div>
        {/* Header HUD */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-gray-950">Canopy Health &amp; Inspection Velocity</h3>
              <span className="text-[11px] font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 font-semibold transition-all">
                p95: {data.p95Latency}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Weekly commit volume and query latency across municipal wards
            </p>
          </div>

          {/* Timeframe Selector Buttons */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg border border-gray-200/70 text-xs">
              {(["7D", "14D", "30D"] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => handleTimeframeChange(tf)}
                  className={`px-2.5 py-1 rounded font-semibold text-xs transition-all ${
                    activeTimeframe === tf
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "text-gray-500 hover:text-gray-900 hover:bg-white/60"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
            <button className="text-gray-400 hover:text-black transition-colors" title="Export Chart Telemetry">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 text-xs text-gray-500 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-1 bg-emerald-700 rounded-full"></span>
            <span className="font-medium text-gray-800">Spatial Commits / Day</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-[2px] border-t-2 border-dashed border-gray-400"></span>
            <span>p95 Latency Benchmark (ms)</span>
          </div>
        </div>

        {/* Interactive Smooth SVG Chart */}
        <div className="relative h-64 w-full select-none">
          {/* Y Axis Labels */}
          <div className="absolute left-0 top-0 bottom-6 w-9 flex flex-col justify-between text-[11px] font-mono text-gray-400">
            {data.yLabels.map((lbl, idx) => (
              <span key={idx}>{lbl}</span>
            ))}
          </div>

          {/* Chart Canvas Area */}
          <div className="absolute left-10 right-0 top-1 bottom-6">
            {/* Gridlines */}
            <div className="w-full h-full flex flex-col justify-between pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-full h-px border-t border-dashed border-gray-200/80"></div>
              ))}
            </div>

            {/* Live Interactive SVG */}
            <svg
              className="absolute inset-0 w-full h-full overflow-visible cursor-crosshair"
              viewBox="0 0 540 200"
              preserveAspectRatio="none"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => {
                const peakIdx = data.points.findIndex((p) => p.isPeak);
                setHoveredIdx(peakIdx !== -1 ? peakIdx : data.points.length - 1);
              }}
            >
              <defs>
                <linearGradient id="velocityGradientArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#047857" stopOpacity="0.28" />
                  <stop offset="65%" stopColor="#047857" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#047857" stopOpacity="0.0" />
                </linearGradient>
                <filter id="emeraldSplineGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#047857" floodOpacity="0.35" />
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
                stroke="#047857"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#emeraldSplineGlow)"
                className="transition-all duration-300"
              />

              {/* Active Crosshair Line */}
              <line
                x1={activeX}
                y1={10}
                x2={activeX}
                y2={190}
                stroke="#047857"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                opacity="0.75"
                className="transition-all duration-75"
              />

              {/* Data Points */}
              {data.points.map((pt, idx) => {
                const px = getX(idx);
                const py = getY(pt.commits);
                const isSelected = idx === hoveredIdx;

                return (
                  <g key={idx} className="transition-all duration-150">
                    {isSelected && (
                      <circle
                        cx={px}
                        cy={py}
                        r={10}
                        fill="#047857"
                        fillOpacity="0.22"
                        className="animate-ping"
                      />
                    )}
                    <circle
                      cx={px}
                      cy={py}
                      r={isSelected ? 5 : 3}
                      fill="#047857"
                      stroke="#ffffff"
                      strokeWidth={isSelected ? 2 : 1.5}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Dynamic Interactive Tooltip */}
            <div
              className={`absolute top-2 pointer-events-none bg-white/95 backdrop-blur-md text-gray-900 rounded-xl p-3 shadow-xl border border-emerald-300 text-[11px] leading-tight z-20 transition-all duration-150 ${
                isRightSide ? "right-6" : "left-6"
              }`}
              style={{
                boxShadow: "0 10px 25px -5px rgba(5, 150, 105, 0.15), 0 8px 10px -6px rgba(5, 150, 105, 0.1)",
              }}
            >
              <div className="flex items-center justify-between gap-4 font-semibold mb-1.5 pb-1 border-b border-gray-100">
                <span className="text-emerald-950 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  {activePt.label}
                </span>
                <span className="text-emerald-700 font-mono font-bold text-xs">
                  {activePt.commits.toLocaleString()} commits
                </span>
              </div>
              <div className="text-gray-600 flex items-center justify-between gap-4 text-[10px] py-0.5">
                <span className="font-medium">Hybrid Latency</span>
                <span className="font-mono text-emerald-800 font-bold">
                  {activePt.latencyMs.toFixed(1)}ms (p95)
                </span>
              </div>
              <div className="text-gray-600 flex items-center justify-between gap-4 text-[10px] py-0.5">
                <span className="font-medium">Spatial GiST Cache</span>
                <span className="font-mono text-emerald-700 font-bold">
                  {activePt.cacheHitPercent.toFixed(1)}% Hit
                </span>
              </div>
            </div>
          </div>

          {/* X Axis Labels */}
          <div className="absolute left-10 right-0 bottom-0 h-5 flex justify-between text-[11px] font-mono text-gray-500">
            {data.points.map((pt, idx) => (
              <span
                key={idx}
                className={`transition-colors cursor-pointer ${
                  idx === hoveredIdx ? "font-bold text-emerald-800" : "hover:text-gray-900"
                }`}
                onClick={() => setHoveredIdx(idx)}
              >
                {pt.shortLabel}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Telemetry Strip - Updates dynamically based on timeframe */}
      <div className="mt-5 pt-3.5 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div>
          <span className="text-gray-400 block text-[10px] uppercase font-semibold">
            {activeTimeframe === "7D" ? "Weekly Volume" : activeTimeframe === "14D" ? "14-Day Volume" : "Monthly Volume"}
          </span>
          <span className="font-bold font-mono text-gray-900">{data.weeklyVolume}</span>
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

