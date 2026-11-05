/**
 * EverLeafDB Database Type System
 * PostgreSQL 16 + PostGIS + pgvector (512-dim)
 * Generated for Phase 3: Relational 3NF Schema & TypeScript Type System
 */

// ============================================================================
// 1. POSTGRESQL ENUM DOMAIN TYPES
// ============================================================================

export type TreeHealthStatus =
  | 'healthy'
  | 'monitor'
  | 'diseased'
  | 'critical'
  | 'under_treatment'
  | 'dead'
  | 'removed';

export type OrganBodyPart =
  | 'leaf'
  | 'bark'
  | 'trunk'
  | 'root'
  | 'canopy';

export type DiseaseSeverity =
  | 'LOW'
  | 'MEDIUM'
  | 'MODERATE'
  | 'HIGH'
  | 'CRITICAL';

export type TreatmentOutcome =
  | 'SUCCESSFUL'
  | 'PARTIAL'
  | 'FAILED'
  | 'ONGOING'
  | 'IN_PROGRESS';

export type WorkOrderPriority =
  | 'LOW'
  | 'STANDARD'
  | 'MEDIUM'
  | 'HIGH'
  | 'EMERGENCY';

export type WorkOrderStatus =
  | 'PENDING'
  | 'DISPATCHED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type AlertStatus =
  | 'PENDING'
  | 'REVIEWED'
  | 'ACTIONED'
  | 'DISMISSED';

export type UserRole =
  | 'admin'
  | 'supervisor'
  | 'field_inspector'
  | 'citizen_reporter';

// ============================================================================
// 2. GEOSPATIAL & VECTOR TYPES (PostGIS & pgvector)
// ============================================================================

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude] in SRID 4326
}

export interface GeoPolygon {
  type: 'Polygon';
  coordinates: [number, number][][]; // Linear ring coordinates in SRID 4326
}

export type Vector512 = number[]; // 512-dimensional float32 vector array

// ============================================================================
// 3. CORE 3NF DATABASE ENTITY INTERFACES (14 RELATIONAL TABLES)
// ============================================================================

/** Table 1: Botanical Species Catalog */
export interface Species {
  species_id: number;
  scientific_name: string;
  common_name: string;
  typical_lifespan_years: number;
  growth_rate: 'SLOW' | 'MODERATE' | 'FAST' | null;
  foliage_type: string | null;
  created_at: string; // ISO 8601 string
}

/** Table 2: Municipal Administrative Wards */
export interface Ward {
  ward_id: number;
  ward_number: string;
  name: string;
  boundary_geom: GeoPolygon | string; // GeoJSON or WKT
  area_sq_km: number | null;
  created_at: string;
}

/** Table 3: Application Users (Inspectors, Supervisors, Admins) */
export interface User {
  user_id: string; // UUID v4
  username: string;
  email: string;
  password_hash?: string; // Excluded from safe client payloads
  role: UserRole;
  assigned_ward_id: number | null;
  is_active: boolean;
  created_at: string;
}

/** Table 4: Registered Urban Trees */
export interface Tree {
  tree_id: string; // UUID v4
  species_id: number;
  ward_id: number;
  location_geom: GeoPoint | string; // GeoJSON Point or WKT
  latitude?: number;
  longitude?: number;
  planted_date: string; // YYYY-MM-DD
  height_meters: number;
  girth_cm: number;
  health_status: TreeHealthStatus;
  last_inspected_at: string | null;
  created_at: string;
}

/** Table 5: Periodic Tree Field Inspections */
export interface Inspection {
  inspection_id: string; // UUID v4
  tree_id: string; // UUID v4
  inspector_id: string; // UUID v4
  inspected_at: string;
  condition_score: number; // 1 to 5
  field_notes: string | null;
  notes_embedding?: Vector512 | null;
  created_at: string;
}

/** Table 6: High-Dimensional Visual Symptom Photos & Embeddings */
export interface InspectionImage {
  image_id: string; // UUID v4
  inspection_id: string; // UUID v4
  file_path: string;
  body_part: OrganBodyPart;
  image_embedding: Vector512;
  captured_at: string;
}

/** Table 7: Master Pathological Disease Library */
export interface Disease {
  disease_id: number;
  name: string;
  category: 'fungal' | 'bacterial' | 'viral' | 'pest' | 'nutrient';
  severity_level: DiseaseSeverity;
  symptoms_description: string | null;
  created_at: string;
}

/** Table 8: Species-to-Disease Susceptibility Matrix (M:N) */
export interface SpeciesDiseaseSusceptibility {
  species_id: number;
  disease_id: number;
  vulnerability_index: 'LOW' | 'MODERATE' | 'HIGH';
}

/** Table 9: Clinical Diagnoses Confirmed by Inspectors / Supervisors */
export interface Diagnosis {
  diagnosis_id: string; // UUID v4
  inspection_id: string; // UUID v4
  disease_id: number;
  confirmed_by_id: string; // UUID v4
  confidence_source: 'manual' | 'vector_suggested';
  similarity_score: number | null;
  diagnosed_at: string;
}

/** Table 10: Master Botanical Treatments & Interventions */
export interface Treatment {
  treatment_id: number;
  name: string;
  treatment_type: 'chemical' | 'biological' | 'pruning' | 'soil_amendment';
  standard_cost: number;
  typical_duration_days: number;
  created_at: string;
}

/** Table 11: Operational Treatment Administration Records */
export interface TreatmentRecord {
  treatment_record_id: string; // UUID v4
  diagnosis_id: string; // UUID v4
  treatment_id: number;
  start_date: string;
  end_date: string | null;
  outcome_status: TreatmentOutcome;
  inspector_remarks: string | null;
  created_at: string;
}

/** Table 12: Field Crew Work Orders */
export interface WorkOrder {
  order_id: string; // UUID v4
  tree_id: string; // UUID v4
  diagnosis_id: string | null; // UUID v4
  assigned_to_user_id: string; // UUID v4
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  due_date: string;
  closed_at: string | null;
  created_at: string;
}

/** Table 13: Automated Risk Alerts Triggered by Vector Nearest Neighbors */
export interface Alert {
  alert_id: string; // UUID v4
  tree_id: string; // UUID v4
  inspection_id: string; // UUID v4
  reason: string;
  similarity_score: number;
  severity: DiseaseSeverity;
  status: AlertStatus;
  created_at: string;
}

/** Table 14: Immutable Security & Relational Audit Trail */
export interface AuditLog {
  log_id: number;
  user_id: string | null;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'DISPATCH' | 'LOGIN';
  table_name: string;
  record_id: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  performed_at: string;
}

// ============================================================================
// 4. JOINED MODELS & EXTENDED DTO INTERFACES
// ============================================================================

export interface TreeWithRelations extends Tree {
  species?: Species;
  ward?: Ward;
  latest_inspection?: Inspection;
  active_alerts?: Alert[];
  open_work_orders?: WorkOrder[];
}

export interface InspectionWithDetails extends Inspection {
  tree?: Tree;
  inspector?: Pick<User, 'user_id' | 'username' | 'email' | 'role'>;
  images?: InspectionImage[];
  diagnoses?: (Diagnosis & { disease?: Disease })[];
}

export interface AlertWithRelations extends Alert {
  tree?: Tree & { species?: Species; ward?: Ward };
  inspection?: Inspection & { images?: InspectionImage[] };
  potential_diseases?: (Disease & { match_score: number })[];
}

export interface WorkOrderWithRelations extends WorkOrder {
  tree?: Tree & { species?: Species; ward?: Ward };
  diagnosis?: Diagnosis & { disease?: Disease };
  assigned_to?: Pick<User, 'user_id' | 'username' | 'email' | 'role'>;
}

export interface WardStatistics {
  ward_id: number;
  ward_number: string;
  name: string;
  total_trees: number;
  healthy_count: number;
  critical_count: number;
  active_alerts_count: number;
  open_work_orders_count: number;
}

// ============================================================================
// 5. VECTOR SIMILARITY SEARCH PAYLOADS
// ============================================================================

export interface VectorSearchQuery {
  embedding: Vector512;
  top_k?: number;
  min_similarity?: number;
  body_part?: OrganBodyPart;
  species_id?: number;
  ward_id?: number;
}

export interface VectorMatchResult {
  image_id: string;
  inspection_id: string;
  tree_id: string;
  body_part: OrganBodyPart;
  file_path: string;
  similarity_score: number;
  cosine_distance: number;
  diagnosis?: {
    disease_id: number;
    name: string;
    category: string;
    severity_level: DiseaseSeverity;
  };
}
