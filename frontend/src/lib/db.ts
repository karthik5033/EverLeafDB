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
  health_status:
    | "HEALTHY"
    | "MONITOR"
    | "DISEASED"
    | "CRITICAL"
    | "DEAD"
    | "UNDER_TREATMENT"
    | "healthy"
    | "monitor"
    | "diseased"
    | "critical"
    | "under_treatment"
    | "dead"
    | "removed";
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
  category: "Fungal" | "Bacterial" | "Viral" | "Pest/Insect" | "Nutrient" | string;
  severity: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  lethal: boolean;
  standard_treatment: string;
  estimated_cost_usd: number;
  typical_cure_rate: number;
}

export interface SpeciesSeed {
  species_id: number;
  scientific_name: string;
  common_name: string;
  typical_lifespan_years: number;
  growth_rate: "SLOW" | "MODERATE" | "FAST";
  foliage_type: string;
}

export interface TreatmentSeed {
  treatment_id: number;
  name: string;
  treatment_type: "chemical" | "biological" | "pruning" | "soil_amendment";
  standard_cost: number;
  typical_duration_days: number;
}

export interface SusceptibilitySeed {
  species_id: number;
  disease_id: number;
  vulnerability_index: "LOW" | "MODERATE" | "HIGH";
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
    name: "Koramangala Canopy Corridor",
    zone: "South",
    area_sq_km: 4.6,
    tree_count: 16400,
    canopy_cover_percent: 42.1,
    assigned_inspector: "inspector_06",
    centroid: [77.621, 12.934],
    polygon: [
      [77.610, 12.925],
      [77.632, 12.926],
      [77.631, 12.943],
      [77.612, 12.942],
      [77.610, 12.925]
    ]
  },
  {
    ward_id: "ward_06",
    ward_number: 6,
    name: "Malleswaram Heritage Precinct",
    zone: "North",
    area_sq_km: 4.8,
    tree_count: 15800,
    canopy_cover_percent: 48.5,
    assigned_inspector: "inspector_07",
    centroid: [77.571, 13.003],
    polygon: [
      [77.560, 12.993],
      [77.582, 12.994],
      [77.581, 13.013],
      [77.561, 13.012],
      [77.560, 12.993]
    ]
  },
  {
    ward_id: "ward_07",
    ward_number: 7,
    name: "Jayanagar Green Belt",
    zone: "South",
    area_sq_km: 5.2,
    tree_count: 19200,
    canopy_cover_percent: 54.0,
    assigned_inspector: "inspector_08",
    centroid: [77.581, 12.925],
    polygon: [
      [77.570, 12.915],
      [77.592, 12.916],
      [77.590, 12.935],
      [77.571, 12.934],
      [77.570, 12.915]
    ]
  },
  {
    ward_id: "ward_08",
    ward_number: 8,
    name: "Whitefield Tech Corridor",
    zone: "East",
    area_sq_km: 7.5,
    tree_count: 12100,
    canopy_cover_percent: 29.5,
    assigned_inspector: "inspector_09",
    centroid: [77.745, 12.972],
    polygon: [
      [77.730, 12.960],
      [77.760, 12.961],
      [77.758, 12.985],
      [77.732, 12.984],
      [77.730, 12.960]
    ]
  },
  {
    ward_id: "ward_09",
    ward_number: 9,
    name: "Hebbal Lake Sanctuary",
    zone: "North",
    area_sq_km: 6.4,
    tree_count: 21500,
    canopy_cover_percent: 61.2,
    assigned_inspector: "inspector_10",
    centroid: [77.595, 13.042],
    polygon: [
      [77.580, 13.030],
      [77.610, 13.031],
      [77.608, 13.055],
      [77.582, 13.054],
      [77.580, 13.030]
    ]
  },
  {
    ward_id: "ward_14",
    ward_number: 14,
    name: "Ulsoor Lake Catchment",
    zone: "Central",
    area_sq_km: 3.5,
    tree_count: 11250,
    canopy_cover_percent: 39.4,
    assigned_inspector: "inspector_14",
    centroid: [77.625, 12.983],
    polygon: [
      [77.615, 12.975],
      [77.635, 12.976],
      [77.634, 12.991],
      [77.616, 12.990],
      [77.615, 12.975]
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
    severity: "LOW",
    lethal: false,
    standard_treatment: "Sulfur/Potassium Bicarbonate Foliar Spray",
    estimated_cost_usd: 45,
    typical_cure_rate: 96.8
  },
  {
    disease_id: 5,
    common_name: "Anthracnose Leaf Scorch",
    pathogen_name: "Apiognomonia veneta",
    category: "Fungal",
    severity: "MODERATE",
    lethal: false,
    standard_treatment: "Copper Hydroxide Micronized Spray + Airflow Thinning",
    estimated_cost_usd: 75,
    typical_cure_rate: 94.2
  },
  {
    disease_id: 6,
    common_name: "Sooty Mold Infestation",
    pathogen_name: "Capnodium citri",
    category: "Fungal",
    severity: "LOW",
    lethal: false,
    standard_treatment: "Horticultural Mineral Oil + Bio-Inoculant",
    estimated_cost_usd: 55,
    typical_cure_rate: 98.0
  },
  {
    disease_id: 7,
    common_name: "Fusarium Vascular Wilt",
    pathogen_name: "Fusarium oxysporum",
    category: "Fungal",
    severity: "HIGH",
    lethal: true,
    standard_treatment: "Trichoderma harzianum Root Bio-Barrier Drench",
    estimated_cost_usd: 95,
    typical_cure_rate: 76.5
  },
  {
    disease_id: 8,
    common_name: "Cercospora Leaf Spot",
    pathogen_name: "Cercospora microsora",
    category: "Fungal",
    severity: "LOW",
    lethal: false,
    standard_treatment: "Potassium Bicarbonate Foliar Spray",
    estimated_cost_usd: 45,
    typical_cure_rate: 95.0
  },
  {
    disease_id: 9,
    common_name: "Puccinia Foliar Rust",
    pathogen_name: "Puccinia spp.",
    category: "Fungal",
    severity: "MODERATE",
    lethal: false,
    standard_treatment: "Bacillus subtilis Bio-Fungicide Canopy Fogging",
    estimated_cost_usd: 65,
    typical_cure_rate: 92.4
  },
  {
    disease_id: 10,
    common_name: "Root-Knot Nematode Galls",
    pathogen_name: "Meloidogyne incognita",
    category: "Pest/Insect",
    severity: "HIGH",
    lethal: false,
    standard_treatment: "Beneficial Entomopathogenic Nematode Soil Application",
    estimated_cost_usd: 130,
    typical_cure_rate: 85.0
  },
  {
    disease_id: 11,
    common_name: "Armillaria Honey Fungus Rot",
    pathogen_name: "Armillaria mellea",
    category: "Fungal",
    severity: "CRITICAL",
    lethal: true,
    standard_treatment: "Root Flare Excavation & Soil Bio-Inoculation",
    estimated_cost_usd: 210,
    typical_cure_rate: 71.0
  },
  {
    disease_id: 12,
    common_name: "Phytophthora Collar Rot",
    pathogen_name: "Phytophthora cactorum",
    category: "Fungal",
    severity: "CRITICAL",
    lethal: true,
    standard_treatment: "Macro-Infusion Systemic Fungicide Injection",
    estimated_cost_usd: 290,
    typical_cure_rate: 79.5
  },
  {
    disease_id: 13,
    common_name: "Crown Gall",
    pathogen_name: "Agrobacterium tumefaciens",
    category: "Bacterial",
    severity: "MODERATE",
    lethal: false,
    standard_treatment: "Selective Scaffold Debridement & Heat Cauterization",
    estimated_cost_usd: 150,
    typical_cure_rate: 87.0
  },
  {
    disease_id: 14,
    common_name: "Bacterial Leaf Scorch",
    pathogen_name: "Xylella fastidiosa",
    category: "Bacterial",
    severity: "HIGH",
    lethal: true,
    standard_treatment: "Oxytetracycline Micro-Injection",
    estimated_cost_usd: 140,
    typical_cure_rate: 81.2
  },
  {
    disease_id: 15,
    common_name: "Verticillium Vascular Wilt",
    pathogen_name: "Verticillium dahliae",
    category: "Fungal",
    severity: "HIGH",
    lethal: true,
    standard_treatment: "Soil Solarization & Trichoderma Inoculation",
    estimated_cost_usd: 110,
    typical_cure_rate: 78.4
  },
  {
    disease_id: 16,
    common_name: "Longhorn Stem Borer Beetle",
    pathogen_name: "Batocera rufomaculata",
    category: "Pest/Insect",
    severity: "HIGH",
    lethal: true,
    standard_treatment: "Emamectin Benzoate Trunk Micro-Injection",
    estimated_cost_usd: 220,
    typical_cure_rate: 83.5
  },
  {
    disease_id: 17,
    common_name: "Aphid & Scale Colony Outbreak",
    pathogen_name: "Aphis gossypii",
    category: "Pest/Insect",
    severity: "MODERATE",
    lethal: false,
    standard_treatment: "Horticultural Mineral Oil Canopy Fogging",
    estimated_cost_usd: 60,
    typical_cure_rate: 96.0
  },
  {
    disease_id: 18,
    common_name: "Whitefly Foliage Chlorosis",
    pathogen_name: "Bemisia tabaci",
    category: "Pest/Insect",
    severity: "MODERATE",
    lethal: false,
    standard_treatment: "Beauveria bassiana Bio-Spray",
    estimated_cost_usd: 55,
    typical_cure_rate: 93.0
  },
  {
    disease_id: 19,
    common_name: "Dothiorella Stem Canker",
    pathogen_name: "Dothiorella gregaria",
    category: "Fungal",
    severity: "HIGH",
    lethal: false,
    standard_treatment: "Bark Debridement & Copper Barrier Sealant",
    estimated_cost_usd: 135,
    typical_cure_rate: 86.8
  },
  {
    disease_id: 20,
    common_name: "Iron Chlorosis Deficiency",
    pathogen_name: "Physiological Nutrient Deficiency",
    category: "Nutrient",
    severity: "LOW",
    lethal: false,
    standard_treatment: "Soil Aeration & Iron Chelate (Fe-EDDHA) Treatment",
    estimated_cost_usd: 85,
    typical_cure_rate: 97.5
  }
];

export const SPECIES_SEED: SpeciesSeed[] = [
  { species_id: 1, scientific_name: "Azadirachta indica", common_name: "Neem Tree", typical_lifespan_years: 200, growth_rate: "FAST", foliage_type: "Semi-evergreen" },
  { species_id: 2, scientific_name: "Ficus benghalensis", common_name: "Heritage Banyan", typical_lifespan_years: 350, growth_rate: "SLOW", foliage_type: "Evergreen" },
  { species_id: 3, scientific_name: "Ficus religiosa", common_name: "Sacred Peepal", typical_lifespan_years: 300, growth_rate: "MODERATE", foliage_type: "Deciduous" },
  { species_id: 4, scientific_name: "Jacaranda mimosifolia", common_name: "Blue Jacaranda", typical_lifespan_years: 80, growth_rate: "FAST", foliage_type: "Semi-evergreen" },
  { species_id: 5, scientific_name: "Delonix regia", common_name: "Royal Gulmohar", typical_lifespan_years: 60, growth_rate: "FAST", foliage_type: "Deciduous" },
  { species_id: 6, scientific_name: "Tectona grandis", common_name: "Teak Tree", typical_lifespan_years: 120, growth_rate: "MODERATE", foliage_type: "Deciduous" },
  { species_id: 7, scientific_name: "Samanea saman", common_name: "Rain Tree", typical_lifespan_years: 100, growth_rate: "FAST", foliage_type: "Semi-evergreen" },
  { species_id: 8, scientific_name: "Mangifera indica", common_name: "Mango Tree", typical_lifespan_years: 150, growth_rate: "MODERATE", foliage_type: "Evergreen" },
  { species_id: 9, scientific_name: "Peltophorum pterocarpum", common_name: "Yellow Copperpod", typical_lifespan_years: 80, growth_rate: "FAST", foliage_type: "Deciduous" },
  { species_id: 10, scientific_name: "Madhuca longifolia", common_name: "Mahua Tree", typical_lifespan_years: 100, growth_rate: "SLOW", foliage_type: "Deciduous" },
  { species_id: 11, scientific_name: "Saraca asoca", common_name: "Sita Ashoka", typical_lifespan_years: 70, growth_rate: "SLOW", foliage_type: "Evergreen" },
  { species_id: 12, scientific_name: "Grevillea robusta", common_name: "Silver Oak", typical_lifespan_years: 65, growth_rate: "FAST", foliage_type: "Evergreen" },
  { species_id: 13, scientific_name: "Tabebuia rosea", common_name: "Pink Trumpet Tree", typical_lifespan_years: 75, growth_rate: "FAST", foliage_type: "Deciduous" },
  { species_id: 14, scientific_name: "Tamarindus indica", common_name: "Tamarind Tree", typical_lifespan_years: 250, growth_rate: "SLOW", foliage_type: "Evergreen" },
  { species_id: 15, scientific_name: "Syzygium cumini", common_name: "Jamun (Black Plum)", typical_lifespan_years: 100, growth_rate: "MODERATE", foliage_type: "Evergreen" },
  { species_id: 16, scientific_name: "Erythrina variegata", common_name: "Indian Coral Tree", typical_lifespan_years: 50, growth_rate: "FAST", foliage_type: "Deciduous" },
  { species_id: 17, scientific_name: "Millettia pinnata", common_name: "Pongamia (Karanja)", typical_lifespan_years: 90, growth_rate: "FAST", foliage_type: "Semi-evergreen" },
  { species_id: 18, scientific_name: "Lagerstroemia speciosa", common_name: "Pride of India", typical_lifespan_years: 60, growth_rate: "MODERATE", foliage_type: "Deciduous" },
  { species_id: 19, scientific_name: "Terminalia catappa", common_name: "Indian Almond", typical_lifespan_years: 70, growth_rate: "FAST", foliage_type: "Deciduous" },
  { species_id: 20, scientific_name: "Neolamarckia cadamba", common_name: "Kadamba Tree", typical_lifespan_years: 50, growth_rate: "FAST", foliage_type: "Evergreen" },
  { species_id: 21, scientific_name: "Cassia fistula", common_name: "Golden Shower", typical_lifespan_years: 60, growth_rate: "MODERATE", foliage_type: "Deciduous" },
  { species_id: 22, scientific_name: "Couroupita guianensis", common_name: "Cannonball Tree", typical_lifespan_years: 90, growth_rate: "MODERATE", foliage_type: "Evergreen" },
  { species_id: 23, scientific_name: "Bombax ceiba", common_name: "Red Silk Cotton", typical_lifespan_years: 100, growth_rate: "FAST", foliage_type: "Deciduous" },
  { species_id: 24, scientific_name: "Terminalia arjuna", common_name: "Arjuna Tree", typical_lifespan_years: 150, growth_rate: "MODERATE", foliage_type: "Semi-evergreen" },
  { species_id: 25, scientific_name: "Butea monosperma", common_name: "Flame of the Forest", typical_lifespan_years: 80, growth_rate: "SLOW", foliage_type: "Deciduous" }
];

export const TREATMENTS_SEED: TreatmentSeed[] = [
  { treatment_id: 1, name: "Propiconazole Root Drench + Crown Weight Reduction", treatment_type: "chemical", standard_cost: 180.0, typical_duration_days: 30 },
  { treatment_id: 2, name: "Oxytetracycline Trunk Micro-Injection + Bark Debridement", treatment_type: "chemical", standard_cost: 120.0, typical_duration_days: 21 },
  { treatment_id: 3, name: "Emamectin Benzoate Trunk Micro-Injection", treatment_type: "chemical", standard_cost: 240.0, typical_duration_days: 14 },
  { treatment_id: 4, name: "Potassium Bicarbonate Eco-Fungicide Foliar Spray", treatment_type: "biological", standard_cost: 45.0, typical_duration_days: 10 },
  { treatment_id: 5, name: "Copper Hydroxide Micronized Spray + Canopy Airflow Thinning", treatment_type: "chemical", standard_cost: 75.0, typical_duration_days: 14 },
  { treatment_id: 6, name: "Horticultural Mineral Oil + Beauveria bassiana Bio-Inoculant", treatment_type: "biological", standard_cost: 55.0, typical_duration_days: 12 },
  { treatment_id: 7, name: "Trichoderma harzianum Antagonist Root Bio-Barrier Drench", treatment_type: "biological", standard_cost: 95.0, typical_duration_days: 45 },
  { treatment_id: 8, name: "Selective Lateral Scaffold Debridement & Sanitized Pruning", treatment_type: "pruning", standard_cost: 150.0, typical_duration_days: 7 },
  { treatment_id: 9, name: "Soil Aeration & Slow-Release Iron Chelate (Fe-EDDHA) Treatment", treatment_type: "soil_amendment", standard_cost: 85.0, typical_duration_days: 60 },
  { treatment_id: 10, name: "Macro-Infusion Systemic Fungicide Injection", treatment_type: "chemical", standard_cost: 290.0, typical_duration_days: 28 },
  { treatment_id: 11, name: "Bacillus subtilis Bio-Fungicide Canopy Fogging", treatment_type: "biological", standard_cost: 65.0, typical_duration_days: 14 },
  { treatment_id: 12, name: "Hazardous Deadwood Removal & End-Weight Relieving Cuts", treatment_type: "pruning", standard_cost: 210.0, typical_duration_days: 5 },
  { treatment_id: 13, name: "Deep Root Hydraulic Micro-Nutrient Compost Tea Injection", treatment_type: "soil_amendment", standard_cost: 115.0, typical_duration_days: 30 },
  { treatment_id: 14, name: "Nemasys Beneficial Entomopathogenic Nematode Soil Application", treatment_type: "biological", standard_cost: 130.0, typical_duration_days: 21 },
  { treatment_id: 15, name: "Root Flare Excavation & Girdling Root Surgical Amputation", treatment_type: "pruning", standard_cost: 175.0, typical_duration_days: 14 }
];

export const SUSCEPTIBILITY_SEED: SusceptibilitySeed[] = [
  { species_id: 2, disease_id: 1, vulnerability_index: "HIGH" },
  { species_id: 2, disease_id: 2, vulnerability_index: "MODERATE" },
  { species_id: 2, disease_id: 11, vulnerability_index: "HIGH" },
  { species_id: 3, disease_id: 1, vulnerability_index: "HIGH" },
  { species_id: 3, disease_id: 4, vulnerability_index: "LOW" },
  { species_id: 3, disease_id: 13, vulnerability_index: "MODERATE" },
  { species_id: 5, disease_id: 1, vulnerability_index: "HIGH" },
  { species_id: 5, disease_id: 11, vulnerability_index: "HIGH" },
  { species_id: 5, disease_id: 16, vulnerability_index: "HIGH" },
  { species_id: 4, disease_id: 5, vulnerability_index: "HIGH" },
  { species_id: 4, disease_id: 7, vulnerability_index: "MODERATE" },
  { species_id: 4, disease_id: 18, vulnerability_index: "HIGH" },
  { species_id: 6, disease_id: 9, vulnerability_index: "HIGH" },
  { species_id: 6, disease_id: 16, vulnerability_index: "HIGH" },
  { species_id: 7, disease_id: 1, vulnerability_index: "HIGH" },
  { species_id: 7, disease_id: 2, vulnerability_index: "HIGH" },
  { species_id: 8, disease_id: 5, vulnerability_index: "HIGH" },
  { species_id: 8, disease_id: 4, vulnerability_index: "HIGH" },
  { species_id: 9, disease_id: 1, vulnerability_index: "HIGH" },
  { species_id: 1, disease_id: 4, vulnerability_index: "LOW" },
  { species_id: 1, disease_id: 8, vulnerability_index: "LOW" },
  { species_id: 1, disease_id: 10, vulnerability_index: "LOW" }
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
  },
  {
    tree_id: "tree_5011",
    tag_number: "TREE-5011",
    species_id: 1,
    species_common: "Neem Tree",
    species_scientific: "Azadirachta indica",
    ward_id: "ward_03",
    ward_name: "Cubbon Park Heritage",
    latitude: 12.9730,
    longitude: 77.5960,
    height_m: 13.5,
    dbh_cm: 58.0,
    health_status: "MONITOR",
    condition_score: 3,
    planted_at: "1995-07-22",
    last_inspected_at: "2025-11-10T10:00:00Z", // ~360 days overdue
    active_alerts_count: 0
  },
  {
    tree_id: "tree_5012",
    tag_number: "TREE-5012",
    species_id: 3,
    species_common: "Sacred Peepal",
    species_scientific: "Ficus religiosa",
    ward_id: "ward_02",
    ward_name: "Lalbagh Botanical Zone",
    latitude: 12.9520,
    longitude: 77.5860,
    height_m: 21.0,
    dbh_cm: 140.0,
    health_status: "DISEASED",
    condition_score: 2,
    planted_at: "1960-03-10",
    last_inspected_at: "2025-08-15T09:00:00Z", // ~447 days overdue
    active_alerts_count: 0
  },
  {
    tree_id: "tree_5013",
    tag_number: "TREE-5013",
    species_id: 4,
    species_common: "Royal Gulmohar",
    species_scientific: "Delonix regia",
    ward_id: "ward_14",
    ward_name: "Malleswaram Canopy Sector",
    latitude: 13.0040,
    longitude: 77.5720,
    height_m: 11.2,
    dbh_cm: 45.0,
    health_status: "MONITOR",
    condition_score: 3,
    planted_at: "2005-09-14",
    last_inspected_at: "2026-03-20T14:00:00Z", // ~230 days overdue
    active_alerts_count: 0
  },
  {
    tree_id: "tree_5014",
    tag_number: "TREE-5014",
    species_id: 2,
    species_common: "Heritage Banyan",
    species_scientific: "Ficus benghalensis",
    ward_id: "ward_03",
    ward_name: "Cubbon Park Heritage",
    latitude: 12.9710,
    longitude: 77.5940,
    height_m: 24.5,
    dbh_cm: 195.0,
    health_status: "HEALTHY",
    condition_score: 4,
    planted_at: "1938-11-05",
    last_inspected_at: "2026-04-12T11:30:00Z", // ~207 days overdue
    active_alerts_count: 0
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

