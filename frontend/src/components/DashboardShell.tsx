"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Trees,
  Compass,
  Layers,
  Database,
  ShieldAlert,
  ClipboardList,
  Wrench,
  BarChart3,
  Settings,
  Menu,
  ChevronLeft,
  ChevronRight,
  PanelLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Sparkles,
  User,
  ShieldCheck,
  Stethoscope,
  Building2,
  Flame,
  Clock,
  Megaphone,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline" | "emerald" | "critical";
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Operations & GIS",
    items: [
      {
        title: "Tree Directory",
        href: "/trees",
        icon: Database
      },
      {
        title: "Spatial Map Explorer",
        href: "/map",
        icon: Compass,
        badge: "PostGIS",
        badgeVariant: "emerald"
      },
      {
        title: "Field Inspections",
        href: "/inspections",
        icon: Stethoscope
      }
    ]
  },
  {
    title: "Hybrid DBMS Engines",
    items: [
      {
        title: "SQL Query Console",
        href: "/console",
        icon: Database
      },
      {
        title: "Disease Similarity",
        href: "/similarity",
        icon: Layers,
        badge: "pgvector",
        badgeVariant: "emerald"
      },
      {
        title: "Nearby Similar (Q1)",
        href: "/queries/nearby-similar",
        icon: Compass
      },
      {
        title: "Ward Outbreaks (Q2)",
        href: "/queries/ward-disease-search",
        icon: Building2
      },
      {
        title: "Contagion Clusters (Q3)",
        href: "/queries/contagion-clusters",
        icon: Flame
      },
      {
        title: "Treatment ROI (Q4)",
        href: "/analytics/treatment-efficacy",
        icon: BarChart3
      },
      {
        title: "Canopy Mortality (Q5/6)",
        href: "/analytics/canopy-health",
        icon: Clock
      }
    ]
  },
  {
    title: "Municipal Management",
    items: [
      {
        title: "Supervisor Triage",
        href: "/alerts",
        icon: ShieldAlert,
        badge: "Alerts",
        badgeVariant: "critical"
      },
      {
        title: "Crew Dispatch Kanban",
        href: "/work-orders",
        icon: Wrench
      },
      {
        title: "Citizen Hazard Portal",
        href: "/report",
        icon: Megaphone
      },
      {
        title: "Executive Analytics",
        href: "/analytics",
        icon: Activity
      },
      {
        title: "System Audit & PITR",
        href: "/admin/audit",
        icon: ShieldCheck
      },
      {
        title: "Inspector Session",
        href: "/login",
        icon: User,
        badge: "RLS",
        badgeVariant: "outline"
      }
    ]
  }
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setIsCollapsed((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <TooltipProvider delayDuration={0}>
      <div className="h-screen bg-slate-50 flex flex-col font-sans text-slate-900 overflow-hidden">
        {/* Top App Bar (Clean Light Landing Page Styling) */}
        <header className="shrink-0 z-40 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 md:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Navigation Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-slate-700">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72 bg-white">
                <div className="p-4 border-b border-slate-200 flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-slate-950 text-white rounded-lg flex items-center justify-center font-bold">
                    <Trees className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-sm tracking-tight text-slate-900">EverLeafDB</div>
                    <div className="text-xs text-slate-500 font-mono">PostGIS + pgvector</div>
                  </div>
                </div>
                <div className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-4rem)]">
                  {NAV_SECTIONS.map((section) => (
                    <div key={section.title} className="space-y-1">
                      <div className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                        {section.title}
                      </div>
                      {section.items.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              isActive
                                ? "bg-slate-900 text-white font-semibold shadow-xs"
                                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                              <span>{item.title}</span>
                            </div>
                            {item.badge && (
                              <Badge
                                variant={item.badgeVariant || "secondary"}
                                className="text-xs px-2 py-0.5 shrink-0 whitespace-nowrap font-mono"
                              >
                                {item.badge}
                              </Badge>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </SheetContent>
            </Sheet>

            {/* Brand Logo & Desktop Sidebar Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden md:flex h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200/60 shadow-2xs"
                title={isCollapsed ? "Expand Sidebar (Ctrl+B)" : "Collapse Sidebar (Ctrl+B)"}
                aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
              </Button>

              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105 shadow-xs border border-emerald-500/30">
                  <img src="/icon.svg" alt="EverLeafDB" className="w-full h-full object-cover" />
                </div>
                <span className="font-bold text-base tracking-tight text-slate-950">EverLeafDB</span>
              </Link>
            </div>

            <span className="hidden sm:inline-flex text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
              PostgreSQL 16 3NF
            </span>
          </div>

          {/* Right Header Status Bar */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>RLS: Ward 03 Isolated</span>
            </div>

            <Link href="/console">
              <Button size="sm" className="bg-slate-950 hover:bg-slate-800 text-white text-xs h-8 px-3.5 rounded-lg shadow-xs gap-1.5">
                Launch Console <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              </Button>
            </Link>
          </div>
        </header>

        {/* Master Workspace Layout */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Desktop Collapsible Clean Sidebar - Fixed Viewport Position */}
          <aside
            className={`hidden md:flex flex-col border-r border-slate-200 bg-white transition-all duration-300 shrink-0 h-full relative z-30 ${
              isCollapsed ? "w-16" : "w-72"
            }`}
          >
            {/* Sidebar Internal Header with Minimize / Expand Control */}
            <div
              className={`h-10 px-3 border-b border-slate-100 flex items-center shrink-0 bg-slate-50/70 ${
                isCollapsed ? "justify-center" : "justify-between"
              }`}
            >
              {!isCollapsed ? (
                <>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                    Navigation
                  </span>
                  <button
                    onClick={() => setIsCollapsed(true)}
                    className="h-6 w-6 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-white hover:border hover:border-slate-200 transition-all shadow-2xs"
                    title="Collapse Sidebar (Ctrl+B)"
                    aria-label="Collapse Sidebar"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsCollapsed(false)}
                  className="w-8 h-6 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white hover:border hover:border-slate-200 transition-all shadow-2xs"
                  title="Expand Sidebar (Ctrl+B)"
                  aria-label="Expand Sidebar"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Floating Divider Edge Toggle Button (Placed at top-12 away from scrollbar arrow) */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="absolute -right-3.5 top-12 z-40 w-7 h-7 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 transition-all hover:scale-110 cursor-pointer"
              title={isCollapsed ? "Expand Sidebar (Ctrl+B)" : "Collapse Sidebar (Ctrl+B)"}
              aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>

            {/* Sidebar Navigation Items */}
            <div className="p-3 pb-8 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
              {NAV_SECTIONS.map((section) => (
                <div key={section.title} className="space-y-1">
                  {!isCollapsed && (
                    <div className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      {section.title}
                    </div>
                  )}

                  {section.items.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    if (isCollapsed) {
                      return (
                        <Tooltip key={item.href}>
                          <TooltipTrigger asChild>
                            <Link
                              href={item.href}
                              className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center transition-colors ${
                                isActive
                                  ? "bg-slate-900 text-white shadow-xs"
                                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="bg-slate-900 text-white text-xs">
                            <span>{item.title}</span>
                          </TooltipContent>
                        </Tooltip>
                      );
                    }

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors group ${
                          isActive
                            ? "bg-slate-900 text-white font-semibold shadow-xs"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon
                            className={`w-4 h-4 shrink-0 transition-colors ${
                              isActive ? "text-white" : "text-slate-400 group-hover:text-slate-700"
                            }`}
                          />
                          <span className="truncate">{item.title}</span>
                        </div>
                        {item.badge && (
                          <Badge
                            variant={isActive ? "secondary" : item.badgeVariant || "secondary"}
                            className="text-xs px-2 py-0.5 shrink-0 whitespace-nowrap font-mono"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Sidebar User Tenant Footer */}
            {!isCollapsed && (
              <div className="p-3.5 border-t border-slate-200 bg-slate-50/90 text-xs font-mono shrink-0">
                <div className="flex items-center justify-between text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">
                  <span>Tenant Boundary</span>
                  <span className="flex items-center gap-1 text-emerald-700 font-semibold lowercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    active
                  </span>
                </div>
                <div className="font-bold text-slate-900 truncate text-sm">Ward 03 Cubbon Heritage</div>
                <div className="text-xs text-slate-500 truncate mt-0.5">inspector_04 • Verified RLS</div>
              </div>
            )}
          </aside>

          {/* Main Content Viewport */}
          <main className="flex-1 min-w-0 overflow-y-auto bg-slate-50">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
