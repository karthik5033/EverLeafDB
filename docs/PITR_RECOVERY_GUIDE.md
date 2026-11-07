# EverLeafDB: Point-in-Time Recovery (PITR) & Disaster Recovery Runbook
**Database:** PostgreSQL 16 + PostGIS 3.4 + pgvector 0.5  
**Municipal Authority:** Department of Urban Forestry & Tree Management  
**Target RPO (Recovery Point Objective):** < 60 seconds  
**Target RTO (Recovery Time Objective):** < 15 minutes  

---

## 1. Overview of PostgreSQL Continuous Archiving & WAL

EverLeafDB implements PostgreSQL Continuous Archiving combining:
1. **Base Backups:** Full compressed snapshot files (`pg_dump -Fc -Z9` or `pg_basebackup`) taken at scheduled intervals (daily or weekly).
2. **Write-Ahead Log (WAL) Segments:** Immutable sequential transaction stream files containing every relational mutation, PostGIS coordinate modification, and pgvector index insertion since the base backup.

By replaying archived WAL files onto a restored base backup up to an exact timestamp, municipal administrators can roll back human error, transaction corruption, or infrastructure failure to the exact second prior to the incident without losing intervening work.

---

## 2. PostgreSQL Server Configuration (`postgresql.conf`)

To enable production-grade Continuous WAL Archiving, ensure the following parameters are active in `postgresql.conf`:

```ini
# Replication and WAL Archiving
wal_level = replica
archive_mode = on
archive_command = 'test ! -f /var/lib/postgresql/wal_archive/%f && cp %p /var/lib/postgresql/wal_archive/%f'
archive_timeout = 300       # Force WAL switch at least every 5 minutes

# Checkpoint Tuning for Consistent Recovery
checkpoint_timeout = 15min
max_wal_size = 2GB
min_wal_size = 512MB
checkpoint_completion_target = 0.9
```

---

## 3. Automated Base Backup Routine

Municipal automated backups run daily at 02:00 UTC using the PostgreSQL custom format (`-Fc`), which employs zlib compression:

```bash
#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="/var/backups/everleafdb"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/everleafdb_base_${TIMESTAMP}.dump"
MANIFEST_FILE="${BACKUP_DIR}/everleafdb_manifest_${TIMESTAMP}.json"

echo "=== EverLeafDB: Initiating Base Backup at ${TIMESTAMP} ==="
mkdir -p "${BACKUP_DIR}"

# Execute compressed custom-format pg_dump
pg_dump \
  -h localhost \
  -p 5432 \
  -U municipal_admin \
  -d everleafdb \
  -Fc \
  -Z 9 \
  --verbose \
  -f "${BACKUP_FILE}"

# Generate SHA-256 integrity checksum
sha256sum "${BACKUP_FILE}" > "${BACKUP_FILE}.sha256"

# Record snapshot metadata manifest via PL/pgSQL
psql -h localhost -U municipal_admin -d everleafdb \
  -t -A -c "SELECT fn_generate_database_snapshot_manifest();" > "${MANIFEST_FILE}"

echo "=== Backup completed successfully: ${BACKUP_FILE} ==="
```

---

## 4. Point-in-Time Recovery (PITR) Execution Procedure

If an erroneous mutation or data corruption occurs at `2026-11-07 14:32:15 UTC`:

### Step 1: Stop Active Database Service
```bash
docker compose stop db
```

### Step 2: Preserve Current WAL Logs
Ensure any unreplicated WAL segments in `pg_wal` are copied to safe storage before clearing data:
```bash
cp -r /var/lib/postgresql/data/pg_wal /var/backups/everleafdb/unarchived_wal/
```

### Step 3: Clear Damaged Cluster Data Directory
```bash
rm -rf /var/lib/postgresql/data/*
```

### Step 4: Restore Base Backup
Restore from the most recent base backup taken prior to the target timestamp:
```bash
pg_restore \
  -h localhost \
  -p 5432 \
  -U municipal_admin \
  -d everleafdb \
  --clean \
  --if-exists \
  --verbose \
  /var/backups/everleafdb/everleafdb_base_20261107_020000.dump
```

### Step 5: Configure Recovery Signal & Target Time
Create `recovery.signal` in the cluster data directory and append target directives:

```bash
touch /var/lib/postgresql/data/recovery.signal

cat <<EOF >> /var/lib/postgresql/data/postgresql.auto.conf
# Point-in-Time Recovery Directives
restore_command = 'cp /var/lib/postgresql/wal_archive/%f "%p"'
recovery_target_time = '2026-11-07 14:32:00+00'
recovery_target_action = 'pause'
EOF
```

### Step 6: Restart Database in Recovery Mode
```bash
docker compose start db
```

PostgreSQL will replay WAL records sequentially until reaching `2026-11-07 14:32:00+00` and then pause.

### Step 7: Verify Recovery Consistency
Connect as Municipal Admin and verify relational consistency:
```bash
psql -h localhost -U municipal_admin -d everleafdb -c "
SELECT pg_is_wal_replay_paused();
SELECT * FROM fn_verify_backup_integrity_checksum(pg_read_file('/var/backups/manifest.json')::jsonb);
"
```

Once confirmed, resume and promote the standby database to primary:
```bash
psql -h localhost -U municipal_admin -d everleafdb -c "SELECT pg_wal_replay_resume();"
```

---

## 5. Automated Integrity Drill & Verification
EverLeafDB performs automated restoration drills weekly in a detached container (`everleafdb-recovery-drill`) to verify that the generated `.dump` archive can be fully unpacked and passes the `fn_verify_backup_integrity_checksum()` parity assertions without discrepancy.

