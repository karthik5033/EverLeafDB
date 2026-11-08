"use client";

import React from "react";
import Image from "next/image";
import { PrecedentCase } from "@/lib/precedent-engine";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Layers,
  ArrowRight,
  ShieldAlert,
  Stethoscope,
  Info
} from "lucide-react";

interface PrecedentMatchCardProps {
  precedent: PrecedentCase;
  queryImageUrl?: string;
  onApplyTreatment?: (precedent: PrecedentCase) => void;
}

export function PrecedentMatchCard({
  precedent,
  queryImageUrl = "/specimen_leaf.jpg",
  onApplyTreatment
}: PrecedentMatchCardProps) {
  const isHighMatch = precedent.similarity_percent >= 82.0;

  return (
    <Card className="overflow-hidden border border-border/80 shadow-xs hover:border-emerald-300 transition-all">
      {/* Header Banner */}
      <div className="bg-muted/40 px-4 py-2.5 border-b border-border flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Badge
            variant={isHighMatch ? "emerald" : "secondary"}
            className="font-mono text-xs font-bold"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1 inline" />
            {precedent.similarity_percent.toFixed(1)}% Visual Match
          </Badge>
          <span className="text-xs text-muted-foreground font-mono">
            Cosine Dist: {precedent.cosine_distance.toFixed(3)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={
              precedent.severity_level === "CRITICAL"
                ? "critical"
                : precedent.severity_level === "HIGH"
                ? "warning"
                : "secondary"
            }
            className="text-xs uppercase font-bold px-2 py-0.5"
          >
            {precedent.severity_level}
          </Badge>

          <Badge
            variant={precedent.outcome_status === "SUCCESSFUL" ? "emerald" : "destructive"}
            className="text-xs font-bold px-2 py-0.5"
          >
            {precedent.outcome_status === "SUCCESSFUL" ? (
              <CheckCircle2 className="w-3.5 h-3.5 mr-1 inline" />
            ) : (
              <XCircle className="w-3.5 h-3.5 mr-1 inline" />
            )}
            Outcome: {precedent.outcome_status}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Side-by-Side Visual Comparison */}
        <div className="grid grid-cols-2 gap-3 bg-muted/20 p-2.5 rounded-lg border border-border/50">
          {/* Query Image */}
          <div className="space-y-1.5 text-center">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Inquiry Specimen
            </span>
            <div className="relative aspect-4/3 rounded-md overflow-hidden border border-border bg-black/5 flex items-center justify-center">
              <img
                src={queryImageUrl}
                alt="Inquiry Specimen"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Historical Precedent Image */}
          <div className="space-y-1.5 text-center">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
              Historical Cured Case
            </span>
            <div className="relative aspect-4/3 rounded-md overflow-hidden border border-emerald-300 bg-emerald-50/20 flex items-center justify-center">
              <img
                src={precedent.photo_url}
                alt={precedent.disease_name}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-1 right-1 bg-black/75 text-white text-xs font-mono px-2 py-0.5 rounded">
                {precedent.tree_tag}
              </div>
            </div>
          </div>
        </div>

        {/* Clinical Diagnostics Information */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-extrabold text-foreground flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-emerald-800" />
              {precedent.disease_name}
            </h4>
            <span className="text-xs font-mono text-muted-foreground">{precedent.species_name}</span>
          </div>

          <div className="p-3 rounded-md bg-muted/30 border border-border/40 text-sm text-slate-700 leading-relaxed">
            <div className="text-xs font-bold text-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-emerald-800" />
              Inspector Clinical Observations & Evidence
            </div>
            {precedent.inspector_notes}
          </div>
        </div>

        {/* Treatment Recommendation Card */}
        <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/40 space-y-2">
          <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-emerald-950">
            <span>Prescribed Treatment Protocol</span>
            <span className="font-mono text-xs text-emerald-800 font-bold uppercase bg-emerald-100/60 px-2 py-0.5 rounded">
              {precedent.treatment_type}
            </span>
          </div>

          <div className="text-sm font-bold text-emerald-950">
            {precedent.treatment_name}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-emerald-200/60 text-xs sm:text-sm text-emerald-900 font-medium">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>Cure Window: <strong>{precedent.cure_duration_days} days</strong></span>
            </div>
            <div className="flex items-center gap-1.5 justify-end">
              <DollarSign className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>Est. Cost: <strong>${precedent.typical_cost.toFixed(2)}</strong></span>
            </div>
          </div>
        </div>
      </CardContent>

      {onApplyTreatment && (
        <CardFooter className="p-4 pt-0">
          <Button
            onClick={() => onApplyTreatment(precedent)}
            className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-bold h-9 text-xs sm:text-sm"
          >
            Apply Treatment Plan from Precedent
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

