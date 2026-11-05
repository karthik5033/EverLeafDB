-- ============================================================================
-- EverLeafDB: Botanical Species & Disease Taxonomy Seeding
-- Phase 6: 25 Species, 20 Diseases, M:N Susceptibility Matrix, 15 Treatments
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 01. BOTANICAL SPECIES CATALOG (25 URBAN SPECIES)
-- ----------------------------------------------------------------------------

INSERT INTO species (species_id, scientific_name, common_name, typical_lifespan_years, growth_rate, foliage_type)
VALUES
  (1, 'Azadirachta indica', 'Neem Tree', 200, 'FAST', 'Semi-evergreen'),
  (2, 'Ficus benghalensis', 'Heritage Banyan', 350, 'SLOW', 'Evergreen'),
  (3, 'Ficus religiosa', 'Sacred Peepal', 300, 'MODERATE', 'Deciduous'),
  (4, 'Jacaranda mimosifolia', 'Blue Jacaranda', 80, 'FAST', 'Semi-evergreen'),
  (5, 'Delonix regia', 'Royal Gulmohar', 60, 'FAST', 'Deciduous'),
  (6, 'Tectona grandis', 'Teak Tree', 120, 'MODERATE', 'Deciduous'),
  (7, 'Samanea saman', 'Rain Tree', 100, 'FAST', 'Semi-evergreen'),
  (8, 'Mangifera indica', 'Mango Tree', 150, 'MODERATE', 'Evergreen'),
  (9, 'Peltophorum pterocarpum', 'Yellow Copperpod', 80, 'FAST', 'Deciduous'),
  (10, 'Madhuca longifolia', 'Mahua Tree', 100, 'SLOW', 'Deciduous'),
  (11, 'Saraca asoca', 'Sita Ashoka', 70, 'SLOW', 'Evergreen'),
  (12, 'Grevillea robusta', 'Silver Oak', 65, 'FAST', 'Evergreen'),
  (13, 'Tabebuia rosea', 'Pink Trumpet Tree', 75, 'FAST', 'Deciduous'),
  (14, 'Tamarindus indica', 'Tamarind Tree', 250, 'SLOW', 'Evergreen'),
  (15, 'Syzygium cumini', 'Jamun (Black Plum)', 100, 'MODERATE', 'Evergreen'),
  (16, 'Erythrina variegata', 'Indian Coral Tree', 50, 'FAST', 'Deciduous'),
  (17, 'Millettia pinnata', 'Pongamia (Karanja)', 90, 'FAST', 'Semi-evergreen'),
  (18, 'Lagerstroemia speciosa', 'Pride of India', 60, 'MODERATE', 'Deciduous'),
  (19, 'Terminalia catappa', 'Indian Almond', 70, 'FAST', 'Deciduous'),
  (20, 'Neolamarckia cadamba', 'Kadamba Tree', 50, 'FAST', 'Evergreen'),
  (21, 'Cassia fistula', 'Golden Shower (Amaltas)', 60, 'MODERATE', 'Deciduous'),
  (22, 'Couroupita guianensis', 'Cannonball Tree', 90, 'MODERATE', 'Evergreen'),
  (23, 'Bombax ceiba', 'Red Silk Cotton', 100, 'FAST', 'Deciduous'),
  (24, 'Terminalia arjuna', 'Arjuna Tree', 150, 'MODERATE', 'Semi-evergreen'),
  (25, 'Butea monosperma', 'Flame of the Forest', 80, 'SLOW', 'Deciduous')
ON CONFLICT (species_id) DO UPDATE SET
  scientific_name = EXCLUDED.scientific_name,
  common_name = EXCLUDED.common_name,
  typical_lifespan_years = EXCLUDED.typical_lifespan_years,
  growth_rate = EXCLUDED.growth_rate,
  foliage_type = EXCLUDED.foliage_type;

SELECT setval('species_species_id_seq', (SELECT MAX(species_id) FROM species));

-- ----------------------------------------------------------------------------
-- 02. MASTER PATHOLOGICAL DISEASE LIBRARY (20 PROFILES)
-- ----------------------------------------------------------------------------

INSERT INTO diseases (disease_id, name, category, severity_level, symptoms_description)
VALUES
  (1, 'Ganoderma Root & Butt Rot', 'fungal', 'CRITICAL', 'Basidiocarps at tree base, extensive heartwood and sapwood degradation, root anchorage failure risk.'),
  (2, 'Bacterial Wetwood Canker', 'bacterial', 'HIGH', 'Fermenting sap exuding from trunk fissures with rancid odor, internal gas pressure, bark delamination.'),
  (3, 'Emerald Borer Beetle Infestation', 'pest', 'CRITICAL', 'D-shaped exit holes, serpentine larval feeding galleries in phloem, canopy dieback starting at crown apex.'),
  (4, 'Powdery Mildew', 'fungal', 'LOW', 'White talcum-like epiphytic fungal mycelium coating upper leaf surfaces, slight photosynthetic reduction.'),
  (5, 'Anthracnose Leaf Blight', 'fungal', 'MODERATE', 'Irregular water-soaked necrotic lesions along primary leaf veins, premature leaf senescence during wet season.'),
  (6, 'Sooty Mold Infestation', 'fungal', 'LOW', 'Black crustaceous fungal film colonizing honeydew secretions from homopteran sap-sucking insects.'),
  (7, 'Fusarium Vascular Wilt', 'fungal', 'HIGH', 'Xylem vessel plugging, unilateral branch chlorosis and wilting, dark brown vascular discoloration in cross-section.'),
  (8, 'Cercospora Leaf Spot', 'fungal', 'LOW', 'Circular to angular chlorotic spots with grey necrotic centers and reddish-purple borders on mature foliage.'),
  (9, 'Puccinia Foliar Rust', 'fungal', 'MODERATE', 'Pustules producing powdery orange-yellow urediniospores on abaxial leaf surfaces, localized chlorotic spotting.'),
  (10, 'Root-Knot Nematode Galls', 'pest', 'HIGH', 'Hypertrophy forming visible spherical root knots, reduced nutrient uptake, secondary pathogen entry facilitation.'),
  (11, 'Armillaria Honey Fungus Rot', 'fungal', 'CRITICAL', 'White mycelial sheets beneath trunk bark, shoestring rhizomorphs in soil, sudden crown collapse.'),
  (12, 'Phytophthora Collar Rot', 'fungal', 'CRITICAL', 'Bleeding trunk lesions near soil grade, reddish-brown sub-cortical tissue necrosis, basal cambium girdling.'),
  (13, 'Crown Gall (Agrobacterium)', 'bacterial', 'MODERATE', 'Tumorous woody swellings at root collar and lower stem junction caused by bacterial T-DNA plasmid integration.'),
  (14, 'Bacterial Leaf Scorch (Xylella)', 'bacterial', 'HIGH', 'Marginal leaf necrosis with distinctive chlorotic halo, fastidious xylem-limited bacterial occlusion.'),
  (15, 'Verticillium Vascular Wilt', 'fungal', 'HIGH', 'Foliage interveinal chlorosis, leaf curl, olive-black streaking in functional sapwood rings.'),
  (16, 'Longhorn Stem Borer Beetle', 'pest', 'HIGH', 'Coarse frass ejected from circular trunk bores, structural wood honeycombing, branch snapping under wind load.'),
  (17, 'Aphid & Scale Colony Outbreak', 'pest', 'MODERATE', 'Heavy sap withdrawal causing stunted foliar growth, leaf curling, copious honeydew secretion.'),
  (18, 'Whitefly Foliage Chlorosis', 'pest', 'MODERATE', 'Abaxial leaf encrustation by nymph scales, honeydew accumulation, vectoring geminivirus pathogens.'),
  (19, 'Dothiorella Stem Canker', 'fungal', 'HIGH', 'Sunken bark lesions with amber resin exudation, localized cambial necrosis on lateral scaffolds.'),
  (20, 'Iron Chlorosis Deficiency', 'nutrient', 'LOW', 'Interveinal yellowing of youngest leaves while veins remain green, caused by high alkaline soil pH locking iron.')
ON CONFLICT (disease_id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  severity_level = EXCLUDED.severity_level,
  symptoms_description = EXCLUDED.symptoms_description;

SELECT setval('diseases_disease_id_seq', (SELECT MAX(disease_id) FROM diseases));

-- ----------------------------------------------------------------------------
-- 03. SPECIES-TO-DISEASE SUSCEPTIBILITY MATRIX (M:N RELATIONSHIP)
-- ----------------------------------------------------------------------------

INSERT INTO species_disease_susceptibility (species_id, disease_id, vulnerability_index)
VALUES
  -- Heritage Banyan & Peepal (Ficus spp.)
  (2, 1, 'HIGH'),    -- Banyan vs Ganoderma
  (2, 2, 'MODERATE'),-- Banyan vs Bacterial Wetwood
  (2, 11, 'HIGH'),   -- Banyan vs Armillaria
  (3, 1, 'HIGH'),    -- Peepal vs Ganoderma
  (3, 4, 'LOW'),     -- Peepal vs Powdery Mildew
  (3, 13, 'MODERATE'),

  -- Royal Gulmohar (Delonix regia)
  (5, 1, 'HIGH'),    -- Gulmohar vs Ganoderma Root Rot (frequent municipal windfall cause)
  (5, 11, 'HIGH'),   -- Gulmohar vs Armillaria
  (5, 16, 'HIGH'),   -- Gulmohar vs Longhorn Stem Borer
  (5, 19, 'MODERATE'),

  -- Blue Jacaranda (Jacaranda mimosifolia)
  (4, 5, 'HIGH'),    -- Jacaranda vs Anthracnose
  (4, 7, 'MODERATE'),-- Jacaranda vs Fusarium Wilt
  (4, 18, 'HIGH'),   -- Jacaranda vs Whitefly

  -- Teak (Tectona grandis)
  (6, 9, 'HIGH'),    -- Teak vs Rust (Olivea tectonae)
  (6, 16, 'HIGH'),   -- Teak vs Longhorn Stem Borer
  (6, 7, 'MODERATE'),

  -- Rain Tree (Samanea saman)
  (7, 1, 'HIGH'),    -- Rain tree vs Ganoderma
  (7, 2, 'HIGH'),    -- Rain tree vs Wetwood Canker
  (7, 17, 'MODERATE'),

  -- Mango (Mangifera indica)
  (8, 5, 'HIGH'),    -- Mango vs Anthracnose
  (8, 4, 'HIGH'),    -- Mango vs Powdery Mildew
  (8, 6, 'MODERATE'),-- Mango vs Sooty Mold
  (8, 16, 'HIGH'),   -- Mango vs Stem Borer

  -- Yellow Copperpod (Peltophorum pterocarpum)
  (9, 1, 'HIGH'),    -- Copperpod vs Ganoderma
  (9, 2, 'MODERATE'),
  (9, 19, 'HIGH'),

  -- Neem Tree (Azadirachta indica - High natural pathogen resistance)
  (1, 4, 'LOW'),
  (1, 8, 'LOW'),
  (1, 10, 'LOW'),    -- Neem naturally repels nematodes

  -- Pink Trumpet (Tabebuia rosea)
  (13, 5, 'HIGH'),
  (13, 14, 'MODERATE'),

  -- Jamun (Syzygium cumini)
  (15, 8, 'MODERATE'),
  (15, 12, 'HIGH'),

  -- Silver Oak (Grevillea robusta)
  (12, 11, 'HIGH'),
  (12, 15, 'HIGH'),

  -- Pride of India (Lagerstroemia speciosa)
  (18, 4, 'HIGH'),   -- Lagerstroemia prone to powdery mildew
  (18, 5, 'MODERATE'),

  -- Red Silk Cotton (Bombax ceiba)
  (23, 16, 'HIGH'),  -- Stem borer
  (23, 1, 'MODERATE'),

  -- Arjuna Tree (Terminalia arjuna)
  (24, 1, 'MODERATE'),
  (24, 12, 'HIGH')
ON CONFLICT (species_id, disease_id) DO UPDATE SET
  vulnerability_index = EXCLUDED.vulnerability_index;

-- ----------------------------------------------------------------------------
-- 04. MASTER BOTANICAL TREATMENTS (15 ARBORICULTURAL PROTOCOLS)
-- ----------------------------------------------------------------------------

INSERT INTO treatments (treatment_id, name, treatment_type, standard_cost, typical_duration_days)
VALUES
  (1, 'Propiconazole Root Drench + Crown Weight Reduction', 'chemical', 180.00, 30),
  (2, 'Oxytetracycline Trunk Micro-Injection + Bark Debridement', 'chemical', 120.00, 21),
  (3, 'Emamectin Benzoate Trunk Micro-Injection', 'chemical', 240.00, 14),
  (4, 'Potassium Bicarbonate Eco-Fungicide Foliar Spray', 'biological', 45.00, 10),
  (5, 'Copper Hydroxide Micronized Spray + Canopy Airflow Thinning', 'chemical', 75.00, 14),
  (6, 'Horticultural Mineral Oil + Beauveria bassiana Bio-Inoculant', 'biological', 55.00, 12),
  (7, 'Trichoderma harzianum Antagonist Root Bio-Barrier Drench', 'biological', 95.00, 45),
  (8, 'Selective Lateral Scaffold Debridement & Sanitized Pruning', 'pruning', 150.00, 7),
  (9, 'Soil Aeration & Slow-Release Iron Chelate (Fe-EDDHA) Treatment', 'soil_amendment', 85.00, 60),
  (10, 'Macro-Infusion Systemic Fungicide Injection', 'chemical', 290.00, 28),
  (11, 'Bacillus subtilis Bio-Fungicide Canopy Fogging', 'biological', 65.00, 14),
  (12, 'Hazardous Deadwood Removal & End-Weight Relieving Cuts', 'pruning', 210.00, 5),
  (13, 'Deep Root Hydraulic Micro-Nutrient Compost Tea Injection', 'soil_amendment', 115.00, 30),
  (14, 'Nemasys Beneficial Entomopathogenic Nematode Soil Application', 'biological', 130.00, 21),
  (15, 'Root Flare Excavation & Girdling Root Surgical Amputation', 'pruning', 175.00, 14)
ON CONFLICT (treatment_id) DO UPDATE SET
  name = EXCLUDED.name,
  treatment_type = EXCLUDED.treatment_type,
  standard_cost = EXCLUDED.standard_cost,
  typical_duration_days = EXCLUDED.typical_duration_days;

SELECT setval('treatments_treatment_id_seq', (SELECT MAX(treatment_id) FROM treatments));
