"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import { Inspection, TREES } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import {
  Stethoscope,
  Plus,
  Search,
  Trees,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  Calendar,
  Layers,
  Leaf
} from "lucide-react";

export default function InspectionsDirectoryPage() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterScore, setFilterScore] = useState<string>("all");

  useEffect(() => {
    fetch("/api/inspections")
      .then((res) => res.json())
      .then((data) => {
        if (data.inspections) setInspections(data.inspections);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = inspections.filter((i) => {
    if (filterScore !== "all" && String(i.condition_score) !== filterScore) return false;
    return true;
  });

  const totalCriticalAlerts = inspections.filter((i) => i.escalation_triggered).length;

  return (
    <DashboardShell>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-mono text-emerald-800 mb-2">
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Phase 12: Field Inspection Records</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
              Field Health Inspections Log
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Photographic symptom inventory, CLIP vectorization logs, and automated risk alert trigger history.
            </p>
          </div>

          <Link href="/inspections/new">
            <Button className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold h-10 shadow-xs">
              <Plus className="w-4 h-4 mr-1.5" />
              Log Field Inspection
            </Button>
          </Link>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-xs text-muted-foreground">Total Inspections</div>
            <div className="text-2xl font-extrabold text-foreground mt-1">{inspections.length}</div>
            <div className="text-[10px] text-emerald-800 font-mono mt-1">3NF Ingestion</div>
          </Card>

          <Card className="p-4">
            <div className="text-xs text-muted-foreground">Outbreak Escalations</div>
            <div className="text-2xl font-extrabold text-destructive mt-1">{totalCriticalAlerts}</div>
            <div className="text-[10px] text-destructive font-mono mt-1">Similarity &gt;= 0.82</div>
          </Card>

          <Card className="p-4">
            <div className="text-xs text-muted-foreground">Vector Dimension</div>
            <div className="text-2xl font-extrabold text-emerald-700 mt-1">512-d</div>
            <div className="text-[10px] text-muted-foreground font-mono mt-1">CLIP ViT-B/32</div>
          </Card>

          <Card className="p-4">
            <div className="text-xs text-muted-foreground">Indexing Method</div>
            <div className="text-2xl font-extrabold text-foreground mt-1">HNSW</div>
            <div className="text-[10px] text-emerald-800 font-mono mt-1">m=16, ef=64</div>
          </Card>
        </div>

        {/* Filter Toolbar */}
        <Card className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Filter Condition Score:</span>
            <div className="flex items-center gap-1.5">
              {["all", "1", "2", "3", "4", "5"].map((score) => (
                <button
                  key={score}
                  onClick={() => setFilterScore(score)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                    filterScore === score
                      ? "bg-emerald-800 text-white"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {score === "all" ? "All Scores" : `Score ${score}`}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Inspections Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Inspection ID</TableHead>
                <TableHead>Target Specimen</TableHead>
                <TableHead>Organ &amp; Photo</TableHead>
                <TableHead>Condition Score</TableHead>
                <TableHead>CLIP Similarity Match</TableHead>
                <TableHead>Trigger Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Loading field inspections...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No inspections match the filter.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((insp) => (
                  <TableRow key={insp.inspection_id}>
                    <TableCell className="font-mono text-xs font-bold text-foreground">
                      {insp.inspection_id}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/trees/${insp.tree_id}`}
                        className="font-mono text-xs font-bold text-emerald-800 hover:underline"
                      >
                        {insp.tree_id}
                      </Link>
                      <div className="text-[11px] text-muted-foreground">
                        {new Date(insp.inspected_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <img
                          src={insp.photo_url}
                          alt="Symptom preview"
                          className="w-10 h-10 rounded-lg object-cover border border-border shrink-0"
                        />
                        <div>
                          <Badge variant="outline" className="text-[10px] font-mono capitalize">
                            {insp.organ}
                          </Badge>
                          <div className="text-[11px] text-muted-foreground truncate max-w-[180px] mt-0.5">
                            {insp.symptom_notes}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {insp.condition_score <= 2 ? (
                        <Badge variant="critical">Score: {insp.condition_score} / 5</Badge>
                      ) : insp.condition_score === 3 ? (
                        <Badge variant="warning">Score: {insp.condition_score} / 5</Badge>
                      ) : (
                        <Badge variant="emerald">Score: {insp.condition_score} / 5</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-semibold text-foreground">
                        {insp.matched_disease}
                      </div>
                      <div className="text-[11px] font-mono text-emerald-800 font-bold">
                        {insp.cosine_similarity != null
                          ? `${(insp.cosine_similarity * 100).toFixed(1)}% Cosine Similarity`
                          : "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {insp.escalation_triggered ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-destructive">
                          <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
                          ALERT FIRED
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono text-muted-foreground">
                          Logged (Normal)
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/trees/${insp.tree_id}`}>
                        <Button variant="outline" size="sm" className="h-8 text-xs font-semibold">
                          View Tree
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
