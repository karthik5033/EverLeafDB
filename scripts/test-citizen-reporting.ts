/**
 * EverLeafDB Phase 27 Verification Suite: Citizen Reporting Public Portal
 *
 * Tests:
 * 1. PostGIS ST_Contains Spatial Ward Routing (Point-in-polygon)
 * 2. Collision-resistant tracking code format (CR-2025-XXXX)
 * 3. Citizen hazard report submission & validation
 * 4. Case-insensitive public tracking code lookup
 * 5. Dynamic SLA breach calculation (> 24 hours)
 * 6. Priority ordering (EMERGENCY -> HIGH -> MODERATE -> LOW)
 * 7. Supervisor status transitions & audit trail recording
 * 8. Zero prohibited terms compliance verification
 */

import {
  submitCitizenReport,
  lookupCitizenReport,
  listCitizenReports,
  updateCitizenReportStatus,
  assignWardBySpatialLocation,
  generateTrackingCode,
  CITIZEN_REPORTS_STORE
} from "../frontend/src/lib/citizen-reporting";
import { AUDIT_STORE } from "../frontend/src/lib/audit";
import * as fs from "fs";
import * as path from "path";

console.log("================================================================================");
console.log("EVERLEAFDB PHASE 27 VERIFICATION: CITIZEN REPORTING & SPATIAL HAZARD INGESTION");
console.log("================================================================================\n");

let passed = 0;
let total = 0;

function assert(condition: boolean, testName: string, details?: string) {
  total++;
  if (condition) {
    passed++;
    console.log(`  [PASS] Test ${total}: ${testName}`);
  } else {
    console.error(`  [FAIL] Test ${total}: ${testName}`);
    if (details) console.error(`         Details: ${details}`);
  }
}

// -----------------------------------------------------------------------------
// Test Group 1: PostGIS ST_Contains Spatial Point-in-Polygon Ward Assignment
// -----------------------------------------------------------------------------
console.log("--- Group 1: PostGIS ST_Contains Spatial Ward Assignment ---");

const wardCentral = assignWardBySpatialLocation(12.9735, 77.6015);
assert(
  wardCentral.ward_id === 1 && wardCentral.ward_name === "Central Business District",
  "Point (12.9735, 77.6015) in Cubbon Park is mapped to Ward 1 (Central Business District)"
);

const wardLalbagh = assignWardBySpatialLocation(12.9512, 77.5845);
assert(
  wardLalbagh.ward_id === 2 && wardLalbagh.ward_name === "Lalbagh Botanical Zone",
  "Point (12.9512, 77.5845) in Lalbagh is mapped to Ward 2 (Lalbagh Botanical Zone)"
);

const wardIndiranagar = assignWardBySpatialLocation(12.9782, 77.6385);
assert(
  wardIndiranagar.ward_id === 4 && wardIndiranagar.ward_name === "Indiranagar Urban Forest",
  "Point (12.9782, 77.6385) in Indiranagar is mapped to Ward 4 (Indiranagar Urban Forest)"
);

const wardKoramangala = assignWardBySpatialLocation(12.9348, 77.6212);
assert(
  wardKoramangala.ward_id === 5 && wardKoramangala.ward_name === "Koramangala Canopy Corridor",
  "Point (12.9348, 77.6212) in Koramangala is mapped to Ward 5 (Koramangala Canopy Corridor)"
);

// Fallback test: Point far outside polygon bounds still resolves to nearest valid ward
const wardOutside = assignWardBySpatialLocation(13.1000, 77.7000);
assert(
  wardOutside.ward_id > 0 && typeof wardOutside.ward_name === "string",
  "Out-of-boundary coordinate safely falls back to nearest municipal ward"
);

// -----------------------------------------------------------------------------
// Test Group 2: Tracking Code Format & Generation
// -----------------------------------------------------------------------------
console.log("\n--- Group 2: Collision-Resistant Tracking Code Generation ---");

const code1 = generateTrackingCode();
const code2 = generateTrackingCode();
const trackingRegex = /^CR-\d{4}-\d{4}$/;

assert(
  trackingRegex.test(code1),
  `Generated tracking code '${code1}' matches format CR-YYYY-XXXX`
);
assert(
  code1 !== code2,
  "Successive tracking code generation is distinct and collision-resistant"
);

// -----------------------------------------------------------------------------
// Test Group 3: Citizen Report Submission & Validation
// -----------------------------------------------------------------------------
console.log("\n--- Group 3: Public Report Ingestion & Validation ---");

const initialCount = CITIZEN_REPORTS_STORE.length;
const initialAuditCount = AUDIT_STORE.length;

const newSubmission = submitCitizenReport({
  reporter_name: "Sunil Deshmukh",
  reporter_phone: "+91-9880011223",
  reporter_email: "sunil.d@example.com",
  latitude: 12.9730,
  longitude: 77.6010,
  address_landmark: "Cubbon Park Bamboo Grove Path",
  hazard_category: "FALLING_BRANCH",
  urgency_level: "HIGH",
  description: "Severely cracked heavy branch dangling over public jogger trail."
});

assert(
  CITIZEN_REPORTS_STORE.length === initialCount + 1,
  "Submitted citizen report added to in-memory staging store"
);
assert(
  newSubmission.status === "PENDING_TRIAGE",
  "New report initialized with status 'PENDING_TRIAGE'"
);
assert(
  newSubmission.ward_id === 1,
  "New report automatically tagged with Ward 1 via spatial ST_Contains trigger"
);
assert(
  trackingRegex.test(newSubmission.tracking_code),
  `Assigned valid tracking code ${newSubmission.tracking_code}`
);
assert(
  AUDIT_STORE.length > initialAuditCount,
  "Relational audit trail entry logged for citizen report creation"
);

// Validation failures
let caughtMinDescError = false;
try {
  submitCitizenReport({
    latitude: 12.97,
    longitude: 77.60,
    address_landmark: "Test Landmark",
    hazard_category: "OTHER",
    description: "Short" // < 10 chars
  });
} catch {
  caughtMinDescError = true;
}
assert(caughtMinDescError, "Submission rejected when description is under 10 characters");

let caughtEmptyAddressError = false;
try {
  submitCitizenReport({
    latitude: 12.97,
    longitude: 77.60,
    address_landmark: "  ",
    hazard_category: "OTHER",
    description: "Valid long description of an emergency tree hazard in the park."
  });
} catch {
  caughtEmptyAddressError = true;
}
assert(caughtEmptyAddressError, "Submission rejected when address landmark is empty");

// -----------------------------------------------------------------------------
// Test Group 4: Case-Insensitive Public Tracking Lookup
// -----------------------------------------------------------------------------
console.log("\n--- Group 4: Public Tracking Lookup ---");

const lookupExact = lookupCitizenReport(newSubmission.tracking_code);
assert(
  lookupExact !== null && lookupExact.report_id === newSubmission.report_id,
  "Lookup succeeds with exact uppercase tracking code"
);

const lookupLower = lookupCitizenReport(newSubmission.tracking_code.toLowerCase());
assert(
  lookupLower !== null && lookupLower.report_id === newSubmission.report_id,
  "Lookup succeeds case-insensitively with lowercase tracking code"
);

const lookupNonExistent = lookupCitizenReport("CR-9999-0000");
assert(
  lookupNonExistent === null,
  "Lookup returns null for non-existent tracking code"
);

// -----------------------------------------------------------------------------
// Test Group 5: SLA Breach Calculation & Priority Ordering
// -----------------------------------------------------------------------------
console.log("\n--- Group 5: Dynamic SLA Breach & Urgency Sorting ---");

const breachedReport = lookupCitizenReport("CR-2025-9214"); // Seeded > 24 hours ago in PENDING_TRIAGE
assert(
  breachedReport !== null && breachedReport.is_sla_breached === true,
  "Report pending triage for > 24 hours flagged with is_sla_breached = true"
);

const freshReport = lookupCitizenReport(newSubmission.tracking_code);
assert(
  freshReport !== null && freshReport.is_sla_breached === false,
  "Newly submitted report flagged with is_sla_breached = false"
);

const sortedQueue = listCitizenReports();
const urgencyRank: Record<string, number> = { EMERGENCY: 1, HIGH: 2, MODERATE: 3, LOW: 4 };

let isSortedCorrectly = true;
for (let i = 0; i < sortedQueue.length - 1; i++) {
  const currentUrgency = urgencyRank[sortedQueue[i].urgency_level];
  const nextUrgency = urgencyRank[sortedQueue[i + 1].urgency_level];
  if (currentUrgency > nextUrgency) {
    isSortedCorrectly = false;
    break;
  }
}
assert(
  isSortedCorrectly,
  "Citizen reports triage queue strictly sorted by urgency priority (EMERGENCY -> HIGH -> MODERATE -> LOW)"
);

// -----------------------------------------------------------------------------
// Test Group 6: Supervisor Status Lifecycle Transitions
// -----------------------------------------------------------------------------
console.log("\n--- Group 6: Municipal Tree Supervisor Status Lifecycle ---");

const reportToTransition = newSubmission.report_id;

// Step A: Transition to INVESTIGATING
const investigatingReport = updateCitizenReportStatus(
  reportToTransition,
  "INVESTIGATING",
  "Dispatched Field Inspector Team 01 for site inspection."
);
assert(
  investigatingReport.status === "INVESTIGATING",
  "Status transitioned from PENDING_TRIAGE to INVESTIGATING"
);
assert(
  investigatingReport.supervisor_notes?.includes("Dispatched Field Inspector") === true,
  "Supervisor operational notes correctly recorded"
);

// Step B: Transition to ACTIONED
const actionedReport = updateCitizenReportStatus(
  reportToTransition,
  "ACTIONED",
  "Emergency work order dispatched to tree crew."
);
assert(
  actionedReport.status === "ACTIONED",
  "Status transitioned from INVESTIGATING to ACTIONED"
);

// Step C: Transition to RESOLVED
const resolvedReport = updateCitizenReportStatus(
  reportToTransition,
  "RESOLVED",
  "Branch safely pruned and road clearance certified."
);
assert(
  resolvedReport.status === "RESOLVED",
  "Status transitioned from ACTIONED to RESOLVED"
);
assert(
  resolvedReport.resolved_at !== null && typeof resolvedReport.resolved_at === "string",
  "Resolution timestamp (resolved_at) automatically populated upon completion"
);

// -----------------------------------------------------------------------------
// Test Group 7: Prohibited Terminology Audit (Zero Tolerance)
// -----------------------------------------------------------------------------
console.log("\n--- Group 7: Prohibited Terminology Audit ---");

const filesToCheck = [
  "sql/20_citizen_reporting.sql",
  "frontend/sql/20_citizen_reporting.sql",
  "frontend/src/lib/citizen-reporting.ts",
  "frontend/src/app/api/reports/route.ts",
  "frontend/src/app/api/reports/[id]/route.ts",
  "frontend/src/app/report/page.tsx",
  "frontend/src/app/report/track/page.tsx"
];

let prohibitedFound = 0;
const prohibitedTerm = "arbor" + "ist"; // String concatenation to avoid self-match

for (const relPath of filesToCheck) {
  const fullPath = path.resolve(__dirname, "..", relPath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, "utf-8").toLowerCase();
    if (content.includes(prohibitedTerm)) {
      prohibitedFound++;
      console.error(`  Prohibited word found in: ${relPath}`);
    }
  }
}

assert(
  prohibitedFound === 0,
  `Zero occurrences of prohibited role terminology across all Phase 27 files (found: ${prohibitedFound})`
);

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log("\n================================================================================");
console.log(`PHASE 27 TEST RESULTS: ${passed}/${total} ASSERTIONS PASSED (100% Target)`);
console.log("================================================================================\n");

if (passed !== total) {
  process.exit(1);
}
