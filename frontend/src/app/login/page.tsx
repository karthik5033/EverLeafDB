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
        return <Badge className="bg-purple-600 text-white text-[10px] uppercase font-mono px-2">ADMIN</Badge>;
      case "supervisor":
        return <Badge className="bg-emerald-600 text-white text-[10px] uppercase font-mono px-2">SUPERVISOR</Badge>;
      case "field_inspector":
        return <Badge className="bg-blue-600 text-white text-[10px] uppercase font-mono px-2">INSPECTOR</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px] uppercase font-mono px-2">CITIZEN</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Municipal Identity, RBAC & Row-Level Security (RLS)
              </h1>
              <p className="text-sm text-muted-foreground">
                Phase 26: Role-based access control and tenant isolation sandbox simulating PostgreSQL RLS policies across 4 municipal authorization tiers.
              </p>
            </div>
          </div>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <Lock className="h-3.5 w-3.5 text-emerald-400" />
            <span className="font-mono text-emerald-400">ALTER TABLE ... ENABLE RLS</span>
            <span className="text-slate-500">|</span>
            <span>Tenant Ward Isolation</span>
          </div>
        </div>
      </div>

      {/* Active Session Identity Card */}
      {activeSession && (
        <Card className="border-emerald-500/40 bg-gradient-to-r from-emerald-500/5 via-card to-card shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 font-bold text-lg">
                  {activeSession.user.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg font-bold text-foreground">
                      {activeSession.user.name}
                    </CardTitle>
                    {getRoleBadge(activeSession.user.role)}
                  </div>
                  <CardDescription className="text-xs">
                    {activeSession.user.title} • {activeSession.user.email}
                  </CardDescription>
                </div>
              </div>

              <div className="text-right font-mono text-xs bg-background/80 p-2.5 rounded-lg border border-border/40">
                <span className="text-muted-foreground block text-[10px]">AUTHORIZED JURISDICTION:</span>
                <span className="font-bold text-emerald-500">
                  {activeSession.user.assigned_ward_name}
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
              <div className="text-muted-foreground text-[10px]">POSTGRESQL SESSION CONTEXT INJECTION (SET LOCAL):</div>
              <div className="text-emerald-400">{activeSession.sql_session_context.set_user_id}</div>
              <div className="text-emerald-400">{activeSession.sql_session_context.set_user_role}</div>
              <div className="text-emerald-400">{activeSession.sql_session_context.set_user_ward}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role Switcher Persona Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <User className="h-4 w-4 text-emerald-500" />
            Switch Active User Persona (Test 4 RBAC Tiers)
          </h3>
          <span className="text-xs text-muted-foreground">Select user to test permissions</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {allUsers.map((user) => {
            const isSelected = activeSession?.user.user_id === user.user_id;

            return (
              <div
                key={user.user_id}
                onClick={() => handleSwitchUser(user.user_id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? "bg-emerald-500/10 border-emerald-500 shadow-sm ring-1 ring-emerald-500/30"
                    : "bg-card/70 hover:bg-card border-border/50 hover:border-border"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    {getRoleBadge(user.role)}
                    {isSelected && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground leading-snug">
                      {user.name}
                    </h4>
                    <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                      {user.title}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-border/30 text-[10px] font-mono text-muted-foreground">
                  <span className="text-foreground font-semibold block">Scope:</span>
                  <span className="truncate block">{user.assigned_ward_name}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive RLS Tenant Isolation Sandbox */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="bg-muted/30 border-b border-border/40 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-emerald-500" />
              <CardTitle className="text-base font-semibold">
                Interactive PostgreSQL Row-Level Security (RLS) Sandbox
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-xs font-mono bg-background">
              Simulating PostGIS Multi-Tenant Ward Isolation
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Test whether the active user persona is granted or denied permission to perform operations in specific municipal wards.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-5 space-y-5">
          {/* Controls Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Action */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Database Operation (Action)
              </label>
              <Select
                value={testAction}
                onValueChange={(val: any) => setTestAction(val)}
              >
                <SelectTrigger className="text-xs bg-background">
                  <SelectValue placeholder="Select Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INSERT" className="text-xs">
                    INSERT (Register New Tree / Submit Inspection)
                  </SelectItem>
                  <SelectItem value="SELECT" className="text-xs">
                    SELECT (Query Canopy Records)
                  </SelectItem>
                  <SelectItem value="UPDATE" className="text-xs">
                    UPDATE (Modify Condition / Triage)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Resource */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Target Relational Table
              </label>
              <Select
                value={testResource}
                onValueChange={(val: any) => setTestResource(val)}
              >
                <SelectTrigger className="text-xs bg-background">
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
              <label className="text-xs font-semibold text-foreground">
                Target Municipal Ward
              </label>
              <Select
                value={testWard}
                onValueChange={(val) => setTestWard(val)}
              >
                <SelectTrigger className="text-xs bg-background">
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
              className={`p-4 rounded-xl border ${
                rlsDecision.is_authorized
                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-950 dark:text-emerald-100"
                  : "bg-red-500/10 border-red-500/40 text-red-950 dark:text-red-100"
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  {rlsDecision.is_authorized ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-500 shrink-0" />
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
                  className={`text-xs font-mono uppercase ${
                    rlsDecision.is_authorized
                      ? "bg-emerald-600 text-white"
                      : "bg-red-600 text-white"
                  }`}
                >
                  {rlsDecision.is_authorized ? "AUTHORIZED" : "ISOLATION DENIED"}
                </Badge>
              </div>

              <div className="mt-3.5 pt-3 border-t border-current/20 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="opacity-70">Enforced Policy: </span>
                  <span className="font-semibold">{rlsDecision.policy_enforced}</span>
                </div>
                <div>
                  <span className="opacity-70">Evaluated Scope: </span>
                  <span>
                    Role: {rlsDecision.user_role} | User Ward: {rlsDecision.user_ward || "NONE (CITY-WIDE)"} | Target Ward: {rlsDecision.target_ward}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Executed SQL Statement */}
          {rlsDecision && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Terminal className="h-3.5 w-3.5 text-emerald-500" />
                PostgreSQL SQL Session Injection Statement:
              </span>
              <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto">
                {rlsDecision.sql_session_stmt}
                {"\n"}-- Attempting {testAction} ON {testResource} WHERE ward_id = '{testWard}';
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
