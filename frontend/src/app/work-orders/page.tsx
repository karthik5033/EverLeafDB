"use client";

import React, { useState, useEffect } from "react";
import {
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  RotateCcw,
  UserCheck,
  MapPin,
  TreeDeciduous,
  Filter,
  Search,
  RefreshCw,
  Play,
  Check,
  DollarSign,
  Layers,
  ShieldAlert,
  Flame,
  Calendar,
  Eye,
  Building2,
  Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  KanbanWorkOrderItem,
  KanbanBoardData,
  KanbanColumnId,
  MUNICIPAL_CREWS
} from "@/lib/work-order-engine";
import { DashboardShell } from "@/components/DashboardShell";

export default function WorkOrdersKanbanPage() {
  const [boardData, setBoardData] = useState<KanbanBoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters State
  const [selectedCrew, setSelectedCrew] = useState("ALL");
  const [selectedWard, setSelectedWard] = useState("ALL");
  const [selectedPriority, setSelectedPriority] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Detailed Modal State
  const [activeItem, setActiveItem] = useState<KanbanWorkOrderItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Fetch Board Data
  const fetchBoardData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCrew !== "ALL") params.append("assigned_crew", selectedCrew);
      if (selectedWard !== "ALL") params.append("ward_id", selectedWard);
      if (selectedPriority !== "ALL") params.append("priority", selectedPriority);
      if (searchQuery.trim() !== "") params.append("search_query", searchQuery);

      const res = await fetch(`/api/work-orders?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setBoardData(data);
      }
    } catch (err) {
      console.error("Failed to load Kanban board data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoardData();
  }, [selectedCrew, selectedWard, selectedPriority, searchQuery]);

  // Handle Status Transition
  const handleTransition = async (orderId: string, newStatus: string) => {
    try {
      setActionLoading(true);
      const res = await fetch("/api/work-orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          new_status: newStatus,
          notes: `Moved to ${newStatus} via municipal crew dispatch Kanban board.`
        })
      });
      const data = await res.json();
      if (data.success) {
        await fetchBoardData();
        if (activeItem && activeItem.order_id === orderId) {
          setActiveItem(data.work_order);
        }
      } else {
        alert(data.error || "Failed to update work order status.");
      }
    } catch (err) {
      console.error("Transition failed:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Crew Reassignment
  const handleReassignCrew = async (orderId: string, newCrew: string) => {
    try {
      setActionLoading(true);
      const res = await fetch("/api/work-orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          new_crew: newCrew
        })
      });
      const data = await res.json();
      if (data.success) {
        await fetchBoardData();
      }
    } catch (err) {
      console.error("Reassign failed:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const openDetailsModal = (item: KanbanWorkOrderItem) => {
    setActiveItem(item);
    setModalOpen(true);
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "EMERGENCY":
        return <Badge variant="destructive" className="text-[10px] uppercase font-mono px-1.5 py-0">EMERGENCY</Badge>;
      case "HIGH":
        return <Badge className="bg-amber-500 text-white text-[10px] uppercase font-mono px-1.5 py-0">HIGH</Badge>;
      case "STANDARD":
      case "MEDIUM":
        return <Badge variant="default" className="text-[10px] uppercase font-mono px-1.5 py-0">STANDARD</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px] uppercase font-mono px-1.5 py-0">LOW</Badge>;
    }
  };

  const COLUMN_CONFIG: {
    id: KanbanColumnId;
    title: string;
    description: string;
    color: string;
    border: string;
    bg: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      id: "PENDING",
      title: "Pending Dispatch",
      description: "Dispatched orders awaiting field crew arrival",
      color: "text-amber-500",
      border: "border-amber-500/30",
      bg: "bg-amber-500/5",
      icon: Clock
    },
    {
      id: "IN_PROGRESS",
      title: "In Progress",
      description: "Active therapeutic remediations on-site",
      color: "text-blue-500",
      border: "border-blue-500/30",
      bg: "bg-blue-500/5",
      icon: Play
    },
    {
      id: "COMPLETED",
      title: "Completed",
      description: "Remediation verified & closed out",
      color: "text-emerald-500",
      border: "border-emerald-500/30",
      bg: "bg-emerald-500/5",
      icon: CheckCircle2
    },
    {
      id: "CANCELLED",
      title: "Cancelled",
      description: "Aborted, non-viable, or duplicate orders",
      color: "text-slate-400",
      border: "border-slate-500/30",
      bg: "bg-slate-500/5",
      icon: XCircle
    }
  ];

  return (
    <DashboardShell>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 pb-28">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
                <Wrench className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Municipal Field Crew Dispatch &amp; Task Kanban
                </h1>
                <p className="text-sm text-slate-500">
                  Task orchestration for municipal tree response teams, contractors, and field crews across Bangalore wards.
                </p>
              </div>
            </div>
          </div>

          {/* Live Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchBoardData}
              disabled={loading}
              className="gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh Board
            </Button>
          </div>
        </div>

        {/* KPI Metrics Cards */}
        {boardData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-white border-slate-200 shadow-xs">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-medium uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  Total Managed Orders
                  <Layers className="h-4 w-4 text-emerald-600" />
                </CardDescription>
                <CardTitle className="text-2xl font-bold text-slate-900">
                  {boardData.kpis.total_orders} Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500">Across all municipal crews</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-xs">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-medium uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  Active In-Progress
                  <Play className="h-4 w-4 text-blue-600" />
                </CardDescription>
                <CardTitle className="text-2xl font-bold text-blue-700">
                  {boardData.kpis.in_progress_count} On-Site
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500">Under active treatment</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-xs">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-medium uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  Emergency SLA Queue
                  <Flame className="h-4 w-4 text-red-600" />
                </CardDescription>
                <CardTitle className="text-2xl font-bold text-red-700">
                  {boardData.kpis.emergency_sla_count} Critical
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500">24-hour turnaround mandate</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-xs">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-medium uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  Completed Remediations
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </CardDescription>
                <CardTitle className="text-2xl font-bold text-emerald-700">
                  {boardData.kpis.completed_count} Cured
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500">Total: ${boardData.kpis.total_cost_allocated} USD</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Crew Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground font-medium">Crew:</span>
            <Select value={selectedCrew} onValueChange={setSelectedCrew}>
              <SelectTrigger className="w-[180px] h-8 text-xs bg-background">
                <SelectValue placeholder="All Crews" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Field Crews</SelectItem>
                {boardData?.all_crews.map((crew) => (
                  <SelectItem key={crew} value={crew} className="text-xs">
                    {crew}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ward Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground font-medium">Ward:</span>
            <Select value={selectedWard} onValueChange={setSelectedWard}>
              <SelectTrigger className="w-[170px] h-8 text-xs bg-background">
                <SelectValue placeholder="All Wards" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Bangalore Wards</SelectItem>
                {boardData?.all_wards.map((w) => (
                  <SelectItem key={w.ward_id} value={w.ward_id} className="text-xs">
                    {w.ward_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground font-medium">Priority:</span>
            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger className="w-[130px] h-8 text-xs bg-background">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Priorities</SelectItem>
                <SelectItem value="EMERGENCY">Emergency Only</SelectItem>
                <SelectItem value="HIGH">High Only</SelectItem>
                <SelectItem value="STANDARD">Standard Only</SelectItem>
                <SelectItem value="LOW">Low Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Text Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search order ID, tree tag, species..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs bg-background"
          />
        </div>
      </div>

      {/* 4-Column Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
        {COLUMN_CONFIG.map((col) => {
          const items = boardData ? boardData.columns[col.id] : [];
          const Icon = col.icon;

          return (
            <div
              key={col.id}
              className={`rounded-2xl border ${col.border} ${col.bg} p-3.5 flex flex-col min-h-[650px] space-y-3.5`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${col.color}`} />
                  <h3 className="text-sm font-bold text-foreground">{col.title}</h3>
                </div>
                <Badge variant="outline" className={`font-mono text-xs ${col.color} border-current/30`}>
                  {items.length}
                </Badge>
              </div>

              {/* Card List Container */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[750px] pr-0.5">
                {items.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border/40 rounded-xl bg-card/20">
                    No orders in this stage
                  </div>
                ) : (
                  items.map((item) => (
                    <Card
                      key={item.order_id}
                      className="bg-card hover:bg-card/90 transition-all border-border/60 hover:border-emerald-500/50 shadow-sm relative group"
                    >
                      <CardHeader className="p-3.5 pb-2">
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-bold text-foreground">
                                {item.order_id}
                              </span>
                              {getPriorityBadge(item.priority)}
                            </div>
                            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <TreeDeciduous className="h-3 w-3 text-emerald-500" />
                              <span className="font-mono">{item.tree_tag}</span>
                              <span>•</span>
                              <span className="truncate max-w-[110px]">{item.species_common}</span>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                            onClick={() => openDetailsModal(item)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardHeader>

                      <CardContent className="p-3.5 pt-0 space-y-2.5">
                        {/* Protocol & Disease */}
                        <div className="bg-muted/40 p-2 rounded-lg border border-border/30 text-[11px] space-y-1">
                          <span className="font-semibold text-foreground block line-clamp-1">
                            {item.protocol}
                          </span>
                          <span className="text-amber-500 text-[10px] block">
                            Target: {item.disease_name}
                          </span>
                        </div>

                        {/* Location & Crew */}
                        <div className="space-y-1 text-[11px] text-muted-foreground">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1 truncate max-w-[140px]">
                              <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                              {item.ward_name}
                            </span>
                            <span className="font-mono text-[10px] font-semibold text-foreground">
                              ${item.cost_estimate_usd}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[10px] pt-1 border-t border-border/30">
                            <span className="flex items-center gap-1 truncate max-w-[130px]">
                              <UserCheck className="h-3 w-3 text-emerald-500 shrink-0" />
                              {item.assigned_crew}
                            </span>

                            {/* SLA Badge */}
                            {col.id !== "COMPLETED" && col.id !== "CANCELLED" && (
                              <span
                                className={`font-mono text-[10px] font-semibold ${
                                  item.is_overdue
                                    ? "text-red-500"
                                    : item.sla_remaining_hours <= 12
                                    ? "text-amber-500"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {item.is_overdue
                                  ? "OVERDUE"
                                  : `${item.sla_remaining_hours}h SLA`}
                              </span>
                            )}
                            {col.id === "COMPLETED" && (
                              <span className="text-emerald-500 font-mono text-[10px]">
                                CURED
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status Transition Action Buttons */}
                        <div className="pt-2 border-t border-border/30 flex items-center justify-between gap-1.5">
                          {col.id === "PENDING" && (
                            <Button
                              size="sm"
                              disabled={actionLoading}
                              onClick={() => handleTransition(item.order_id, "IN_PROGRESS")}
                              className="w-full h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                            >
                              <Play className="h-3 w-3" />
                              Start Work
                            </Button>
                          )}

                          {col.id === "IN_PROGRESS" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={actionLoading}
                                onClick={() => handleTransition(item.order_id, "PENDING")}
                                className="h-7 text-[11px] px-2 text-muted-foreground"
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Hold
                              </Button>
                              <Button
                                size="sm"
                                disabled={actionLoading}
                                onClick={() => handleTransition(item.order_id, "COMPLETED")}
                                className="flex-1 h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                              >
                                <Check className="h-3 w-3" />
                                Complete
                              </Button>
                            </>
                          )}

                          {col.id === "COMPLETED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={actionLoading}
                              onClick={() => handleTransition(item.order_id, "IN_PROGRESS")}
                              className="w-full h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
                            >
                              <RotateCcw className="h-3 w-3" />
                              Reopen Case
                            </Button>
                          )}

                          {col.id === "CANCELLED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={actionLoading}
                              onClick={() => handleTransition(item.order_id, "PENDING")}
                              className="w-full h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
                            >
                              <RotateCcw className="h-3 w-3" />
                              Reactivate Order
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Work Order Inspection & Detail Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          {activeItem && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-foreground">
                      {activeItem.order_id}
                    </span>
                    {getPriorityBadge(activeItem.priority)}
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    Status: {activeItem.status}
                  </Badge>
                </div>
                <DialogDescription className="text-xs">
                  Municipal Field Crew Work Order & Relational Audit Details
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2 text-xs">
                {/* Botanical & Tree Info */}
                <div className="bg-muted/40 p-3 rounded-lg border border-border/40 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-muted-foreground block">Specimen Tag:</span>
                    <span className="font-mono font-bold text-foreground">{activeItem.tree_tag}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Species:</span>
                    <span className="font-semibold text-foreground">{activeItem.species_common}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Ward:</span>
                    <span className="font-medium text-foreground">{activeItem.ward_name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Target Disease:</span>
                    <span className="font-semibold text-amber-500">{activeItem.disease_name}</span>
                  </div>
                </div>

                {/* Treatment Protocol */}
                <div className="space-y-1">
                  <span className="text-muted-foreground font-semibold">Prescribed Protocol:</span>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg text-emerald-700 dark:text-emerald-300 font-medium">
                    {activeItem.protocol}
                  </div>
                </div>

                {/* Reassign Crew Selector */}
                <div className="space-y-1.5">
                  <span className="text-muted-foreground font-semibold">Assigned Response Crew:</span>
                  <Select
                    value={activeItem.assigned_crew}
                    onValueChange={(val) => {
                      handleReassignCrew(activeItem.order_id, val);
                      setActiveItem({ ...activeItem, assigned_crew: val });
                    }}
                  >
                    <SelectTrigger className="text-xs bg-background">
                      <SelectValue placeholder="Select Response Crew" />
                    </SelectTrigger>
                    <SelectContent>
                      {MUNICIPAL_CREWS.map((c) => (
                        <SelectItem key={c} value={c} className="text-xs">
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Timeline Metrics */}
                <div className="bg-background p-3 rounded-lg border border-border/60 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dispatched At:</span>
                    <span>{new Date(activeItem.dispatched_at).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SLA Window:</span>
                    <span>{activeItem.sla_hours} Hours</span>
                  </div>
                  {activeItem.closed_at && (
                    <div className="flex justify-between text-emerald-500 font-semibold">
                      <span>Closed / Cured At:</span>
                      <span>{new Date(activeItem.closed_at).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Standard Remediation Cost:</span>
                    <span>${activeItem.cost_estimate_usd} USD</span>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex flex-row items-center justify-between sm:justify-between w-full">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleTransition(activeItem.order_id, "CANCELLED");
                    setModalOpen(false);
                  }}
                  className="text-xs text-red-500 hover:text-red-600 border-red-500/30"
                >
                  Cancel Order
                </Button>

                <Button
                  size="sm"
                  className="text-xs bg-slate-950 hover:bg-slate-800 text-white"
                  onClick={() => setModalOpen(false)}
                >
                  Close Details
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </DashboardShell>
  );
}

