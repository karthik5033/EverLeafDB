"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import {
  User,
  ShieldCheck,
  Key,
  Lock,
  ArrowRight,
  CheckCircle2,
  Trees,
  Terminal,
  Sparkles
} from "lucide-react";
import Link from "next/link";

interface AccountProfile {
  id: string;
  role: "FIELD_INSPECTOR" | "MUNICIPAL_SUPERVISOR" | "CHIEF_FORESTER";
  name: string;
  title: string;
  wardScope: string;
  jwtClaim: Record<string, string>;
}

const PROFILES: AccountProfile[] = [
  {
    id: "inspector_04",
    role: "FIELD_INSPECTOR",
    name: "Vikram Mehta",
    title: "Field Inspector (Ward 03 Cubbon Park)",
    wardScope: "Ward 03 Only (RLS Isolated)",
    jwtClaim: {
      sub: "inspector_04",
      role: "FIELD_INSPECTOR",
      ward_id: "ward_03",
      tenant_isolation: "STRICT_RLS"
    }
  },
  {
    id: "supervisor_rajesh",
    role: "MUNICIPAL_SUPERVISOR",
    name: "Dr. Rajesh Kumar",
    title: "Municipal Triage Supervisor",
    wardScope: "All 198 Metropolitan Wards",
    jwtClaim: {
      sub: "supervisor_rajesh",
      role: "MUNICIPAL_SUPERVISOR",
      ward_id: "*",
      can_dispatch_orders: "TRUE"
    }
  },
  {
    id: "dr_ramanathan",
    role: "CHIEF_FORESTER",
    name: "Dr. S. Ramanathan",
    title: "Chief Municipal Forester",
    wardScope: "State Forestry Board Authority",
    jwtClaim: {
      sub: "dr_ramanathan",
      role: "CHIEF_FORESTER",
      governance: "STATE_WIDE",
      audit_access: "FULL"
    }
  }
];

export default function LoginPage() {
  const [selectedProfile, setSelectedProfile] = useState<AccountProfile>(PROFILES[0]);
  const [sessionActive, setSessionActive] = useState(false);

  const handleSignIn = () => {
    setSessionActive(true);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-[1200px] w-full mx-auto p-4 md:p-8 flex flex-col items-center justify-center">
        <div className="max-w-2xl w-full bg-white p-6 md:p-8 rounded-2xl border border-gray-200/90 shadow-sm space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-3">
              <Trees className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-950">
              Inspector Fleet &amp; Municipal Auth Portal
            </h1>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Simulates PostgreSQL Row-Level Security (RLS) tenant isolation. Every query automatically restricts records based on cryptographic JWT session claims.
            </p>
          </div>

          {/* Profile Quick Selectors */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-gray-700 block">Select Demo Inspector / Officer Role:</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {PROFILES.map((prof) => {
                const isSelected = selectedProfile.id === prof.id;
                return (
                  <div
                    key={prof.id}
                    onClick={() => {
                      setSelectedProfile(prof);
                      setSessionActive(false);
                    }}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? "bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-300/40 shadow-xs"
                        : "bg-white border-gray-200 hover:border-gray-300 opacity-80 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 font-bold text-gray-700">
                        {prof.role === "FIELD_INSPECTOR" ? "INSPECTOR" : prof.role === "MUNICIPAL_SUPERVISOR" ? "SUPERVISOR" : "CHIEF"}
                      </span>
                      {isSelected && <span className="w-2 h-2 rounded-full bg-emerald-600"></span>}
                    </div>
                    <div className="font-bold text-xs text-gray-950 mt-1">{prof.name}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{prof.wardScope}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Session & RLS Token Preview */}
          <div className="p-4 bg-gray-50 border border-gray-200/90 rounded-xl space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between text-gray-500 text-[10px]">
              <span className="flex items-center gap-1.5 font-bold text-gray-800">
                <Lock className="w-3.5 h-3.5 text-emerald-700" />
                Simulated JWT Session Token
              </span>
              <span className="text-emerald-800 font-bold">HMAC-SHA256</span>
            </div>

            <pre className="p-3 bg-white border border-gray-200 rounded-lg text-[10px] text-gray-800 leading-relaxed overflow-x-auto">
              {JSON.stringify(selectedProfile.jwtClaim, null, 2)}
            </pre>

            <div className="text-[10px] text-gray-500 leading-relaxed">
              <strong className="text-gray-900">Enforced Database Policy:</strong>
              <div className="mt-1 p-2 bg-emerald-50 text-emerald-950 rounded border border-emerald-200/80">
                CREATE POLICY tree_ward_isolation_policy ON trees FOR ALL TO inspector_role USING (ward_id = current_setting(&apos;jwt.claims.ward_id&apos;));
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div>
            {!sessionActive ? (
              <button
                onClick={handleSignIn}
                className="w-full py-2.5 bg-[#111111] hover:bg-black text-white text-xs font-semibold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all"
              >
                Sign In as {selectedProfile.name} <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="space-y-3 animate-in fade-in">
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center justify-between text-xs text-emerald-950">
                  <div className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    Session Active: Authenticated as {selectedProfile.id}
                  </div>
                  <span className="font-mono text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-bold">
                    RLS Isolated
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/map"
                    className="p-2.5 bg-white border border-gray-200 hover:border-emerald-300 rounded-lg text-center text-xs font-semibold text-gray-900 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    Open Spatial Map
                  </Link>
                  <Link
                    href="/console"
                    className="p-2.5 bg-black text-white hover:bg-gray-800 rounded-lg text-center text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    Open SQL Console <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

