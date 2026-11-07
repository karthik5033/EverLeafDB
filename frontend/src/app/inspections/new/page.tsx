"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import { TREES, WARDS, DISEASES, Tree } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Stethoscope,
  Camera,
  Upload,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Trees,
  Leaf,
  Layers,
  ShieldAlert,
  ArrowRight,
  Database,
  ArrowLeft,
  RefreshCw
} from "lucide-react";

const ANATOMICAL_ORGANS = [
  { id: "leaf", label: "Leaf / Foliage", desc: "Chlorosis, necrosis, leaf spots" },
  { id: "bark", label: "Bark / Cortex", desc: "Cracking, insect boring galleries" },
  { id: "trunk", label: "Trunk / Stem", desc: "Sap bleeding, cankers, cavities" },
  { id: "root", label: "Root / Flare", desc: "Basal mycelium, root rot, girdling" },
  { id: "canopy", label: "Crown Canopy", desc: "Branch dieback, defoliation" }
];

const CONDITION_SCORES = [
  { score: 1, label: "1 - Critical", desc: "Lethal hazard, immediate failure risk", variant: "critical" as const },
  { score: 2, label: "2 - Diseased", desc: "Significant damage, active pathogen", variant: "critical" as const },
  { score: 3, label: "3 - Monitor", desc: "Moderate decline, minor necrosis", variant: "warning" as const },
  { score: 4, label: "4 - Good", desc: "Minor foliar blemishes, strong vigor", variant: "emerald" as const },
  { score: 5, label: "5 - Optimal", desc: "Healthy, vigorous canopy architecture", variant: "emerald" as const }
];

function InspectionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialTreeId = searchParams.get("tree_id") || "tree_1084";
  const [selectedTreeId, setSelectedTreeId] = useState(initialTreeId);
  const [conditionScore, setConditionScore] = useState(1);
  const [organ, setOrgan] = useState("leaf");
  const [fieldNotes, setFieldNotes] = useState(
    "Severe lower foliage necrosis and canopy chlorosis. Possible mycelium at root collar."
  );

  // Photo state
  const [previewUrl, setPreviewUrl] = useState("/specimen_leaf.jpg");
  const [uploadedFileName, setUploadedFileName] = useState("specimen_leaf.jpg");
  const [isUploading, setIsUploading] = useState(false);
  const [vectorEmbedding, setVectorEmbedding] = useState<number[] | null>(null);
  const [vectorSource, setVectorSource] = useState<string>("CLIP ViT-B/32 (Cached Precedent)");

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resultAlert, setResultAlert] = useState<any | null>(null);

  const targetTree = TREES.find((t) => t.tree_id === selectedTreeId) || TREES[0];

  // Handle image upload from camera / file picker
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg(null);

    // Create immediate local preview
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setUploadedFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Call Phase 11 /api/upload endpoint (stores file, strips EXIF, generates 512-d CLIP vector)
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Image upload failed");
      }

      if (data.file?.public_url) {
        setPreviewUrl(data.file.public_url);
      }
      if (data.vector?.embedding) {
        setVectorEmbedding(data.vector.embedding);
        setVectorSource(data.vector.embedding_source);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to process photo upload");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUsePreset = (type: "leaf" | "trunk") => {
    if (type === "leaf") {
      setPreviewUrl("/specimen_leaf.jpg");
      setUploadedFileName("specimen_leaf.jpg");
      setOrgan("leaf");
      setConditionScore(1);
      setFieldNotes("Severe lower foliage necrosis and canopy chlorosis. Possible mycelium at root collar.");
    } else {
      setPreviewUrl("/specimen_trunk.jpg");
      setUploadedFileName("specimen_trunk.jpg");
      setOrgan("trunk");
      setConditionScore(2);
      setFieldNotes("Dark exuding sap from trunk fissures with rancid odor. Bark delamination active.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setResultAlert(null);

    try {
      const res = await fetch("/api/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tree_id: targetTree.tree_id,
          inspector_id: "inspector_04",
          condition_score: conditionScore,
          organ,
          symptom_notes: fieldNotes,
          photo_url: previewUrl,
          image_embedding: vectorEmbedding
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit field inspection");
      }

      if (data.alert) {
        setResultAlert(data.alert);
      } else {
        router.push("/inspections");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to record inspection");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardShell>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/inspections"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Inspections Directory</span>
          </Link>
        </div>

        {/* Header Title */}
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700 mb-2">
            <Stethoscope className="w-3.5 h-3.5 text-slate-500" />
            <span>Field Pathology • CLIP Vectorization</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
            Log Field Health Inspection
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Capture pathological symptom photography, assign anatomical organ tags, and trigger real-time HNSW cosine anomaly detection.
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Result Trigger Modal / Banner if Escalation Fired */}
        {resultAlert && (
          <Card className="border-destructive/60 bg-rose-50/70 p-6 space-y-4 animate-in fade-in-50">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-destructive rounded-xl text-white shrink-0">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="critical">AUTOMATED RISK ALERT FIRED</Badge>
                  <span className="text-xs font-mono font-bold text-destructive">
                    Cosine Sim: {(resultAlert.cosine_similarity * 100).toFixed(1)}% &gt;= 82.0%
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-rose-950">
                  {resultAlert.detected_disease} Detected
                </h3>
                <p className="text-xs text-rose-900 leading-relaxed">
                  PostgreSQL PL/pgSQL trigger <code className="font-mono bg-rose-100 px-1 py-0.5 rounded">trg_fn_detect_severe_disease_alert()</code> has automatically escalated specimen <strong>{targetTree.tag_number}</strong> to the municipal alert queue for supervisor work order dispatch.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Link href="/alerts" className="w-full sm:w-auto">
                <Button className="bg-destructive hover:bg-destructive/90 text-white font-bold h-10 w-full sm:w-auto">
                  View in Outbreak Alerts Queue
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => router.push("/inspections")}
                className="w-full sm:w-auto"
              >
                Go to Inspections
              </Button>
            </div>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Inspection Form (2 Columns) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Target Specimen Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>1. Target Tree Specimen</span>
                  <Badge variant="outline" className="font-mono text-xs">
                    {targetTree.tag_number}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <select
                  value={selectedTreeId}
                  onChange={(e) => setSelectedTreeId(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl p-3 text-sm font-semibold focus:outline-hidden"
                >
                  {TREES.map((t) => (
                    <option key={t.tree_id} value={t.tree_id}>
                      {t.tag_number} — {t.species_common} ({t.ward_name})
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono p-3 bg-muted/40 rounded-xl border border-border">
                  <div>
                    <span className="text-muted-foreground text-[10px] uppercase block">Ward</span>
                    <span className="font-bold text-foreground">{targetTree.ward_name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px] uppercase block">Height/DBH</span>
                    <span className="font-bold text-foreground">{targetTree.height_m}m / {targetTree.dbh_cm}cm</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px] uppercase block">Status</span>
                    <span className="font-bold text-emerald-800">{targetTree.health_status}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Photo Ingestion & Real-Time Camera Shutter */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Camera className="w-4 h-4 text-emerald-700" />
                      <span>2. Visual Symptom Capture</span>
                    </CardTitle>
                    <CardDescription>
                      Upload high-res photo; EXIF GPS stripped &amp; CLIP 512-d vector extracted automatically
                    </CardDescription>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Photo Preview Canvas with Laser HUD */}
                <div className="relative w-full h-64 rounded-xl border border-gray-300 bg-gray-950 overflow-hidden group">
                  <img
                    src={previewUrl}
                    alt="Specimen preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                  {/* High-tech targeting reticle overlay */}
                  <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10b981] animate-pulse top-1/2 pointer-events-none" />

                  {/* Top-Right Tag */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/80 text-emerald-300 border border-emerald-500/40 backdrop-blur-xs flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      512-dim Float32
                    </span>
                  </div>

                  {/* Bottom Info HUD */}
                  <div className="absolute bottom-3 inset-x-3 flex items-center justify-between text-xs text-white/90 font-mono pointer-events-none">
                    <div className="truncate max-w-[200px]">{uploadedFileName}</div>
                    <div className="text-emerald-400 font-bold">{vectorSource}</div>
                  </div>
                </div>

                {/* Upload & Quick Preset Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="h-9 text-xs font-semibold"
                  >
                    <Upload className="w-3.5 h-3.5 mr-1.5 text-emerald-700" />
                    {isUploading ? "Sanitizing & Vectorizing..." : "Upload from Device / Camera"}
                  </Button>

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span>Sample Presets:</span>
                    <button
                      type="button"
                      onClick={() => handleUsePreset("leaf")}
                      className="px-2 py-1 rounded bg-muted hover:bg-muted/80 text-foreground text-xs font-mono font-medium"
                    >
                      Leaf Necrosis
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUsePreset("trunk")}
                      className="px-2 py-1 rounded bg-muted hover:bg-muted/80 text-foreground text-xs font-mono font-medium"
                    >
                      Bark Canker
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Anatomical Organ & Condition Score */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">3. Anatomical Organ &amp; Health Score</CardTitle>
                <CardDescription>Visual triage assessment of affected botanical organs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Organ Selector Buttons */}
                <div>
                  <label className="text-xs font-semibold text-foreground mb-2 block">
                    Affected Botanical Organ
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {ANATOMICAL_ORGANS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setOrgan(item.id)}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          organ === item.id
                            ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-bold shadow-xs ring-1 ring-emerald-300"
                            : "bg-background border-border text-foreground hover:bg-muted/50"
                        }`}
                      >
                        <div className="text-xs">{item.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Condition Score 1 to 5 */}
                <div>
                  <label className="text-xs font-semibold text-foreground mb-2 flex items-center justify-between">
                    <span>Visual Condition Score</span>
                    <span className="font-mono text-emerald-800 font-bold">{conditionScore} / 5</span>
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {CONDITION_SCORES.map((s) => (
                      <button
                        key={s.score}
                        type="button"
                        onClick={() => setConditionScore(s.score)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          conditionScore === s.score
                            ? s.score <= 2
                              ? "bg-rose-50 border-rose-300 text-rose-950 font-bold ring-2 ring-rose-400"
                              : "bg-emerald-50 border-emerald-300 text-emerald-950 font-bold ring-2 ring-emerald-400"
                            : "bg-background border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <div className="text-lg font-extrabold">{s.score}</div>
                        <div className="text-[10px] truncate">{s.score <= 2 ? "Hazard" : s.score === 3 ? "Monitor" : "Healthy"}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Field Diagnostic Notes */}
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Field Diagnostic Observations
                  </label>
                  <Textarea
                    rows={3}
                    value={fieldNotes}
                    onChange={(e) => setFieldNotes(e.target.value)}
                    placeholder="Document symptoms, exudate, mycelium, insect exit holes, or structural hazards..."
                    className="text-xs"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar: PL/pgSQL Trigger Engine Telemetry */}
          <div className="space-y-6">
            <Card className="border-emerald-200/80 bg-emerald-50/20">
              <CardHeader>
                <CardTitle className="text-sm font-mono flex items-center gap-2 text-emerald-950">
                  <Database className="w-4 h-4 text-emerald-700" />
                  <span>Real-Time Trigger Evaluation</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Simulating <code className="font-mono text-emerald-800">AFTER INSERT</code> trigger on <code className="font-mono">inspection_images</code>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 font-mono text-xs">
                <div className="p-3 bg-gray-950 text-emerald-300 rounded-xl space-y-1 text-[11px] shadow-inner">
                  <div className="text-muted-foreground">-- HNSW Nearest Neighbor Check</div>
                  <div>1 - (img_embed &lt;=&gt; $clip_vec)</div>
                  <div className="pt-1 flex items-center justify-between text-white font-bold">
                    <span>Similarity:</span>
                    <span className={conditionScore <= 2 ? "text-rose-400" : "text-emerald-400"}>
                      {conditionScore <= 1 ? "0.892 (89.2%)" : conditionScore === 2 ? "0.841 (84.1%)" : conditionScore === 3 ? "0.740 (74.0%)" : "0.420 (42.0%)"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Threshold:</span>
                    <span>&gt;= 0.820 (82.0%)</span>
                  </div>
                  <div className="pt-2 text-[10px] text-amber-300 border-t border-white/10">
                    {conditionScore <= 2 ? "ACTION: INSERT INTO alerts (CRITICAL)" : "ACTION: RECORD_ONLY (No alert)"}
                  </div>
                </div>

                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Officer Role:</span>
                    <span className="font-bold text-foreground">Field Inspector</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Vector Dim:</span>
                    <span className="text-emerald-800 font-bold">512 (Normalized)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Asset Storage:</span>
                    <span className="text-emerald-800 font-bold">SHA-256 Deduplicated</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-bold h-11"
                >
                  {submitting ? "Vectorizing & Ingesting..." : "Commit Field Inspection"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}

export default function NewInspectionPage() {
  return (
    <Suspense
      fallback={
        <DashboardShell>
          <div className="p-8 max-w-5xl mx-auto flex items-center justify-center min-h-[400px]">
            <div className="flex items-center gap-3 text-sm text-muted-foreground font-mono">
              <RefreshCw className="w-5 h-5 animate-spin text-emerald-800" />
              <span>Loading inspection station...</span>
            </div>
          </div>
        </DashboardShell>
      }
    >
      <InspectionForm />
    </Suspense>
  );
}
