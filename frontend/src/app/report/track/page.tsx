"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MapPin,
  Camera,
  ArrowLeft,
  ShieldCheck,
  Wrench,
  Stethoscope,
  Info
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CitizenReport } from "@/lib/citizen-reporting";
import { DashboardShell } from "@/components/DashboardShell";

const SAMPLE_TRACKING_CODES = [
  "CR-2025-7841",
  "CR-2025-9214",
  "CR-2025-4502",
  "CR-2025-1108"
];

function ReportTrackerContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get("code") || "";

  const [inputCode, setInputCode] = useState(initialCode);
  const [report, setReport] = useState<CitizenReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchReport = async (code: string) => {
    if (!code.trim()) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/reports?code=${encodeURIComponent(code.trim())}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setReport(null);
        setErrorMessage(data.error || "Report not found. Please double-check your tracking code.");
      } else {
        setReport(data.report);
      }
    } catch (err: any) {
      setReport(null);
      setErrorMessage(err.message || "Failed to retrieve tracking data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialCode) {
      setInputCode(initialCode);
      fetchReport(initialCode);
    }
  }, [initialCode]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReport(inputCode);
  };

  // Determine active step index: 0 = PENDING_TRIAGE, 1 = INVESTIGATING, 2 = ACTIONED, 3 = RESOLVED
  const getStepIndex = (status?: string): number => {
    switch (status) {
      case "PENDING_TRIAGE":
        return 0;
      case "INVESTIGATING":
        return 1;
      case "ACTIONED":
        return 2;
      case "RESOLVED":
        return 3;
      case "DISMISSED":
        return 3;
      default:
        return 0;
    }
  };

  const steps = [
    {
      title: "Received & Logged",
      desc: "Hazard logged into PostGIS staging queue",
      icon: Clock
    },
    {
      title: "Field Inspector Dispatched",
      desc: "Clinical on-site hazard verification",
      icon: Stethoscope
    },
    {
      title: "Work Order Actioned",
      desc: "Municipal tree crew dispatched",
      icon: Wrench
    },
    {
      title: "Hazard Remediated",
      desc: "Resolved and public safety secured",
      icon: ShieldCheck
    }
  ];

  const currentStep = report ? getStepIndex(report.status) : -1;

  return (
    <DashboardShell>
      <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/report" className="text-xs text-slate-500 hover:text-emerald-700 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Reporting Portal
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Hazard Report Status Tracker
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Check the real-time operational status, inspector dispatch updates, and remediation timeline.
          </p>
        </div>
      </div>

      {/* Search Input Card */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <Input
                placeholder="Enter municipal tracking code (e.g. CR-2025-7841)"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                className="pl-9 font-mono text-sm tracking-wider uppercase"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-medium"
            >
              <Search className="w-4 h-4" />
              {isLoading ? "Looking up..." : "Track Hazard"}
            </Button>
          </form>

          {/* Quick preset links */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>Try sample tracking codes:</span>
            {SAMPLE_TRACKING_CODES.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => {
                  setInputCode(code);
                  fetchReport(code);
                }}
                className="font-mono text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
              >
                {code}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Error display */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Report Details and Stepper */}
      {report && (
        <div className="space-y-6">
          {/* 4-Step Progress Stepper */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/80 border-b border-slate-200 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-semibold text-slate-500">Tracking Code:</span>
                  <span className="font-mono font-bold text-base text-slate-900">{report.tracking_code}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`font-mono text-xs ${
                      report.urgency_level === "EMERGENCY"
                        ? "bg-red-50 text-red-800 border-red-300 font-bold"
                        : report.urgency_level === "HIGH"
                        ? "bg-orange-50 text-orange-800 border-orange-300"
                        : "bg-emerald-50 text-emerald-800 border-emerald-300"
                    }`}
                  >
                    {report.urgency_level} Priority
                  </Badge>
                  <Badge variant="outline" className="bg-slate-100 text-slate-800 border-slate-300 text-xs">
                    Status: {report.status.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-8 pb-8 px-4 sm:px-8">
              {/* Desktop & Mobile Stepper */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
                {steps.map((step, idx) => {
                  const Icon = step.icon;
                  const isCompleted = idx < currentStep || (idx === currentStep && report.status === "RESOLVED");
                  const isCurrent = idx === currentStep && report.status !== "RESOLVED";

                  return (
                    <div key={step.title} className="flex md:flex-col items-center md:items-center text-left md:text-center gap-3 md:gap-2">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                          isCompleted
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : isCurrent
                            ? "bg-emerald-50 border-emerald-600 text-emerald-700 ring-4 ring-emerald-100"
                            : "bg-slate-100 border-slate-300 text-slate-400"
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                      </div>
                      <div>
                        <div
                          className={`text-xs font-semibold ${
                            isCompleted || isCurrent ? "text-slate-900" : "text-slate-400"
                          }`}
                        >
                          {idx + 1}. {step.title}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                          {step.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left 2 cols: Incident Details */}
            <div className="md:col-span-2 space-y-4">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-slate-900">Incident Details & Observations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div>
                    <span className="text-slate-500 block mb-1 font-medium">Report Description:</span>
                    <p className="text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs leading-relaxed">
                      {report.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-white rounded-lg border border-slate-200">
                      <span className="text-slate-500 block">Hazard Category:</span>
                      <span className="font-semibold text-slate-900 mt-0.5 block">
                        {report.hazard_category.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-slate-200">
                      <span className="text-slate-500 block">Date Reported:</span>
                      <span className="font-semibold text-slate-900 mt-0.5 block">
                        {new Date(report.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {report.supervisor_notes && (
                    <div>
                      <span className="text-slate-500 block mb-1 font-medium">Supervisor Operational Notes:</span>
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 p-3 rounded-lg">
                        {report.supervisor_notes}
                      </div>
                    </div>
                  )}

                  {report.resolved_at && (
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>
                        Remediation completed on <strong>{new Date(report.resolved_at).toLocaleString()}</strong>.
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right 1 col: Location & Photo */}
            <div className="space-y-4">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    Spatial Ward Routing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Assigned Ward:</span>
                    <span className="font-bold text-slate-900 text-sm">
                      Ward {report.ward_id} • {report.ward_name}
                    </span>
                    <span className="text-slate-500 block text-[11px] mt-0.5">
                      Zone: {report.ward_zone}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Landmark / Street:</span>
                    <span className="font-medium text-slate-800 block mt-0.5">
                      {report.address_landmark}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Coordinates:</span>
                    <span className="font-mono text-slate-700 block mt-0.5">
                      {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}
                    </span>
                  </div>

                  {report.photo_url && (
                    <div className="pt-2">
                      <span className="text-slate-500 block mb-1.5">Submitted Photo:</span>
                      <div className="rounded-lg overflow-hidden border border-slate-200">
                        <img
                          src={report.photo_url}
                          alt="Citizen Hazard Photo"
                          className="w-full h-32 object-cover"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
      </div>
    </DashboardShell>
  );
}

export default function CitizenReportTrackPage() {
  return (
    <Suspense fallback={<div className="container max-w-4xl mx-auto py-16 text-center text-slate-500 text-sm">Loading hazard status tracker...</div>}>
      <ReportTrackerContent />
    </Suspense>
  );
}

