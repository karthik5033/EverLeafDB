"use client";

import React, { useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  Sparkles,
  Layers,
  Compass,
  Database,
  CheckCircle2,
  AlertTriangle,
  Trees,
  MoreVertical,
  Plus
} from "lucide-react";
import { TREES } from "@/lib/db";

export default function ShowcasePage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <DashboardShell>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="emerald" className="font-mono text-[10px]">Phase 2 Deliverable</Badge>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                shadcn/ui Forestry Design System
              </h1>
            </div>
            <p className="text-xs text-muted-foreground max-w-2xl">
              Strictly configured Slate &amp; Emerald design tokens, Radix UI primitives, and atomic components ready for multi-model forestry DBMS replication.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="emerald" size="sm">
                  <Plus className="w-4 h-4 mr-1.5" /> Register Specimen (Dialog)
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Register New Tree Specimen</DialogTitle>
                  <DialogDescription>
                    PostGIS coordinate validation (ST_Contains) will automatically verify ward containment.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-2 text-xs">
                  <div>
                    <label className="text-muted-foreground block mb-1">Common Species Name</label>
                    <Input placeholder="e.g. Heritage Banyan" defaultValue="Heritage Banyan" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-muted-foreground block mb-1">Latitude</label>
                      <Input defaultValue="12.9716" />
                    </div>
                    <div>
                      <label className="text-muted-foreground block mb-1">Longitude</label>
                      <Input defaultValue="77.5946" />
                    </div>
                  </div>
                  <div>
                    <label className="text-muted-foreground block mb-1">Dendrometric Observation Notes</label>
                    <Textarea placeholder="Condition score, canopy chlorosis, bark conk symptoms..." defaultValue="Basidiocarp detected on trunk base; sample collected." />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button variant="emerald" size="sm" onClick={() => setDialogOpen(false)}>Commit Transaction</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  Open Drawer (Sheet)
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Audit Trail Snapshot</SheetTitle>
                  <SheetDescription>
                    Immutable PostgreSQL JSONB diffs from active triggers.
                  </SheetDescription>
                </SheetHeader>
                <div className="py-4 space-y-3 text-xs font-mono">
                  <div className="p-3 bg-muted rounded-lg">
                    <span className="text-muted-foreground block text-[10px]">Operation</span>
                    <strong className="text-foreground">UPDATE on trees (tree_id = &apos;tree_1084&apos;)</strong>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <span className="text-muted-foreground block text-[10px]">NEW_VALUES</span>
                    <span className="text-emerald-800 font-bold">{`{"status": "under_treatment", "score": 1}`}</span>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Section 1: Buttons & Badges */}
        <Card>
          <CardHeader>
            <CardTitle>1. Buttons &amp; Badges (Forestry Palette)</CardTitle>
            <CardDescription>Atomic button variants and contextual status indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="emerald">Emerald Primary</Button>
              <Button variant="emeraldOutline">Emerald Outline</Button>
              <Button variant="default">Default Dark</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="emerald" size="sm">Small Size</Button>
              <Button variant="emerald" size="lg">Large Size</Button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
              <Badge variant="emerald">PostGIS 4326 GiST</Badge>
              <Badge variant="default">pgvector 512-d</Badge>
              <Badge variant="secondary">3NF Relational</Badge>
              <Badge variant="outline">RLS Active</Badge>
              <Badge variant="critical">Critical Flag (0.892)</Badge>
              <Badge variant="warning">Monitor Required</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Form Controls (Input, Select, Textarea) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="col-span-1 md:col-span-2">
            <CardHeader>
              <CardTitle>2. Input &amp; Selection Controls</CardTitle>
              <CardDescription>Radix select, masked coordinates, and descriptive text areas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Target Municipal Ward</label>
                  <Select defaultValue="ward_03">
                    <SelectTrigger>
                      <SelectValue placeholder="Choose ward..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ward_01">Ward 01 (Central Business District)</SelectItem>
                      <SelectItem value="ward_02">Ward 02 (Lalbagh Botanical Zone)</SelectItem>
                      <SelectItem value="ward_03">Ward 03 (Cubbon Park Heritage)</SelectItem>
                      <SelectItem value="ward_04">Ward 04 (Indiranagar Forest)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Spatial Proximity Threshold</label>
                  <Input placeholder="500" defaultValue="500 meters" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">CLIP Vision Query Prompt</label>
                <Textarea placeholder="Extract embedding vector from visual symptoms..." defaultValue="Ganoderma lucidum basidiocarp conk with reddish-brown concentric zones and white margin." />
              </div>
            </CardContent>
          </Card>

          {/* Skeletons & Dropdowns */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Dropdown &amp; Skeletons</CardTitle>
                <CardDescription>Lazy loading placeholders</CardDescription>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Database Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Run EXPLAIN ANALYZE</DropdownMenuItem>
                  <DropdownMenuItem>Verify GiST Index</DropdownMenuItem>
                  <DropdownMenuItem>Trigger HNSW Rebuild</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs text-muted-foreground">Vector re-ranking buffer:</div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        </div>

        {/* Section 3: Data Table & Tabs */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle>3. Table &amp; Tabs Component Integration</CardTitle>
                <CardDescription>Cataloged specimen inventory with health state indicators</CardDescription>
              </div>
              <Tabs defaultValue="all" className="w-auto">
                <TabsList>
                  <TabsTrigger value="all">All Specimens</TabsTrigger>
                  <TabsTrigger value="critical">Critical Flagged</TabsTrigger>
                  <TabsTrigger value="healthy">Healthy</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tag ID</TableHead>
                  <TableHead>Species Common</TableHead>
                  <TableHead>Scientific Taxon</TableHead>
                  <TableHead>Ward Jurisdiction</TableHead>
                  <TableHead>Height / DBH</TableHead>
                  <TableHead>Health Classification</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {TREES.map((tree) => (
                  <TableRow key={tree.tree_id}>
                    <TableCell className="font-mono font-bold text-foreground">{tree.tag_number}</TableCell>
                    <TableCell className="font-semibold">{tree.species_common}</TableCell>
                    <TableCell className="italic text-muted-foreground text-xs">{tree.species_scientific}</TableCell>
                    <TableCell>{tree.ward_name}</TableCell>
                    <TableCell className="font-mono text-xs">{tree.height_m}m / {tree.dbh_cm}cm</TableCell>
                    <TableCell>
                      {tree.health_status === "CRITICAL" ? (
                        <Badge variant="critical">{tree.health_status}</Badge>
                      ) : tree.health_status === "MONITOR" ? (
                        <Badge variant="warning">{tree.health_status}</Badge>
                      ) : (
                        <Badge variant="emerald">{tree.health_status}</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

