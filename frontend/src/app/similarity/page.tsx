"use client";

import React, { useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { PrecedentMatchCard } from "@/components/PrecedentMatchCard";
import { PrecedentCase } from "@/lib/precedent-engine";
import {
  Layers,
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Activity,
  FileText,
  RotateCcw
} from "lucide-react";

export default function SimilarityPage() {
  const [selectedPhoto, setSelectedPhoto] = useState<"/specimen_leaf.jpg" | "/specimen_trunk.jpg">("/specimen_leaf.jpg");
  const [organ, setOrgan] = useState<"leaf" | "bark" | "trunk">("leaf");
  const [isLoading, setIsLoading] = useState(false);
  const [similarityResults, setSimilarityResults] = useState<any[] | null>(null);
  const [precedents, setPrecedents] = useState<PrecedentCase[]>([]);

  const runSimilaritySearch = async () => {
    setIsLoading(true);
    try {
      const [simRes, precRes] = await Promise.all([
        fetch("/api/similarity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ organ, specimen_type: selectedPhoto })
        }),
        fetch("/api/precedents/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ species_id: organ === "trunk" ? 2 : 1 })
        })
      ]);

      const simData = await simRes.json();
      const precData = await precRes.json();

      setSimilarityResults(simData.results || []);
      if (precData.precedents) {
        setPrecedents(precData.precedents);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Run on first load if null
  React.useEffect(() => {
    runSimilaritySearch();
  }, [selectedPhoto, organ]);

  return (
    <DashboardShell>
      <div className="p-4 md:p-6 max-w-[1400px] w-full mx-auto flex flex-col gap-5">
        {/* Header Bar */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
                <Layers className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-extrabold tracking-tight text-gray-950">
                pgvector Multimodal Similarity &amp; Precedent Retrieval Studio
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                512-d CLIP HNSW
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Matches botanical pathology photography against verified historical diagnoses using cosine distance (<code>&lt;=&gt;</code>) to retrieve explainable cure outcomes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200/80 font-bold">
              Autonomous Trigger: &tau; &ge; 0.82
            </span>
          </div>
        </div>

        {/* 2-Column Studio Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-start">
          {/* Left Column: Query Specimen Ingestion (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <span className="font-bold text-xs uppercase tracking-wider text-gray-500">Incoming Field Specimen</span>
                <span className="text-xs font-mono text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded font-semibold border border-emerald-200">
                  Target: Tree #1084
                </span>
              </div>

              {/* Photo Selector */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">Select Pathology Capture:</label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => {
                      setSelectedPhoto("/specimen_leaf.jpg");
                      setOrgan("leaf");
                    }}
                    className={`relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                      selectedPhoto === "/specimen_leaf.jpg"
                        ? "border-emerald-700 ring-2 ring-emerald-700/20 shadow-sm"
                        : "border-gray-200 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src="/specimen_leaf.jpg" alt="Leaf necrosis" className="w-full h-28 object-cover" />
                    <div className="p-2.5 bg-white text-xs sm:text-sm font-semibold text-gray-900 flex justify-between items-center">
                      <span>Necrotic Foliage</span>
                      <span className="text-xs font-mono text-emerald-800">Organ: Leaf</span>
                    </div>
                  </div>

                  <div
                    onClick={() => {
                      setSelectedPhoto("/specimen_trunk.jpg");
                      setOrgan("bark");
                    }}
                    className={`relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                      selectedPhoto === "/specimen_trunk.jpg"
                        ? "border-emerald-700 ring-2 ring-emerald-700/20 shadow-sm"
                        : "border-gray-200 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src="/specimen_trunk.jpg" alt="Trunk bark rot" className="w-full h-28 object-cover" />
                    <div className="p-2.5 bg-white text-xs sm:text-sm font-semibold text-gray-900 flex justify-between items-center">
                      <span>Basidiocarp Conk</span>
                      <span className="text-xs font-mono text-emerald-800">Organ: Bark</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vector Embedding Preview Box */}
              <div className="p-3.5 bg-gray-50 border border-gray-200/90 rounded-xl font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-gray-600 text-xs font-medium">
                  <span>CLIP ViT-B/32 Vector Embedding</span>
                  <span className="text-emerald-800 font-bold">512-dim Float32</span>
                </div>
                <div className="bg-white p-2.5 rounded border border-gray-200 text-xs text-gray-800 leading-relaxed overflow-x-auto">
                  [ 0.04218, -0.19821, 0.08912, 0.31204, -0.05412, 0.18742, -0.24150, 0.00941, ... +504 dims ]
                </div>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Unit Normalized: ||v|| = 1.0</span>
                  <span className="text-emerald-800 font-bold">L2 Metric Ready</span>
                </div>
              </div>

              {/* Autonomous Escalation Status */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs sm:text-sm font-semibold text-emerald-950">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                  <span>Database Outbreak Trigger Active</span>
                </div>
                <span className="font-mono text-xs text-emerald-800 font-bold">&tau;=0.82</span>
              </div>
            </div>
          </div>

          {/* Right Column: Precedent Retrieval Matches (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-xs flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-800" />
                    <h3 className="font-bold text-sm text-gray-950">Explainable Precedent Matches (pgvector HNSW)</h3>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400">Index Scan Time: 6.84ms</span>
                </div>

                {/* Retrieved Case Cards */}
                <div className="space-y-4">
                  {precedents.length > 0 ? (
                    precedents.slice(0, 3).map((prec) => (
                      <PrecedentMatchCard
                        key={prec.image_id}
                        precedent={prec}
                        queryImageUrl={selectedPhoto}
                      />
                    ))
                  ) : (
                    (similarityResults || []).map((match, idx) => {
                      const isTop1 = idx === 0;
                      return (
                        <div
                          key={match.rank}
                          className={`p-4 rounded-xl border transition-all ${
                            isTop1
                              ? "bg-emerald-50/40 border-emerald-300 shadow-xs"
                              : "bg-white border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2.5">
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono ${
                                isTop1 ? "bg-emerald-800 text-white" : "bg-gray-100 text-gray-700"
                              }`}>
                                #{match.rank}
                              </span>
                              <div>
                                <h4 className="font-bold text-sm text-gray-900 leading-tight">
                                  {match.disease_name}
                                </h4>
                                <span className="text-[10px] font-mono text-gray-500 italic">
                                  {match.pathogen}
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-base font-extrabold font-mono text-emerald-800">
                                {(match.similarity_score * 100).toFixed(1)}%
                              </div>
                              <span className="text-[9px] font-mono text-gray-400 block">
                                Cosine Dist: {match.cosine_distance}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono my-2.5">
                            <div className="p-2 bg-white rounded border border-gray-200/80">
                              <span className="text-gray-400 block text-[9px]">Matched Precedent Tree</span>
                              <strong className="text-gray-900">{match.precedent_tree_tag}</strong>
                            </div>
                            <div className="p-2 bg-white rounded border border-gray-200/80">
                              <span className="text-gray-400 block text-[9px]">Clinical Outcome</span>
                              <span className="text-emerald-800 font-bold">{match.outcome_status} ({match.cure_rate} Cure)</span>
                            </div>
                          </div>

                          <div className="text-xs text-gray-700 bg-gray-50/80 p-2.5 rounded-lg border border-gray-100 flex items-center justify-between">
                            <span>
                              <strong className="text-gray-900">Verified Protocol:</strong> {match.recommended_protocol}
                            </span>
                            <span className="font-mono text-gray-500 text-[11px] font-semibold">{match.estimated_cost}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Bottom SQL Query Preview */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] font-mono text-gray-500">
                <span>SQL: <code>ORDER BY image_embedding &lt;=&gt; $query_vector LIMIT 4</code></span>
                <span className="text-emerald-800 font-semibold">Speedup: 274x vs SeqScan</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

