"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  User,
  Lock,
  Key,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Layers,
  Building2,
  TreeDeciduous,
  ArrowRight,
  RefreshCw,
  Terminal,
  Sparkles,
  Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  SystemUser,
  SessionContext,
  RlsAuthorizationDecision,
  SYSTEM_USERS
} from "@/lib/auth-rbac";
import { WARDS } from "@/lib/db";
import { DashboardShell } from "@/components/DashboardShell";

export default function LoginPage() {
  const [activeSession, setActiveSession] = useState<SessionContext | null>(null);
  const [allUsers, setAllUsers] = useState<SystemUser[]>(SYSTEM_USERS);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

  // RLS Sandbox Tester State
  const [testAction, setTestAction] = useState<"INSERT" | "SELECT" | "UPDATE">("INSERT");
  const [testResource, setTestResource] = useState<"trees" | "inspections" | "work_orders">("trees");
  const [testWard, setTestWard] = useState("ward_03");
  const [rlsDecision, setRlsDecision] = useState<RlsAuthorizationDecision | null>(null);
  const [evaluating, setEvaluating] = useState(false);

  const fetchSession = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      if (data.success) {
        setActiveSession(data.session);
        setAllUsers(data.all_users);
      }
    } catch (err) {
      console.error("Failed to fetch session:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const handleSwitchUser = async (userId: string) => {
    try {
      setSwitching(true);
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId })
      });
      const data = await res.json();
      if (data.success) {
        setActiveSession(data.session);
        // Automatically evaluate RLS for the new active user
        handleEvaluateRls(data.session.user.user_id);
      }
    } catch (err) {
      console.error("Failed to switch session:", err);
    } finally {
      setSwitching(false);
    }
  };

  const handleEvaluateRls = async (userId?: string) => {
    try {
      setEvaluating(true);
      const effectiveUserId = userId || activeSession?.user.user_id;
      const res = await fetch("/api/auth/rls-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: testAction,
          resource: testResource,
          target_ward: testWard,
          user_id: effectiveUserId
        })
      });
      const data = await res.json();
      if (data.success) {
        setRlsDecision(data.decision);
      }
    } catch (err) {
      console.error("Failed to evaluate RLS:", err);
    } finally {
      setEvaluating(false);
    }
  };

  // Run initial RLS evaluation on session load
  useEffect(() => {
    if (activeSession) {
      handleEvaluateRls();
    }
  }, [activeSession?.user.user_id, testAction, testResource, testWard]);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-700 text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded-full">
            ADMIN
          </Badge>
        );
      case "supervisor":
        return (
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800 text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded-full">
            SUPERVISOR
          </Badge>
        );
      case "field_inspector":
        return (
          <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded-full">
            INSPECTOR
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-slate-200 bg-slate-100 text-slate-700 text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded-full">
            CITIZEN
          </Badge>
        );
    }
  };

  return (
    <DashboardShell>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 pb-32">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Municipal Identity, RBAC &amp; Row-Level Security (RLS)
                </h1>
                <p className="text-sm text-slate-500">
                  Role-based access control and tenant isolation sandbox simulating PostgreSQL RLS policies across 4 municipal authorization tiers.
                </p>
              </div>
            </div>
          </div>

          {/* Status Pill */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-700">
              <Lock className="h-3.5 w-3.5 text-emerald-700" />
              <span className="font-mono text-emerald-800 font-semibold">ALTER TABLE ... ENABLE RLS</span>
              <span className="text-slate-400">|</span>
              <span>Tenant Ward Isolation</span>
            </div>
          </div>
        </div>

        {/* Active Session Identity Card */}
        {activeSession && (
          <Card className="border border-slate-200 bg-white shadow-xs rounded-2xl overflow-hidden">
            <div className="p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 font-bold text-lg shadow-2xs">
                    {activeSession.user.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-lg font-bold text-slate-900">
                        {activeSession.user.name}
                      </h2>
                      {getRoleBadge(activeSession.user.role)}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {activeSession.user.title} • <span className="font-mono text-slate-600">{activeSession.user.email}</span>
                    </p>
                  </div>
                </div>

                <div className="font-mono text-xs bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-left sm:text-right shrink-0">
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">AUTHORIZED JURISDICTION:</span>
                  <span className="font-bold text-emerald-800 text-xs">
                    {activeSession.user.assigned_ward_name}
                  </span>
                </div>
              </div>

              {/* PostgreSQL Session Injection */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] space-y-1.5 shadow-inner">
                <div className="text-slate-400 text-[10px] font-bold tracking-wider uppercase mb-1">
                  POSTGRESQL SESSION CONTEXT INJECTION (SET LOCAL):
                </div>
                <div className="text-emerald-400">{activeSession.sql_session_context.set_user_id}</div>
                <div className="text-emerald-400">{activeSession.sql_session_context.set_user_role}</div>
                <div className="text-emerald-400">{activeSession.sql_session_context.set_user_ward}</div>
              </div>
            </div>
          </Card>
        )}

        {/* Role Switcher Persona Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <User className="h-4 w-4 text-emerald-600" />
              Switch Active User Persona (Test 4 RBAC Tiers)
            </h3>
            <span className="text-xs text-slate-500">Select user to test permissions</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {allUsers.map((user) => {
              const isSelected = activeSession?.user.user_id === user.user_id;

              return (
                <div
                  key={user.user_id}
                  onClick={() => handleSwitchUser(user.user_id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between min-h-[145px] ${
                    isSelected
                      ? "bg-emerald-50/60 border-emerald-500 shadow-sm ring-1 ring-emerald-500/30"
                      : "bg-white hover:bg-slate-50/80 border-slate-200 shadow-xs hover:border-slate-300"
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      {getRoleBadge(user.role)}
                      {isSelected && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">
                        {user.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                        {user.title}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 text-[10px] font-mono text-slate-500">
                    <span className="text-slate-400 font-semibold block uppercase text-[9px]">Scope:</span>
                    <span className="font-medium text-slate-700 truncate block mt-0.5">{user.assigned_ward_name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Interactive RLS Tenant Isolation Sandbox */}
        <Card className="border border-slate-200 shadow-xs rounded-2xl overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/70 border-b border-slate-200 p-5 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-emerald-600" />
                <CardTitle className="text-base font-semibold text-slate-900">
                  Interactive PostgreSQL Row-Level Security (RLS) Sandbox
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-xs font-mono bg-white border-slate-200 text-slate-700 w-fit">
                Simulating PostGIS Multi-Tenant Ward Isolation
              </Badge>
            </div>
            <CardDescription className="text-xs text-slate-500 mt-1">
              Test whether the active user persona is granted or denied permission to perform operations in specific municipal wards.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 md:p-8 space-y-6">
            {/* Controls Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Action */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Database Operation (Action)
                </label>
                <Select
                  value={testAction}
                  onValueChange={(val: any) => setTestAction(val)}
                >
                  <SelectTrigger className="h-10 text-xs bg-white border-slate-200 shadow-xs">
                    <SelectValue placeholder="Select Action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INSERT" className="text-xs">
                      INSERT (Register New Tree / Submit Inspection)
                    </SelectItem>
                    <SelectItem value="SELECT" className="text-xs">
                      SELECT (Query Trees &amp; GIS Polygons)
                    </SelectItem>
                    <SelectItem value="UPDATE" className="text-xs">
                      UPDATE (Change Health Status / Dispatch Crew)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Target Resource Table */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Target Relational Table
                </label>
                <Select
                  value={testResource}
                  onValueChange={(val: any) => setTestResource(val)}
                >
                  <SelectTrigger className="h-10 text-xs bg-white border-slate-200 shadow-xs">
                    <SelectValue placeholder="Select Table" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trees" className="text-xs">
                      trees (Urban Forest Registry)
                    </SelectItem>
                    <SelectItem value="inspections" className="text-xs">
                      inspections (Clinical Transects)
                    </SelectItem>
                    <SelectItem value="work_orders" className="text-xs">
                      work_orders (Crew Task Allocations)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Target Ward */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Target Municipal Ward
                </label>
                <Select
                  value={testWard}
                  onValueChange={(val) => setTestWard(val)}
                >
                  <SelectTrigger className="h-10 text-xs bg-white border-slate-200 shadow-xs">
                    <SelectValue placeholder="Select Ward" />
                  </SelectTrigger>
                  <SelectContent>
                    {WARDS.map((w) => (
                      <SelectItem key={w.ward_id} value={w.ward_id} className="text-xs">
                        {w.name} ({w.ward_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Evaluation Result Panel */}
            {rlsDecision && (
              <div
                className={`p-5 rounded-xl border transition-all ${
                  rlsDecision.is_authorized
                    ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                    : "bg-red-50 border-red-200 text-red-950"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {rlsDecision.is_authorized ? (
                      <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-600 shrink-0" />
                    )}
                    <div>
                      <h4 className="text-sm font-bold tracking-tight">
                        {rlsDecision.is_authorized
                          ? "RLS POLICY PERMITTED: ACCESS GRANTED"
                          : "RLS SECURITY VIOLATION: ACCESS DENIED"}
                      </h4>
                      <p className="text-xs opacity-90 mt-0.5">
                        {rlsDecision.reason}
                      </p>
                    </div>
                  </div>

                  <Badge
                    className={`text-xs font-mono uppercase px-2.5 py-1 ${
                      rlsDecision.is_authorized
                        ? "bg-emerald-600 text-white"
                        : "bg-red-600 text-white"
                    }`}
                  >
                    {rlsDecision.is_authorized ? "AUTHORIZED" : "ISOLATION DENIED"}
                  </Badge>
                </div>

                <div className="mt-4 pt-3 border-t border-current/20 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <div>
                    <span className="opacity-70 font-sans font-medium text-[11px] block">Enforced Policy:</span>
                    <span className="font-semibold">{rlsDecision.policy_enforced}</span>
                  </div>
                  <div>
                    <span className="opacity-70 font-sans font-medium text-[11px] block">Evaluated Scope:</span>
                    <span>
                      Role: {rlsDecision.user_role} | User Ward: {rlsDecision.user_ward || "NONE (CITY-WIDE)"} | Target Ward: {rlsDecision.target_ward}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Executed SQL Statement */}
            {rlsDecision && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5 text-emerald-600" />
                  PostgreSQL SQL Session Injection Statement:
                </span>
                <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto shadow-inner">
                  {rlsDecision.sql_session_stmt}
                  {"\n"}-- Attempting {testAction} ON {testResource} WHERE ward_id = '{testWard}';
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
