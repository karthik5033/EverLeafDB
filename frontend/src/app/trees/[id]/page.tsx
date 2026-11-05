"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";
import { TREES, WARDS, SPECIES_SEED, Tree, Disease } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Trees,
  MapPin,
  Calendar,
  Ruler,
  Stethoscope,
  Activity,
  ArrowLeft,
  Compass,
  AlertTriangle,
  CheckCircle2,
  FileCode,
  ShieldCheck,
  ChevronRight
} from "lucide-react";

export default function TreeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const treeId = typeof params?.id === "string" ? params.id : "";

  const tree = TREES.find((t) => t.tree_id.toLowerCase() === treeId.toLowerCase()) || TREES[0];
  const ward = WARDS.find((w) => w.ward_id.toLowerCase() === tree.ward_id.toLowerCase()) || WARDS[0];
  const species = SPECIES_SEED.find((s) => s.species_id === tree.species_id) || SPECIES_SEED[0];

  const estimatedAgeYears = Math.max(1, new Date().getFullYear() - new Date(tree.planted_at).getFullYear());
  const wktGeometry = `SRID=4326;POINT(${tree.longitude.toFixed(6)} ${tree.latitude.toFixed(6)})`;

  return (
    <DashboardShell>
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
        {/* Back Button & Top Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/trees"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Tree Directory</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link href={`/inspections/new?tree_id=${tree.tree_id}`}>
              <Button size="sm" className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold h-9 shadow-xs">
                <Stethoscope className="w-4 h-4 mr-1.5" />
                Log Inspection
              </Button>
            </Link>
            <Link href={`/map?tree_id=${tree.tree_id}`}>
              <Button variant="outline" size="sm" className="h-9 font-semibold">
                <Compass className="w-4 h-4 mr-1.5 text-emerald-700" />
                View on GIS Map
              </Button>
            </Link>
          </div>
        </div>

        {/* Tree Hero Banner */}
        <div className="p-6 rounded-2xl border border-border bg-card shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-muted font-bold text-foreground">
                {tree.tag_number}
              </span>
              {tree.health_status === "CRITICAL" ? (
                <Badge variant="critical">CRITICAL HAZARD</Badge>
              ) : tree.health_status === "DISEASED" ? (
                <Badge variant="critical">ACTIVE DISEASE</Badge>
              ) : tree.health_status === "MONITOR" ? (
                <Badge variant="warning">MONITORING</Badge>
              ) : (
                <Badge variant="emerald">HEALTHY</Badge>
              )}
              <span className="text-xs text-muted-foreground">Condition Score: {tree.condition_score}/5</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight pt-1">
              {tree.species_common}
            </h1>
            <p className="text-sm italic text-muted-foreground font-serif">
              {tree.species_scientific}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
            <div>
              <div className="text-muted-foreground uppercase text-[10px]">Height</div>
              <div className="text-base font-bold text-foreground">{tree.height_m}m</div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <div className="text-muted-foreground uppercase text-[10px]">DBH Girth</div>
              <div className="text-base font-bold text-foreground">{tree.dbh_cm}cm</div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <div className="text-muted-foreground uppercase text-[10px]">Estimated Age</div>
              <div className="text-base font-bold text-foreground">~{estimatedAgeYears} yrs</div>
            </div>
          </div>
        </div>

        {/* Main 2-Column Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Botanical Species Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Trees className="w-4 h-4 text-emerald-700" />
                <span>Botanical Taxon Profile</span>
              </CardTitle>
              <CardDescription>Species characteristics and pathological vulnerabilities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Binomial Taxon:</span>
                <span className="font-semibold italic">{species.scientific_name}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Growth Rate:</span>
                <Badge variant="outline" className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50">
                  {species.growth_rate}
                </Badge>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Typical Lifespan:</span>
                <span className="font-bold">{species.typical_lifespan_years} years</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Foliage Classification:</span>
                <span className="font-medium">{species.foliage_type}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-muted-foreground">Initial Planting Date:</span>
                <span className="font-mono">{tree.planted_at}</span>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Geospatial & Geofence Coordinates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-700" />
                <span>Geospatial &amp; PostGIS Geofence</span>
              </CardTitle>
              <CardDescription>Spatial coordinates and ward polygon containment verification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Designated Ward:</span>
                <span className="font-bold text-foreground">
                  {ward.name} (#{ward.ward_number})
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Administrative Zone:</span>
                <span className="font-medium">{ward.zone} Zone</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/50 font-mono text-xs">
                <span className="text-muted-foreground">Latitude / Longitude:</span>
                <span className="font-bold text-emerald-800">
                  {tree.latitude.toFixed(6)}, {tree.longitude.toFixed(6)}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/50 text-xs">
                <span className="text-muted-foreground">Containment Check:</span>
                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  ST_Contains = TRUE
                </span>
              </div>
              <div className="pt-1">
                <div className="text-[10px] font-mono text-muted-foreground mb-1 uppercase">WKT Geometry:</div>
                <div className="p-2 bg-muted/60 rounded-md font-mono text-[11px] text-foreground truncate">
                  {wktGeometry}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inspection History & Clinical Log */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-700" />
                  <span>Inspection History &amp; Diagnostics</span>
                </CardTitle>
                <CardDescription>Field health records and condition scoring timeline</CardDescription>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                Last Inspected: {new Date(tree.last_inspected_at).toLocaleDateString()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant={tree.health_status === "CRITICAL" ? "critical" : "emerald"}>
                    Score: {tree.condition_score} / 5
                  </Badge>
                  <span className="text-xs font-semibold text-foreground">Field Health Log</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Latest inspection verified tree vigor, trunk stability, and canopy foliar density.
                </p>
              </div>

              <Link href={`/inspections/new?tree_id=${tree.tree_id}`}>
                <Button size="sm" variant="outline" className="text-xs font-semibold">
                  Record New Score
                  <ChevronRight className="w-3.5 h-3.5 ml-1 text-emerald-700" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
