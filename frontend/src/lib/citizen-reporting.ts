/**
 * EverLeafDB Citizen Reporting Public Portal Subsystem (Phase 27)
 * Implements public community tree hazard ingestion, spatial ward tagging (PostGIS ST_Contains),
 * tracking code verification, and municipal supervisor triage workflows.
 *
 * Strict constraint: Zero occurrences of forbidden terminology.
 * Authorized roles: Citizen Reporter, Field Inspector, Municipal Tree Supervisor, Tree Manager, Municipal Admin.
 */

import { WARDS } from "./db";
import { stContains, stDistanceMeters, LngLat } from "./gis";
import { recordAuditTrail } from "./audit";

export type CitizenHazardCategory =
  | "FALLING_BRANCH"
  | "TRUNK_DECAY_FUNGUS"
  | "ROOT_EXCAVATION_DAMAGE"
  | "PEST_INFESTATION"
  | "OVERHANGING_POWERLINE"
  | "DEAD_TREE_HAZARD"
  | "OTHER";

export type CitizenUrgencyLevel = "LOW" | "MODERATE" | "HIGH" | "EMERGENCY";

export type CitizenReportStatus =
  | "PENDING_TRIAGE"
  | "INVESTIGATING"
  | "ACTIONED"
  | "RESOLVED"
  | "DISMISSED";

export interface CitizenReport {
  report_id: string;
  tracking_code: string;
  reporter_name: string;
  reporter_phone?: string;
  reporter_email?: string;
  latitude: number;
  longitude: number;
  ward_id: number;
  ward_name: string;
  ward_zone: string;
  address_landmark: string;
  hazard_category: CitizenHazardCategory;
  urgency_level: CitizenUrgencyLevel;
  description: string;
  photo_url?: string;
  status: CitizenReportStatus;
  supervisor_notes?: string;
  created_at: string;
  resolved_at?: string | null;
  elapsed_hours: number;
  is_sla_breached: boolean;
}

export interface CreateCitizenReportInput {
  reporter_name?: string;
  reporter_phone?: string;
  reporter_email?: string;
  latitude: number;
  longitude: number;
  address_landmark: string;
  hazard_category: CitizenHazardCategory;
  urgency_level?: CitizenUrgencyLevel;
  description: string;
  photo_url?: string;
}

// ----------------------------------------------------------------------------
// Seed Data: Realistic Community Tree Hazard Reports
// ----------------------------------------------------------------------------
export const CITIZEN_REPORTS_STORE: CitizenReport[] = [
  {
    report_id: "cr-8001-a1b2",
    tracking_code: "CR-2025-7841",
    reporter_name: "Anita Sharma",
    reporter_phone: "+91-9845012345",
    reporter_email: "anita.sharma@example.com",
    latitude: 12.9735,
    longitude: 77.6015,
    ward_id: 1,
    ward_name: "Central Business District",
    ward_zone: "Central",
    address_landmark: "Opposite Cubbon Park Metro Station Gate 2",
    hazard_category: "FALLING_BRANCH",
    urgency_level: "HIGH",
    description: "Large heavy bough hanging precariously over pedestrian footway following heavy evening squall. Risk of falling on commuters.",
    photo_url: "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=600&q=80",
    status: "INVESTIGATING",
    supervisor_notes: "Dispatched Field Inspector team 01 for site perimeter cordoning and hydraulic cherry picker assessment.",
    created_at: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    resolved_at: null,
    elapsed_hours: 14.0,
    is_sla_breached: false
  },
  {
    report_id: "cr-8002-c3d4",
    tracking_code: "CR-2025-9214",
    reporter_name: "Kavitha R.",
    reporter_phone: "+91-9741098765",
    reporter_email: "kavitha.r@example.com",
    latitude: 12.9512,
    longitude: 77.5845,
    ward_id: 2,
    ward_name: "Lalbagh Botanical Zone",
    ward_zone: "South",
    address_landmark: "Near Lalbagh West Gate Nursery Road",
    hazard_category: "TRUNK_DECAY_FUNGUS",
    urgency_level: "MODERATE",
    description: "Massive fungal bracket (shelf mushroom) forming at base of heritage Rain Tree trunk. Bark flaking and hollow sound.",
    photo_url: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80",
    status: "PENDING_TRIAGE",
    supervisor_notes: undefined,
    created_at: new Date(Date.now() - 32 * 3600 * 1000).toISOString(),
    resolved_at: null,
    elapsed_hours: 32.0,
    is_sla_breached: true // > 24 hours SLA
  },
  {
    report_id: "cr-8003-e5f6",
    tracking_code: "CR-2025-4502",
    reporter_name: "Vikram Sengupta",
    reporter_phone: "+91-9980123456",
    reporter_email: "vikram.s@example.com",
    latitude: 12.9782,
    longitude: 77.6385,
    ward_id: 4,
    ward_name: "Indiranagar Urban Forest",
    ward_zone: "East",
    address_landmark: "12th Main Road, Corner of 4th Cross",
    hazard_category: "OVERHANGING_POWERLINE",
    urgency_level: "EMERGENCY",
    description: "Branches of dense Gulmohar tree contacting 11kV overhead electrical distribution cables. Visible sparks during breezy conditions.",
    photo_url: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80",
    status: "ACTIONED",
    supervisor_notes: "Emergency utility work order issued (WO-2025-089) with BESCOM power shutdown coordination.",
    created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    resolved_at: null,
    elapsed_hours: 6.0,
    is_sla_breached: false
  },
  {
    report_id: "cr-8004-g7h8",
    tracking_code: "CR-2025-1108",
    reporter_name: "Anonymous Citizen",
    reporter_phone: undefined,
    reporter_email: undefined,
    latitude: 12.9348,
    longitude: 77.6212,
    ward_id: 5,
    ward_name: "Koramangala Canopy Corridor",
    ward_zone: "South",
    address_landmark: "80 Feet Road, Near Sony World Junction",
    hazard_category: "DEAD_TREE_HAZARD",
    urgency_level: "HIGH",
    description: "Completely desiccant standing dead eucalyptus tree tilting toward road carriageway. Severe hazard to passing two-wheelers.",
    photo_url: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=600&q=80",
    status: "RESOLVED",
    supervisor_notes: "Controlled felling executed by municipal field crew. Timber cleared and replacement sapling scheduled.",
    created_at: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    resolved_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    elapsed_hours: 60.0,
    is_sla_breached: false
  }
];

/**
 * Assigns municipal ward using PostGIS ST_Contains point-in-polygon algorithm.
 * Fallbacks to nearest ward boundary if coordinate is marginally on the boundary.
 */
export function assignWardBySpatialLocation(lat: number, lng: number): {
  ward_id: number;
  ward_name: string;
  ward_zone: string;
} {
  const testPoint: LngLat = [lng, lat];

  // 1. Precise ST_Contains ray-casting check against ward polygon boundaries
  for (const ward of WARDS) {
    if (ward.polygon && ward.polygon.length >= 3) {
      if (stContains(ward.polygon, testPoint)) {
        return {
          ward_id: ward.ward_number,
          ward_name: ward.name,
          ward_zone: ward.zone
        };
      }
    }
  }

  // 2. Geodesic distance nearest-ward fallback (if outside defined ward polygons)
  let minDistance = Infinity;
  let nearestWard = WARDS[0];

  for (const ward of WARDS) {
    const dist = stDistanceMeters(lat, lng, ward.centroid[1], ward.centroid[0]);
    if (dist < minDistance) {
      minDistance = dist;
      nearestWard = ward;
    }
  }

  return {
    ward_id: nearestWard.ward_number,
    ward_name: nearestWard.name,
    ward_zone: nearestWard.zone
  };
}

/**
 * Generates a collision-resistant municipal tracking code (e.g. CR-2025-XXXX)
 */
export function generateTrackingCode(): string {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  let code = `CR-${year}-${randomSuffix}`;

  // Ensure uniqueness in store
  while (CITIZEN_REPORTS_STORE.some(r => r.tracking_code === code)) {
    const nextSuffix = Math.floor(1000 + Math.random() * 9000);
    code = `CR-${year}-${nextSuffix}`;
  }

  return code;
}

/**
 * Submits a public community tree hazard report.
 * Automatically runs PostGIS spatial containment trigger and registers in-memory & audit trail.
 */
export function submitCitizenReport(input: CreateCitizenReportInput): CitizenReport {
  if (!input.description || input.description.trim().length < 10) {
    throw new Error("Report description must be at least 10 characters detailing the hazard.");
  }
  if (!input.address_landmark || input.address_landmark.trim().length < 3) {
    throw new Error("Valid street address or landmark is required.");
  }
  if (isNaN(input.latitude) || isNaN(input.longitude)) {
    throw new Error("Valid geographic coordinates (latitude and longitude) are required.");
  }

  // Spatial trigger execution: PostGIS ST_Contains point-in-polygon ward determination
  const spatialWard = assignWardBySpatialLocation(input.latitude, input.longitude);

  const trackingCode = generateTrackingCode();
  const reportId = `cr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const newReport: CitizenReport = {
    report_id: reportId,
    tracking_code: trackingCode,
    reporter_name: input.reporter_name?.trim() || "Anonymous Citizen",
    reporter_phone: input.reporter_phone?.trim(),
    reporter_email: input.reporter_email?.trim(),
    latitude: Number(input.latitude.toFixed(6)),
    longitude: Number(input.longitude.toFixed(6)),
    ward_id: spatialWard.ward_id,
    ward_name: spatialWard.ward_name,
    ward_zone: spatialWard.ward_zone,
    address_landmark: input.address_landmark.trim(),
    hazard_category: input.hazard_category,
    urgency_level: input.urgency_level || "MODERATE",
    description: input.description.trim(),
    photo_url: input.photo_url || "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=600&q=80",
    status: "PENDING_TRIAGE",
    supervisor_notes: undefined,
    created_at: now,
    resolved_at: null,
    elapsed_hours: 0,
    is_sla_breached: false
  };

  CITIZEN_REPORTS_STORE.unshift(newReport);

  // Record relational audit trail for compliance
  recordAuditTrail({
    user_id: "00000000-0000-0000-0000-000000000005", // Citizen Reporter system ID
    action: "INSERT",
    table_name: "citizen_reports",
    record_id: reportId,
    old_values: null,
    new_values: {
      tracking_code: trackingCode,
      ward_id: spatialWard.ward_id,
      hazard_category: input.hazard_category,
      urgency_level: newReport.urgency_level,
      address_landmark: newReport.address_landmark
    }
  });

  return newReport;
}

/**
 * Public tracking lookup by case-insensitive tracking code
 */
export function lookupCitizenReport(trackingCode: string): CitizenReport | null {
  if (!trackingCode) return null;
  const normalized = trackingCode.trim().toUpperCase();
  const report = CITIZEN_REPORTS_STORE.find(r => r.tracking_code.toUpperCase() === normalized);
  if (!report) return null;

  // Refresh dynamic SLA status
  const createdDate = new Date(report.created_at).getTime();
  const resolvedDate = report.resolved_at ? new Date(report.resolved_at).getTime() : Date.now();
  report.elapsed_hours = Math.round(((resolvedDate - createdDate) / (3600 * 1000)) * 10) / 10;
  report.is_sla_breached = report.status === "PENDING_TRIAGE" && report.elapsed_hours > 24;

  return report;
}

/**
 * Filtered list of citizen reports for supervisor triage queue
 */
export function listCitizenReports(filters?: {
  ward_id?: number | string;
  status?: string;
  urgency?: string;
  search?: string;
}): CitizenReport[] {
  let list = [...CITIZEN_REPORTS_STORE];

  // Refresh dynamic elapsed hours and SLA breach
  const nowTime = Date.now();
  for (const report of list) {
    const createdDate = new Date(report.created_at).getTime();
    const resolvedDate = report.resolved_at ? new Date(report.resolved_at).getTime() : nowTime;
    report.elapsed_hours = Math.round(((resolvedDate - createdDate) / (3600 * 1000)) * 10) / 10;
    report.is_sla_breached = report.status === "PENDING_TRIAGE" && report.elapsed_hours > 24;
  }

  if (filters?.ward_id) {
    const wardNum = Number(filters.ward_id);
    list = list.filter(r => r.ward_id === wardNum);
  }

  if (filters?.status && filters.status !== "ALL") {
    list = list.filter(r => r.status === filters.status);
  }

  if (filters?.urgency && filters.urgency !== "ALL") {
    list = list.filter(r => r.urgency_level === filters.urgency);
  }

  if (filters?.search) {
    const q = filters.search.toLowerCase().trim();
    list = list.filter(
      r =>
        r.tracking_code.toLowerCase().includes(q) ||
        r.address_landmark.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.reporter_name.toLowerCase().includes(q)
    );
  }

  // Sort by priority urgency and creation time
  const urgencyWeight: Record<CitizenUrgencyLevel, number> = {
    EMERGENCY: 1,
    HIGH: 2,
    MODERATE: 3,
    LOW: 4
  };

  return list.sort((a, b) => {
    const weightDiff = urgencyWeight[a.urgency_level] - urgencyWeight[b.urgency_level];
    if (weightDiff !== 0) return weightDiff;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

/**
 * Updates status of a citizen report by a Municipal Tree Supervisor
 */
export function updateCitizenReportStatus(
  reportId: string,
  newStatus: CitizenReportStatus,
  supervisorNotes?: string
): CitizenReport {
  const index = CITIZEN_REPORTS_STORE.findIndex(r => r.report_id === reportId);
  if (index === -1) {
    throw new Error(`Citizen report not found: ${reportId}`);
  }

  const existing = CITIZEN_REPORTS_STORE[index];
  const oldStatus = existing.status;
  const oldNotes = existing.supervisor_notes;

  existing.status = newStatus;
  if (supervisorNotes !== undefined) {
    existing.supervisor_notes = supervisorNotes;
  }

  if (newStatus === "RESOLVED" || newStatus === "DISMISSED") {
    existing.resolved_at = new Date().toISOString();
  } else {
    existing.resolved_at = null;
  }

  // Audit trail
  recordAuditTrail({
    user_id: "00000000-0000-0000-0000-000000000002", // Municipal Tree Supervisor
    action: "UPDATE",
    table_name: "citizen_reports",
    record_id: reportId,
    old_values: { status: oldStatus, supervisor_notes: oldNotes },
    new_values: { status: newStatus, supervisor_notes: existing.supervisor_notes }
  });

  return existing;
}
