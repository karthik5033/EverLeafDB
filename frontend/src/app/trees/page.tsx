"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import { TREES, WARDS, Tree } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Trees,
  Plus,
  Search,
  Filter,
  MapPin,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Database,
  Activity
} from "lucide-react";

export default function TreesDirectoryPage() {
  const [trees, setTrees] = useState<Tree[]>(TREES);
  const [search, setSearch] = useState("");
  const [selectedWard, setSelectedWard] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const filteredTrees = trees.filter((tree) => {
    const matchesSearch =
      tree.tag_number.toLowerCase().includes(search.toLowerCase()) ||
      tree.species_common.toLowerCase().includes(search.toLowerCase()) ||
      tree.species_scientific.toLowerCase().includes(search.toLowerCase());

    const matchesWard = selectedWard === "all" || tree.ward_id === selectedWard;
    const matchesStatus = selectedStatus === "all" || tree.health_status === selectedStatus;

    return matchesSearch && matchesWard && matchesStatus;
  });

  const totalHealthy = trees.filter((t) => t.health_status === "HEALTHY").length;
  const totalMonitor = trees.filter((t) => t.health_status === "MONITOR").length;
  const totalCritical = trees.filter(
    (t) => t.health_status === "CRITICAL" || t.health_status === "DISEASED"
  ).length;

  return (
    <DashboardShell>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 pb-28">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700 mb-2">
              <Database className="w-3.5 h-3.5 text-slate-500" />
              <span>Municipal Registry • 3NF Normalized</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Municipal Tree Directory
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-2xl">
              Complete 3NF lifecycle records, dendrometric girth measurements, and PostGIS WGS-84 coordinates.
            </p>
          </div>

          <Link href="/trees/new">
            <Button className="bg-slate-950 hover:bg-slate-800 text-white font-medium h-9 text-xs shadow-xs px-4">
              <Plus className="w-4 h-4 mr-1.5" />
              Register New Tree
            </Button>
          </Link>
        </div>

        {/* Vital KPI Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <Card className="p-5 bg-white border border-slate-200 shadow-xs rounded-xl">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Cataloged Specimens
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1.5">
              {trees.length.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              <span>3NF Relational Records</span>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-slate-200 shadow-xs rounded-xl">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Optimal Health
            </div>
            <div className="text-2xl font-bold text-emerald-700 mt-1.5">
              {totalHealthy}
            </div>
            <div className="text-[11px] text-emerald-800 font-mono mt-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Condition Score 5/5</span>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-slate-200 shadow-xs rounded-xl">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Under Monitoring
            </div>
            <div className="text-2xl font-bold text-amber-700 mt-1.5">
              {totalMonitor}
            </div>
            <div className="text-[11px] text-amber-800 font-mono mt-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              <span>Follow-up Scheduled</span>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-slate-200 shadow-xs rounded-xl">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Critical Hazards
            </div>
            <div className="text-2xl font-bold text-red-700 mt-1.5">
              {totalCritical}
            </div>
            <div className="text-[11px] text-red-800 font-mono mt-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              <span>Active Alerts Raised</span>
            </div>
          </Card>
        </div>

        {/* Filter Toolbar */}
        <Card className="p-3 bg-white border border-slate-200 shadow-xs rounded-xl">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search by specimen tag, common name, or scientific taxon..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                className="bg-white border border-slate-200 text-xs rounded-lg px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option value="all">All Wards (Geofences)</option>
                {WARDS.map((w) => (
                  <option key={w.ward_id} value={w.ward_id}>
                    {w.name} (#{w.ward_number})
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-white border border-slate-200 text-xs rounded-lg px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option value="all">All Health States</option>
                <option value="HEALTHY">HEALTHY</option>
                <option value="MONITOR">MONITOR</option>
                <option value="DISEASED">DISEASED</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Trees Data Table */}
        <Card className="bg-white border border-slate-200 shadow-xs rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 border-b border-slate-200 hover:bg-slate-50/80">
                <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3">
                  Specimen Tag
                </TableHead>
                <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3">
                  Botanical Taxon
                </TableHead>
                <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3">
                  Municipal Ward
                </TableHead>
                <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3">
                  Coordinates (EPSG:4326)
                </TableHead>
                <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3">
                  Height / DBH
                </TableHead>
                <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3">
                  Health State
                </TableHead>
                <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-slate-400 text-xs">
                    No registered specimens match the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTrees.map((tree) => {
                  const healthStateBadge = (status: string) => {
                    switch (status.toUpperCase()) {
                      case "HEALTHY":
                        return (
                          <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-semibold">
                            HEALTHY
                          </Badge>
                        );
                      case "MONITOR":
                        return (
                          <Badge className="bg-amber-50 text-amber-800 border-amber-200 text-[10px] font-semibold">
                            MONITOR
                          </Badge>
                        );
                      case "CRITICAL":
                      case "DISEASED":
                        return (
                          <Badge className="bg-red-50 text-red-700 border-red-200 text-[10px] font-semibold">
                            {status.toUpperCase()}
                          </Badge>
                        );
                      default:
                        return (
                          <Badge variant="outline" className="text-[10px] text-slate-600">
                            {status}
                          </Badge>
                        );
                    }
                  };

                  return (
                    <TableRow key={tree.tree_id} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
                      <TableCell className="py-3">
                        <Link
                          href={`/trees/${tree.tree_id}`}
                          className="font-mono font-bold text-xs text-slate-900 hover:text-emerald-700 hover:underline"
                        >
                          {tree.tag_number}
                        </Link>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="font-semibold text-xs text-slate-900">{tree.species_common}</div>
                        <div className="text-[11px] italic text-slate-500">{tree.species_scientific}</div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="text-xs font-medium text-slate-800">{tree.ward_name}</div>
                        <div className="text-[10px] font-mono text-slate-400">{tree.ward_id}</div>
                      </TableCell>
                      <TableCell className="py-3 font-mono text-xs text-slate-600">
                        {tree.latitude.toFixed(4)}, {tree.longitude.toFixed(4)}
                      </TableCell>
                      <TableCell className="py-3 text-xs text-slate-700">
                        {tree.height_m}m / {tree.dbh_cm}cm
                      </TableCell>
                      <TableCell className="py-3">
                        {healthStateBadge(tree.health_status)}
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <Link
                          href={`/trees/${tree.tree_id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-950 transition-colors"
                        >
                          Inspect <ArrowRight className="w-3 h-3 text-slate-400" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </DashboardShell>
  );
}
