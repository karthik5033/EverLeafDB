"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";
import { SPECIES_SEED, WARDS, Ward } from "@/lib/db";
import CoordinatePicker from "@/components/CoordinatePicker";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Trees,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Database,
  Terminal,
  Calendar,
  Ruler
} from "lucide-react";

export default function NewTreeRegistrationPage() {
  const router = useRouter();
  const [speciesId, setSpeciesId] = useState(1);
  const [heightM, setHeightM] = useState(12.5);
  const [dbhCm, setDbhCm] = useState(45.0);
  const [healthStatus, setHealthStatus] = useState("HEALTHY");
  const [plantedDate, setPlantedDate] = useState("2018-06-15");
  const [coords, setCoords] = useState<{ latitude: number; longitude: number; detectedWard: Ward }>({
    latitude: 12.9716,
    longitude: 77.5946,
    detectedWard: WARDS[2]
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const selectedSpecies = SPECIES_SEED.find((s) => s.species_id === speciesId) || SPECIES_SEED[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/trees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          species_id: speciesId,
          species_common: selectedSpecies.common_name,
          species_scientific: selectedSpecies.scientific_name,
          latitude: coords.latitude,
          longitude: coords.longitude,
          ward_id: coords.detectedWard.ward_id,
          height_m: heightM,
          dbh_cm: dbhCm,
          health_status: healthStatus,
          condition_score: healthStatus === "CRITICAL" ? 1 : healthStatus === "DISEASED" ? 2 : healthStatus === "MONITOR" ? 3 : 5
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to register tree");
      }

      setSuccessMsg(`Tree ${data.tree?.tag_number || "registered"} persisted under ST_Point geometry!`);
      setTimeout(() => {
        router.push("/trees");
      }, 1400);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-mono text-emerald-800 mb-2">
              <Trees className="w-3.5 h-3.5" />
              <span>Phase 8: Tree Lifecycle Registry</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
              Register Botanical Specimen
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Catalog an urban tree with dendrometric measurements and PostGIS <code className="font-mono text-emerald-800">ST_Point</code> coordinate georeferencing.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-sm flex items-center gap-3 font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Fields (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card 1: Botanical Taxon */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">1. Botanical Taxonomy</CardTitle>
                <CardDescription>Select verified species from 25 cataloged urban taxa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Species Selection
                  </label>
                  <select
                    value={speciesId}
                    onChange={(e) => setSpeciesId(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-xl p-3 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
                  >
                    {SPECIES_SEED.map((s) => (
                      <option key={s.species_id} value={s.species_id}>
                        {s.common_name} — {s.scientific_name} ({s.growth_rate} growth)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3 bg-muted/40 rounded-xl border border-border flex items-center justify-between text-xs">
                  <div>
                    <span className="text-muted-foreground">Lifespan Expectancy: </span>
                    <span className="font-bold text-foreground">{selectedSpecies.typical_lifespan_years} years</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Foliage Classification: </span>
                    <span className="font-bold text-foreground">{selectedSpecies.foliage_type}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Dendrometrics & Health */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">2. Dendrometric Vital Stats</CardTitle>
                <CardDescription>Physical canopy dimensions and initial health assessment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 flex items-center justify-between">
                      <span>Height (Meters)</span>
                      <span className="font-mono text-emerald-800 font-bold">{heightM}m</span>
                    </label>
                    <Input
                      type="number"
                      step="0.5"
                      min="1"
                      max="80"
                      value={heightM}
                      onChange={(e) => setHeightM(parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 flex items-center justify-between">
                      <span>DBH / Girth (cm)</span>
                      <span className="font-mono text-emerald-800 font-bold">{dbhCm}cm</span>
                    </label>
                    <Input
                      type="number"
                      step="1"
                      min="5"
                      max="1500"
                      value={dbhCm}
                      onChange={(e) => setDbhCm(parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      Health Status Classification
                    </label>
                    <select
                      value={healthStatus}
                      onChange={(e) => setHealthStatus(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl p-2.5 text-sm font-semibold focus:outline-hidden"
                    >
                      <option value="HEALTHY">HEALTHY (Optimal Vigour)</option>
                      <option value="MONITOR">MONITOR (Minor Chlorosis)</option>
                      <option value="DISEASED">DISEASED (Active Symptoms)</option>
                      <option value="CRITICAL">CRITICAL (Failure Hazard)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      Estimated Planting Date
                    </label>
                    <Input
                      type="date"
                      value={plantedDate}
                      onChange={(e) => setPlantedDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Spatial Coordinate Picker */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">3. Geospatial Location Picker</CardTitle>
                <CardDescription>
                  Drop coordinates on the map or click presets; PostGIS <code className="font-mono text-emerald-800">ST_Contains()</code> will detect the ward.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CoordinatePicker
                  initialLat={coords.latitude}
                  initialLng={coords.longitude}
                  onCoordinatesChange={setCoords}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar: SQL Live Preview & Actions */}
          <div className="space-y-6">
            <Card className="border-emerald-200/80 bg-emerald-50/20">
              <CardHeader>
                <CardTitle className="text-sm font-mono flex items-center gap-2 text-emerald-950">
                  <Database className="w-4 h-4 text-emerald-700" />
                  <span>DDL Query Execution Plan</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 font-mono text-xs">
                <div className="p-3 bg-gray-950 text-emerald-300 rounded-xl overflow-x-auto text-[11px] leading-relaxed shadow-inner">
                  <span className="text-purple-400">INSERT INTO</span> trees (<br/>
                  &nbsp;&nbsp;species_id, ward_id, location_geom,<br/>
                  &nbsp;&nbsp;height_meters, girth_cm, health_status<br/>
                  )<br/>
                  <span className="text-purple-400">VALUES</span> (<br/>
                  &nbsp;&nbsp;{speciesId}, <span className="text-amber-300">&apos;{coords.detectedWard.ward_id}&apos;</span>,<br/>
                  &nbsp;&nbsp;<span className="text-emerald-400">ST_SetSRID</span>(<br/>
                  &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-emerald-400">ST_Point</span>({coords.longitude.toFixed(4)}, {coords.latitude.toFixed(4)}),<br/>
                  &nbsp;&nbsp;&nbsp;&nbsp;4326<br/>
                  &nbsp;&nbsp;),<br/>
                  &nbsp;&nbsp;{heightM}, {dbhCm}, <span className="text-amber-300">&apos;{healthStatus.toLowerCase()}&apos;</span><br/>
                  );
                </div>

                <div className="space-y-1.5 pt-2 text-[11px] text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Target Ward:</span>
                    <span className="font-bold text-foreground">{coords.detectedWard.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Index Accelerated:</span>
                    <span className="text-emerald-800 font-bold">GiST R-Tree</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Constraint Check:</span>
                    <span className="text-emerald-800 font-bold">chk_tree_within_ward</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-bold h-11"
                >
                  {loading ? "Persisting to PostgreSQL..." : "Commit Tree to Database"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="w-full"
                >
                  Cancel
                </Button>
              </CardFooter>
            </Card>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}
