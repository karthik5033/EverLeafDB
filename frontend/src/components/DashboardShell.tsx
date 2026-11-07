"use client";

import React, { useState } from "react";
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
        title: "Canopy Overview",
        href: "/",
        icon: Trees
      },
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

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
        {/* Top App Bar (Clean Light Landing Page Styling) */}
        <header className="sticky top-0 z-40 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 md:px-6 flex items-center justify-between">
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
                    <div className="text-[10px] text-slate-500 font-mono">PostGIS + pgvector</div>
                  </div>
                </div>
                <div className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-4rem)]">
                  {NAV_SECTIONS.map((section) => (
                    <div key={section.title} className="space-y-1">
                      <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        {section.title}
                      </div>
                      {section.items.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
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
                                className="text-[10px] px-1.5 py-0 shrink-0 whitespace-nowrap"
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

            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 bg-slate-950 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105 shadow-xs">
                <Trees className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-base tracking-tight text-slate-950">EverLeafDB</span>
            </Link>

            <span className="hidden sm:inline-flex text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
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
        <div className="flex-1 flex overflow-hidden">
          {/* Desktop Collapsible Clean Sidebar */}
          <aside
            className={`hidden md:flex flex-col border-r border-slate-200 bg-white transition-all duration-300 relative ${
              isCollapsed ? "w-16" : "w-64"
            }`}
          >
            {/* Collapse / Expand Toggle Button */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="absolute -right-3 top-4 z-30 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-900 transition-transform hover:scale-110"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>

            {/* Sidebar Navigation Items */}
            <div className="p-3 pb-8 space-y-4 flex-1 overflow-y-auto no-scrollbar">
              {NAV_SECTIONS.map((section) => (
                <div key={section.title} className="space-y-1">
                  {!isCollapsed && (
                    <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
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
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors group ${
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
                            className="text-[10px] px-1.5 py-0 shrink-0 whitespace-nowrap font-mono"
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
              <div className="p-3 border-t border-slate-200 bg-slate-50/80 text-xs font-mono">
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">
                  Tenant Boundary
                </div>
                <div className="font-semibold text-slate-900 truncate">Ward 03 Cubbon Heritage</div>
                <div className="text-[10px] text-slate-500 truncate">inspector_04 • Active</div>
              </div>
            )}
          </aside>

          {/* Main Content Viewport */}
          <main className="flex-1 overflow-y-auto bg-slate-50">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
