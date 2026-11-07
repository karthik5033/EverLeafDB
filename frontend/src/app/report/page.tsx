"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  MapPin,
  Camera,
  CheckCircle2,
  Clock,
  Compass,
  Send,
  Search,
  ShieldAlert,
  ArrowRight,
  Copy,
  Info,
  Sparkles,
  ExternalLink,
  Layers,
  UserCheck
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  CitizenHazardCategory,
  CitizenUrgencyLevel,
  CitizenReport,
  assignWardBySpatialLocation
} from "@/lib/citizen-reporting";

const HAZARD_CATEGORIES: { id: CitizenHazardCategory; label: string; desc: string }[] = [
  { id: "FALLING_BRANCH", label: "Falling / Hanging Bough", desc: "Heavy broken branch dangling precariously over road or pathway." },
  { id: "TRUNK_DECAY_FUNGUS", label: "Trunk Decay / Basal Fungus", desc: "Bracket fungus conks, hollow cavities, or structural stem softening." },
  { id: "ROOT_EXCAVATION_DAMAGE", label: "Root Severance / Heaving", desc: "Utility trenching root damage or sidewalk buckling causing root instability." },
  { id: "PEST_INFESTATION", label: "Borer Pest Infestation", desc: "Frass accumulation, sawdust galleries, or active beetle emergence holes." },
  { id: "OVERHANGING_POWERLINE", label: "Overhanging Powerlines", desc: "Live high-voltage electric distribution line touching tree limbs." },
  { id: "DEAD_TREE_HAZARD", label: "Standing Dead Tree Hazard", desc: "Completely desiccant or severely leaning tree with imminent collapse hazard." },
  { id: "OTHER", label: "Other Community Hazard", desc: "General pathological decline or municipal obstruction." }
];

const WARD_PRESETS = [
  { label: "Central (Cubbon Park)", lat: 12.9735, lng: 77.6015 },
  { label: "Lalbagh Botanical", lat: 12.9512, lng: 77.5845 },
  { label: "Indiranagar (12th Main)", lat: 12.9782, lng: 77.6385 },
  { label: "Koramangala (80 Feet Rd)", lat: 12.9348, lng: 77.6212 },
  { label: "Jayanagar 4th Block", lat: 12.9298, lng: 77.5828 }
];

const SAMPLE_PHOTO_PRESETS = [
  {
    label: "Branch Breakage",
    url: "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=600&q=80"
  },
  {
    label: "Basal Fungus",
    url: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80"
  },
  {
    label: "Powerline Contact",
    url: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80"
  },
  {
    label: "Dead Standing Tree",
    url: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=600&q=80"
  }
];

export default function CitizenReportingPage() {
  const [activeTab, setActiveTab] = useState<"submit" | "triage">("submit");

  // Form State
  const [reporterName, setReporterName] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [latitude, setLatitude] = useState(12.9735);
  const [longitude, setLongitude] = useState(77.6015);
  const [addressLandmark, setAddressLandmark] = useState("");
  const [hazardCategory, setHazardCategory] = useState<CitizenHazardCategory>("FALLING_BRANCH");
  const [urgencyLevel, setUrgencyLevel] = useState<CitizenUrgencyLevel>("MODERATE");
  const [description, setDescription] = useState("");
  const [photoUrl, setPhotoUrl] = useState(SAMPLE_PHOTO_PRESETS[0].url);

  // Geo status
  const [isLocating, setIsLocating] = useState(false);
  const [assignedWard, setAssignedWard] = useState<{ ward_id: number; ward_name: string; ward_zone: string }>({
    ward_id: 1,
    ward_name: "Central Business District",
    ward_zone: "Central"
  });

  // Submission result
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReport, setSubmittedReport] = useState<CitizenReport | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Supervisor triage queue state
  const [triageReports, setTriageReports] = useState<CitizenReport[]>([]);
  const [isLoadingTriage, setIsLoadingTriage] = useState(false);
  const [triageFilterStatus, setTriageFilterStatus] = useState("ALL");
  const [actioningId, setActioningId] = useState<string | null>(null);

  // Recalculate spatial ward assignment whenever coordinates change
  useEffect(() => {
    if (!isNaN(latitude) && !isNaN(longitude)) {
      const ward = assignWardBySpatialLocation(latitude, longitude);
      setAssignedWard(ward);
    }
  }, [latitude, longitude]);

  // Load triage reports
  const fetchTriageReports = async () => {
    setIsLoadingTriage(true);
    try {
      const res = await fetch(`/api/reports${triageFilterStatus !== "ALL" ? `?status=${triageFilterStatus}` : ""}`);
      const data = await res.json();
      if (data.success && data.reports) {
        setTriageReports(data.reports);
      }
    } catch (err) {
      console.error("Failed to load triage reports", err);
    } finally {
      setIsLoadingTriage(false);
    }
  };

  useEffect(() => {
    if (activeTab === "triage") {
      fetchTriageReports();
    }
  }, [activeTab, triageFilterStatus]);

  // Geolocation trigger
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(Number(pos.coords.latitude.toFixed(6)));
        setLongitude(Number(pos.coords.longitude.toFixed(6)));
        setIsLocating(false);
      },
      (err) => {
        console.warn("Geo error:", err);
        // Fallback to Central Bangalore
        setLatitude(12.9716);
        setLongitude(77.5946);
        setIsLocating(false);
      },
      { timeout: 8000 }
    );
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!addressLandmark.trim()) {
      setErrorMessage("Please specify a nearby street address or landmark.");
      return;
    }
    if (description.trim().length < 10) {
      setErrorMessage("Please provide a description of at least 10 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reporter_name: reporterName || "Anonymous Citizen",
          reporter_phone: reporterPhone || undefined,
          reporter_email: reporterEmail || undefined,
          latitude,
          longitude,
          address_landmark: addressLandmark,
          hazard_category: hazardCategory,
          urgency_level: urgencyLevel,
          description,
          photo_url: photoUrl
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit report.");
      }

      setSubmittedReport(data.report);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (!submittedReport) return;
    navigator.clipboard.writeText(submittedReport.tracking_code);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  // Quick triage status update
  const handleUpdateStatus = async (reportId: string, newStatus: string) => {
    setActioningId(reportId);
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          supervisor_notes: `Status transitioned to ${newStatus} by Municipal Tree Supervisor on ${new Date().toLocaleDateString()}`
        })
      });
      if (res.ok) {
        await fetchTriageReports();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-300 font-mono text-xs">
              MUNICIPAL CIVIC INTERFACE • PHASE 27
            </Badge>
            <Badge variant="outline" className="text-slate-600 bg-slate-50 border-slate-300 font-mono text-xs">
              PostGIS ST_Contains Auto-Ward
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Citizen Tree Hazard Reporting
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Community reporting channel for fallen boughs, diseased heritage trees, and powerline hazards. 
            All reports are automatically spatially routed to the designated municipal ward.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/report/track">
            <Button variant="outline" className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-50">
              <Search className="w-4 h-4 text-emerald-600" />
              Track Existing Report
            </Button>
          </Link>
          <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-100">
            <button
              onClick={() => setActiveTab("submit")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === "submit"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Submit Report
            </button>
            <button
              onClick={() => setActiveTab("triage")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === "triage"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Supervisor Queue
            </button>
          </div>
        </div>
      </div>

      {/* SUBMISSION TAB */}
      {activeTab === "submit" && (
        <>
          {submittedReport ? (
            /* Success Confirmation Card */
            <Card className="border-emerald-300 bg-emerald-50/50 shadow-md">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <CardTitle className="text-2xl text-emerald-950">Report Successfully Submitted!</CardTitle>
                <CardDescription className="text-emerald-800 text-sm">
                  Your hazard report has been logged and assigned to municipal field operations.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 max-w-xl mx-auto">
                <div className="p-4 bg-white rounded-xl border border-emerald-200 text-center shadow-sm">
                  <span className="text-xs uppercase font-semibold text-slate-500 tracking-wider">
                    Your Municipal Tracking Code
                  </span>
                  <div className="flex items-center justify-center gap-3 mt-1 mb-2">
                    <span className="text-3xl font-mono font-bold text-slate-900 tracking-wider">
                      {submittedReport.tracking_code}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyCode}
                      className="border-slate-300 text-slate-700 gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      {copySuccess ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Save this code to check resolution progress, inspector notes, and crew dispatch status.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">Assigned Ward:</span>
                    <span className="font-semibold text-slate-900 mt-0.5 block">
                      Ward {submittedReport.ward_id} • {submittedReport.ward_name}
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">Urgency Status:</span>
                    <span className="font-semibold text-slate-900 mt-0.5 block">
                      {submittedReport.urgency_level} Priority
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Link href={`/report/track?code=${submittedReport.tracking_code}`} className="flex-1">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                      <Search className="w-4 h-4" />
                      Track This Report Live
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSubmittedReport(null);
                      setDescription("");
                      setAddressLandmark("");
                    }}
                    className="border-slate-300 text-slate-700"
                  >
                    Submit Another Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Citizen Submission Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMessage && (
                <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Spatial Location Card */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
                        <MapPin className="w-5 h-5 text-emerald-600" />
                        1. Hazard Location & Spatial Ward Routing
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500">
                        Coordinates are analyzed via PostGIS ST_Contains to route directly to the local ward office.
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-800 font-mono text-xs">
                      Ward {assignedWard.ward_id}: {assignedWard.ward_name} ({assignedWard.ward_zone})
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Quick Preset Buttons */}
                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1.5">
                      Quick Bangalore Coordinate Presets:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {WARD_PRESETS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            setLatitude(preset.lat);
                            setLongitude(preset.lng);
                            setAddressLandmark(preset.label);
                          }}
                          className={`px-2.5 py-1 text-xs rounded-md border transition-all ${
                            latitude === preset.lat && longitude === preset.lng
                              ? "bg-emerald-600 text-white border-emerald-600 font-medium shadow-sm"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleDetectLocation}
                        disabled={isLocating}
                        className="text-xs h-7 gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                      >
                        <Compass className={`w-3.5 h-3.5 ${isLocating ? "animate-spin" : ""}`} />
                        {isLocating ? "Detecting GPS..." : "Detect Current GPS"}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-medium text-slate-700 block mb-1">
                        Latitude (EPSG:4326)
                      </label>
                      <Input
                        type="number"
                        step="0.0001"
                        value={latitude}
                        onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                        required
                        className="font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700 block mb-1">
                        Longitude (EPSG:4326)
                      </label>
                      <Input
                        type="number"
                        step="0.0001"
                        value={longitude}
                        onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                        required
                        className="font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700 block mb-1">
                        Nearest Street Address / Landmark *
                      </label>
                      <Input
                        placeholder="e.g., Near Metro Pillar 142, CMH Road"
                        value={addressLandmark}
                        onChange={(e) => setAddressLandmark(e.target.value)}
                        required
                        className="text-sm"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Hazard Classification Card */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    2. Hazard Type & Severity Assessment
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Select the physiological or structural threat observed to trigger appropriate inspection protocol.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {HAZARD_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setHazardCategory(cat.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          hazardCategory === cat.id
                            ? "border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-500"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="font-semibold text-xs text-slate-900 mb-1 flex items-center justify-between">
                          <span>{cat.label}</span>
                          {hazardCategory === cat.id && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">{cat.desc}</p>
                      </button>
                    ))}
                  </div>

                  {/* Urgency Selector */}
                  <div className="pt-2">
                    <label className="text-xs font-medium text-slate-700 block mb-1.5">
                      Estimated Urgency Level:
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {(["LOW", "MODERATE", "HIGH", "EMERGENCY"] as CitizenUrgencyLevel[]).map((level) => {
                        const colors: Record<CitizenUrgencyLevel, string> = {
                          LOW: "hover:border-slate-400 text-slate-700",
                          MODERATE: "hover:border-amber-400 text-amber-800",
                          HIGH: "hover:border-orange-500 text-orange-800",
                          EMERGENCY: "hover:border-red-600 text-red-800"
                        };
                        const activeColors: Record<CitizenUrgencyLevel, string> = {
                          LOW: "bg-slate-100 border-slate-500 text-slate-900 ring-1 ring-slate-500",
                          MODERATE: "bg-amber-50 border-amber-500 text-amber-900 ring-1 ring-amber-500",
                          HIGH: "bg-orange-50 border-orange-500 text-orange-900 ring-1 ring-orange-500",
                          EMERGENCY: "bg-red-50 border-red-600 text-red-900 ring-1 ring-red-600 font-bold"
                        };
                        return (
                          <button
                            key={level}
                            type="button"
                            onClick={() => setUrgencyLevel(level)}
                            className={`py-2 px-3 text-xs rounded-lg border text-center transition-all ${
                              urgencyLevel === level ? activeColors[level] : `bg-white border-slate-200 ${colors[level]}`
                            }`}
                          >
                            {level}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1">
                      Detailed Observation Description *
                    </label>
                    <Textarea
                      rows={3}
                      placeholder="Describe the visible damage, proximity to vehicles or powerlines, tree species if known, and any immediate threats..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      className="text-sm"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Photo Evidence & Presets */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
                    <Camera className="w-5 h-5 text-slate-600" />
                    3. Visual Photographic Evidence
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Photographic documentation facilitates rapid supervisor verification and visual similarity query matching.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1.5">
                      Select Sample Evidence Image:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {SAMPLE_PHOTO_PRESETS.map((preset) => (
                        <div
                          key={preset.label}
                          onClick={() => setPhotoUrl(preset.url)}
                          className={`group cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${
                            photoUrl === preset.url
                              ? "border-emerald-600 ring-2 ring-emerald-200"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.label}
                            className="w-full h-24 object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="p-1.5 bg-white text-center">
                            <span className="text-[11px] font-medium text-slate-700 truncate block">
                              {preset.label}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1">
                      Or Paste Direct Image URL:
                    </label>
                    <Input
                      type="url"
                      placeholder="https://..."
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      className="text-sm font-mono"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Citizen Contact Info */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
                    <UserCheck className="w-5 h-5 text-slate-600" />
                    4. Reporter Contact Information (Optional)
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Your contact information will only be used to send dispatch and resolution SMS notifications.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-medium text-slate-700 block mb-1">
                        Full Name
                      </label>
                      <Input
                        placeholder="e.g. Ramesh Kumar"
                        value={reporterName}
                        onChange={(e) => setReporterName(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700 block mb-1">
                        Mobile Phone Number
                      </label>
                      <Input
                        placeholder="+91-9876543210"
                        value={reporterPhone}
                        onChange={(e) => setReporterPhone(e.target.value)}
                        className="text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700 block mb-1">
                        Email Address
                      </label>
                      <Input
                        type="email"
                        placeholder="citizen@example.com"
                        value={reporterEmail}
                        onChange={(e) => setReporterEmail(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Action */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Link href="/report/track">
                  <Button variant="ghost" type="button" className="text-slate-600">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 gap-2 shadow-sm font-medium"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? "Routing Report..." : "Submit Hazard Report"}
                </Button>
              </div>
            </form>
          )}
        </>
      )}

      {/* SUPERVISOR TRIAGE TAB */}
      {activeTab === "triage" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Municipal Tree Supervisor Citizen Hazard Queue
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review community hazard reports, verify photographic evidence, and dispatch field crews.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Filter Status:</span>
              <Select value={triageFilterStatus} onValueChange={setTriageFilterStatus}>
                <SelectTrigger className="w-40 h-8 text-xs bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Reports</SelectItem>
                  <SelectItem value="PENDING_TRIAGE">Pending Triage</SelectItem>
                  <SelectItem value="INVESTIGATING">Investigating</SelectItem>
                  <SelectItem value="ACTIONED">Actioned</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={fetchTriageReports} className="h-8 text-xs border-slate-300">
                Refresh
              </Button>
            </div>
          </div>

          {isLoadingTriage ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              Loading incoming citizen reports...
            </div>
          ) : triageReports.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              No reports found for the selected filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {triageReports.map((report) => {
                const urgencyBadgeColor: Record<CitizenUrgencyLevel, string> = {
                  EMERGENCY: "bg-red-100 text-red-800 border-red-300 font-bold",
                  HIGH: "bg-orange-100 text-orange-800 border-orange-300",
                  MODERATE: "bg-amber-100 text-amber-800 border-amber-300",
                  LOW: "bg-slate-100 text-slate-700 border-slate-300"
                };

                const statusBadgeColor: Record<string, string> = {
                  PENDING_TRIAGE: "bg-amber-50 text-amber-800 border-amber-200",
                  INVESTIGATING: "bg-blue-50 text-blue-800 border-blue-200",
                  ACTIONED: "bg-purple-50 text-purple-800 border-purple-200",
                  RESOLVED: "bg-emerald-50 text-emerald-800 border-emerald-200",
                  DISMISSED: "bg-slate-50 text-slate-600 border-slate-200"
                };

                return (
                  <Card key={report.report_id} className="border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 flex flex-col md:flex-row gap-4">
                      {/* Photo Thumbnail */}
                      {report.photo_url && (
                        <div className="w-full md:w-36 h-28 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                          <img
                            src={report.photo_url}
                            alt="Hazard Evidence"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-slate-900">
                              {report.tracking_code}
                            </span>
                            <Badge variant="outline" className={urgencyBadgeColor[report.urgency_level]}>
                              {report.urgency_level}
                            </Badge>
                            <Badge variant="outline" className={statusBadgeColor[report.status]}>
                              {report.status.replace("_", " ")}
                            </Badge>
                            {report.is_sla_breached && (
                              <Badge className="bg-red-600 text-white font-mono text-[10px]">
                                SLA BREACHED (&gt;24H)
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 font-mono">
                            {new Date(report.created_at).toLocaleString()}
                          </span>
                        </div>

                        <div className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Ward {report.ward_id} ({report.ward_name})</span>
                          <span className="text-slate-300">•</span>
                          <span>{report.address_landmark}</span>
                        </div>

                        <p className="text-xs text-slate-800 line-clamp-2">
                          {report.description}
                        </p>

                        {report.supervisor_notes && (
                          <div className="p-2 bg-slate-50 rounded text-[11px] text-slate-600 border border-slate-200">
                            <span className="font-semibold text-slate-800">Supervisor Note: </span>
                            {report.supervisor_notes}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                          <span className="text-[11px] text-slate-500">
                            Reported by: <strong className="text-slate-700">{report.reporter_name}</strong>
                            {report.reporter_phone && ` (${report.reporter_phone})`}
                          </span>

                          {/* Quick Action Buttons for Supervisor */}
                          <div className="flex items-center gap-1.5">
                            {report.status === "PENDING_TRIAGE" && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={actioningId === report.report_id}
                                onClick={() => handleUpdateStatus(report.report_id, "INVESTIGATING")}
                                className="h-7 text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                              >
                                Dispatch Field Inspector
                              </Button>
                            )}
                            {report.status === "INVESTIGATING" && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={actioningId === report.report_id}
                                onClick={() => handleUpdateStatus(report.report_id, "ACTIONED")}
                                className="h-7 text-xs border-purple-300 text-purple-700 hover:bg-purple-50"
                              >
                                Issue Work Order
                              </Button>
                            )}
                            {report.status !== "RESOLVED" && report.status !== "DISMISSED" && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={actioningId === report.report_id}
                                onClick={() => handleUpdateStatus(report.report_id, "RESOLVED")}
                                className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                              >
                                Mark Resolved
                              </Button>
                            )}
                            <Link href={`/report/track?code=${report.tracking_code}`}>
                              <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-600 gap-1">
                                View Stepper <ArrowRight className="w-3 h-3" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
