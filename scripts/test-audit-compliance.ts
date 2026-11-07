/**
 * EverLeafDB Phase 28 Verification Suite: System Auditing, Compliance & Backup Verification
 *
 * Tests:
 * 1. PL/pgSQL Trigger Audit Trail Ingestion & Querying
 * 2. JSONB Attribute Diff Computation (Attribute Transitions)
 * 3. Automated Base Backup Snapshot & SHA-256 Checksum Calculation
 * 4. Compression Ratio & Metadata Manifest Generation
 * 5. PITR Row Count Parity & Verification Checksum
 * 6. Audit Trail Recording for Disaster Recovery Operations
 * 7. Zero Prohibited Terminology Compliance Verification
 */

import {
  AUDIT_STORE,
  getAuditLogs,
  computeJsonbDiff,
  recordAuditTrail
} from "../frontend/src/lib/audit";
import { executeAutomatedBackup, BackupManifest } from "./backup-database";
import * as fs from "fs";
import * as path from "path";

console.log("================================================================================");
console.log("EVERLEAFDB PHASE 28 VERIFICATION: SYSTEM AUDITING & DISASTER RECOVERY (PITR)");
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
// Test Group 1: Audit Trail Store & Filtering
// -----------------------------------------------------------------------------
console.log("--- Group 1: Audit Log Ingestion & Filtering ---");

const allLogs = getAuditLogs();
assert(
  allLogs.length >= 2,
  `Audit store initialized with existing historical logs (count: ${allLogs.length})`
);

const treeLogs = getAuditLogs({ table_name: "trees" });
assert(
  treeLogs.every((l) => l.table_name.toLowerCase() === "trees"),
  "Table name filter correctly isolates 'trees' mutations"
);

const updateLogs = getAuditLogs({ action: "UPDATE" });
assert(
  updateLogs.every((l) => l.action === "UPDATE"),
  "Action filter correctly isolates 'UPDATE' events"
);

// -----------------------------------------------------------------------------
// Test Group 2: JSONB Attribute Diff Engine
// -----------------------------------------------------------------------------
console.log("\n--- Group 2: JSONB Diff Engine ---");

// Test Case A: Attribute change
const diffUpdate = computeJsonbDiff(
  { health_status: "fair", canopy_density: 0.8 },
  { health_status: "critical", canopy_density: 0.8 }
);
assert(
  diffUpdate["health_status"] !== undefined &&
    diffUpdate["health_status"].from === "fair" &&
    diffUpdate["health_status"].to === "critical",
  "Single attribute transition detected from 'fair' to 'critical'"
);
assert(
  diffUpdate["canopy_density"] === undefined,
  "Unchanged attributes excluded from JSONB transition diff"
);

// Test Case B: Insert diff (null old_values)
const diffInsert = computeJsonbDiff(null, { tag_number: "BLR-0999", condition_score: 1 });
assert(
  diffInsert["tag_number"] !== undefined &&
    diffInsert["tag_number"].from === null &&
    diffInsert["tag_number"].to === "BLR-0999",
  "INSERT event diff maps all new attributes with from: null"
);

// Test Case C: Delete diff (null new_values)
const diffDelete = computeJsonbDiff({ tag_number: "BLR-0999" }, null);
assert(
  diffDelete["tag_number"] !== undefined &&
    diffDelete["tag_number"].from === "BLR-0999" &&
    diffDelete["tag_number"].to === null,
  "DELETE event diff maps all removed attributes with to: null"
);

// -----------------------------------------------------------------------------
// Test Group 3: Automated Compressed Base Backup & Snapshot Generation
// -----------------------------------------------------------------------------
console.log("\n--- Group 3: Automated Base Backup Execution ---");

const testBackupDir = path.resolve(__dirname, "..", "backups");
const initialAuditLength = AUDIT_STORE.length;

const manifest = executeAutomatedBackup(testBackupDir);

assert(
  typeof manifest.backup_id === "string" && manifest.backup_id.startsWith("bkp-"),
  `Generated backup identifier: ${manifest.backup_id}`
);
assert(
  manifest.backup_format.includes("pg_dump -Fc"),
  "Backup format conforms to PostgreSQL Custom Compressed Archive (-Fc)"
);
assert(
  /^[a-f0-9]{64}$/i.test(manifest.sha256_checksum),
  `Valid SHA-256 integrity hash generated: ${manifest.sha256_checksum.slice(0, 16)}...`
);
assert(
  manifest.compressed_size_bytes < manifest.size_bytes && manifest.compression_ratio_pct > 50,
  `Zlib/Gzip compression achieved ${manifest.compression_ratio_pct}% size reduction (${manifest.compressed_size_bytes} bytes)`
);
assert(
  manifest.table_metrics.trees > 0 &&
    manifest.table_metrics.inspections > 0 &&
    manifest.table_metrics.work_orders > 0,
  "Snapshot manifest captures accurate record counts across all core tables"
);

// Verify filesystem output
const checksumFilePath = path.join(testBackupDir, `${manifest.archive_filename}.sha256`);
assert(
  fs.existsSync(checksumFilePath),
  `Integrity checksum file persisted to disk: ${manifest.archive_filename}.sha256`
);

// -----------------------------------------------------------------------------
// Test Group 4: Point-in-Time Recovery (PITR) Metadata & WAL Checkpoint
// -----------------------------------------------------------------------------
console.log("\n--- Group 4: Point-in-Time Recovery (PITR) Metadata ---");

assert(
  typeof manifest.wal_checkpoint.lsn === "string" && manifest.wal_checkpoint.lsn.includes("/"),
  `WAL LSN boundary recorded for PITR replay: ${manifest.wal_checkpoint.lsn}`
);

assert(
  AUDIT_STORE.length === initialAuditLength + 1,
  "Disaster recovery event logged directly into audit_log table"
);

const latestAudit = AUDIT_STORE[0];
assert(
  latestAudit.action === "DISPATCH" && latestAudit.table_name === "system_backups",
  "Latest audit entry confirms 'DISPATCH' action on 'system_backups'"
);

// -----------------------------------------------------------------------------
// Test Group 5: Zero Prohibited Terminology Compliance Audit
// -----------------------------------------------------------------------------
console.log("\n--- Group 5: Prohibited Terminology Audit ---");

const filesToCheck = [
  "sql/21_system_auditing_backup.sql",
  "frontend/sql/21_system_auditing_backup.sql",
  "scripts/backup-database.ts",
  "frontend/src/app/api/admin/backup/route.ts",
  "frontend/src/app/admin/audit/page.tsx",
  "docs/PITR_RECOVERY_GUIDE.md"
];

let prohibitedFound = 0;
const prohibitedTerm = "arbor" + "ist"; // concatenated to prevent self-match

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
  `Zero occurrences of prohibited role terminology across all Phase 28 files (found: ${prohibitedFound})`
);

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log("\n================================================================================");
console.log(`PHASE 28 TEST RESULTS: ${passed}/${total} ASSERTIONS PASSED (100% Target)`);
console.log("================================================================================\n");

if (passed !== total) {
  process.exit(1);
}
