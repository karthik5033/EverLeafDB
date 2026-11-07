"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileSearch,
  Sparkles,
  ArrowRight,
  Database,
  Lock,
  Layers,
  Activity,
  Send,
  Eye,
  Microscope,
  Stethoscope,
  TreeDeciduous,
  MapPin,
  Clock,
  UserCheck,
  Check,
  RefreshCw,
  Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { TriageAlertItem, TriageActionResult } from "@/lib/triage-engine";
import { DISEASES, TREATMENTS_SEED } from "@/lib/db";
import { DashboardShell } from "@/components/DashboardShell";

export default function SupervisorTriagePage() {
  const [alerts, setAlerts] = useState<TriageAlertItem[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<TriageAlertItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [kpis, setKpis] = useState({
    total_alerts: 0,
    pending_count: 0,
    actioned_count: 0,
    dismissed_count: 0,
    critical_count: 0,
    avg_similarity: 0
  });

  // Triage Form Controls State
  const [confirmedDiseaseId, setConfirmedDiseaseId] = useState<number>(1);
  const [confidenceSource, setConfidenceSource] = useState<"vector_suggested" | "manual" | "lab_confirmed">("vector_suggested");
  const [treatmentId, setTreatmentId] = useState<number>(1);
  const [assignedCrew, setAssignedCrew] = useState("North Rapid Response Team");
  const [priority, setPriority] = useState<"EMERGENCY" | "HIGH" | "MEDIUM" | "LOW">("EMERGENCY");
  const [supervisorRemarks, setSupervisorRemarks] = useState("");

  // Transaction Receipt Modal State
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [transactionResult, setTransactionResult] = useState<TriageActionResult | null>(null);

  // Fetch Triage Queue
  const fetchTriageQueue = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (severityFilter !== "ALL") params.append("severity", severityFilter);

      const res = await fetch(`/api/alerts?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setAlerts(data.alerts || []);
        setKpis(data.kpis || {
          total_alerts: 0,
          pending_count: 0,
          actioned_count: 0,
          dismissed_count: 0,
          critical_count: 0,
          avg_similarity: 0
        });

        // Set active selected alert
        if (data.alerts && data.alerts.length > 0) {
          // If previous selection exists in new data, keep it; otherwise pick first
          const found = selectedAlert ? data.alerts.find((a: TriageAlertItem) => a.alert_id === selectedAlert.alert_id) : null;
          handleSelectAlert(found || data.alerts[0]);
        } else {
          setSelectedAlert(null);
        }
      }
    } catch (err) {
      console.error("Failed to load triage queue:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTriageQueue();
  }, [statusFilter, severityFilter]);

  const handleSelectAlert = (alert: TriageAlertItem) => {
    setSelectedAlert(alert);
    setConfirmedDiseaseId(alert.detected_disease_id || 1);
    setTreatmentId(alert.precedent_match?.treatment_id || 1);
    setConfidenceSource("vector_suggested");
    setPriority(alert.severity === "CRITICAL" ? "EMERGENCY" : "HIGH");
    setSupervisorRemarks(
      `Precedent comparison matches ${alert.precedent_match?.disease_name || alert.detected_disease} with ${alert.similarity_percent}% visual confidence. Immediate intervention prescribed.`
    );
  };

  // Submit Triage Action
  const handleSubmitAction = async (actionType: "CONFIRM_AND_DISPATCH" | "DISMISS" | "ESCALATE_LAB") => {
    if (!selectedAlert) return;

    try {
      setActionLoading(true);
      const selectedTreatment = TREATMENTS_SEED.find(t => t.treatment_id === treatmentId);

      const payload = {
        alert_id: selectedAlert.alert_id,
        action: actionType,
        confirmed_disease_id: confirmedDiseaseId,
        confidence_source: confidenceSource,
        treatment_id: treatmentId,
        protocol: selectedTreatment?.name,
        assigned_crew: assignedCrew,
        priority: priority,
        supervisor_remarks: supervisorRemarks,
        supervisor_id: "supervisor_01"
      };

      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result: TriageActionResult = await res.json();
      if (result.success) {
        setTransactionResult(result);
        setReceiptModalOpen(true);
        // Refresh alert list
        await fetchTriageQueue();
      } else {
        alert(result.message || "Failed to process triage decision.");
      }
    } catch (err) {
      console.error("Action execution failed:", err);
      alert("Network error processing triage action.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <DashboardShell>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 pb-28">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Supervisor Clinical Triage &amp; Outbreak Response
                </h1>
                <p className="text-sm text-slate-500">
                  Real-time decision workspace for municipal tree supervisors to review automated risk alerts, perform visual case comparison, and confirm clinical diagnoses.
                </p>
              </div>
            </div>
          </div>

          {/* ACID Transaction Protocol Pill */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-700">
              <Lock className="h-3.5 w-3.5 text-emerald-700" />
              <span className="font-mono text-emerald-800 font-semibold">SELECT FOR UPDATE</span>
              <span className="text-slate-400">|</span>
              <span>ACID Repeatable Read</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTriageQueue}
              disabled={loading}
              className="gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* KPI Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white border-slate-200 shadow-xs">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium uppercase tracking-wider text-slate-500 flex items-center justify-between">
                Pending Triage Queue
                <Clock className="h-4 w-4 text-amber-500" />
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-amber-700">
                {kpis.pending_count} Cases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">Awaiting clinical confirmation</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-xs">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium uppercase tracking-wider text-slate-500 flex items-center justify-between">
                Critical Risk Alerts
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-red-700">
                {kpis.critical_count} Urgent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">High biosecurity hazard tier</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-xs">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium uppercase tracking-wider text-slate-500 flex items-center justify-between">
                Actioned / Dispatched
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-emerald-700">
                {kpis.actioned_count} Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">Treatment staged to crews</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-xs">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium uppercase tracking-wider text-slate-500 flex items-center justify-between">
                Mean Vector Similarity
                <Sparkles className="h-4 w-4 text-blue-600" />
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-slate-900">
                {kpis.avg_similarity}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">Cosine similarity vs reference</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-auto">
          <TabsList className="bg-background/80">
            <TabsTrigger value="PENDING" className="gap-1.5 text-xs">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              Pending ({kpis.pending_count})
            </TabsTrigger>
            <TabsTrigger value="ACTIONED" className="gap-1.5 text-xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              Actioned ({kpis.actioned_count})
            </TabsTrigger>
            <TabsTrigger value="DISMISSED" className="gap-1.5 text-xs">
              <XCircle className="h-3.5 w-3.5 text-slate-400" />
              Dismissed ({kpis.dismissed_count})
            </TabsTrigger>
            <TabsTrigger value="ALL" className="text-xs">
              All ({kpis.total_alerts})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">Severity:</span>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[130px] h-8 text-xs bg-background">
              <SelectValue placeholder="All Severities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Severities</SelectItem>
              <SelectItem value="CRITICAL">Critical Only</SelectItem>
              <SelectItem value="HIGH">High Only</SelectItem>
              <SelectItem value="WARNING">Warning Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Workspace: Split Screen Triage Queue & Clinical Decision Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Alerts List Queue (4 Columns) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-500" />
              Alert Queue ({alerts.length})
            </h3>
            <span className="text-xs text-muted-foreground">Select case to review</span>
          </div>

          <div className="space-y-2.5 max-h-[820px] overflow-y-auto pr-1">
            {alerts.length === 0 ? (
              <Card className="p-8 text-center bg-card/30 border-dashed border-border/60">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <h4 className="text-sm font-semibold text-foreground">Queue Cleared</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  No alerts matching the selected filter criteria.
                </p>
              </Card>
            ) : (
              alerts.map((alert) => {
                const isSelected = selectedAlert?.alert_id === alert.alert_id;
                const isCritical = alert.severity === "CRITICAL";
                const isActioned = alert.status === "ACTIONED";
                const isDismissed = alert.status === "DISMISSED";

                return (
                  <div
                    key={alert.alert_id}
                    onClick={() => handleSelectAlert(alert)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-emerald-500/10 border-emerald-500 shadow-sm ring-1 ring-emerald-500/20"
                        : "bg-card/60 hover:bg-card border-border/50 hover:border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-foreground">
                            {alert.alert_id}
                          </span>
                          <Badge
                            variant={
                              isCritical ? "destructive" : alert.severity === "HIGH" ? "default" : "outline"
                            }
                            className="text-[10px] px-1.5 py-0 h-4"
                          >
                            {alert.severity}
                          </Badge>
                          {isActioned && (
                            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] px-1.5 py-0 h-4">
                              ACTIONED
                            </Badge>
                          )}
                          {isDismissed && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 text-slate-400">
                              DISMISSED
                            </Badge>
                          )}
                        </div>
                        <h4 className="text-sm font-medium text-foreground line-clamp-1">
                          {alert.detected_disease}
                        </h4>
                      </div>

                      {/* Cosine Similarity Pill */}
                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold text-emerald-500 font-mono">
                          {alert.similarity_percent}%
                        </div>
                        <span className="text-[10px] text-muted-foreground">match</span>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <TreeDeciduous className="h-3 w-3 text-emerald-500" />
                        <span className="font-mono text-[11px]">{alert.tree_tag}</span>
                        <span>•</span>
                        <span>{alert.species_common}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        <span className="truncate max-w-[90px]">{alert.ward_name}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Side-by-Side Clinical Viewer & Decision Workspace (8 Columns) */}
        <div className="lg:col-span-8">
          {selectedAlert ? (
            <div className="space-y-6">
              {/* Selected Alert Banner */}
              <div className="p-4 rounded-xl bg-card border border-border/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-foreground">
                      Case File: {selectedAlert.alert_id}
                    </span>
                    <Badge
                      variant={
                        selectedAlert.severity === "CRITICAL"
                          ? "destructive"
                          : selectedAlert.severity === "HIGH"
                          ? "default"
                          : "outline"
                      }
                      className="text-xs"
                    >
                      {selectedAlert.severity} PRIORITY
                    </Badge>
                    <Badge
                      className={
                        selectedAlert.status === "PENDING"
                          ? "bg-amber-500/15 text-amber-500 border-amber-500/30"
                          : selectedAlert.status === "ACTIONED"
                          ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                          : "bg-slate-500/15 text-slate-400 border-slate-500/30"
                      }
                    >
                      {selectedAlert.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Flagged by automated HNSW cosine vector trigger on {new Date(selectedAlert.created_at).toLocaleDateString()} at {new Date(selectedAlert.created_at).toLocaleTimeString()}
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs bg-muted/60 px-3.5 py-2 rounded-lg border border-border/40 font-mono">
                  <div>
                    <span className="text-muted-foreground">Tree: </span>
                    <span className="font-bold text-foreground">{selectedAlert.tree_tag}</span>
                  </div>
                  <span className="text-slate-400">|</span>
                  <div>
                    <span className="text-muted-foreground">Ward: </span>
                    <span className="text-foreground">{selectedAlert.ward_name}</span>
                  </div>
                </div>
              </div>

              {/* Side-by-Side Visual Comparison Card */}
              <Card className="border-border/60 shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/40 py-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Microscope className="h-4 w-4 text-emerald-500" />
                      <CardTitle className="text-base font-semibold">
                        Side-by-Side Specimen Comparison
                      </CardTitle>
                    </div>
                    <Badge variant="outline" className="bg-background text-xs font-mono">
                      pgvector Cosine Distance: {(1 - selectedAlert.similarity_score).toFixed(4)}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Comparing current field specimen against top confirmed clinical precedent retrieved from 512-dimensional embedding database.
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Left Panel: Field Specimen Under Review */}
                    <div className="space-y-3.5 p-4 rounded-xl bg-background border border-border/60">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Eye className="h-3.5 w-3.5 text-amber-500" />
                          Field Specimen (Suspicious)
                        </span>
                        <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                          {selectedAlert.suspicious_body_part} view
                        </Badge>
                      </div>

                      {/* Specimen Photo */}
                      <div className="relative aspect-video rounded-lg overflow-hidden border border-border/40 bg-slate-950 flex items-center justify-center">
                        <Image
                          src={selectedAlert.suspicious_image_url}
                          alt="Field Inspection Specimen"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/75 backdrop-blur text-[10px] text-white font-mono">
                          {selectedAlert.tree_tag} • {selectedAlert.species_common}
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="space-y-2 text-xs">
                        <div className="grid grid-cols-2 gap-2 text-[11px] bg-muted/40 p-2.5 rounded-lg border border-border/40">
                          <div>
                            <span className="text-muted-foreground block">Scientific Name:</span>
                            <span className="font-semibold italic text-foreground">{selectedAlert.species_scientific}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block">Field Inspector:</span>
                            <span className="font-medium text-foreground">{selectedAlert.inspector_name}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block">Inspection Date:</span>
                            <span className="font-medium text-foreground">{new Date(selectedAlert.inspected_at).toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block">Suspected Pathogen:</span>
                            <span className="font-semibold text-amber-500">{selectedAlert.detected_disease}</span>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-muted-foreground">
                          <span className="text-[11px] font-semibold text-foreground block mb-0.5">Inspector Field Remarks:</span>
                          <p className="text-[11px] italic leading-relaxed text-foreground/80">
                            "{selectedAlert.inspector_notes}"
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right Panel: Top Precedent Case Match */}
                    <div className="space-y-3.5 p-4 rounded-xl bg-background border border-emerald-500/40 shadow-sm relative">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          Top Precedent Case Match
                        </span>
                        <Badge className="bg-emerald-500 text-white text-[10px] font-mono px-2">
                          {selectedAlert.similarity_percent}% SIMILARITY
                        </Badge>
                      </div>

                      {/* Reference Photo */}
                      <div className="relative aspect-video rounded-lg overflow-hidden border border-emerald-500/30 bg-slate-950 flex items-center justify-center">
                        <Image
                          src={selectedAlert.precedent_match.photo_url}
                          alt="Top Precedent Case"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/75 backdrop-blur text-[10px] text-white font-mono">
                          Ref: {selectedAlert.precedent_match.tree_tag} • {selectedAlert.precedent_match.disease_name}
                        </div>
                      </div>

                      {/* Precedent Metadata */}
                      <div className="space-y-2 text-xs">
                        <div className="grid grid-cols-2 gap-2 text-[11px] bg-emerald-500/5 p-2.5 rounded-lg border border-emerald-500/20">
                          <div>
                            <span className="text-muted-foreground block">Confirmed Pathogen:</span>
                            <span className="font-bold text-foreground">{selectedAlert.precedent_match.disease_name}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block">Pathogen Severity:</span>
                            <span className="font-semibold text-red-500">{selectedAlert.precedent_match.severity_level}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block">Prescribed Therapy:</span>
                            <span className="font-medium text-foreground truncate block">{selectedAlert.precedent_match.treatment_name}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block">Historical Outcome:</span>
                            <span className="font-bold text-emerald-500">{selectedAlert.precedent_match.outcome_status}</span>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-muted-foreground">
                          <span className="text-[11px] font-semibold text-foreground block mb-0.5">Clinical Case Outcome:</span>
                          <p className="text-[11px] leading-relaxed text-foreground/80">
                            {selectedAlert.precedent_match.inspector_notes}
                          </p>
                          <div className="mt-2 pt-1.5 border-t border-emerald-500/20 flex items-center justify-between text-[10px] font-mono">
                            <span>Cost: ${selectedAlert.precedent_match.typical_cost} USD</span>
                            <span>Cure Duration: {selectedAlert.precedent_match.cure_duration_days} days</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Supervisor Clinical Triage & Dispatch Form */}
              <Card className="border-border/60 shadow-sm">
                <CardHeader className="bg-muted/30 border-b border-border/40 py-3.5">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-emerald-500" />
                    <CardTitle className="text-base font-semibold">
                      Supervisor Clinical Diagnosis & Action Console
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Confirm pathogen diagnosis, assign municipal therapeutic protocol, and stage crew dispatch order.
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Confirm Disease */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Confirm Pathological Disease
                      </label>
                      <Select
                        value={String(confirmedDiseaseId)}
                        onValueChange={(val) => setConfirmedDiseaseId(Number(val))}
                        disabled={selectedAlert.status === "ACTIONED"}
                      >
                        <SelectTrigger className="text-xs bg-background">
                          <SelectValue placeholder="Select Disease" />
                        </SelectTrigger>
                        <SelectContent>
                          {DISEASES.map((d) => (
                            <SelectItem key={d.disease_id} value={String(d.disease_id)} className="text-xs">
                              {d.common_name} ({d.severity})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Confidence Source */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Diagnostic Confidence Source
                      </label>
                      <Select
                        value={confidenceSource}
                        onValueChange={(val: any) => setConfidenceSource(val)}
                        disabled={selectedAlert.status === "ACTIONED"}
                      >
                        <SelectTrigger className="text-xs bg-background">
                          <SelectValue placeholder="Select Source" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vector_suggested" className="text-xs">
                            vector_suggested (pgvector {selectedAlert.similarity_percent}%)
                          </SelectItem>
                          <SelectItem value="manual" className="text-xs">
                            manual (Supervisor Visual Inspection)
                          </SelectItem>
                          <SelectItem value="lab_confirmed" className="text-xs">
                            lab_confirmed (Fungal PCR / Mycology)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Treatment Protocol */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Treatment Intervention Protocol
                      </label>
                      <Select
                        value={String(treatmentId)}
                        onValueChange={(val) => setTreatmentId(Number(val))}
                        disabled={selectedAlert.status === "ACTIONED"}
                      >
                        <SelectTrigger className="text-xs bg-background">
                          <SelectValue placeholder="Select Protocol" />
                        </SelectTrigger>
                        <SelectContent>
                          {TREATMENTS_SEED.map((t) => (
                            <SelectItem key={t.treatment_id} value={String(t.treatment_id)} className="text-xs">
                              {t.name} (${t.standard_cost})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Assigned Crew */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Assigned Municipal Response Crew
                      </label>
                      <Select
                        value={assignedCrew}
                        onValueChange={setAssignedCrew}
                        disabled={selectedAlert.status === "ACTIONED"}
                      >
                        <SelectTrigger className="text-xs bg-background">
                          <SelectValue placeholder="Select Crew" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="North Rapid Response Team" className="text-xs">
                            North Rapid Response Team (Zone 1)
                          </SelectItem>
                          <SelectItem value="Central Emergency Arbor Unit 1" className="text-xs">
                            Central Emergency Arbor Unit 1 (Zone Central)
                          </SelectItem>
                          <SelectItem value="South Biosecurity Sanitation Squad" className="text-xs">
                            South Biosecurity Sanitation Squad (Zone 3)
                          </SelectItem>
                          <SelectItem value="East Foliar Mist Contractors" className="text-xs">
                            East Foliar Mist Contractors (Zone 2)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Dispatch Priority */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Dispatch SLA Priority Tier
                      </label>
                      <Select
                        value={priority}
                        onValueChange={(val: any) => setPriority(val)}
                        disabled={selectedAlert.status === "ACTIONED"}
                      >
                        <SelectTrigger className="text-xs bg-background">
                          <SelectValue placeholder="Select Priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EMERGENCY" className="text-xs text-red-500 font-semibold">
                            EMERGENCY (24-Hour SLA)
                          </SelectItem>
                          <SelectItem value="HIGH" className="text-xs text-amber-500 font-medium">
                            HIGH (48-Hour SLA)
                          </SelectItem>
                          <SelectItem value="MEDIUM" className="text-xs text-blue-500">
                            MEDIUM (72-Hour SLA)
                          </SelectItem>
                          <SelectItem value="LOW" className="text-xs text-slate-400">
                            LOW (7-Day Routine SLA)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Supervisor Remarks */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Supervisor Clinical Remarks & Treatment Directives
                    </label>
                    <Textarea
                      value={supervisorRemarks}
                      onChange={(e) => setSupervisorRemarks(e.target.value)}
                      rows={3}
                      placeholder="Enter clinical rationale, safety directives, or quarantine instructions..."
                      disabled={selectedAlert.status === "ACTIONED"}
                      className="text-xs bg-background"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/40">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={actionLoading || selectedAlert.status !== "PENDING"}
                        onClick={() => handleSubmitAction("DISMISS")}
                        className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
                      >
                        <XCircle className="h-4 w-4" />
                        Dismiss False Positive
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={actionLoading || selectedAlert.status !== "PENDING"}
                        onClick={() => handleSubmitAction("ESCALATE_LAB")}
                        className="text-xs text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10 gap-1.5"
                      >
                        <Microscope className="h-4 w-4" />
                        Escalate for Lab PCR
                      </Button>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      disabled={actionLoading || selectedAlert.status === "ACTIONED"}
                      onClick={() => handleSubmitAction("CONFIRM_AND_DISPATCH")}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2 shadow-sm"
                    >
                      <Check className="h-4 w-4" />
                      {selectedAlert.status === "ACTIONED"
                        ? "Work Order Dispatched"
                        : "Confirm Diagnosis & Dispatch Work Order"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="p-12 text-center bg-card/40 border-dashed border-border/60">
              <Stethoscope className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-60" />
              <h3 className="text-base font-semibold text-foreground">No Alert Selected</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Select an alert from the queue on the left to inspect suspicious photos, evaluate nearest neighbor precedents, and stage treatment work orders.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Transaction Receipt Modal */}
      <Dialog open={receiptModalOpen} onOpenChange={setReceiptModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mb-2">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <DialogTitle className="text-base font-bold">
              Atomic Stored Procedure Executed
            </DialogTitle>
            <DialogDescription className="text-xs">
              Transaction successfully committed with Repeatable Read pessimistic row isolation.
            </DialogDescription>
          </DialogHeader>

          {transactionResult && (
            <div className="space-y-3 py-2 text-xs">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
                <div className="text-emerald-400 font-semibold">
                  CALL sp_confirm_diagnosis_and_dispatch_order()
                </div>
                <div className="text-slate-400">
                  Lock: {transactionResult.acid_transaction.row_lock}
                </div>
                <div className="text-slate-400">
                  Status: {transactionResult.acid_transaction.status} (Zero Rollbacks)
                </div>
              </div>

              {transactionResult.work_order && (
                <div className="bg-muted/40 p-3 rounded-lg border border-border/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Generated Work Order:</span>
                    <span className="font-mono font-bold text-foreground">
                      {transactionResult.work_order.order_id}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Assigned Crew:</span>
                    <span className="font-medium text-foreground">
                      {transactionResult.work_order.assigned_crew}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">SLA Deadline:</span>
                    <span className="font-semibold text-amber-500">
                      {transactionResult.work_order.sla_hours} Hours (Priority: {transactionResult.work_order.priority})
                    </span>
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground italic">
                {transactionResult.message}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              size="sm"
              className="text-xs bg-slate-950 hover:bg-slate-800 text-white"
              onClick={() => setReceiptModalOpen(false)}
            >
              Close Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </DashboardShell>
  );
}
