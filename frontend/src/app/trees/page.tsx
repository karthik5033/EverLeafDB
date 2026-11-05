"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import { TREES, WARDS, Tree } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Trees,
  Plus,
  Search,
  Filter,
  MapPin,
  Compass,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Stethoscope
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
  const totalCritical = trees.filter((t) => t.health_status === "CRITICAL" || t.health_status === "DISEASED").length;

  return (
    <DashboardShell>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-mono text-emerald-800 mb-2">
              <Trees className="w-3.5 h-3.5" />
              <span>Phase 8: Urban Tree Registry Core</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
              Municipal Tree Directory
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Complete 3NF lifecycle records, dendrometric girth statistics, and PostGIS geocoding.
            </p>
          </div>

          <Link href="/trees/new">
            <Button className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold h-10 shadow-xs">
              <Plus className="w-4 h-4 mr-1.5" />
              Register New Tree
            </Button>
          </Link>
        </div>

        {/* Vital KPI Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-xs text-muted-foreground">Cataloged Specimens</div>
            <div className="text-2xl font-extrabold text-foreground mt-1">{trees.length.toLocaleString()}</div>
            <div className="text-[10px] text-emerald-800 font-mono mt-1">3NF Relational Table</div>
          </Card>

          <Card className="p-4">
            <div className="text-xs text-muted-foreground">Optimal Health</div>
            <div className="text-2xl font-extrabold text-emerald-700 mt-1">{totalHealthy}</div>
            <div className="text-[10px] text-muted-foreground font-mono mt-1">Condition Score 5/5</div>
          </Card>

          <Card className="p-4">
            <div className="text-xs text-muted-foreground">Under Monitoring</div>
            <div className="text-2xl font-extrabold text-amber-600 mt-1">{totalMonitor}</div>
            <div className="text-[10px] text-muted-foreground font-mono mt-1">Follow-up Needed</div>
          </Card>

          <Card className="p-4">
            <div className="text-xs text-muted-foreground">Critical Hazards</div>
            <div className="text-2xl font-extrabold text-destructive mt-1">{totalCritical}</div>
            <div className="text-[10px] text-destructive font-mono mt-1">Alerts Raised</div>
          </Card>
        </div>

        {/* Filter Toolbar */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search by tag, common name, or scientific taxon..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                className="bg-background border border-border text-xs rounded-lg px-3 py-2 font-medium focus:outline-hidden"
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
                className="bg-background border border-border text-xs rounded-lg px-3 py-2 font-medium focus:outline-hidden"
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

        {/* Trees Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Specimen Tag</TableHead>
                <TableHead>Botanical Taxon</TableHead>
                <TableHead>Municipal Ward</TableHead>
                <TableHead>Coordinates (EPSG:4326)</TableHead>
                <TableHead>Height / DBH</TableHead>
                <TableHead>Health State</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                    No registered specimens match the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTrees.map((tree) => (
                  <TableRow key={tree.tree_id}>
                    <TableCell>
                      <Link
                        href={`/trees/${tree.tree_id}`}
                        className="font-mono font-bold text-emerald-800 hover:underline"
                      >
                        {tree.tag_number}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-sm text-foreground">{tree.species_common}</div>
                      <div className="text-xs italic text-muted-foreground">{tree.species_scientific}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-medium text-foreground">{tree.ward_name}</div>
                      <div className="text-[10px] font-mono text-muted-foreground">{tree.ward_id}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {tree.latitude.toFixed(4)}, {tree.longitude.toFixed(4)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {tree.height_m}m / {tree.dbh_cm}cm
                    </TableCell>
                    <TableCell>
                      {tree.health_status === "CRITICAL" ? (
                        <Badge variant="critical">CRITICAL</Badge>
                      ) : tree.health_status === "DISEASED" ? (
                        <Badge variant="critical">DISEASED</Badge>
                      ) : tree.health_status === "MONITOR" ? (
                        <Badge variant="warning">MONITOR</Badge>
                      ) : (
                        <Badge variant="emerald">HEALTHY</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/trees/${tree.tree_id}`}>
                        <Button variant="outline" size="sm" className="h-8 text-xs font-semibold">
                          Inspect
                          <ArrowRight className="w-3.5 h-3.5 ml-1 text-emerald-700" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </DashboardShell>
  );
}
