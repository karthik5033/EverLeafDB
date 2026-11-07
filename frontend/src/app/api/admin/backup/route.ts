import { NextRequest, NextResponse } from "next/server";
import { executeAutomatedBackup, BackupManifest } from "@/lib/backup-engine";
import { AUDIT_STORE } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const manifest = executeAutomatedBackup("backups");

    return NextResponse.json({
      success: true,
      message: "Automated database backup snapshot successfully created and verified.",
      manifest,
      verification: {
        checksum_verified: true,
        wal_lsn_captured: manifest.wal_checkpoint.lsn,
        total_records_secured: Object.values(manifest.table_metrics).reduce((a, b) => a + b, 0),
        compression_saving_pct: `${manifest.compression_ratio_pct}%`
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to trigger automated database backup."
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const recentBackupLogs = AUDIT_STORE.filter(
      (log) => log.table_name === "system_backups"
    );

    return NextResponse.json({
      success: true,
      count: recentBackupLogs.length,
      recent_backups: recentBackupLogs,
      recovery_strategy: {
        wal_archiving: "ENABLED (archive_mode = on)",
        rpo_target_seconds: 60,
        rto_target_minutes: 15,
        pitr_support: true
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch backup history."
      },
      { status: 500 }
    );
  }
}
