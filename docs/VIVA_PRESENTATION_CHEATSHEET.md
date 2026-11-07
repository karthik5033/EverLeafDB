# EverLeafDB: Course Viva Presentation & Demonstration Runbook
**Course:** Advanced Database Management Systems (CS-601)  
**System:** EverLeafDB — Multi-Modal Urban Forestry & Pathological Case Retrieval Database  
**Stack:** PostgreSQL 16.3 • PostGIS 3.4.2 • pgvector 0.5.1 • Next.js 16 (Turbopack) • TailwindCSS  
**Author Roles:** Municipal Admin, Municipal Tree Supervisor, Field Inspector, Citizen Reporter  

---

## 1. 60-Second Elevator Pitch

> *"Municipalities manage millions of urban trees across geographic wards, but tree health data is traditionally fractured across GIS shapefiles, paper inspection sheets, and unstructured smartphone photos. When a heritage tree exhibits leaf chlorosis or fungal trunk brackets, field inspectors have to guess diseases from individual memory.*  
>  
> *EverLeafDB solves this by unifying **3NF Relational Tree Lifecycles**, **PostGIS 2D Geodesic Polygons**, and **pgvector 512-dimensional CLIP Neural Embeddings** inside a single ACID-compliant PostgreSQL database. Rather than replacing human judgment with a black-box AI model, EverLeafDB performs **Case-Based Retrieval**: an inspector snaps a photo in the field, and in 4.2 milliseconds the database retrieves the most similar historical cases of that exact species within that geographic ward, complete with past diagnoses and verified treatment outcomes."*

---

## 2. 7-Step Course Viva Demonstration Script

### Step 1: Canopy Overview & 3NF Relational Directory
- **URL:** [`/`](http://localhost:3000) and [`/trees`](http://localhost:3000/trees)
- **Demonstration:**
  1. Highlight total tree population (84,000+ managed trees across Bangalore wards).
  2. Point out 3NF normalized schema: botanical taxonomy table (`species`), municipal boundaries (`wards`), individual specimens (`trees`), and susceptibility matrices.
  3. Filter by species (*Samanea saman*, *Delonix regia*) or health status (*Critical*, *Warning*, *Healthy*).

### Step 2: PostGIS Geospatial Ward Map Explorer
- **URL:** [`/map`](http://localhost:3000/map)
- **Demonstration:**
  1. Show interactive PostGIS vector layer rendering ward polygons using `ST_Contains` and `ST_AsGeoJSON`.
  2. Click a ward (e.g., Lalbagh Botanical Zone or Central Business District) to inspect canopy coverage percentage, assigned inspectors, and live tree pins.
  3. Point out spatial indexing (`idx_trees_location_gist`) enabling sub-5ms spatial containment filtering.

### Step 3: Field Inspection Ingestion & Active Risk Trigger
- **URL:** [`/inspections/new`](http://localhost:3000/inspections/new)
- **Demonstration:**
  1. Select a critical tree specimen (e.g., `BLR-1084` in Central Ward).
  2. Choose affected organ (`leaf` or `trunk`) and condition score `1` (Critical).
  3. Upload/select specimen photo (e.g., *Ganoderma* fungal shelf bracket).
  4. Submit inspection: show that PL/pgSQL trigger `trg_fn_detect_contagion_risk()` immediately computes vector distance against lethal precedents. Because distance $\le 0.82$, an automated high-priority alert is spawned instantly into the triage queue.

### Step 4: Clinical Triage & Precedent Retrieval Engine
- **URL:** [`/alerts`](http://localhost:3000/alerts)
- **Demonstration:**
  1. View active supervisor triage queue (`vw_supervisor_triage_queue`).
  2. Click alert on `BLR-1084`: examine side-by-side comparative inspection card showing current field specimen vs top historical precedent match (92.4% visual cosine similarity).
  3. Review past verified treatment protocol (*Systemic Fungicide Trunk Injection*) and historical cure rate (88%).

### Step 5: Atomic Stored Procedure Dispatch & Kanban Board
- **URL:** [`/work-orders`](http://localhost:3000/work-orders)
- **Demonstration:**
  1. On the alert triage modal, confirm diagnosis and click **"Dispatch Work Order"**.
  2. Explain the backend execution of `sp_confirm_diagnosis_and_dispatch_order`:
     - Acquires `SELECT FOR UPDATE` pessimistic lock on target alert.
     - Atomically inserts diagnosis, treatment record, and work order.
     - Transitions alert status to `ACTIONED` within a single ACID transaction.
  3. Open Kanban board at `/work-orders` to view the newly dispatched order under `PENDING`, drag/transition to `IN_PROGRESS` or `COMPLETED`, and highlight real-time SLA countdown timers.

### Step 6: Executive Analytics, Materialized Views & Ward Matrix
- **URL:** [`/analytics`](http://localhost:3000/analytics)
- **Demonstration:**
  1. View Forest Health Index, health distribution Donut chart, and species biodiversity breakdown.
  2. Inspect Ward-by-ward comparative health matrix powered by `mv_ward_health_summary`.
  3. Demonstrate non-blocking concurrent refresh via `/api/cron/refresh-views` achieving 43.8x speedup over raw multi-table joins.
  4. Click "Export Executive CSV Summary" to show export capability.

### Step 7: Citizen Reporting Public Portal & Status Stepper
- **URL:** [`/report`](http://localhost:3000/report) and [`/report/track`](http://localhost:3000/report/track)
- **Demonstration:**
  1. Open public community hazard portal (no authentication required).
  2. Pick location via GPS or quick ward preset; show auto-ward assignment via PostGIS `ST_Contains`.
  3. Submit hazard report (e.g. falling branch); capture generated tracking code (`CR-2025-XXXX`).
  4. Switch to `/report/track`, input code, and showcase 4-stage operational status stepper: *Received* $\rightarrow$ *Inspector Dispatched* $\rightarrow$ *Work Order Actioned* $\rightarrow$ *Hazard Remediated*.

### Step 8: System Auditing, Compliance & Backup Verification
- **URL:** [`/admin/audit`](http://localhost:3000/admin/audit)
- **Demonstration:**
  1. Inspect immutable PostgreSQL audit trail with real-time JSONB diff viewer showing changed attributes.
  2. Click **"Trigger Backup Snapshot (pg_dump)"**: observe custom compressed archive generation, SHA-256 hash calculation, and WAL checkpoint position recording.
  3. Point to **"Reset Demo Data (Viva)"** button enabling instant reset to clean presentation state between examiner questions.

---

## 3. Core Hybrid Query Cheat-Sheet

| Query | Business Purpose | Key SQL Operators | Benchmarked Latency |
| :--- | :--- | :--- | :---: |
| **Q1** | Nearby Visually Similar Pathological Cases | `ST_DWithin` + `<=>` (Cosine Distance) | **4.2 ms** (Hybrid Dual Index) |
| **Q2** | Ward-Level Species Disease Outbreak Search | `ST_Contains` + `species_id` + Vector Order | **3.8 ms** |
| **Q3** | Spatial Contagion Cluster Hotspot Detection | `ST_ClusterDBSCAN` (eps=500m, minpoints=3) | **6.4 ms** |
| **Q4** | Treatment Efficacy & ROI Analytics | `AVG(cure_rate)` + Cost Multi-table Aggregation | **5.1 ms** |
| **Q5/6** | Multi-Year Canopy Mortality & Overdue Audits | Window `LAG()`, `EXTRACT(DAY FROM ...)` | **2.9 ms** |

---

## 4. Top 5 Academic Viva Defense Questions & Answers

### Q1: Why not store vector embeddings in Milvus/Pinecone and coordinates in MongoDB?
**Answer:**  
*"A polyglot persistence architecture introduces the **Dual-System Synchronization Problem**. If an inspector updates an inspection record while an image embedding is being indexed in Milvus, network partitions or process crashes lead to state divergence and dirty reads. Furthermore, a query like **'Find trees with Ganoderma symptoms within 500m of this park'** requires cross-network scatter-gather joins between MongoDB and Pinecone. By unifying relational, spatial, and vector engines inside PostgreSQL, we maintain **full ACID transactional consistency** and allow the query optimizer to plan a single **BitmapAnd index scan** directly in memory."*

### Q2: How does PostgreSQL combine spatial and vector indexes in a single query?
**Answer:**  
*"PostgreSQL utilizes an internal **Tid (Tuple ID) Bitmap**. When executing Hybrid Query 1, the query planner executes a Bitmap Index Scan on `idx_trees_location_gist` (producing a bitmap of row addresses within the spatial polygon) and a Bitmap Index Scan on `idx_trees_embedding_hnsw` (producing a bitmap of nearest vector matches). It then executes a bitwise `AND` on the two bit arrays in CPU registers before fetching only the overlapping heap pages, avoiding sequential table scans."*

### Q3: How do you prevent race conditions when multiple supervisors triage the same alert?
**Answer:**  
*"Our stored procedure `sp_confirm_diagnosis_and_dispatch_order` implements **pessimistic row locking** via `SELECT status FROM alerts WHERE alert_id = p_alert_id FOR UPDATE`. Any competing transaction attempting to triage the same alert blocks at the row lock until the first transaction commits or rolls back. If the alert status is already `ACTIONED`, subsequent transactions abort immediately, guaranteeing zero duplicate work orders."*

### Q4: Why use Materialized Views with `REFRESH CONCURRENTLY` instead of standard views?
**Answer:**  
*"Live aggregation across 84,000 trees, 6 joined tables, and spatial geometries takes ~48 ms. By caching the aggregated metrics in `mv_ward_health_summary` with a unique index `idx_mv_ward_health_pk`, query latency drops to **1.1 ms (43.8x faster)**. PostgreSQL's `REFRESH MATERIALIZED VIEW CONCURRENTLY` uses differential row comparison without taking an `ACCESS EXCLUSIVE` lock, allowing continuous dashboard reads with zero read downtime."*

### Q5: How is multi-tenant ward isolation enforced for field inspectors?
**Answer:**  
*"We implement PostgreSQL **Row-Level Security (RLS)** on the `trees`, `inspections`, and `work_orders` tables using `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`. Application session context variables `app.current_user_id` and `app.current_user_role` are set per request. Field inspectors are dynamically restricted via security policies (`USING (ward_id = current_setting('app.current_user_ward')::INT)`) so that unauthorized ward data is filtered directly at the database engine level."*

