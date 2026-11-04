// EverLeafDB Mock Database Engine with Spatial PostGIS & pgvector HNSW Simulation

export interface Tree {
  tree_id: string;
  tag_number: string;
  species_id: number;
  species_common: string;
  species_scientific: string;
  ward_id: string;
  ward_name: string;
  latitude: number;
  longitude: number;
  height_m: number;
  dbh_cm: number;
  health_status: "HEALTHY" | "MONITOR" | "DISEASED" | "CRITICAL" | "DEAD";
  condition_score: number; // 1-5
  planted_at: string;
  last_inspected_at: string;
  active_alerts_count: number;
}

export interface Ward {
  ward_id: string;
  ward_number: number;
  name: string;
  zone: string;
  area_sq_km: number;
  tree_count: number;
  canopy_cover_percent: number;
  assigned_inspector: string;
  polygon: [number, number][]; // [lng, lat]
  centroid: [number, number]; // [lng, lat]
}

export interface Disease {
  disease_id: number;
  common_name: string;
  pathogen_name: string;
  category: "Fungal" | "Bacterial" | "Viral" | "Pest/Insect";
  severity: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  lethal: boolean;
  standard_treatment: string;
  estimated_cost_usd: number;
  typical_cure_rate: number;
}

export interface Inspection {
  inspection_id: string;
  tree_id: string;
  inspector_id: string;
  condition_score: number;
  organ: "leaf" | "bark" | "trunk" | "root" | "canopy";
  photo_url: string;
  symptom_notes: string;
  inspected_at: string;
  matched_disease?: string;
  cosine_similarity?: number;
  escalation_triggered: boolean;
}

export interface Alert {
  alert_id: string;
  tree_id: string;
  ward_id: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  status: "PENDING" | "ACTIONED" | "DISMISSED";
  detected_disease: string;
  cosine_similarity: number;
  created_at: string;
  assigned_inspector: string;
}

export interface WorkOrder {
  order_id: string;
  tree_id: string;
  alert_id?: string;
  priority: "EMERGENCY" | "HIGH" | "STANDARD";
  status: "DISPATCHED" | "IN_PROGRESS" | "COMPLETED";
  protocol: string;
  assigned_crew: string;
  dispatched_at: string;
  sla_hours: number;
  cost_estimate_usd: number;
}

// -------------------------------------------------------------
// Seed Data: 10 Key Bangalore Municipal Wards (PostGIS Polygons)
// -------------------------------------------------------------
export const WARDS: Ward[] = [
  {
    ward_id: "ward_01",
    ward_number: 1,
    name: "Central Business District",
    zone: "Central",
    area_sq_km: 3.8,
    tree_count: 8420,
    canopy_cover_percent: 28.4,
    assigned_inspector: "inspector_01",
    centroid: [77.601, 12.973],
    polygon: [
      [77.592, 12.968],
      [77.612, 12.969],
      [77.611, 12.982],
      [77.593, 12.981],
      [77.592, 12.968]
    ]
  },
  {
    ward_id: "ward_02",
    ward_number: 2,
    name: "Lalbagh Botanical Zone",
    zone: "South",
    area_sq_km: 4.2,
    tree_count: 24850,
    canopy_cover_percent: 64.2,
    assigned_inspector: "inspector_02",
    centroid: [77.584, 12.951],
    polygon: [
      [77.575, 12.942],
      [77.595, 12.943],
      [77.593, 12.959],
      [77.576, 12.958],
      [77.575, 12.942]
    ]
  },
  {
    ward_id: "ward_03",
    ward_number: 3,
    name: "Cubbon Park Heritage",
    zone: "Central",
    area_sq_km: 2.9,
    tree_count: 18940,
    canopy_cover_percent: 71.5,
    assigned_inspector: "inspector_04",
    centroid: [77.5946, 12.9716],
    polygon: [
      [77.586, 12.966],
      [77.604, 12.967],
      [77.603, 12.980],
      [77.587, 12.979],
      [77.586, 12.966]
    ]
  },
  {
    ward_id: "ward_04",
    ward_number: 4,
    name: "Indiranagar Urban Forest",
    zone: "East",
    area_sq_km: 5.1,
    tree_count: 14200,
    canopy_cover_percent: 36.8,
    assigned_inspector: "inspector_05",
    centroid: [77.641, 12.978],
    polygon: [
      [77.630, 12.969],
      [77.652, 12.970],
      [77.651, 12.988],
      [77.631, 12.987],
      [77.630, 12.969]
    ]
  },
  {
    ward_id: "ward_05",
    ward_number: 5,
    name: "Jayanagar Boulevard",
    zone: "South",
    area_sq_km: 4.8,
    tree_count: 16400,
    canopy_cover_percent: 42.1,
    assigned_inspector: "inspector_06",
    centroid: [77.581, 12.930],
    polygon: [
      [77.570, 12.920],
      [77.592, 12.921],
      [77.591, 12.940],
      [77.571, 12.939],
      [77.570, 12.920]
    ]
  },
  {
    ward_id: "ward_14",
    ward_number: 14,
    name: "Malleswaram Canopy Sector",
    zone: "North",
    area_sq_km: 3.5,
    tree_count: 11250,
    canopy_cover_percent: 39.4,
    assigned_inspector: "inspector_14",
    centroid: [77.571, 13.003],
    polygon: [
      [77.560, 12.993],
      [77.582, 12.994],
      [77.581, 13.013],
      [77.561, 13.012],
      [77.560, 12.993]
    ]
  }
];

// -------------------------------------------------------------
// Seed Data: Pathological Diseases Repository
// -------------------------------------------------------------
export const DISEASES: Disease[] = [
  {
    disease_id: 1,
    common_name: "Ganoderma Root & Butt Rot",
    pathogen_name: "Ganoderma lucidum",
    category: "Fungal",
    severity: "CRITICAL",
    lethal: true,
    standard_treatment: "Propiconazole Root Drench + Crown Weight Reduction",
    estimated_cost_usd: 180,
    typical_cure_rate: 88.2
  },
  {
    disease_id: 2,
    common_name: "Bacterial Wetwood Canker",
    pathogen_name: "Xanthomonas arboricola",
    category: "Bacterial",
    severity: "HIGH",
    lethal: false,
    standard_treatment: "Oxytetracycline Micro-Injection + Bark Debridement",
    estimated_cost_usd: 120,
    typical_cure_rate: 91.5
  },
  {
    disease_id: 3,
    common_name: "Emerald Borer Beetle Infestation",
    pathogen_name: "Agrilus planipennis",
    category: "Pest/Insect",
    severity: "CRITICAL",
    lethal: true,
    standard_treatment: "Emamectin Benzoate Trunk Injection + Quarantine Girdling",
    estimated_cost_usd: 240,
    typical_cure_rate: 84.0
  },
  {
    disease_id: 4,
    common_name: "Powdery Mildew Necrosis",
    pathogen_name: "Erysiphe alphitoides",
    category: "Fungal",
    severity: "MODERATE",
    lethal: false,
    standard_treatment: "Sulfur/Potassium Bicarbonate Foliar Spray",
    estimated_cost_usd: 65,
    typical_cure_rate: 96.8
  },
  {
    disease_id: 5,
    common_name: "Anthracnose Leaf Scorch",
    pathogen_name: "Apiognomonia veneta",
    category: "Fungal",
    severity: "MODERATE",
    lethal: false,
    standard_treatment: "Chlorothalonil Systemic Application",
    estimated_cost_usd: 90,
    typical_cure_rate: 94.2
  }
];

// -------------------------------------------------------------
// Seed Data: Sample Cataloged Trees (PostGIS Points)
// -------------------------------------------------------------
export const TREES: Tree[] = [
  {
    tree_id: "tree_1084",
    tag_number: "TREE-1084",
    species_id: 1,
    species_common: "Heritage Banyan",
    species_scientific: "Ficus benghalensis",
    ward_id: "ward_03",
    ward_name: "Cubbon Park Heritage",
    latitude: 12.9716,
    longitude: 77.5946,
    height_m: 22.4,
    dbh_cm: 185.0,
    health_status: "CRITICAL",
    condition_score: 1,
    planted_at: "1932-06-15",
    last_inspected_at: "2026-11-04T18:24:00Z",
    active_alerts_count: 1
  },
  {
    tree_id: "tree_1085",
    tag_number: "TREE-1085",
    species_id: 2,
    species_common: "Neem Tree",
    species_scientific: "Azadirachta indica",
    ward_id: "ward_03",
    ward_name: "Cubbon Park Heritage",
    latitude: 12.9721,
    longitude: 77.5951,
    height_m: 14.8,
    dbh_cm: 64.2,
    health_status: "HEALTHY",
    condition_score: 5,
    planted_at: "1988-08-20",
    last_inspected_at: "2026-11-03T11:15:00Z",
    active_alerts_count: 0
  },
  {
    tree_id: "tree_1086",
    tag_number: "TREE-1086",
    species_id: 3,
    species_common: "Gulmohar (Flamboyant)",
    species_scientific: "Delonix regia",
    ward_id: "ward_03",
    ward_name: "Cubbon Park Heritage",
    latitude: 12.9712,
    longitude: 77.5938,
    height_m: 11.2,
    dbh_cm: 48.0,
    health_status: "MONITOR",
    condition_score: 3,
    planted_at: "2002-04-10",
    last_inspected_at: "2026-11-01T09:30:00Z",
    active_alerts_count: 0
  },
  {
    tree_id: "tree_2011",
    tag_number: "TREE-2011",
    species_id: 1,
    species_common: "Heritage Banyan",
    species_scientific: "Ficus benghalensis",
    ward_id: "ward_02",
    ward_name: "Lalbagh Botanical Zone",
    latitude: 12.9512,
    longitude: 77.5841,
    height_m: 26.5,
    dbh_cm: 210.0,
    health_status: "HEALTHY",
    condition_score: 4,
    planted_at: "1895-09-01",
    last_inspected_at: "2026-10-28T14:00:00Z",
    active_alerts_count: 0
  },
  {
    tree_id: "tree_3042",
    tag_number: "TREE-3042",
    species_id: 4,
    species_common: "Blue Jacaranda",
    species_scientific: "Jacaranda mimosifolia",
    ward_id: "ward_04",
    ward_name: "Indiranagar Urban Forest",
    latitude: 12.9782,
    longitude: 77.6415,
    height_m: 13.5,
    dbh_cm: 52.4,
    health_status: "DISEASED",
    condition_score: 2,
    planted_at: "1999-11-12",
    last_inspected_at: "2026-11-02T16:20:00Z",
    active_alerts_count: 1
  },
  {
    tree_id: "tree_4190",
    tag_number: "TREE-4190",
    species_id: 1,
    species_common: "Heritage Banyan",
    species_scientific: "Ficus benghalensis",
    ward_id: "ward_14",
    ward_name: "Malleswaram Canopy Sector",
    latitude: 13.0035,
    longitude: 77.5714,
    height_m: 19.2,
    dbh_cm: 160.0,
    health_status: "CRITICAL",
    condition_score: 1,
    planted_at: "1945-02-18",
    last_inspected_at: "2026-11-04T20:10:00Z",
    active_alerts_count: 1
  }
];

// -------------------------------------------------------------
// Seed Data: Active Alerts & Stored Procedures
// -------------------------------------------------------------
export const ALERTS: Alert[] = [
  {
    alert_id: "ALT-1049",
    tree_id: "tree_1084",
    ward_id: "ward_03",
    severity: "CRITICAL",
    status: "PENDING",
    detected_disease: "Ganoderma Root & Butt Rot",
    cosine_similarity: 0.892,
    created_at: "2026-11-04T18:24:12Z",
    assigned_inspector: "inspector_04"
  },
  {
    alert_id: "ALT-1050",
    tree_id: "tree_4190",
    ward_id: "ward_14",
    severity: "CRITICAL",
    status: "PENDING",
    detected_disease: "Ganoderma Root & Butt Rot",
    cosine_similarity: 0.914,
    created_at: "2026-11-04T20:10:05Z",
    assigned_inspector: "inspector_14"
  },
  {
    alert_id: "ALT-1041",
    tree_id: "tree_3042",
    ward_id: "ward_04",
    severity: "WARNING",
    status: "ACTIONED",
    detected_disease: "Bacterial Wetwood Canker",
    cosine_similarity: 0.841,
    created_at: "2026-11-02T16:20:18Z",
    assigned_inspector: "inspector_05"
  }
];

export const WORK_ORDERS: WorkOrder[] = [
  {
    order_id: "WO-4192",
    tree_id: "tree_1084",
    alert_id: "ALT-1049",
    priority: "EMERGENCY",
    status: "DISPATCHED",
    protocol: "Propiconazole Root Drench + Canopy Trimming",
    assigned_crew: "North Emergency Crew A",
    dispatched_at: "2026-11-04T19:00:00Z",
    sla_hours: 48,
    cost_estimate_usd: 180
  },
  {
    order_id: "WO-4188",
    tree_id: "tree_3042",
    alert_id: "ALT-1041",
    priority: "STANDARD",
    status: "IN_PROGRESS",
    protocol: "Oxytetracycline Micro-Injection",
    assigned_crew: "East Maintenance Unit 2",
    dispatched_at: "2026-11-03T08:30:00Z",
    sla_hours: 72,
    cost_estimate_usd: 120
  }
];

// -------------------------------------------------------------
// Spatial & Vector Utility Math
// -------------------------------------------------------------
export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Ray-casting algorithm for Point-in-Polygon (PostGIS ST_Contains simulation)
export function pointInPolygon(point: [number, number], vs: [number, number][]): boolean {
  const x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0], yi = vs[i][1];
    const xj = vs[j][0], yj = vs[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

