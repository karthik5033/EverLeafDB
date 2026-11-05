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
  Bell,
  Sparkles,
  User,
  ShieldCheck
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

const NAV_ITEMS: NavItem[] = [
  {
    title: "Canopy Overview",
    href: "/",
    icon: Trees
  },
  {
    title: "Tree Directory",
    href: "/trees",
    icon: Trees,
    badge: "3NF",
    badgeVariant: "emerald"
  },
  {
    title: "Spatial Map Explorer",
    href: "/map",
    icon: Compass,
    badge: "PostGIS",
    badgeVariant: "emerald"
  },
  {
    title: "SQL Query Console",
    href: "/console",
    icon: Database,
    badge: "Hybrid",
    badgeVariant: "secondary"
  },
  {
    title: "Disease Similarity",
    href: "/similarity",
    icon: Layers,
    badge: "pgvector",
    badgeVariant: "emerald"
  },
  {
    title: "Outbreak Alerts",
    href: "/alerts",
    icon: ShieldAlert,
    badge: "2 Critical",
    badgeVariant: "critical"
  },
  {
    title: "Work Orders Triage",
    href: "/work-orders",
    icon: Wrench,
    badge: "Active",
    badgeVariant: "secondary"
  },
  {
    title: "Design System (Phase 2)",
    href: "/showcase",
    icon: Sparkles,
    badge: "shadcn",
    badgeVariant: "emerald"
  },
  {
    title: "Inspector Session",
    href: "/login",
    icon: User,
    badge: "RLS",
    badgeVariant: "outline"
  }
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen bg-background flex flex-col font-sans">
        {/* Top Floating App Bar */}
        <header className="sticky top-0 z-40 h-14 bg-card/90 backdrop-blur-md border-b border-border px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Sheet Trigger */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72">
                <div className="p-4 border-b border-border flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                    <Trees className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-sm tracking-tight">EverLeafDB</div>
                    <div className="text-[10px] text-muted-foreground font-mono">PostGIS + pgvector</div>
                  </div>
                </div>
                <div className="p-3 space-y-1">
                  {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                          isActive
                            ? "bg-accent text-accent-foreground font-bold"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4 text-emerald-800" />
                          <span>{item.title}</span>
                        </div>
                        {item.badge && (
                          <Badge variant={item.badgeVariant || "secondary"} className="text-[9px] px-1.5 py-0">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center transition-transform group-hover:scale-105">
                <Trees className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-base tracking-tight text-foreground">EverLeafDB</span>
            </Link>

            <Badge variant="emerald" className="hidden sm:inline-flex text-[10px] font-mono">
              PostgreSQL 16 3NF
            </Badge>
          </div>

          {/* Right Header Status */}
          <div className="flex items-center gap-2.5">
            <Badge variant="emerald" className="text-[11px] font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              RLS: Ward 03 Isolated
            </Badge>

            <Link href="/console">
              <Button size="sm" variant="emerald" className="text-xs font-semibold">
                Launch Console <Sparkles className="w-3.5 h-3.5 ml-1 text-emerald-300" />
              </Button>
            </Link>
          </div>
        </header>

        {/* Master Workspace with Collapsible Sidebar */}
        <div className="flex-1 flex">
          {/* Desktop Collapsible Sidebar */}
          <aside
            className={`hidden md:flex flex-col border-r border-border bg-card transition-all duration-300 relative ${
              isCollapsed ? "w-16" : "w-64"
            }`}
          >
            {/* Collapse Toggle Button */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="absolute -right-3 top-5 z-30 w-6 h-6 rounded-full bg-card border border-border shadow-xs flex items-center justify-center text-muted-foreground hover:text-foreground transition-transform hover:scale-110"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>

            {/* Sidebar Navigation */}
            <div className="p-3 space-y-1 flex-1">
              {NAV_ITEMS.map((item) => {
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
                              ? "bg-accent text-accent-foreground font-bold shadow-xs"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isActive ? "text-emerald-800" : ""}`} />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <span>{item.title}</span>
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      isActive
                        ? "bg-accent text-accent-foreground font-bold"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? "text-emerald-800" : "text-muted-foreground"}`} />
                      <span className="truncate">{item.title}</span>
                    </div>
                    {item.badge && (
                      <Badge variant={item.badgeVariant || "secondary"} className="text-[9px] px-1.5 py-0 font-mono">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Sidebar Footer */}
            {!isCollapsed && (
              <div className="p-3 border-t border-border bg-muted/40 text-xs font-mono">
                <div className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Active Inspector</div>
                <div className="font-bold text-foreground truncate">inspector_04 (Vikram Mehta)</div>
                <div className="text-[10px] text-emerald-800 font-semibold">Ward 03 Cubbon Heritage</div>
              </div>
            )}
          </aside>

          {/* Main Content Viewport */}
          <main className="flex-1 overflow-x-hidden">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}

