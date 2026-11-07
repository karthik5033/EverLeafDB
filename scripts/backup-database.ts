/**
 * EverLeafDB Automated Database Backup & Snapshot Generator (Phase 28)
 * CLI invocation script.
 */

import { executeAutomatedBackup, BackupManifest } from "../frontend/src/lib/backup-engine";

export { executeAutomatedBackup, BackupManifest };

// Standalone execution
if (require.main === module) {
  console.log("=== EverLeafDB: Executing Automated Base Backup ===");
  const manifest = executeAutomatedBackup();
  console.log(`[SUCCESS] Backup Generated: ${manifest.archive_filename}`);
  console.log(`          Backup ID:        ${manifest.backup_id}`);
  console.log(`          SHA-256:          ${manifest.sha256_checksum}`);
  console.log(`          Compressed Size:  ${(manifest.compressed_size_bytes / 1024).toFixed(1)} KB (${manifest.compression_ratio_pct}% reduction)`);
  console.log(`          Tables Snapshot:  Trees: ${manifest.table_metrics.trees}, Inspections: ${manifest.table_metrics.inspections}, Work Orders: ${manifest.table_metrics.work_orders}`);
}
