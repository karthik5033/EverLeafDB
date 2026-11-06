/**
 * EverLeafDB Phase 25: Executive Analytics & Ward Health Dashboard Test Suite
 *
 * Verifies:
 * 1. Executive city-wide KPI calculations
 * 2. Donut Chart health status categorical distribution completeness (100% total)
 * 3. Bar Chart species biodiversity population breakdown
 * 4. Municipal CSV report export generator and structure
 * 5. Strict role title compliance (zero 'arborist' occurrences)
 * 6. Execution latency benchmarking (sub-15ms)
 */

import {
  computeExecutiveKpis,
  computeHealthDistribution,
  computeSpeciesBiodiversity,
  generateExecutiveCsvReport,
  getExecutiveOverviewData
} from "../frontend/src/lib/executive-analytics";
import { getWardHealthSummary } from "../frontend/src/lib/materialized-views";

let totalAssertions = 0;
let passedAssertions = 0;

function assert(description: string, condition: boolean) {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
    console.log(`  ✓ [PASS] ${description}`);
  } else {
    console.error(`  ✗ [FAIL] ${description}`);
  }
}

console.log("================================================================================");
console.log("EVERLEAFDB PHASE 25: EXECUTIVE ANALYTICS TEST SUITE");
console.log("================================================================================\n");

// --- TEST 1: City-Wide Executive KPIs ---
console.log("--- TEST 1: City-Wide Executive KPIs ---");
const kpis = computeExecutiveKpis();
assert("Total managed trees is positive integer", kpis.total_managed_trees > 0);
assert("Total covered wards is positive", kpis.total_covered_wards > 0);
assert("Forest health index is valid percentage between 0 and 100", kpis.forest_health_index_pct >= 0 && kpis.forest_health_index_pct <= 100);
assert("Active contagion alerts is non-negative", kpis.active_contagion_alerts >= 0);
assert("Overdue inspections count is non-negative", kpis.overdue_inspections_count >= 0);
assert("Total canopy biomass DBH is calculated", kpis.total_canopy_biomass_dbh_cm > 0);
assert("City average condition score is between 1.0 and 5.0", kpis.city_avg_condition_score >= 1.0 && kpis.city_avg_condition_score <= 5.0);

// --- TEST 2: Donut Chart Health Distribution ---
console.log("\n--- TEST 2: Health Status Categorical Distribution (Donut Chart) ---");
const healthDist = computeHealthDistribution();
assert("Health distribution contains all 4 standard clinical categories", healthDist.length === 4);
const totalHealthCount = healthDist.reduce((sum, h) => sum + h.count, 0);
assert("Sum of health distribution counts matches total trees", totalHealthCount === kpis.total_managed_trees);
const totalHealthPct = healthDist.reduce((sum, h) => sum + h.percentage, 0);
assert("Sum of health percentages approximates 100%", Math.round(totalHealthPct) >= 99 && Math.round(totalHealthPct) <= 101);
assert("Every category has valid hex color code", healthDist.every(h => h.color_hex.startsWith("#")));

// --- TEST 3: Bar Chart Species Biodiversity Breakdown ---
console.log("\n--- TEST 3: Species Biodiversity Breakdown (Bar Chart) ---");
const speciesBio = computeSpeciesBiodiversity();
assert("Species biodiversity populated across botanical catalog", speciesBio.length > 0);
const topSpecies = speciesBio[0];
assert("Top species has valid common name and scientific name", !!topSpecies.common_name && !!topSpecies.scientific_name);
assert("Species population counts are non-negative", speciesBio.every(s => s.population_count >= 0));
const totalBioPct = speciesBio.reduce((sum, s) => sum + s.biodiversity_percentage, 0);
assert("Sum of biodiversity percentages approximates 100%", Math.round(totalBioPct) >= 99 && Math.round(totalBioPct) <= 101);

// --- TEST 4: Municipal CSV Report Generation ---
console.log("\n--- TEST 4: Municipal CSV Report Generation ---");
const wardSummary = getWardHealthSummary(true);
const csvReport = generateExecutiveCsvReport(wardSummary.data);
assert("CSV report string is generated", typeof csvReport === "string" && csvReport.length > 100);
const csvLines = csvReport.split("\n");
assert("CSV header contains required municipal columns", csvLines[0].includes("Ward ID") && csvLines[0].includes("Health Index (%)") && csvLines[0].includes("Outbreak Status"));
assert("CSV lines match total wards + 1 header line", csvLines.length === wardSummary.data.length + 1);

// --- TEST 5: Consolidated Executive Overview Retriever ---
console.log("\n--- TEST 5: Consolidated Overview Retriever ---");
const overview = getExecutiveOverviewData();
assert("Overview data returns all components", !!overview.kpis && !!overview.health_distribution && !!overview.species_biodiversity && !!overview.ward_summaries);

// --- TEST 6: Strict Role Naming Compliance (Zero 'arborist' Occurrences) ---
console.log("\n--- TEST 6: Strict Role Naming Compliance ---");
const fullOverviewStr = (JSON.stringify(overview) + csvReport).toLowerCase();
assert("Executive analytics payload strictly complies with role naming (zero 'arborist' occurrences)", !fullOverviewStr.includes("arborist"));

// --- TEST 7: Execution Latency Benchmark ---
console.log("\n--- TEST 7: Execution Latency Benchmark ---");
const start = performance.now();
for (let i = 0; i < 50; i++) {
  getExecutiveOverviewData();
}
const elapsed = (performance.now() - start) / 50;
console.log(`  ℹ Average Executive Overview compilation latency: ${elapsed.toFixed(3)} ms`);
assert("Executive overview compilation latency is sub-15ms", elapsed < 15.0);

console.log("\n================================================================================");
console.log(`RESULTS: ${passedAssertions} / ${totalAssertions} test assertions passed successfully.`);
console.log("================================================================================\n");

if (passedAssertions !== totalAssertions) {
  process.exit(1);
}

