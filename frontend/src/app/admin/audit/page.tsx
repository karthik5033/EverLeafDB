"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Database,
  Search,
  Filter,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Layers,
  Archive,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Hash,
  User,
  Activity,
  HardDrive
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { DashboardShell } from "@/components/DashboardShell";

interface AuditEntry {
  log_id: number;
  user_id: string;
  action: "INSERT" | "UPDATE" | "DELETE" | "DISPATCH" | "LOGIN";
  table_name: string;
  record_id: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  performed_at: string;
  diff?: Record<string, { from: unknown; to: unknown }>;
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState("ALL");
  const [selectedAction, setSelectedAction] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

  // Backup Trigger Dialog State
  const [isBackupDialogOpen, setIsBackupDialogOpen] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupResult, setBackupResult] = useState<any | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedTable !== "ALL") params.append("table_name", selectedTable);
      if (selectedAction !== "ALL") params.append("action", selectedAction);
      params.append("limit", "100");

      const res = await fetch(`/api/audit?${params.toString()}`);
      const data = await res.json();
      if (data.success && data.audit_logs) {
        setLogs(data.audit_logs);
      }
    } catch (err) {
      console.error("Failed to fetch audit logs", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedTable, selectedAction]);

  const [isResettingDemo, setIsResettingDemo] = useState(false);

  const handleResetDemoData = async () => {
    if (!confirm("Are you sure you want to reset all demo state to certified Course Viva baseline?")) {
      return;
    }
    setIsResettingDemo(true);
    try {
      const res = await fetch("/api/admin/demo-reset", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        await fetchLogs();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to reset demo data.");
    } finally {
      setIsResettingDemo(false);
    }
  };

  const handleTriggerBackup = async () => {
    setIsBackingUp(true);
    setBackupResult(null);
    setIsBackupDialogOpen(true);

    try {
      const res = await fetch("/api/admin/backup", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setBackupResult(data);
        await fetchLogs(); // Refresh logs to include the backup event
      } else {
        alert(data.error || "Backup failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Error triggering backup snapshot.");
    } finally {
      setIsBackingUp(false);
    }
  };

  // Filter logs by search query (record ID, user ID, or payload keys)
  const filteredLogs = logs.filter((log) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      log.record_id.toLowerCase().includes(q) ||
      log.user_id.toLowerCase().includes(q) ||
      log.table_name.toLowerCase().includes(q) ||
      JSON.stringify(log.new_values || {}).toLowerCase().includes(q)
    );
  });

  // Action Badge Colors
  const actionBadgeColors: Record<string, string> = {
    INSERT: "bg-emerald-50 text-emerald-800 border-emerald-300",
    UPDATE: "bg-blue-50 text-blue-800 border-blue-300",
    DELETE: "bg-red-50 text-red-800 border-red-300",
    DISPATCH: "bg-purple-50 text-purple-800 border-purple-300",
    LOGIN: "bg-slate-50 text-slate-800 border-slate-300"
  };

  // Role Resolver for User IDs
  const resolveActorName = (userId: string): { label: string; role: string } => {
    if (userId.endsWith("001")) return { label: "Dr. Elena Rostova", role: "Municipal Admin" };
    if (userId.endsWith("002")) return { label: "Marcus Vance", role: "Municipal Tree Supervisor" };
    if (userId.endsWith("003")) return { label: "Sarah Jenkins", role: "Field Inspector" };
    if (userId.endsWith("004")) return { label: "David Kim", role: "Field Inspector" };
    if (userId.endsWith("005")) return { label: "Public Citizen", role: "Citizen Reporter" };
    return { label: `User ...${userId.slice(-6)}`, role: "Authorized User" };
  };

  return (
    <DashboardShell>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Top Banner Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-emerald-800 bg-emerald-50 border-emerald-200 font-mono text-xs">
                MUNICIPAL GOVERNANCE &amp; AUDIT
              </Badge>
              <Badge variant="outline" className="text-slate-600 bg-slate-50 border-slate-200 font-mono text-xs">
                PostgreSQL Triggers &amp; WAL PITR
              </Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
              System Auditing, Compliance &amp; Backup Verification
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Surveillance of all relational mutations, field inspection changes, and automated Point-in-Time Recovery (PITR) backup snapshots.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={handleResetDemoData}
              disabled={isResettingDemo}
              className="border-amber-300 text-amber-800 hover:bg-amber-50 gap-1.5 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResettingDemo ? "animate-spin" : ""}`} />
              Reset Demo Data (Viva)
            </Button>
            <Button
              variant="outline"
              onClick={fetchLogs}
              disabled={isLoading}
              className="border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh Trail
            </Button>
            <Button
              onClick={handleTriggerBackup}
              className="bg-slate-950 hover:bg-slate-800 text-white gap-2 text-xs font-medium shadow-xs"
            >
              <Archive className="w-4 h-4" />
              Trigger Backup Snapshot (pg_dump)
            </Button>
          </div>
        </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Audited Mutations
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-900 flex items-center justify-between">
              <span>{logs.length}</span>
              <Activity className="w-5 h-5 text-emerald-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-slate-500">Captured via PL/pgSQL audit triggers</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Tables Monitored
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-900 flex items-center justify-between">
              <span>5</span>
              <Database className="w-5 h-5 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-slate-500">trees, inspections, work_orders, reports, backups</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Disaster Recovery SLA
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-700 flex items-center justify-between">
              <span>RPO &lt; 60s</span>
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-slate-500">Continuous WAL streaming + PITR enabled</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Snapshot Format
            </CardDescription>
            <CardTitle className="text-lg font-mono font-bold text-slate-900 flex items-center justify-between">
              <span>pg_dump -Fc -Z9</span>
              <HardDrive className="w-5 h-5 text-slate-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-slate-500">Custom tar with SHA-256 verification</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <Input
                placeholder="Search audit trail by record ID, user ID, or payload attributes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs font-mono"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <SelectTrigger className="w-36 h-9 text-xs bg-white">
                  <SelectValue placeholder="All Tables" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Tables</SelectItem>
                  <SelectItem value="trees">trees</SelectItem>
                  <SelectItem value="inspections">inspections</SelectItem>
                  <SelectItem value="work_orders">work_orders</SelectItem>
                  <SelectItem value="citizen_reports">citizen_reports</SelectItem>
                  <SelectItem value="system_backups">system_backups</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger className="w-32 h-9 text-xs bg-white">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Actions</SelectItem>
                  <SelectItem value="INSERT">INSERT</SelectItem>
                  <SelectItem value="UPDATE">UPDATE</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                  <SelectItem value="DISPATCH">DISPATCH</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="py-3 px-4 bg-slate-50/80 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Immutable PostgreSQL Audit Log Records ({filteredLogs.length})
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              ORDER BY performed_at DESC
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              Loading relational audit records...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              No audit records matching the specified filters.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredLogs.map((log) => {
                const actor = resolveActorName(log.user_id);
                const isExpanded = expandedLogId === log.log_id;
                const hasDiff = log.diff && Object.keys(log.diff).length > 0;

                return (
                  <div key={log.log_id} className="transition-colors hover:bg-slate-50/60">
                    {/* Summary Row */}
                    <div
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                      onClick={() => setExpandedLogId(isExpanded ? null : log.log_id)}
                    >
                      <div className="flex items-start sm:items-center gap-3">
                        <button className="text-slate-400 hover:text-slate-600 mt-0.5 sm:mt-0">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>

                        <span className="font-mono text-xs font-bold text-slate-500">
                          #{log.log_id}
                        </span>

                        <Badge
                          variant="outline"
                          className={`font-mono text-[10px] font-bold ${
                            actionBadgeColors[log.action] || "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {log.action}
                        </Badge>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-slate-900">
                              {log.table_name}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="font-mono text-xs text-slate-600">
                              {log.record_id}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <User className="w-3 h-3 text-slate-400" />
                            <span>{actor.label}</span>
                            <span className="text-slate-300">({actor.role})</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
                        {hasDiff && (
                          <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 text-[10px]">
                            {Object.keys(log.diff!).length} attributes changed
                          </Badge>
                        )}
                        <span className="font-mono text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(log.performed_at).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Expanded JSONB Diff Viewer */}
                    {isExpanded && (
                      <div className="px-6 pb-4 pt-1 bg-slate-50/50 border-t border-slate-100 space-y-3">
                        <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-emerald-600" />
                          <span>JSONB Attribute Transition Diff</span>
                        </div>

                        {hasDiff ? (
                          <div className="space-y-2">
                            {Object.entries(log.diff!).map(([attr, change]) => (
                              <div
                                key={attr}
                                className="p-2.5 rounded-lg border border-slate-200 bg-white text-xs grid grid-cols-1 md:grid-cols-3 gap-2 items-center"
                              >
                                <span className="font-mono font-bold text-slate-800">
                                  {attr}
                                </span>
                                <div className="text-slate-500 font-mono text-[11px] bg-red-50 text-red-900 px-2 py-1 rounded border border-red-200 truncate">
                                  <span className="text-[10px] text-red-500 uppercase block">OLD:</span>
                                  {change.from !== null ? JSON.stringify(change.from) : "NULL"}
                                </div>
                                <div className="text-slate-900 font-mono text-[11px] bg-emerald-50 text-emerald-900 px-2 py-1 rounded border border-emerald-200 truncate">
                                  <span className="text-[10px] text-emerald-600 uppercase block">NEW:</span>
                                  {change.to !== null ? JSON.stringify(change.to) : "NULL"}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : log.new_values ? (
                          <div className="p-3 bg-white rounded-lg border border-slate-200">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                              Initial Insert Values
                            </span>
                            <pre className="text-[11px] font-mono text-slate-800 overflow-x-auto whitespace-pre-wrap">
                              {JSON.stringify(log.new_values, null, 2)}
                            </pre>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500 italic">No JSONB payload recorded.</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Backup Execution Dialog */}
      <Dialog open={isBackupDialogOpen} onOpenChange={setIsBackupDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <Archive className="w-5 h-5 text-emerald-600" />
              Automated Database Snapshot & PITR Verification
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              PostgreSQL custom-compressed archive (-Fc) with SHA-256 cryptographic verification.
            </DialogDescription>
          </DialogHeader>

          {isBackingUp ? (
            <div className="py-12 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-xs font-medium text-slate-700">
                Executing pg_dump compressed archive & calculating SHA-256 checksum...
              </p>
            </div>
          ) : backupResult ? (
            <div className="space-y-4 pt-2">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Snapshot Generated & Cryptographically Verified!</span>
                </div>
                <p className="text-emerald-800 text-[11px]">
                  Archive saved to municipal disaster recovery staging. Checksum matches exact row count parity.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Archive Filename:</span>
                  <span className="font-mono font-semibold text-slate-900 text-xs block truncate mt-0.5">
                    {backupResult.manifest.archive_filename}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Compression Ratio:</span>
                  <span className="font-semibold text-emerald-700 text-xs block mt-0.5">
                    {backupResult.verification.compression_saving_pct} Space Saved
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                <span className="text-slate-500 block text-[11px]">Cryptographic SHA-256 Checksum:</span>
                <span className="font-mono text-[11px] text-slate-800 break-all block bg-white p-2 rounded border border-slate-200">
                  {backupResult.manifest.sha256_checksum}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                <span className="text-slate-500 block text-[11px]">Tables Snapshot Record Counts:</span>
                <div className="grid grid-cols-4 gap-2 pt-1 font-mono text-[11px] text-slate-700">
                  <div>Trees: <strong>{backupResult.manifest.table_metrics.trees}</strong></div>
                  <div>Inspections: <strong>{backupResult.manifest.table_metrics.inspections}</strong></div>
                  <div>Work Orders: <strong>{backupResult.manifest.table_metrics.work_orders}</strong></div>
                  <div>Audit Log: <strong>{backupResult.manifest.table_metrics.audit_log}</strong></div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => setIsBackupDialogOpen(false)}
                  className="bg-slate-950 hover:bg-slate-800 text-white text-xs"
                >
                  Close & Acknowledge
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
      </div>
    </DashboardShell>
  );
}
