"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { InteractiveVelocityChart } from "@/components/InteractiveVelocityChart";
import { Geofence3DViewer } from "@/components/Geofence3DViewer";
import {
  Menu,
  Search,
  Moon,
  Database,
  Trees,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  MapPin,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  Activity,
  Layers,
  Compass,
  FileCode,
  Share2,
  User,
  Code,
  Check,
  Sun,
  ChevronDown,
  TriangleAlert,
  Wrench,
  Stethoscope,
  Terminal,
  Clock,
  Bug,
  Leaf,
  FolderGit2
} from "lucide-react";

const GithubIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
    <path d="M9 18c-4.51 2-5-2-7-2"/>
  </svg>
);

export default function Home() {
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [activeTier, setActiveTier] = useState(2); // Default to City Scale (Recommended)

  // Dynamic Typing Animation Phrases
  const TYPING_PHRASES = [
    "Spatial + Vector Filters",
    "PostGIS ST_DWithin(geom, 500m)",
    "pgvector HNSW Cosine Distance (<=>)",
    "3NF ACID Tree Health Lifecycle",
    "Biosecurity Contagion Radii",
    "PostgreSQL 16 Repeatable Read"
  ];

  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = TYPING_PHRASES[phraseIndex];
    let timeout: NodeJS.Timeout;

    if (!isDeleting && displayText === currentPhrase) {
      // Pause at full word for 2.2 seconds
      timeout = setTimeout(() => setIsDeleting(true), 2200);
    } else if (isDeleting && displayText === "") {
      // Finished deleting, move to next phrase
      setIsDeleting(false);
      setPhraseIndex((prev) => (prev + 1) % TYPING_PHRASES.length);
      timeout = setTimeout(() => {}, 200);
    } else {
      // Smooth typing or deleting cadence
      const speed = isDeleting ? 30 : 65;
      timeout = setTimeout(() => {
        setDisplayText((prev) =>
          isDeleting
            ? currentPhrase.substring(0, prev.length - 1)
            : currentPhrase.substring(0, prev.length + 1)
        );
      }, speed);
    }

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, phraseIndex]);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveStep((s) => (s + 1) % 3);
          return 0;
        }
        return prev + 2.5;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white">
      {/* Dynamic Master Navbar with Active Routes */}
      <Navbar />


      {/* Hero Section - Full First Fold with Perfectly Balanced Viewport */}
      <section className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center py-4 sm:py-6 md:py-8 px-4 text-center relative overflow-hidden">
        {/* Subtle Background Radial Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-emerald-200/80 text-xs font-semibold mb-3 bg-emerald-50/70 text-emerald-950 shadow-xs transition-transform hover:scale-105">
          <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
          Spatial &amp; Vector Urban Forestry DBMS
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[48px] font-extrabold tracking-tight text-[#111111] max-w-4xl leading-[1.14] mb-3">
          Urban Tree Lifecycle Management with <br className="hidden sm:inline" />
          <span className="relative inline-block mt-1">
            Spatial &amp; Similarity Search
            <svg
              className="absolute w-full h-2.5 -bottom-1 left-0 text-emerald-600"
              viewBox="0 0 300 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
            >
              <path
                d="M2 9.5C85.5 3.5 198.5 1.5 298 7"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </h1>

        <p className="text-xs sm:text-sm md:text-base text-gray-600 max-w-2xl mb-3.5 leading-relaxed font-normal">
          Unified PostgreSQL engine combining PostGIS geospatial boundaries, 3NF lifecycle records, and pgvector multimodal disease similarity search.
        </p>

        {/* Dynamic Typing Terminal Line */}
        <div className="text-xs sm:text-sm text-gray-500 mb-4 flex items-center justify-center font-mono">
          <span>Hybrid SQL with</span>
          <span className="text-emerald-800 font-bold ml-2 bg-emerald-50/90 px-2 py-0.5 rounded-md border border-emerald-200/90 shadow-xs text-xs sm:text-xs">
            {displayText || "\u00A0"}
          </span>
          <span className="w-[2px] h-3.5 bg-emerald-600 ml-1.5 animate-pulse inline-block shadow-sm shadow-emerald-500"></span>
        </div>

        {/* CTA Buttons with Emerald Shadow Hue */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/console"
            className="px-5 py-2 bg-slate-950 hover:bg-slate-900 text-white border border-emerald-500/40 hover:border-emerald-400 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-all duration-300 shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/35 hover:-translate-y-0.5"
          >
            Explore 3NF Schema &amp; DDL <Database className="w-4 h-4 text-emerald-400" />
          </Link>

          <Link
            href="/console"
            className="px-5 py-2 bg-white hover:bg-emerald-50/40 text-slate-950 border border-emerald-500/30 hover:border-emerald-500/60 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-all duration-300 shadow-sm shadow-emerald-500/15 hover:shadow-md hover:shadow-emerald-500/25 hover:-translate-y-0.5"
          >
            Execute Hybrid Queries <ArrowRight className="w-4 h-4 text-emerald-600" />
          </Link>
        </div>

        {/* Subtle Scroll Hint */}
        <div className="mt-5 text-[11px] font-mono text-slate-400 flex flex-col items-center gap-1 animate-bounce">
          <span>Explore Live System Architecture</span>
          <ChevronDown className="w-3.5 h-3.5 text-emerald-600" />
        </div>
      </section>

      {/* Dashboard Section */}
      <section className="max-w-[1400px] mx-auto px-4 pt-6 pb-16">
        {/* Top Cards - Unified Dark Green Theme */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-4">
          <div className="col-span-1 p-5 rounded-xl border border-gray-200/90 shadow-sm bg-white flex flex-col justify-between hover:border-emerald-300 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-emerald-900/10 text-emerald-800 rounded-lg border border-emerald-200/60">
                <Trees className="w-5 h-5" />
              </div>
              <span className="flex items-center text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/70">
                +24.8% <TrendingUp className="w-3 h-3 ml-1" />
              </span>
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight text-gray-950 mb-0.5">142,850</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2.5">Cataloged Trees</div>
              <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-2.5">
                <span className="font-mono text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-medium px-2 py-0.5 rounded">3NF Relational</span>
                <span className="text-[11px] text-gray-400">0 Null FKs</span>
              </div>
            </div>
          </div>
          
          <div className="col-span-1 p-5 rounded-xl border border-gray-200/90 shadow-sm bg-white flex flex-col justify-between hover:border-emerald-300 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-emerald-900/10 text-emerald-800 rounded-lg border border-emerald-200/60">
                <Compass className="w-5 h-5" />
              </div>
              <span className="flex items-center text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/70">
                100% <ShieldCheck className="w-3 h-3 ml-1" />
              </span>
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight text-gray-950 mb-0.5">198 Wards</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2.5">PostGIS Polygons</div>
              <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-2.5">
                <span className="font-mono text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-medium px-2 py-0.5 rounded">SRID 4326 GiST</span>
                <span className="text-[11px] text-gray-400">&lt; 3.8ms scan</span>
              </div>
            </div>
          </div>
          
          <div className="col-span-1 p-5 rounded-xl border border-gray-200/90 shadow-sm bg-white flex flex-col justify-between hover:border-emerald-300 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-emerald-900/10 text-emerald-800 rounded-lg border border-emerald-200/60">
                <Layers className="w-5 h-5" />
              </div>
              <span className="flex items-center text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/70">
                99.4% <TrendingUp className="w-3 h-3 ml-1" />
              </span>
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight text-gray-950 mb-0.5">89,420</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2.5">CLIP Embeddings</div>
              <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-2.5">
                <span className="font-mono text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-medium px-2 py-0.5 rounded">512-d HNSW</span>
                <span className="text-[11px] text-gray-400">m=16, ef=64</span>
              </div>
            </div>
          </div>
          
          <div className="col-span-1 p-5 rounded-xl border border-gray-200/90 shadow-sm bg-white flex flex-col justify-between hover:border-emerald-300 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-emerald-900/10 text-emerald-800 rounded-lg border border-emerald-200/60">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="flex items-center text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/70">
                +38.2% <TrendingUp className="w-3 h-3 ml-1" />
              </span>
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight text-gray-950 mb-0.5">1,420</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2.5">Triggered Cures</div>
              <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-2.5">
                <span className="font-mono text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-medium px-2 py-0.5 rounded">PL/pgSQL</span>
                <span className="text-[11px] text-gray-400">Auto-Dispatched</span>
              </div>
            </div>
          </div>
          
          <div className="col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-2 p-5 rounded-xl border border-gray-200/90 shadow-sm bg-white relative overflow-hidden flex flex-col justify-between min-w-[280px] hover:border-emerald-300 transition-all">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="font-semibold text-base text-gray-900">Inspector Fleet & RLS Isolation</h3>
                <span className="flex items-center gap-1.5 text-[11px] font-medium bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  RLS Active
                </span>
              </div>
              <p className="text-xs text-gray-500">100% tenant isolation across 198 municipal wards</p>
            </div>
            
            <div className="mt-6 flex items-baseline gap-2 relative z-10">
              <span className="text-3xl font-extrabold text-gray-950 tracking-tight">42.4k</span>
              <span className="text-xs font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/70">+9.2% Velocity</span>
            </div>
            
            <div className="text-[11px] text-gray-500 relative z-10 border-t border-gray-100 pt-2.5 mt-2 flex items-center justify-between">
              <span className="font-mono text-[11px] text-emerald-900 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/50">tenant_id = jwt.ward_id</span>
              <span className="text-[11px] text-gray-400">1,280 active sessions</span>
            </div>
            
            {/* Real 3D Interactive Urban Tree with Holographic RLS Geofence Dome */}
            <div className="absolute right-1 -bottom-2 pointer-events-auto z-10 flex items-center justify-center">
              <Geofence3DViewer />
            </div>
          </div>
        </div>

        {/* Bottom Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Main Inspection Velocity Chart - Dynamic Interactive Component */}
          <InteractiveVelocityChart />

          {/* Operational Pipeline Card - Clean Green Theme */}
          <div className="col-span-1 lg:col-span-3 p-6 rounded-xl border border-gray-200/90 shadow-sm bg-white flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-gray-950">Operational Pipeline</h3>
                    <span className="flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Active Queue
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Transactional triage & execution</p>
                </div>
                <button className="text-gray-400 hover:text-black">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/70 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-emerald-900/10 text-emerald-800 rounded-md border border-emerald-200/50">
                        <Stethoscope className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-gray-800">Field Inspections</span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded font-medium border border-emerald-200/60">+14.2%</span>
                  </div>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-xl font-bold font-mono text-gray-950">5,550</span>
                    <span className="text-[11px] text-gray-500">ST_Point() validated</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: "78%" }}></div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/70 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-emerald-900/10 text-emerald-800 rounded-md border border-emerald-200/50">
                        <Wrench className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-gray-800">Work Orders Dispatched</span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 font-medium">&lt; 5m SLA</span>
                  </div>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-xl font-bold font-mono text-gray-950">3,520</span>
                    <span className="text-[11px] text-gray-500">sp_confirm_diagnosis()</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: "92%" }}></div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/70 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-emerald-900/10 text-emerald-800 rounded-md border border-emerald-200/50">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-gray-800">Cured Pathologies</span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded font-medium border border-emerald-200/60">98.2%</span>
                  </div>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-xl font-bold font-mono text-gray-950">2,350</span>
                    <span className="text-[11px] text-gray-500">Cosine sim &ge; 0.88</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: "98%" }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400 font-mono">
              <span>Backlog: 0 msgs</span>
              <span>Deadlocks: 0</span>
              <span className="text-emerald-800 font-semibold">SLA 99.8%</span>
            </div>
          </div>

          {/* Disease Surveillance Card - Clean Green Theme */}
          <div className="col-span-1 lg:col-span-3 p-6 rounded-xl border border-gray-200/90 shadow-sm bg-white flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-gray-950">Disease Surveillance</h3>
                    <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                      HNSW Clusters
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Real-time cosine distance alerts</p>
                </div>
                <button className="text-gray-400 hover:text-black">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              {/* Real-time Outbreak Flag - Clean Light Alert Banner */}
              <div className="mb-4 p-2.5 bg-emerald-50/90 border border-emerald-200 rounded-lg flex items-center gap-2.5 text-xs text-emerald-950">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                <span className="font-semibold text-[11px]">Critical Flag: Ward 14 (Ganoderma Rot)</span>
              </div>

              {/* Segmented Risk Distribution Bar - Balanced Greens */}
              <div className="mb-4">
                <div className="flex justify-between text-[11px] text-gray-500 mb-1 font-mono">
                  <span>Cluster Proportions</span>
                  <span className="font-semibold text-gray-800">20,113 total</span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-100 flex overflow-hidden">
                  <div className="bg-emerald-600 h-full" style={{ width: "62%" }} title="Fungal 62%"></div>
                  <div className="bg-emerald-500 h-full" style={{ width: "20%" }} title="Bacterial 20%"></div>
                  <div className="bg-emerald-400 h-full" style={{ width: "12%" }} title="Borers 12%"></div>
                  <div className="bg-emerald-700 h-full" style={{ width: "6%" }} title="Critical 6%"></div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-emerald-900/10 text-emerald-800 rounded border border-emerald-200/50">
                      <Leaf className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">Ganoderma Rot</div>
                      <div className="text-[10px] text-gray-400 font-mono">sim &ge; 0.892 · Fungal</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold font-mono text-gray-900">14,250</div>
                    <span className="text-[10px] text-emerald-800 font-medium">62.0%</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-emerald-900/10 text-emerald-800 rounded border border-emerald-200/50">
                      <Activity className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">Bacterial Canker</div>
                      <div className="text-[10px] text-gray-400 font-mono">sim &ge; 0.841 · Supervised</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold font-mono text-gray-900">4,523</div>
                    <span className="text-[10px] text-emerald-800 font-medium">19.8%</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-emerald-900/10 text-emerald-800 rounded border border-emerald-200/50">
                      <Bug className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">Borer Beetles</div>
                      <div className="text-[10px] text-gray-400 font-mono">sim &ge; 0.795 · Quarantine</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold font-mono text-gray-900">1,250</div>
                    <span className="text-[10px] text-emerald-800 font-medium">12.2%</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-emerald-100 text-emerald-800 rounded border border-emerald-200">
                      <TriangleAlert className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                        Critical Outbreak
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono">Trigger Auto-Escalated</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold font-mono text-gray-900">90</div>
                    <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-semibold">&tau;=0.82</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400 font-mono">
              <span>HNSW Index: pgvector</span>
              <span className="text-emerald-800 font-semibold">Recall: 99.4%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="pt-16 pb-0 px-4 bg-white text-center">
        <h4 className="text-sm font-serif italic relative inline-block mb-4">
          Core DBMS Innovations
          <span className="absolute -bottom-1 left-0 w-full h-[1px] bg-black"></span>
        </h4>
        
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 max-w-4xl mx-auto">
          Execute Hybrid Spatial, Relational & Vector Queries with <br className="hidden md:block"/>
          <span className="relative inline-block mt-2">
            Unified PostgreSQL
            <svg
              className="absolute w-full h-3 -bottom-1 left-0 text-black"
              viewBox="0 0 300 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
            >
              <path
                d="M2 9.5C85.5 3.5 198.5 1.5 298 7"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </h2>
        
        <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8 leading-relaxed">
          Eliminate fragmented spreadsheets and fragile external vector stores. EverLeafDB answers complex questions mixing geographic coordinates, botanical facts, and visual pathology in one ACID transaction.
        </p>
      </section>
      
      {/* Massive Bento Grid Features */}
      <section className="max-w-[1400px] mx-auto px-4 py-8">
        
        <style>{`
          @keyframes float-slow {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
          }
          @keyframes float-slower {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-3px); }
          }
          @keyframes dash-move {
            to { stroke-dashoffset: -20; }
          }
          .animate-float-slow { animation: float-slow 4s ease-in-out infinite; }
          .animate-float-slower { animation: float-slower 5s ease-in-out infinite; }
          .animate-dash-move { stroke-dasharray: 4 4; animation: dash-move 1.5s linear infinite; }
          
          @keyframes marquee-v {
            0% { transform: translateY(0); }
            100% { transform: translateY(-50%); }
          }
          .animate-marquee-v { animation: marquee-v 14s linear infinite; }
          
          .mask-image-vertical {
            mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%);
            -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%);
          }
        `}</style>
        
        {/* Row 2: 3-col grids */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border-b border-gray-100 border-dashed">
          {/* PostGIS Spatial Layer */}
          <div className="p-6 md:p-8 border-b border-gray-100 border-dashed lg:border-b-0 lg:border-r flex flex-col min-h-[460px]">
            <h3 className="text-2xl font-bold mb-3">PostGIS Spatial Subsystem</h3>
            <p className="text-gray-500 mb-6 leading-relaxed text-sm">
              Model municipal tree points and ward boundaries as native PostGIS geometries. Enforce spatial containment with ST_Contains and radius proximity with ST_DWithin.
            </p>
            
            {/* Diagram Box */}
            <div className="w-full mt-auto bg-[#fafafa] rounded-2xl border border-gray-100 overflow-hidden h-60 flex items-center p-4 relative gap-0">
              {/* Left Side: Infinite Vertical Marquee */}
              <div className="w-28 h-full relative overflow-hidden mask-image-vertical flex-shrink-0 flex items-center justify-center">
                <div className="flex flex-col gap-3 animate-marquee-v py-4 w-full items-center">
                  <div className="px-4 py-1.5 bg-white border border-gray-200/80 rounded-full text-xs font-medium text-gray-700 shadow-sm whitespace-nowrap text-center">Ward 01 (Central)</div>
                  <div className="px-4 py-1.5 bg-white border border-gray-200/80 rounded-full text-xs font-medium text-gray-700 shadow-sm whitespace-nowrap text-center">Ward 02 (Lalbagh)</div>
                  <div className="px-4 py-1.5 bg-white border border-gray-200/80 rounded-full text-xs font-semibold text-gray-900 shadow-sm whitespace-nowrap text-center">Ward 03 (Cubbon)</div>
                  <div className="px-4 py-1.5 bg-white border border-gray-200/80 rounded-full text-xs font-medium text-gray-700 shadow-sm whitespace-nowrap text-center">Ward 04 (Indiranagar)</div>
                  <div className="px-4 py-1.5 bg-white border border-gray-200/80 rounded-full text-xs font-medium text-gray-700 shadow-sm whitespace-nowrap text-center">Ward 05 (Jayanagar)</div>
                  <div className="px-4 py-1.5 bg-white border border-gray-200/80 rounded-full text-xs font-medium text-gray-700 shadow-sm whitespace-nowrap text-center">Ward 06 (Hebbal)</div>
                  
                  {/* Duplicate set for seamless infinite loop */}
                  <div className="px-4 py-1.5 bg-white border border-gray-200/80 rounded-full text-xs font-medium text-gray-700 shadow-sm whitespace-nowrap text-center">Ward 01 (Central)</div>
                  <div className="px-4 py-1.5 bg-white border border-gray-200/80 rounded-full text-xs font-medium text-gray-700 shadow-sm whitespace-nowrap text-center">Ward 02 (Lalbagh)</div>
                  <div className="px-4 py-1.5 bg-white border border-gray-200/80 rounded-full text-xs font-semibold text-gray-900 shadow-sm whitespace-nowrap text-center">Ward 03 (Cubbon)</div>
                  <div className="px-4 py-1.5 bg-white border border-gray-200/80 rounded-full text-xs font-medium text-gray-700 shadow-sm whitespace-nowrap text-center">Ward 04 (Indiranagar)</div>
                  <div className="px-4 py-1.5 bg-white border border-gray-200/80 rounded-full text-xs font-medium text-gray-700 shadow-sm whitespace-nowrap text-center">Ward 05 (Jayanagar)</div>
                  <div className="px-4 py-1.5 bg-white border border-gray-200/80 rounded-full text-xs font-medium text-gray-700 shadow-sm whitespace-nowrap text-center">Ward 06 (Hebbal)</div>
                </div>
              </div>

              {/* Middle: Solid Connecting Line */}
              <div className="flex-1 h-[1px] bg-gray-200/80 mx-1"></div>

              {/* Right Side: Small Card */}
              <div className="w-44 h-full bg-white border border-gray-200/80 rounded-xl p-3.5 shadow-sm flex flex-col justify-center flex-shrink-0">
                <div className="text-xs font-bold text-gray-900 mb-1">ST_Point (4326)</div>
                <div className="text-[10px] text-gray-400 mb-1.5 leading-tight">Spatial GiST Index Accelerated</div>
                <div className="text-[10px] text-gray-500 leading-relaxed font-mono">ST_DWithin(geom, 500m) &lt; 7.1ms</div>
              </div>
            </div>
          </div>

          {/* pgvector High-Dimensional Similarity */}
          <div className="p-6 md:p-8 border-b border-gray-100 border-dashed lg:border-b-0 lg:border-r flex flex-col min-h-[460px]">
            <h3 className="text-2xl font-bold mb-3">pgvector Similarity Engine</h3>
            <p className="text-gray-500 mb-6 leading-relaxed text-sm">
              Vectorize foliage and bark photos into 512-d CLIP embeddings. Query visual nearest neighbors with cosine distance operators and HNSW graph traversal.
            </p>

            <div className="w-full mt-auto bg-slate-50/60 rounded-2xl border border-slate-100 overflow-hidden relative h-60 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 400 240" preserveAspectRatio="none">
                <path d="M 200 65 C 200 120, 110 120, 110 175" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" className="animate-dash-move" />
                <path d="M 200 65 C 200 120, 290 120, 290 175" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" className="animate-dash-move" />
              </svg>

              {/* Top Node */}
              <div className="absolute left-1/2 top-10 -translate-x-1/2 z-10">
                <div className="px-4 py-2 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-800 shadow-sm animate-float-slow whitespace-nowrap">
                  CLIP ViT-B/32 (512-d)
                </div>
              </div>

              {/* Bottom Left Node */}
              <div className="absolute left-[27.5%] bottom-10 -translate-x-1/2 z-10">
                <div className="px-4 py-2 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-800 shadow-sm animate-float-slower whitespace-nowrap">
                  Cosine Distance (&lt;=&gt;)
                </div>
              </div>

              {/* Bottom Right Node */}
              <div className="absolute left-[72.5%] bottom-10 -translate-x-1/2 z-10">
                <div className="px-4 py-2 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-800 shadow-sm animate-float-slow whitespace-nowrap">
                  HNSW (m=16, ef=64)
                </div>
              </div>
            </div>
          </div>

          {/* Relational 3NF Catalog */}
          <div className="p-6 md:p-8 flex flex-col min-h-[460px]">
            <h3 className="text-2xl font-bold mb-3">Relational 3NF Schema</h3>
            <p className="text-gray-500 mb-6 leading-relaxed text-sm">
              Strictly normalized relational architecture eliminating update and deletion anomalies across botanical species, diagnoses, and field work orders.
            </p>

            <div className="w-full mt-auto bg-slate-50/60 rounded-2xl border border-slate-100 overflow-hidden relative h-60 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 400 240" preserveAspectRatio="none">
                <line x1="110" y1="55" x2="200" y2="120" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" className="animate-dash-move" />
                <line x1="290" y1="55" x2="200" y2="120" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" className="animate-dash-move" />
                <line x1="110" y1="185" x2="200" y2="120" stroke="#10b981" strokeWidth="2" strokeDasharray="4 4" className="animate-dash-move" />
                <line x1="290" y1="185" x2="200" y2="120" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" className="animate-dash-move" />
              </svg>

              {/* Top Left */}
              <div className="absolute left-[27.5%] top-8 -translate-x-1/2 z-10">
                <div className="px-3.5 py-1.5 bg-white border border-gray-200 rounded-full text-xs text-gray-700 font-medium shadow-sm animate-float-slow whitespace-nowrap">
                  Species
                </div>
              </div>

              {/* Top Right */}
              <div className="absolute left-[72.5%] top-8 -translate-x-1/2 z-10">
                <div className="px-3.5 py-1.5 bg-white border border-gray-200 rounded-full text-xs text-gray-700 font-medium shadow-sm animate-float-slower whitespace-nowrap">
                  Wards
                </div>
              </div>

              {/* Center Badge */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <div className="px-4 py-2 bg-slate-100 border border-slate-200 rounded-full text-xs font-mono text-slate-800 shadow-sm animate-float-slow whitespace-nowrap">
                  --schema 3NF
                </div>
              </div>

              {/* Bottom Left */}
              <div className="absolute left-[27.5%] bottom-8 -translate-x-1/2 z-10">
                <div className="px-3.5 py-1.5 bg-white border border-gray-200 rounded-full text-xs text-gray-700 font-medium shadow-sm animate-float-slower whitespace-nowrap">
                  Diagnoses
                </div>
              </div>

              {/* Bottom Right */}
              <div className="absolute left-[72.5%] bottom-8 -translate-x-1/2 z-10">
                <div className="px-3.5 py-1.5 bg-black text-white border border-black rounded-full text-xs font-medium shadow-sm animate-float-slow whitespace-nowrap">
                  Work Orders
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 1: Ingestion Pipeline & Execution Engine */}
        <div className="border-t border-b border-gray-100 border-dashed mb-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Hybrid Query Execution Pipeline */}
            <div className="p-6 md:p-8 border-b border-gray-100 border-dashed lg:border-b-0 lg:border-r flex flex-col items-center text-center overflow-hidden">
              <h3 className="text-xl md:text-2xl font-bold mb-2">Hybrid Query Execution Plan</h3>
              <p className="text-gray-500 mb-6 max-w-md text-xs md:text-sm">
                EXPLAIN ANALYZE execution tree combining PostGIS GiST spatial candidate pruning with pgvector HNSW cosine re-ranking.
              </p>
              
              <div className="w-full bg-[#fafafa] border border-gray-200/80 rounded-xl p-4 mt-auto">
                {/* Pipeline visual - 4 Stages with spacious vertical stacking and zero text collision */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 text-left">
                  {/* Step 1 */}
                  <div className="p-3 bg-white border border-gray-200/90 rounded-lg shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-colors">
                    <div className="flex items-center justify-between gap-1 mb-2 pb-1.5 border-b border-gray-100">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-bold shrink-0">1. Spatial</span>
                      <span className="text-[10px] text-emerald-800 font-mono font-bold">0.15ms</span>
                    </div>
                    <div className="text-[11px] font-mono font-bold text-gray-900 leading-tight mb-1 truncate">Bitmap Index Scan</div>
                    <div className="text-[10px] text-gray-500 font-mono mb-2 truncate">ST_DWithin(500m)</div>
                    <div className="text-[10px] text-emerald-900 font-mono font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 truncate">100k → 28 rows</div>
                  </div>

                  {/* Step 2 */}
                  <div className="p-3 bg-white border border-gray-200/90 rounded-lg shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-colors">
                    <div className="flex items-center justify-between gap-1 mb-2 pb-1.5 border-b border-gray-100">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-bold shrink-0">2. Relational</span>
                      <span className="text-[10px] text-emerald-800 font-mono font-bold">0.30ms</span>
                    </div>
                    <div className="text-[11px] font-mono font-bold text-gray-900 leading-tight mb-1 truncate">Nested Loop Join</div>
                    <div className="text-[10px] text-gray-500 font-mono mb-2 truncate">species &amp; logs</div>
                    <div className="text-[10px] text-emerald-900 font-mono font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 truncate">species_id = 4</div>
                  </div>

                  {/* Step 3 */}
                  <div className="p-3 bg-white border border-gray-200/90 rounded-lg shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-colors">
                    <div className="flex items-center justify-between gap-1 mb-2 pb-1.5 border-b border-gray-100">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-bold shrink-0">3. Vector</span>
                      <span className="text-[10px] text-emerald-800 font-mono font-bold">6.21ms</span>
                    </div>
                    <div className="text-[11px] font-mono font-bold text-gray-900 leading-tight mb-1 truncate">Index Scan (HNSW)</div>
                    <div className="text-[10px] text-gray-500 font-mono mb-2 truncate">img_embed &lt;=&gt; $vec</div>
                    <div className="text-[10px] text-emerald-900 font-mono font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 truncate">Cosine &le; 0.18</div>
                  </div>

                  {/* Step 4 */}
                  <div className="p-3 bg-white border border-gray-200/90 rounded-lg shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-colors">
                    <div className="flex items-center justify-between gap-1 mb-2 pb-1.5 border-b border-gray-100">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-bold shrink-0">4. Limit</span>
                      <span className="text-[10px] text-emerald-800 font-mono font-bold">0.18ms</span>
                    </div>
                    <div className="text-[11px] font-mono font-bold text-gray-900 leading-tight mb-1 truncate">Top-5 Precedents</div>
                    <div className="text-[10px] text-gray-500 font-mono mb-2 truncate">Cures &amp; Outcomes</div>
                    <div className="text-[10px] text-emerald-950 font-mono font-bold bg-emerald-100/70 px-1.5 py-0.5 rounded border border-emerald-200/70 truncate">Total: 6.84ms</div>
                  </div>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-gray-200/80 flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono text-gray-600 gap-1.5 px-1">
                  <span>Planning Time: <strong className="text-gray-900">0.85ms</strong></span>
                  <span className="text-emerald-900 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">Execution: 6.84ms (274x vs SeqScan)</span>
                </div>
              </div>
            </div>

            {/* Multi-Model Index Architecture */}
            <div className="p-6 md:p-8 flex flex-col items-center text-center overflow-hidden">
              <h3 className="text-xl md:text-2xl font-bold mb-2">Multi-Model Index Architecture</h3>
              <p className="text-gray-500 mb-6 max-w-md text-xs md:text-sm">
                Three specialized on-disk access methods engineered for scalar, spatial, and high-dimensional vector search.
              </p>
              
              <div className="w-full bg-[#fafafa] border border-gray-200/80 rounded-xl p-4 mt-auto">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                  {/* B-Tree */}
                  <div className="p-3 bg-white border border-gray-200/90 rounded-lg shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-colors">
                    <div className="flex items-center justify-between gap-1 mb-2 pb-1.5 border-b border-gray-100">
                      <span className="text-xs sm:text-sm font-bold text-gray-900 truncate">Relational B+ Tree</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-bold shrink-0">O(log N)</span>
                    </div>
                    <div className="space-y-1 font-mono text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-100 mb-2">
                      <div className="text-gray-400">[Root Page: Index Meta]</div>
                      <div className="pl-2">↓ [Internal: Keys]</div>
                      <div className="pl-3.5 text-emerald-800 font-bold">↳ [Leaf: Key + ctid]</div>
                    </div>
                    <div className="text-xs font-mono text-emerald-900 bg-emerald-50/70 p-1.5 rounded border border-emerald-200/50 truncate">
                      <strong className="text-emerald-950">INDEX</strong> trees(species, status)
                    </div>
                  </div>

                  {/* GiST R-Tree */}
                  <div className="p-3 bg-white border border-gray-200/90 rounded-lg shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-colors">
                    <div className="flex items-center justify-between gap-1 mb-2 pb-1.5 border-b border-gray-100">
                      <span className="text-xs sm:text-sm font-bold text-gray-900 truncate">PostGIS GiST R-Tree</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-bold shrink-0">SRID 4326</span>
                    </div>
                    <div className="space-y-1 font-mono text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-100 mb-2">
                      <div className="text-gray-400">[Bounding Box R1, R2]</div>
                      <div className="pl-2">↓ [Sub-Boxes &amp; Wards]</div>
                      <div className="pl-3.5 text-emerald-800 font-bold">↳ [Point Geometries]</div>
                    </div>
                    <div className="text-xs font-mono text-emerald-900 bg-emerald-50/70 p-1.5 rounded border border-emerald-200/50 truncate">
                      <strong className="text-emerald-950">USING</strong> gist(location_geom)
                    </div>
                  </div>

                  {/* HNSW Graph */}
                  <div className="p-3 bg-white border border-gray-200/90 rounded-lg shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-colors">
                    <div className="flex items-center justify-between gap-1 mb-2 pb-1.5 border-b border-gray-100">
                      <span className="text-xs sm:text-sm font-bold text-gray-900 truncate">pgvector HNSW</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-bold shrink-0">512-dim</span>
                    </div>
                    <div className="space-y-1 font-mono text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-100 mb-2">
                      <div className="text-gray-400">[Layer 2: Fast Skips]</div>
                      <div className="pl-2">↓ [Layer 1: Proximity]</div>
                      <div className="pl-3.5 text-emerald-800 font-bold">↳ [Layer 0: Cosine &lt;=&gt;]</div>
                    </div>
                    <div className="text-xs font-mono text-emerald-900 bg-emerald-50/70 p-1.5 rounded border border-emerald-200/50 truncate">
                      <strong className="text-emerald-950">HNSW</strong> (m=16, ef_const=64)
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-gray-200/80 flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono text-gray-600 gap-1.5 px-1">
                  <span>Engine: <strong className="text-gray-900">PostgreSQL 16 Core</strong></span>
                  <span className="text-emerald-900 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">ACID Guaranteed Across All Indexes</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Row 1: Bottom 3 cols */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-t border-gray-100 border-dashed">
            <div className="p-8 border-b border-gray-100 border-dashed md:border-b-0 md:border-r flex flex-col justify-center">
              <h3 className="text-xl font-bold mb-3">Sub-15ms Query Latency</h3>
              <p className="text-gray-500 text-sm mb-6">Two-phase index scans prune 100k trees via spatial GiST bounding before HNSW vector re-ranking.</p>
              <div className="flex gap-2 flex-wrap">
                <div className="px-3 py-1.5 border border-gray-200 rounded-full bg-white text-xs text-gray-500 whitespace-nowrap">GiST Index</div>
                <div className="px-3 py-1.5 border border-gray-200 rounded-full bg-white text-xs flex items-center gap-1 shadow-sm whitespace-nowrap font-medium text-gray-800">HNSW Graph</div>
                <div className="px-3 py-1.5 border border-gray-200 rounded-full bg-white text-xs flex items-center gap-1 whitespace-nowrap text-gray-600">B-Tree Composite</div>
              </div>
            </div>
            <div className="p-8 border-b border-gray-100 border-dashed md:border-b-0 md:border-r flex flex-col justify-center">
              <h3 className="text-xl font-bold mb-3">Explainable Case Retrieval</h3>
              <p className="text-gray-500 text-sm mb-6">Shows actual past clinical cases, dosage, and outcomes rather than opaque black-box probability labels.</p>
              <div className="inline-flex items-center gap-3 px-3 py-1.5 border border-gray-200 rounded-full bg-white shadow-sm text-sm self-start">
                Case Accuracy
                <div className="flex gap-1 font-bold text-emerald-600">
                  88.2% Precision@5
                </div>
              </div>
            </div>
            <div className="p-8 flex flex-col justify-center">
              <h3 className="text-xl font-bold mb-3">Strict Domain Integrity</h3>
              <p className="text-gray-500 text-sm mb-6">Enforces positive height/girth constraints, validated health statuses, and strict foreign keys.</p>
              <div className="flex gap-3 items-center">
                <div className="w-12 h-12 flex items-center justify-center border border-gray-200 rounded-lg bg-white shadow-sm font-mono text-base font-bold text-gray-800">
                  3NF
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="inline-flex items-center px-2.5 py-1 border border-gray-200 rounded-md bg-white shadow-sm text-[11px] text-gray-600 font-medium">
                    CHECK <span className="text-gray-300 mx-1.5">|</span> girth_cm &gt; 0
                  </div>
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 border border-gray-200 rounded-md bg-gray-50 shadow-sm text-[11px] font-semibold text-gray-800">
                    No Anomalies
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Security, Active Triggers, Alert Processing */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border-b border-gray-100 border-dashed">
          {/* Column 1: Multi-Ward Sync & Audit Logging */}
          <div className="border-r border-gray-100 border-dashed flex flex-col">
            {/* Row-Level Security Policy */}
            <div className="p-6 md:p-8 border-b border-gray-100 border-dashed flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold">PostgreSQL Row-Level Security</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                  RLS ACTIVE
                </span>
              </div>
              <p className="text-gray-500 mb-6 leading-relaxed text-xs md:text-sm">
                Enforces ward isolation at the database engine level so field inspectors only access and insert trees inside their assigned ward.
              </p>
              
              <div className="w-full bg-[#fafafa] border border-gray-200/80 rounded-xl p-3.5 mt-auto font-mono">
                <div className="text-[10px] text-gray-500 mb-1.5 font-bold uppercase tracking-wide">PostgreSQL Policy DDL</div>
                <div className="bg-white border border-gray-200 rounded-lg p-2.5 text-[10px] text-gray-800 leading-relaxed shadow-xs overflow-x-auto">
                  <div className="text-emerald-950 font-bold">ALTER TABLE <span className="text-black">trees</span> ENABLE ROW LEVEL SECURITY;</div>
                  <div className="text-emerald-800 font-bold mt-1">CREATE POLICY <span className="text-black">rls_trees_ward</span> ON <span className="text-black">trees</span></div>
                  <div className="text-gray-700">FOR ALL TO <span className="text-black font-semibold">authenticated_inspector</span></div>
                  <div className="text-emerald-700 font-bold">USING (ward_id = current_setting(&apos;app.ward_id&apos;)::int);</div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-white border border-gray-200 rounded-md">
                    <div className="text-gray-500 text-xs">INSPECTOR (WARD 3)</div>
                    <div className="font-bold text-emerald-800 mt-0.5 text-sm">142 Trees Visible</div>
                    <div className="text-xs text-gray-400">Restricted to Ward Polygon</div>
                  </div>
                  <div className="p-2.5 bg-white border border-gray-200 rounded-md">
                    <div className="text-gray-500 text-xs">UNAUTHORIZED WARDS</div>
                    <div className="font-bold text-emerald-950 mt-0.5 text-sm">0 Rows Returned</div>
                    <div className="text-xs text-gray-400">Zero Query Leakage</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Audit Trail Logging */}
            <div className="p-6 md:p-8 flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold">Trigger-Based Audit Trail</h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                  JSONB DIFFS
                </span>
              </div>
              <p className="text-gray-500 mb-6 leading-relaxed text-xs md:text-sm">
                Active trigger records immutable JSONB snapshots on every tree mutation, diagnosis update, and work order transition.
              </p>
              
              <div className="w-full bg-[#fafafa] border border-gray-200/80 rounded-xl p-3.5 mt-auto font-mono text-xs">
                <div className="flex justify-between items-center pb-2 mb-2 border-b border-gray-200 text-xs text-gray-500 font-bold">
                  <span>AUDIT_LOG RECORD</span>
                  <span className="text-emerald-800">TX #849201</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between bg-white p-2 rounded border border-gray-200 text-xs">
                    <span className="text-gray-500">Operation:</span>
                    <span className="font-bold text-emerald-950">UPDATE on trees (tree_id = &apos;3b91...&apos;)</span>
                  </div>
                  <div className="flex justify-between bg-white p-2 rounded border border-gray-200 text-xs">
                    <span className="text-gray-500">OLD_VALUES:</span>
                    <span className="font-mono text-gray-700">{JSON.stringify({ status: "healthy", score: 4 })}</span>
                  </div>
                  <div className="flex justify-between bg-white p-2 rounded border border-gray-200 text-xs">
                    <span className="text-gray-500">NEW_VALUES:</span>
                    <span className="font-mono text-emerald-900 font-bold">{JSON.stringify({ status: "under_treatment", score: 1 })}</span>
                  </div>
                  <div className="flex justify-between bg-white p-2 rounded border border-gray-200 text-xs">
                    <span className="text-gray-500">Session Context:</span>
                    <span className="text-gray-700">user_id = inspector_04 | WAL: Archiving ON</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Autonomous Risk Trigger */}
          <div className="border-r border-gray-100 border-dashed flex flex-col">
            {/* Trigger State Machine */}
            <div className="p-6 md:p-8 flex flex-col h-full border-b border-gray-100 border-dashed">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold">Autonomous PL/pgSQL Trigger</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                  REAL-TIME
                </span>
              </div>
              <p className="text-gray-500 mb-6 text-xs md:text-sm leading-relaxed">
                <code className="text-black font-semibold">AFTER INSERT</code> trigger evaluates high-dimensional cosine distance against known lethal diseases of the same species.
              </p>

              <div className="w-full bg-[#fafafa] border border-gray-200/80 rounded-xl p-3.5 mt-auto font-mono">
                <div className="flex items-center justify-between text-[10px] text-gray-600 pb-2 mb-2 border-b border-gray-200">
                  <span className="font-bold">trg_fn_detect_severe_disease_alert()</span>
                  <span className="text-emerald-900 font-bold">Cutoff &ge; 0.82</span>
                </div>

                <div className="space-y-2 text-xs">
                  {/* Step 1 */}
                  <div className="p-2.5 bg-white border border-gray-200 rounded-md">
                    <div className="text-gray-500 text-xs font-semibold">1. INGESTION &amp; EXTRACTION</div>
                    <div className="text-gray-800 font-bold mt-0.5">NEW.image_embedding [512-dim Float32]</div>
                  </div>
                  {/* Step 2 */}
                  <div className="p-2.5 bg-white border border-gray-200 rounded-md">
                    <div className="text-gray-500 text-xs font-semibold">2. HNSW NEAREST-NEIGHBOR QUERY</div>
                    <div className="text-gray-800 font-bold mt-0.5">1 - (known.embedding &lt;=&gt; NEW.embedding)</div>
                    <div className="text-emerald-800 font-bold mt-0.5 text-xs">Matched: Ganoderma Lucidum (Sim: 0.892)</div>
                  </div>
                  {/* Step 3 */}
                  <div className="p-2.5 bg-emerald-50 text-emerald-950 border border-emerald-300 rounded-md">
                    <div className="text-emerald-800 text-xs font-bold">3. AUTOMATIC ESCALATION ACTION</div>
                    <div className="text-emerald-950 font-bold mt-0.5">INSERT INTO alerts (severity=&apos;CRITICAL&apos;)</div>
                    <div className="text-emerald-700 text-xs mt-0.5">UPDATE trees SET health_status=&apos;under_treatment&apos;</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* ACID Stored Procedure Runner */}
            <div className="p-6 md:p-8 flex flex-col h-full">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold">Atomic Stored Procedure</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                  ACID ATOMIC
                </span>
              </div>
              <p className="text-gray-500 mb-6 leading-relaxed text-xs md:text-sm">
                Encapsulates supervisor diagnosis approval, prescription, and work order dispatch into a single atomic transaction.
              </p>
              
              <div className="w-full bg-[#fafafa] border border-gray-200/80 rounded-xl p-3.5 mt-auto font-mono text-[10px]">
                <div className="text-[10px] text-gray-500 mb-1.5 font-bold uppercase tracking-wide">sp_confirm_diagnosis_and_dispatch_order()</div>
                <div className="bg-white border border-gray-200 rounded-lg p-2.5 text-[10px] text-gray-800 leading-relaxed shadow-xs">
                  <div className="text-emerald-950 font-bold">BEGIN TRANSACTION;</div>
                  <div className="text-gray-600 pl-2">-- Pessimistic locking eliminates race conditions</div>
                  <div className="text-emerald-900 pl-2">SELECT * FROM alerts WHERE alert_id = $1 <span className="text-emerald-800 font-bold">FOR UPDATE;</span></div>
                  <div className="text-gray-800 pl-2">INSERT INTO diagnoses (...) RETURNING diagnosis_id;</div>
                  <div className="text-gray-800 pl-2">INSERT INTO treatment_records (...);</div>
                  <div className="text-gray-800 pl-2">INSERT INTO work_orders (...);</div>
                  <div className="text-gray-800 pl-2">UPDATE alerts SET status = &apos;ACTIONED&apos;;</div>
                  <div className="text-emerald-950 font-bold">COMMIT;</div>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Case-Based Accuracy & Terminal */}
          <div className="flex flex-col">
            {/* Precision@k Benchmark */}
            <div className="p-6 md:p-8 border-b border-gray-100 border-dashed flex flex-col h-full">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold">Vector Precision Benchmark</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                  EXPERIMENT A
                </span>
              </div>
              <p className="text-gray-500 mb-6 text-xs md:text-sm leading-relaxed">
                Empirical retrieval quality evaluation across 500 labeled botanical pathological images comparing models and distance metrics.
              </p>

              <div className="w-full bg-[#fafafa] border border-gray-200/80 rounded-xl p-3.5 mt-auto font-mono text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs text-gray-500 font-bold">
                      <th className="pb-1.5">Model / Metric</th>
                      <th className="pb-1.5">Dim</th>
                      <th className="pb-1.5">Top-1</th>
                      <th className="pb-1.5">Precision@5</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    <tr className="bg-emerald-50/60 font-semibold text-emerald-950">
                      <td className="py-2 font-bold">CLIP ViT-B/32 (&lt;=&gt;)</td>
                      <td className="py-2">512</td>
                      <td className="py-2">84.6%</td>
                      <td className="py-2 text-emerald-700 font-bold">88.2%</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-gray-700">MobileNetV3 (L2)</td>
                      <td className="py-2">512</td>
                      <td className="py-2">72.1%</td>
                      <td className="py-2 text-gray-700">74.8%</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-gray-700">ResNet-50 (L2)</td>
                      <td className="py-2">2048</td>
                      <td className="py-2">68.4%</td>
                      <td className="py-2 text-gray-700">71.2%</td>
                    </tr>
                    <tr className="text-gray-400">
                      <td className="py-2">Text-Only Baseline</td>
                      <td className="py-2">384</td>
                      <td className="py-2">42.0%</td>
                      <td className="py-2">46.5%</td>
                    </tr>
                  </tbody>
                </table>

                <div className="mt-3 pt-2.5 border-t border-gray-200/80 flex items-center justify-between text-xs text-gray-500">
                  <span>Cosine Distance Formula:</span>
                  <span className="font-bold text-gray-900">1 - (u·v)/(||u||·||v||)</span>
                </div>
              </div>
            </div>

            {/* CLI & Database Connection */}
            <div className="p-6 md:p-8 flex flex-col h-full">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold">PostgreSQL Engine Catalog</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                  psql CLI
                </span>
              </div>
              <p className="text-gray-500 mb-6 text-xs md:text-sm leading-relaxed">
                Connect via standard psql, asyncpg, or pgAdmin to inspect extensions and execute hybrid spatial-vector queries.
              </p>
              
              <div className="w-full bg-[#111111] text-white rounded-xl p-3.5 mt-auto font-mono text-xs shadow-sm">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-800 text-xs text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span className="ml-1 text-gray-300">everleafdb@localhost:5432</span>
                  </div>
                  <span>pg16.3</span>
                </div>

                <div className="text-gray-300 space-y-1 text-xs">
                  <div><span className="text-emerald-400 font-bold">everleafdb=#</span> \dx</div>
                  <div className="text-gray-400 text-xs leading-relaxed font-mono">
                    &nbsp;postgis&nbsp;&nbsp;&nbsp;|&nbsp;3.4.2&nbsp;|&nbsp;Spatial geometry &amp; GiST<br/>
                    &nbsp;vector&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;0.7.0&nbsp;|&nbsp;pgvector cosine &amp; HNSW<br/>
                    &nbsp;uuid-ossp&nbsp;|&nbsp;1.1&nbsp;&nbsp;&nbsp;|&nbsp;UUID generation functions
                  </div>
                  <div className="pt-2 border-t border-gray-800 text-gray-400 text-xs flex justify-between">
                    <span>Connection Pool: 100</span>
                    <span className="text-emerald-400 font-bold">READY</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section: Animated Software Workflow Player */}
      <section className="py-24 px-4 bg-white border-t border-gray-100">
        <div className="text-center mb-16">
          <h4 className="text-sm font-serif italic relative inline-block mb-4">
            How It Works
            <span className="absolute -bottom-1 left-0 w-full h-[1px] bg-black"></span>
          </h4>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight max-w-4xl mx-auto">
            From Field Inspection to Cured Outbreak
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mt-6 leading-relaxed">
            Experience the real application workflow: field capture, real-time pgvector trigger evaluation, and atomic work order dispatch.
          </p>
        </div>

        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 items-stretch"
             onMouseEnter={() => setIsPaused(true)}
             onMouseLeave={() => setIsPaused(false)}>
          
          {/* Left Step Navigator */}
          <div className="w-full lg:w-1/3 flex flex-col justify-between gap-4">
            {[
              {
                step: 0,
                title: "1. Field Capture & Ingestion",
                desc: "Field inspector captures condition score (1-5), tags anatomical organ (leaf/bark), and uploads photo with GPS coordinates.",
                icon: Leaf,
                badge: "MOBILE INGESTION"
              },
              {
                step: 1,
                title: "2. Vector Similarity & Trigger",
                desc: "CLIP produces 512-d embedding; AFTER INSERT trigger executes HNSW cosine search; auto-escalates if similarity >= 0.82.",
                icon: Sparkles,
                badge: "HNSW TRIGGER"
              },
              {
                step: 2,
                title: "3. Atomic Work Order Dispatch",
                desc: "Supervisor confirms diagnosis and calls sp_confirm_diagnosis_and_dispatch_order() under strict ACID row locking.",
                icon: Wrench,
                badge: "ACID STORED PROC"
              }
            ].map((item, idx) => {
              const Icon = item.icon;
              const isActive = activeStep === idx;
              return (
                <div
                  key={idx}
                  onClick={() => { setActiveStep(idx); setProgress(0); }}
                  className={`p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isActive
                      ? "border-emerald-800 bg-emerald-50/40 shadow-sm ring-1 ring-emerald-800/10"
                      : "border-gray-200 bg-white hover:border-gray-300 opacity-70 hover:opacity-100"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 font-bold text-sm text-gray-900">
                        <Icon className={`w-4 h-4 ${isActive ? "text-emerald-800" : "text-gray-500"}`} />
                        {item.title}
                      </div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        isActive ? "bg-emerald-100 text-emerald-900 border border-emerald-300" : "bg-gray-100 text-gray-700"
                      }`}>
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-gray-600 text-xs leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  {/* Animated Progress Bar */}
                  <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mt-4">
                    <div
                      className={`h-full transition-all duration-100 ease-linear ${
                        isActive ? "bg-emerald-800" : (activeStep > idx ? "bg-emerald-800" : "bg-transparent")
                      }`}
                      style={{
                        width: isActive ? `${progress}%` : (activeStep > idx ? "100%" : "0%")
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Live Application Flow Screen */}
          <div className="w-full lg:w-2/3 bg-white border border-gray-200/90 shadow-xl rounded-xl overflow-hidden flex flex-col min-h-[480px]">
            {/* Window Chrome */}
            <div className="h-10 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-950/30"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-800/40"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-700"></span>
                <span className="text-[11px] font-mono text-gray-600 ml-2">
                  {activeStep === 0 && "everleafdb://field-terminal/inspections/new"}
                  {activeStep === 1 && "everleafdb://engine/active-triggers/symptom-alert"}
                  {activeStep === 2 && "everleafdb://supervisor-console/triage-dispatch"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                  {activeStep === 0 && "GPS: 12.9716, 77.5946 (WARD 03)"}
                  {activeStep === 1 && "pgvector HNSW (<=>) RUNNING"}
                  {activeStep === 2 && "ACID TX LEVEL: REPEATABLE READ"}
                </span>
              </div>
            </div>

            {/* Dynamic Stage Viewport */}
            <div className="flex-1 p-6 flex flex-col justify-between bg-white">
              
              {/* STAGE 0: Field Inspection & Photo Ingestion */}
              {activeStep === 0 && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                      <h4 className="font-bold text-base text-gray-900">Field Inspection Log: Specimen #1084</h4>
                      <p className="text-xs text-gray-500">Species: Ficus benghalensis (Heritage Banyan) • Ward 03</p>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded text-xs font-mono font-bold">
                      Condition Score: 1 / 5 (Severe)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    {/* Realistic Botanical Specimen Photo with Scanning Laser Animation */}
                    <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-200/90 shadow-xs group bg-gray-950 flex flex-col justify-between">
                      <img
                        src="/specimen_leaf.jpg"
                        alt="Botanical specimen field capture"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      {/* Dark gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-950/85 via-transparent to-black/25 pointer-events-none" />
                      
                      {/* Animated Laser Scanning Line */}
                      <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10b981] animate-pulse top-1/2 pointer-events-none" />
                      
                      {/* High-tech targeting reticle overlay */}
                      <div className="relative z-10 p-2.5 flex justify-between items-start text-xs font-mono text-emerald-200">
                        <span className="bg-emerald-950/90 px-2 py-0.5 rounded border border-emerald-700/80 font-bold">TARGET: NECROTIC LEAF</span>
                        <span className="bg-emerald-950/90 px-2 py-0.5 rounded border border-emerald-700/80 font-bold">CONF: 94.8%</span>
                      </div>
                      
                      <div className="relative z-10 p-2.5 flex justify-between items-end text-xs font-mono text-emerald-100">
                        <span className="bg-black/80 px-2 py-0.5 rounded">Ficus benghalensis</span>
                        <span className="bg-emerald-950/90 px-2 py-0.5 rounded text-emerald-300 border border-emerald-700/80 font-bold">512-d CLIP Extracted</span>
                      </div>
                    </div>

                    {/* Metadata & Query Preview */}
                    <div className="space-y-2 text-xs font-mono">
                      <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="text-gray-400">GEOMETRY: </span>
                        <span className="text-gray-900 font-semibold">ST_SetSRID(ST_Point(77.5946, 12.9716), 4326)</span>
                      </div>
                      <div className="p-2.5 bg-emerald-50/70 rounded-lg border border-emerald-200/70">
                        <span className="text-emerald-900 font-bold">WARD CHECK: </span>
                        <span className="text-emerald-800 font-bold">ST_Contains(Ward_03, Point) = TRUE</span>
                      </div>
                      <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-[10px] leading-relaxed">
                        <span className="text-emerald-950 font-bold">INSERT INTO inspections </span>
                        <span className="text-gray-700">(tree_id, condition_score, notes) VALUES (&apos;1084&apos;, 1, &apos;Severe lower rot&apos;);</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 text-emerald-950 border border-emerald-300 rounded-lg flex items-center justify-between text-xs font-mono shadow-xs">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Transaction committed: Ingestion complete &amp; HNSW trigger dispatched
                    </span>
                    <span className="text-emerald-800 font-bold">2.1ms</span>
                  </div>
                </div>
              )}

              {/* STAGE 1: Vector Similarity & Trigger Alert */}
              {activeStep === 1 && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                      <h4 className="font-bold text-base text-gray-900 flex items-center gap-2">
                        <TriangleAlert className="w-4 h-4 text-emerald-800" />
                        Trigger Activated: trg_fn_detect_severe_disease_alert()
                      </h4>
                      <p className="text-xs text-gray-500">Autonomous evaluation against verified pathological case repository</p>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded text-xs font-mono font-bold">
                      THRESHOLD EXCEEDED (89.2% &ge; 82%)
                    </span>
                  </div>

                  {/* Similarity Comparison Grid with Generated Botanical Photos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3.5 bg-white border border-gray-200/90 rounded-xl shadow-xs flex items-center gap-3">
                      <div className="w-16 h-16 rounded-lg overflow-hidden border border-emerald-800/40 relative shrink-0 bg-gray-900">
                        <img src="/specimen_leaf.jpg" alt="Query specimen" className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 inset-x-0 bg-black/75 text-[8px] font-mono text-center text-white py-0.5">QUERY</div>
                      </div>
                      <div className="text-xs">
                        <div className="text-[10px] font-bold text-gray-400 uppercase">Incoming Query Photo</div>
                        <div className="font-bold text-gray-900 mt-0.5">Tree Tag #1084</div>
                        <div className="text-gray-500 text-[10px]">Cubbon Park Ward 03</div>
                        <div className="font-mono text-[10px] text-emerald-800 font-semibold mt-1">Vector: [0.042, -0.198, ...]</div>
                      </div>
                    </div>

                    <div className="p-3.5 bg-emerald-50/50 border border-emerald-200/80 rounded-xl shadow-xs flex items-center gap-3">
                      <div className="w-16 h-16 rounded-lg overflow-hidden border border-emerald-800/50 relative shrink-0 bg-gray-900">
                        <img src="/specimen_trunk.jpg" alt="Precedent match" className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 inset-x-0 bg-emerald-800 text-[8px] font-mono text-center text-white py-0.5 font-bold">MATCH</div>
                      </div>
                      <div className="text-xs">
                        <div className="text-[10px] font-bold text-emerald-800 uppercase">Top-1 Precedent Match (pgvector)</div>
                        <div className="font-bold text-gray-950 mt-0.5">Ganoderma Lucidum (Bark Rot)</div>
                        <div className="text-emerald-800 text-[10px] font-semibold">Similarity: 89.2% (Distance: 0.108)</div>
                        <div className="font-mono text-[10px] text-gray-600 mt-1">Status: CRITICAL AUTO-FLAG</div>
                      </div>
                    </div>
                  </div>

                  {/* Automated Trigger Action Banner */}
                  <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-lg font-mono text-xs text-emerald-950 space-y-1 shadow-xs">
                    <div className="font-bold text-[11px] flex items-center gap-1.5 text-emerald-800">
                      <span>✓</span> Alert #ALT-1049 Inserted with Severity &apos;CRITICAL&apos;
                    </div>
                    <div className="text-[10px] text-emerald-900">
                      &gt; UPDATE trees SET health_status = &apos;under_treatment&apos; WHERE tree_id = &apos;1084&apos;;
                    </div>
                    <div className="text-[10px] text-emerald-700">
                      &gt; Alert pushed to Supervisor Triage Dashboard in 12.4ms.
                    </div>
                  </div>
                </div>
              )}

              {/* STAGE 2: Atomic Work Order Generation */}
              {activeStep === 2 && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                      <h4 className="font-bold text-base text-gray-900 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-800" />
                        Supervisor Clinical Triage &amp; Atomic Dispatch
                      </h4>
                      <p className="text-xs text-gray-500">Executing stored procedure under ACID transaction isolation</p>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded text-xs font-mono font-bold">
                      ACID COMMITTED (200 OK)
                    </span>
                  </div>

                  {/* Stored Procedure Execution Details */}
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs">
                    <div className="text-emerald-950 font-bold mb-2 text-[11px]">
                      CALL sp_confirm_diagnosis_and_dispatch_order(&apos;ALT-1049&apos;, &apos;inspector_04&apos;, 2, 4, &apos;crew_alpha&apos;, &apos;EMERGENCY&apos;, CURRENT_DATE + 2);
                    </div>

                    <div className="space-y-1 text-[10px] text-gray-700">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-800 font-bold">✓ Step 1:</span>
                        <span>SELECT FOR UPDATE on alerts (Pessimistic Row Lock Acquired)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-800 font-bold">✓ Step 2:</span>
                        <span>INSERT INTO diagnoses (Disease: Ganoderma Lucidum, Source: vector_suggested)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-800 font-bold">✓ Step 3:</span>
                        <span>INSERT INTO treatment_records (Protocol: Propiconazole Root Drench, Cost: $180)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-800 font-bold">✓ Step 4:</span>
                        <span>INSERT INTO work_orders (Work Order #WO-4192, Assigned: North Crew A)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-800 font-bold">✓ Step 5:</span>
                        <span>UPDATE alerts SET status = &apos;ACTIONED&apos;; COMMIT;</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 text-emerald-950 border border-emerald-300 rounded-lg flex items-center justify-between text-xs shadow-xs">
                    <span className="font-semibold text-emerald-950 flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      Work Order #WO-4192 successfully dispatched to Field Crew A. SLA: 48 Hours.
                    </span>
                    <span className="text-[10px] font-mono text-emerald-800 font-bold">TX TIME: 14.8ms</span>
                  </div>
                </div>
              )}

              {/* Player Controls Bar */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] text-gray-400">
                    STAGE {activeStep + 1} OF 3
                  </span>
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((s) => (
                      <button
                        key={s}
                        onClick={() => { setActiveStep(s); setProgress(0); }}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          activeStep === s ? "bg-emerald-800 w-5" : "bg-gray-200 hover:bg-gray-400"
                        }`}
                        title={`Jump to Stage ${s + 1}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono text-[10px]">
                  <span>Hover to pause</span>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={() => { setActiveStep((s) => (s + 1) % 3); setProgress(0); }}
                    className="text-emerald-800 hover:text-emerald-950 font-bold underline"
                  >
                    Next Stage →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mathematical & Theoretical DBMS Foundations Section */}
      <section className="py-24 px-4 bg-white border-t border-gray-100">
        <div className="text-center mb-16">
          <h4 className="text-sm font-serif italic relative inline-block mb-4">
            Theoretical Foundations
            <span className="absolute -bottom-1 left-0 w-full h-[1px] bg-black"></span>
          </h4>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight max-w-4xl mx-auto">
            Formulas, Algorithms &amp; <span className="relative inline-block mt-2">
              DBMS Principles
              <span className="absolute -bottom-1 left-0 w-full h-1 bg-black"></span>
            </span>
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mt-6 leading-relaxed">
            The formal mathematical models, relational dependencies, spatial projections, and index complexity proofs powering EverLeafDB.
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Vector Cosine Distance */}
          <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-xs flex flex-col justify-between hover:border-purple-300 transition-colors">
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2 font-bold text-base text-gray-950">
                  <Layers className="w-4 h-4 text-purple-700 shrink-0" /> High-Dim Cosine Metric
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded bg-purple-50 text-purple-700 font-bold border border-purple-200 shrink-0 whitespace-nowrap">
                  pgvector (&lt;=&gt;)
                </span>
              </div>

              {/* Formula Box */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-lg p-3 my-3 text-center font-mono text-[13px] text-slate-900 font-bold shadow-2xs overflow-x-auto">
                D_cos(u, v) = 1 - (u &middot; v) / (||u||₂ &middot; ||v||₂)
              </div>

              <p className="text-gray-600 text-sm leading-relaxed mb-3.5">
                Measures angular deviation in 512-d CLIP embedding space. Invariant to sunlight exposure and camera shadows in foliage imagery.
              </p>
            </div>

            <div className="pt-3 border-t border-gray-100 font-mono text-xs text-gray-600 leading-normal">
              <span className="font-semibold text-gray-900">SIMD Optimization: </span>
              With unit vectors (||u||=1), reduces to <code className="text-purple-700 font-bold">1 - ∑(u_i &middot; v_i)</code> via AVX-512.
            </div>
          </div>

          {/* Card 2: Haversine Geodesic Distance */}
          <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-colors">
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2 font-bold text-base text-gray-950">
                  <MapPin className="w-4 h-4 text-emerald-700 shrink-0" /> Geodesic Spatial Distance
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 shrink-0 whitespace-nowrap">
                  PostGIS (SRID 4326)
                </span>
              </div>

              {/* Formula Box */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-lg p-3 my-3 text-center font-mono text-xs sm:text-[13px] text-slate-900 font-bold shadow-2xs overflow-x-auto">
                d = 2R · arcsin(√(sin²(Δφ/2) + cos(φ₁) · cos(φ₂) · sin²(Δλ/2)))
              </div>

              <p className="text-gray-600 text-sm leading-relaxed mb-3.5">
                Great-circle distance over WGS 84 ellipsoid (R = 6,371 km). Calculates spherical distance between tree coordinates and ward boundaries.
              </p>
            </div>

            <div className="pt-3 border-t border-gray-100 font-mono text-xs text-gray-600 leading-normal">
              <span className="font-semibold text-gray-900">Spatial Pruning: </span>
              Powers <code className="text-emerald-700 font-bold">ST_DWithin(geom, 500m)</code> inside 2D GiST R-Tree bounding boxes.
            </div>
          </div>

          {/* Card 3: 3NF Relational Normalization */}
          <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-xs flex flex-col justify-between hover:border-blue-300 transition-colors">
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2 font-bold text-base text-gray-950">
                  <Database className="w-4 h-4 text-blue-700 shrink-0" /> Third Normal Form (3NF)
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200 shrink-0 whitespace-nowrap">
                  Codd&apos;s Theorem
                </span>
              </div>

              {/* Formula Box */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-lg p-3 my-3 text-center font-mono text-[13px] text-slate-900 font-bold shadow-2xs overflow-x-auto">
                &forall; (X &rarr; A) &isin; F⁺ : (X is superkey) &or; (A is prime)
              </div>

              <p className="text-gray-600 text-sm leading-relaxed mb-3.5">
                Decomposes flat inspection sheets by removing partial dependencies (2NF) and transitive dependencies (3NF):
                <code className="block mt-1.5 text-xs font-mono text-gray-900 bg-slate-50 p-1.5 rounded border border-slate-200/70">tree_id → species_id → lifespan ⇒ trees ⋈ species</code>
              </p>
            </div>

            <div className="pt-3 border-t border-gray-100 font-mono text-xs text-gray-600 leading-normal">
              <span className="font-semibold text-gray-900">Formal Guarantee: </span>
              Lossless-join &amp; dependency-preserving across all 14 database relations.
            </div>
          </div>

          {/* Card 4: HNSW Search Complexity */}
          <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-colors">
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2 font-bold text-base text-gray-950">
                  <TrendingUp className="w-4 h-4 text-indigo-700 shrink-0" /> HNSW Graph Complexity
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 shrink-0 whitespace-nowrap">
                  O(log N) ANN
                </span>
              </div>

              {/* Formula Box */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-lg p-3 my-3 text-center font-mono text-[13px] text-slate-900 font-bold shadow-2xs overflow-x-auto">
                T_search = O(log N) &bull; P(layer = l) = e^(-l &middot; m_L)
              </div>

              <p className="text-gray-600 text-sm leading-relaxed mb-3.5">
                Hierarchical Navigable Small World index with M=16 and ef_construction=64. Constructs multi-layer geometric skip-graphs over 512-d unit vectors.
              </p>
            </div>

            <div className="pt-3 border-t border-gray-100 font-mono text-xs text-gray-600 leading-normal">
              <span className="font-semibold text-gray-900">Benchmark Latency: </span>
              <code className="text-indigo-700 font-bold">6.84ms</code> top-5 query time vs 3,890ms unindexed sequential scan.
            </div>
          </div>

          {/* Card 5: Trigger Decision Boundary */}
          <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-xs flex flex-col justify-between hover:border-red-300 transition-colors">
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2 font-bold text-base text-gray-950">
                  <TriangleAlert className="w-4 h-4 text-red-600 shrink-0" /> Trigger Decision Rule
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded bg-red-50 text-red-700 font-bold border border-red-200 shrink-0 whitespace-nowrap">
                  &tau; = 0.82 Threshold
                </span>
              </div>

              {/* Formula Box */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-lg p-3 my-3 text-center font-mono text-xs sm:text-[13px] text-slate-900 font-bold shadow-2xs overflow-x-auto">
                Alert &hArr; max(1 - (e_query &lt;=&gt; e_severe)) &ge; &tau; (&tau; = 0.82)
              </div>

              <p className="text-gray-600 text-sm leading-relaxed mb-3.5">
                Autonomous Bayesian decision boundary executed inside PostgreSQL trigger. Compares incoming symptom vector against verified critical cases.
              </p>
            </div>

            <div className="pt-3 border-t border-gray-100 font-mono text-xs text-gray-600 leading-normal">
              <span className="font-semibold text-gray-900">Calibrated Accuracy: </span>
              <code className="text-red-700 font-bold">Recall = 91.5%</code>, False Alarm Rate = 10.6% on test set.
            </div>
          </div>

          {/* Card 6: ACID Conflict Serializability */}
          <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-xs flex flex-col justify-between hover:border-teal-300 transition-colors">
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2 font-bold text-base text-gray-950">
                  <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" /> Conflict Serializability
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded bg-teal-50 text-teal-800 font-bold border border-teal-200 shrink-0 whitespace-nowrap">
                  2PL &amp; MVCC
                </span>
              </div>

              {/* Formula Box */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-lg p-3 my-3 text-center font-mono text-[13px] text-slate-900 font-bold shadow-2xs overflow-x-auto">
                Conflict Serializable &hArr; Precedence Graph G(S) is Acyclic
              </div>

              <p className="text-gray-600 text-sm leading-relaxed mb-3.5">
                Guarantees transaction atomicity in stored procedures via pessimistic row locks:
                <code className="block mt-1.5 text-xs font-mono text-gray-900 bg-slate-50 p-1.5 rounded border border-slate-200/70">SELECT * FROM alerts WHERE id=$1 FOR UPDATE;</code>
              </p>
            </div>

            <div className="pt-3 border-t border-gray-100 font-mono text-xs text-gray-600 leading-normal">
              <span className="font-semibold text-gray-900">ACID Concurrency: </span>
              Eliminates dirty reads and double-dispatch anomalies during supervisor triage.
            </div>
          </div>
        </div>
      </section>

      {/* Deployment Tiers Section */}
      <section className="py-24 px-4 bg-white border-t border-gray-100">
        <div className="text-center mb-16">
          <h4 className="text-sm font-serif italic relative inline-block mb-4">
            Deployment Tiers
            <span className="absolute -bottom-1 left-0 w-full h-[1px] bg-black"></span>
          </h4>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight max-w-4xl mx-auto">
            <span className="relative inline-block mt-2">
              Scalable Architectural Options
              <span className="absolute -bottom-1 left-0 w-full h-1 bg-black"></span>
            </span>
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mt-6 leading-relaxed">
            Deploy EverLeafDB for university campuses, metropolitan municipal corporations, or statewide forestry boards.
          </p>
        </div>
        
        {/* Tier Cards - Interactive Animated Selector */}
        <div className="max-w-6xl mx-auto">
          {/* Top Selector Tabs */}
          <div className="flex flex-nowrap md:flex-wrap md:grid md:grid-cols-5 border border-gray-200/90 rounded-2xl shadow-sm bg-white p-2 gap-2 overflow-x-auto">
            <div className="p-5 bg-gray-50/80 rounded-xl min-w-[190px] flex flex-col justify-center border border-gray-100">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded w-fit mb-1 border border-emerald-200/50">PostgreSQL 16</span>
              <h3 className="font-extrabold text-lg text-gray-950">TIERS</h3>
              <p className="text-gray-500 text-xs">Architecture Scale</p>
            </div>
            
            {[
              {
                name: "Community",
                tagline: "Open Source Docker",
                capacity: "Up to 10k Trees",
                badge: "FOSS CORE",
                recommended: false,
                nodes: "Single-Node Docker Container",
                specs: "PostgreSQL 16 + PostGIS + pgvector (4 vCPU, 8GB RAM)",
                index: "B-Tree + GiST Spatial + pgvector IVFFlat",
                isolation: "Standard Role Privileges & Schemas",
                latency: "< 18ms p95 scan",
                command: "docker run -d --name everleafdb -p 5432:5432 -v everleaf_data:/var/lib/postgresql/data everleafdb/core:latest"
              },
              {
                name: "Campus",
                tagline: "Institutes & Gardens",
                capacity: "Up to 50k Trees",
                badge: "REPLICA HA",
                recommended: false,
                nodes: "Primary + 1 Streaming Read Replica",
                specs: "PostgreSQL 16 Primary-Replica with WAL streaming (8 vCPU, 16GB RAM)",
                index: "B-Tree + GiST Spatial + HNSW (m=12, ef=48)",
                isolation: "Departmental Multi-Tenant Isolation",
                latency: "< 12ms p95 scan",
                command: "docker compose -f docker-compose.campus.yml up -d --scale worker=2"
              },
              {
                name: "City Scale",
                tagline: "Municipal Corporations",
                capacity: "500k+ Trees",
                badge: "RECOMMENDED",
                recommended: true,
                nodes: "3-Node HA Patroni Cluster + PgBouncer",
                specs: "3-Node HA Cluster with connection pooling & automated failover (16 vCPU, 64GB RAM)",
                index: "B-Tree Composite + PostGIS GiST + pgvector HNSW (m=16, ef=64)",
                isolation: "198 Municipal Wards Row-Level Security (RLS)",
                latency: "< 7.2ms p95 scan",
                command: "helm install everleafdb-cluster ./charts/everleafdb --set replicaCount=3,pgvector.hnsw.m=16"
              },
              {
                name: "State Fleet",
                tagline: "Multi-Region Gov",
                capacity: "Millions of Trees",
                badge: "GRID MESH",
                recommended: false,
                nodes: "Distributed Geo-Partitioned Sharding",
                specs: "Multi-Region Citus / Sharded PostgreSQL with cross-region WAL replication (64 vCPU, 256GB RAM)",
                index: "Distributed GiST Partitioning + Partition-local HNSW graphs",
                isolation: "Multi-Agency RBAC + Cryptographic Audit Log Verification",
                latency: "< 4.5ms p95 scan",
                command: "terraform apply -var='provider=gcp' -var='regions=asia-south1,asia-south2' -target=module.everleaf_mesh"
              }
            ].map((tier, idx) => {
              const isSelected = activeTier === idx;
              return (
                <div
                  key={tier.name}
                  onClick={() => setActiveTier(idx)}
                  className={`p-4 md:p-5 rounded-xl border relative min-w-[200px] cursor-pointer transition-all duration-200 select-none flex flex-col justify-between ${
                    isSelected
                      ? "border-emerald-800 bg-emerald-50/40 shadow-sm ring-1 ring-emerald-800/20 scale-[1.01]"
                      : "border-gray-200 bg-white hover:border-emerald-300 hover:bg-gray-50/60 opacity-80 hover:opacity-100"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-base text-gray-950 flex items-center gap-1.5">
                        <span>{tier.name}</span>
                      </h3>
                      <div className="flex items-center gap-2">
                        {tier.recommended && (
                          <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                            Recommended
                          </span>
                        )}
                        {isSelected ? (
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-700"></span>
                          </span>
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5">{tier.tagline}</p>
                  </div>
                  <div className="text-sm font-extrabold text-gray-950 mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span>{tier.capacity}</span>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                      isSelected ? "bg-emerald-100 text-emerald-900 border border-emerald-300/80 font-bold" : "bg-gray-100 text-gray-600"
                    }`}>
                      {tier.badge}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Animated Architecture Deployment Spec Preview Console */}
          {[
            {
              name: "Community",
              tagline: "Open Source Docker Deployment",
              capacity: "10,000 Cataloged Trees",
              badge: "FOSS CORE",
              nodes: "Single-Node Docker Container",
              specs: "PostgreSQL 16 + PostGIS 3.4 + pgvector 0.7.0 (4 vCPU, 8GB RAM)",
              index: "B-Tree + GiST Spatial + pgvector IVFFlat",
              isolation: "Standard Role Privileges & Schemas",
              latency: "< 18ms p95 scan",
              command: "docker run -d --name everleafdb -p 5432:5432 -v everleaf_data:/var/lib/postgresql/data everleafdb/core:latest"
            },
            {
              name: "Campus",
              tagline: "Institutes, Botanical Gardens & Arboretums",
              capacity: "50,000 Cataloged Trees",
              badge: "REPLICA HA",
              nodes: "Primary + 1 Streaming Read Replica",
              specs: "PostgreSQL 16 Primary-Replica with WAL streaming (8 vCPU, 16GB RAM)",
              index: "B-Tree + GiST Spatial + HNSW (m=12, ef=48)",
              isolation: "Departmental Multi-Tenant Isolation",
              latency: "< 12ms p95 scan",
              command: "docker compose -f docker-compose.campus.yml up -d --scale worker=2"
            },
            {
              name: "City Scale",
              tagline: "Metropolitan Municipal Corporations & City Wards",
              capacity: "500,000+ Cataloged Trees",
              badge: "RECOMMENDED",
              nodes: "3-Node HA Patroni Cluster + PgBouncer",
              specs: "3-Node HA Cluster with connection pooling & automated failover (16 vCPU, 64GB RAM)",
              index: "B-Tree Composite + PostGIS GiST + pgvector HNSW (m=16, ef=64)",
              isolation: "198 Municipal Wards Row-Level Security (RLS)",
              latency: "< 7.2ms p95 scan",
              command: "helm install everleafdb-cluster ./charts/everleafdb --set replicaCount=3,pgvector.hnsw.m=16"
            },
            {
              name: "State Fleet",
              tagline: "Statewide Forestry Boards & National Parks",
              capacity: "Millions of Cataloged Trees",
              badge: "GRID MESH",
              nodes: "Distributed Geo-Partitioned Sharding",
              specs: "Multi-Region Citus / Sharded PostgreSQL with cross-region WAL replication (64 vCPU, 256GB RAM)",
              index: "Distributed GiST Partitioning + Partition-local HNSW graphs",
              isolation: "Multi-Agency RBAC + Cryptographic Audit Log Verification",
              latency: "< 4.5ms p95 scan",
              command: "terraform apply -var='provider=gcp' -var='regions=asia-south1,asia-south2' -target=module.everleaf_mesh"
            }
          ]
            .filter((_, idx) => idx === activeTier)
            .map((tier) => (
              <div
                key={tier.name}
                className="mt-4 p-6 bg-white border border-gray-200/90 rounded-2xl shadow-md animate-in fade-in slide-in-from-top-3 duration-300"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 mb-4 border-b border-gray-100 gap-3">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h4 className="font-bold text-lg text-gray-950">{tier.name} Architecture</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold">
                        {tier.badge}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{tier.tagline} • Sized for {tier.capacity}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200/70 font-semibold">
                      Target Latency: {tier.latency}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                  <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200/80">
                    <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Topology &amp; Cluster</div>
                    <div className="font-bold text-xs text-gray-950 mb-1">{tier.nodes}</div>
                    <div className="text-[10px] font-mono text-gray-500 leading-tight">{tier.specs}</div>
                  </div>

                  <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200/80">
                    <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Index Pipeline</div>
                    <div className="font-bold text-xs text-emerald-950 mb-1">Hybrid 3-Model Access</div>
                    <div className="text-[10px] font-mono text-gray-600 leading-tight">{tier.index}</div>
                  </div>

                  <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200/80">
                    <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Isolation Policy</div>
                    <div className="font-bold text-xs text-gray-950 mb-1">Row-Level Security</div>
                    <div className="text-[10px] font-mono text-gray-600 leading-tight">{tier.isolation}</div>
                  </div>

                  <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200/80">
                    <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Consistency Guarantee</div>
                    <div className="font-bold text-xs text-emerald-900 mb-1">Strict ACID Guarantees</div>
                    <div className="text-[10px] font-mono text-gray-600 leading-tight">Zero duplicate work orders · 2PL Serializability</div>
                  </div>
                </div>

                {/* Deployment Command Box */}
                <div className="p-3.5 bg-gray-950 text-white rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs border border-gray-800">
                  <div className="flex items-center gap-2 overflow-x-auto">
                    <span className="text-emerald-400 select-none">$</span>
                    <span className="text-gray-200 whitespace-nowrap">{tier.command}</span>
                  </div>
                  <button
                    onClick={() => navigator.clipboard?.writeText(tier.command)}
                    className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded border border-emerald-600 text-[11px] font-sans font-semibold shrink-0 transition-colors"
                  >
                    Copy Command
                  </button>
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-4 bg-white border-t border-gray-100">
        <div className="text-center mb-16">
          <h4 className="text-sm font-serif italic relative inline-block mb-4">
            Technical FAQ
            <span className="absolute -bottom-1 left-0 w-full h-[1px] bg-black"></span>
          </h4>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight max-w-4xl mx-auto">
            Frequently Answered <span className="relative inline-block mt-2">
              Database Questions
              <span className="absolute -bottom-1 left-0 w-full h-1 bg-black"></span>
            </span>
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mt-6 leading-relaxed">
            Essential architectural and DBMS answers for system evaluators and viva panels.
          </p>
        </div>

        <div className="max-w-3xl mx-auto flex flex-col gap-0 border-t border-gray-200">
          {[
            "Why use pgvector instead of a standalone vector database like Pinecone or Milvus?",
            "How does PostGIS spatial indexing (GiST) accelerate hybrid vector queries?",
            "Why does EverLeafDB use case-based retrieval instead of a deep learning classifier?",
            "How does the database trigger prevent race conditions during heavy inspection inserts?",
            "How does Row-Level Security (RLS) enforce ward isolation for field inspectors?",
            "Why was HNSW index selected over IVFFlat for inspection image embeddings?",
            "How does sp_confirm_diagnosis_and_dispatch_order maintain ACID atomicity?"
          ].map((q, i) => (
            <div key={i} className="py-5 border-b border-gray-200 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors">
              <h3 className="font-semibold text-sm">{q}</h3>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          ))}
        </div>
      </section>

      {/* Floating Query Trigger */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2">
        <button className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 shadow-xl mt-2" title="Ask EverLeafDB Bot">
          <Trees className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
