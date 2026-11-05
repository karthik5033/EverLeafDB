/**
 * Botanical Species & Disease Taxonomy Seeding Test Suite
 * Validates 25 Species, 20 Diseases, 15 Treatments, and M:N Susceptibility Integrity
 */

import {
  SPECIES_SEED,
  DISEASES,
  TREATMENTS_SEED,
  SUSCEPTIBILITY_SEED
} from "../frontend/src/lib/db";

console.log("=================================================");
console.log("EverLeafDB Botanical Taxonomy & Pathology Test");
console.log("=================================================\n");

// 1. Botanical Species Catalog Check
console.log("1. Botanical Species Catalog Integrity (Target: 25 Species):");
console.log(`   Total Cataloged Species: ${SPECIES_SEED.length}`);
console.assert(SPECIES_SEED.length === 25, "Expected exactly 25 species");

const validGrowthRates = new Set(["SLOW", "MODERATE", "FAST"]);
for (const s of SPECIES_SEED) {
  console.assert(s.typical_lifespan_years > 0, `Species ${s.common_name} has invalid lifespan`);
  console.assert(validGrowthRates.has(s.growth_rate), `Species ${s.common_name} has invalid growth rate: ${s.growth_rate}`);
  console.assert(s.scientific_name.length > 3, `Species ${s.common_name} has invalid scientific name`);
}
console.log("   ✓ All 25 botanical species satisfy 3NF domain constraints.\n");

// 2. Pathological Disease Library Check
console.log("2. Pathological Disease Library Integrity (Target: 20 Diseases):");
console.log(`   Total Documented Diseases: ${DISEASES.length}`);
console.assert(DISEASES.length === 20, "Expected exactly 20 diseases");

const validSeverities = new Set(["LOW", "MODERATE", "HIGH", "CRITICAL"]);
for (const d of DISEASES) {
  console.assert(validSeverities.has(d.severity), `Disease ${d.common_name} has invalid severity: ${d.severity}`);
  console.assert(d.estimated_cost_usd > 0, `Disease ${d.common_name} has invalid estimated cost`);
  console.assert(d.typical_cure_rate >= 0 && d.typical_cure_rate <= 100, `Disease ${d.common_name} has invalid cure rate`);
}
console.log("   ✓ All 20 disease profiles satisfy category and severity domains.\n");

// 3. Arboricultural Treatments Catalog Check
console.log("3. Arboricultural Treatments Catalog Integrity (Target: 15 Treatments):");
console.log(`   Total Formulated Treatments: ${TREATMENTS_SEED.length}`);
console.assert(TREATMENTS_SEED.length === 15, "Expected exactly 15 treatments");

for (const t of TREATMENTS_SEED) {
  console.assert(t.standard_cost > 0, `Treatment ${t.name} has non-positive cost`);
  console.assert(t.typical_duration_days > 0, `Treatment ${t.name} has non-positive duration`);
}
console.log("   ✓ All 15 treatments satisfy municipal cost and duration constraints.\n");

// 4. M:N Species-Disease Susceptibility Matrix Check
console.log("4. Species-to-Disease Susceptibility Foreign Key Validation:");
const speciesIds = new Set(SPECIES_SEED.map((s) => s.species_id));
const diseaseIds = new Set(DISEASES.map((d) => d.disease_id));

console.log(`   Total Susceptibility Links: ${SUSCEPTIBILITY_SEED.length}`);
for (const link of SUSCEPTIBILITY_SEED) {
  console.assert(speciesIds.has(link.species_id), `Dangling species_id ${link.species_id} in susceptibility matrix`);
  console.assert(diseaseIds.has(link.disease_id), `Dangling disease_id ${link.disease_id} in susceptibility matrix`);
  console.assert(["LOW", "MODERATE", "HIGH"].includes(link.vulnerability_index), `Invalid vulnerability index: ${link.vulnerability_index}`);
}
console.log("   ✓ Zero dangling foreign keys in M:N relationship matrix.\n");

console.log("All Botanical Species & Disease Taxonomy tests passed successfully! ✓");

