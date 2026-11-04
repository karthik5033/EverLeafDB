# EverLeafDB: 30-Phase Master Implementation Plan

> **Tech Stack Specification:**
> - **Frontend & Web Framework:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui (Radix UI primitives, Lucide icons, Sonner, Recharts, TanStack Table)
> - **Mapping & Geospatial:** MapLibre GL / Leaflet with OpenStreetMap tiles & GeoJSON boundary layers
> - **Database Engine:** PostgreSQL 16 + PostGIS 3.4 + pgvector 0.7
> - **Vision & Embeddings:** OpenAI CLIP (`ViT-B/32`) generating 512-dimensional vectors (PyTorch / ONNX Runtime)
> - **API & Concurrency:** Next.js Route Handlers / Server Actions + asyncpg connection pooling with ACID transaction isolation

---

## Phase Overview Map

```
[ FOUNDATION ]  ──>  [ DATA & SPATIAL ]  ──>  [ VECTOR & INGESTION ]  ──>  [ ACTIVE LOGIC & QUERIES ]  ──>  [ UI & ARBORIST WORKFLOW ]  ──>  [ EVALUATION & POLISH ]
  Phases 1-3            Phases 4-8                Phases 9-12                    Phases 13-20                     Phases 21-27                     Phases 28-30
```

---

## Phase Breakdown

### Phase 1: Environment & Toolchain Initialization
- **Objective:** Establish the development environment, containerized database, and Next.js 14 baseline.
- **Tasks:**
  1. Initialize Next.js 14+ project with TypeScript, Tailwind CSS, ESLint, and App Router structure (`/app`).
  2. Create `docker-compose.yml` for PostgreSQL 16 bundling `postgis/postgis:16-3.4` and `pgvector/pgvector:pg16`.
  3. Configure environment variables (`DATABASE_URL`, `EMBEDDING_API_URL`, `JWT_SECRET`, `STORAGE_PATH`).
  4. Test local container connectivity and verify `SELECT postgis_full_version();` and `SELECT * FROM pg_extension WHERE extname = 'vector';`.
- **Deliverables:** Working Next.js repository, Docker Compose stack, database connection pool utility (`lib/db.ts`).

---

### Phase 2: shadcn/ui Design System & Layout Scaffolding
- **Objective:** Configure shadcn/ui components and responsive application layout shells ready for custom UI replication.
- **Tasks:**
  1. Initialize shadcn/ui via CLI (`npx shadcn-ui@latest init`) with Slate/Emerald theme palette suited for forestry.
  2. Install core atomic components: `Button`, `Card`, `Badge`, `Dialog`, `Sheet`, `DropdownMenu`, `Tabs`, `Table`, `Input`, `Select`, `Textarea`, `Toast (Sonner)`, `Skeleton`, `Tooltip`.
  3. Build master dashboard shell with collapsible sidebar navigation (Trees, Inspections, Map Explorer, Alerts, Work Orders, Analytics, Settings).
  4. Create dedicated asset folders (`/public/ui-mocks`) prepared to receive user-provided reference images for pixel-perfect replication.
- **Deliverables:** Clean, theme-aware layout shell with navigation state and component showcase page.

---

### Phase 3: Relational 3NF Schema & TypeScript Type System
- **Objective:** Codify the 3NF database schema, database migrations, and strongly-typed interfaces.
- **Tasks:**
  1. Draft initial database migration scripts (`sql/01_schema.sql`) covering the 14 core tables from the specification.
  2. Define PostgreSQL ENUMs: `tree_health_status`, `organ_body_part`, `disease_severity`, `treatment_outcome`, `work_order_priority`, `work_order_status`, `alert_status`, `user_role`.
  3. Create matching TypeScript interfaces in `types/database.ts` representing every relational entity and its relations.
  4. Write Zod validation schemas in `lib/validations/` for runtime payload verification.
- **Deliverables:** Executable DDL migration, TypeScript data contracts, and Zod validator suite.

---

### Phase 4: PostGIS Spatial Infrastructure & CRS Configuration
- **Objective:** Configure spatial geometries, coordinate reference systems, and GiST indexing.
- **Tasks:**
  1. Implement geometries: `location_geom GEOMETRY(Point, 4326)` on `trees` and `boundary_geom GEOMETRY(Polygon, 4326)` on `wards`.
  2. Create spatial indexes: `idx_trees_location_gist` and `idx_wards_boundary_gist` using GiST.
  3. Implement database check constraint: `chk_tree_within_ward` ensuring tree coordinates fall inside the designated ward polygon.
  4. Test spatial utility queries (`ST_Contains`, `ST_DWithin`, `ST_Distance`).
- **Deliverables:** Tested spatial tables with bounding-box validation and GiST acceleration.

---

### Phase 5: pgvector Setup & High-Dimensional Indexing
- **Objective:** Set up vector columns, cosine operators, and HNSW graph indexes.
- **Tasks:**
  1. Add `image_embedding vector(512)` to `inspection_images` and `notes_embedding vector(512)` to `inspections`.
  2. Enforce dimension constraint: `CHECK (array_length(image_embedding::real[], 1) = 512)`.
  3. Construct HNSW index: `idx_inspection_images_vector_hnsw USING hnsw (image_embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64)`.
  4. Benchmark index creation and cosine similarity operator (`<=>`).
- **Deliverables:** pgvector columns initialized with production-tuned HNSW graph indexes.

---

### Phase 6: Botanical Species & Disease Taxonomy Seeding
- **Objective:** Seed realistic botanical species, pathogens, and susceptibility relationships.
- **Tasks:**
  1. Create seed script for 25 urban tree species (*Neem, Banyan, Jacaranda, Gulmohar, Teak, Rain Tree, etc.*) with growth rate and lifespan data.
  2. Seed 20 pathological disease profiles (*Anthracnose, Ganoderma Root Rot, Powdery Mildew, Bark Borer Beetle, Leaf Scorch*) categorized by severity.
  3. Populate the M:N `species_disease_susceptibility` mapping matrix with vulnerability indices (`LOW`, `MODERATE`, `HIGH`).
  4. Seed standard treatments with duration and estimated municipal cost.
- **Deliverables:** `sql/02_seed_taxonomy.sql` script with real-world arboricultural reference data.

---

### Phase 7: Municipal Wards & Geofence Boundary Layer
- **Objective:** Ingest realistic administrative ward polygons and setup spatial boundaries.
- **Tasks:**
  1. Ingest GeoJSON polygons for municipal wards with area calculations (`area_sq_km`).
  2. Create API endpoint `GET /api/wards` returning GeoJSON MultiPolygons for map rendering.
  3. Implement spatial polygon point-in-polygon helper function in TypeScript using PostGIS `ST_Contains`.
  4. Build ward selector UI component in shadcn/ui with ward area and tree count badges.
- **Deliverables:** Ward boundary layer accessible via API and displayed as interactive SVG/GeoJSON overlays.

---

### Phase 8: Tree Registry Core CRUD & Registration Flow
- **Objective:** Build full tree lifecycle management with interactive coordinate picking.
- **Tasks:**
  1. Create API route `POST /api/trees` validating botanical and spatial attributes.
  2. Build Next.js Tree Registration form with shadcn/ui (`Form`, `Input`, `Select`, `DatePicker`).
  3. Integrate interactive mini-map coordinate picker: clicking the map automatically populates latitude/longitude and detects ward containment.
  4. Implement Tree Detail page (`/trees/[id]`) displaying dendrometric stats (height, girth, estimated age, status badge).
- **Deliverables:** Complete Tree Registration UI and backend pipeline with spatial verification.

---

### Phase 9: Interactive GIS Map Explorer (MapLibre / Leaflet)
- **Objective:** Provide a full-screen geospatial explorer for municipal forest inventory.
- **Tasks:**
  1. Implement Next.js Client Component map using MapLibre GL / Leaflet with vector tiles.
  2. Render municipal ward polygon boundaries with custom fill and stroke styling.
  3. Implement marker clustering for high-density tree locations color-coded by `health_status`.
  4. Build interactive slide-over drawer (shadcn `Sheet`) showing tree details and past inspection timeline when a tree marker is clicked.
- **Deliverables:** Interactive map view with pan, zoom, cluster markers, and ward overlays.

---

### Phase 10: Multimodal Vision Pipeline & Embedding Worker
- **Objective:** Implement the CLIP `ViT-B/32` vectorization worker.
- **Tasks:**
  1. Implement lightweight Python FastAPI / ONNX Runtime microservice (`/embed`) loading pre-trained CLIP `ViT-B/32`.
  2. Normalize image tensors, extract 512-dimensional feature vectors, and apply $L_2$ unit normalization.
  3. Add health-check and batch inference endpoints.
  4. Implement client helper in Next.js backend calling the embedding worker during image upload.
- **Deliverables:** Running embedding extraction service generating 512-d unit vectors from image buffers.

---

### Phase 11: Image Storage & Asset Management Subsystem
- **Objective:** Securely store and serve inspection photography.
- **Tasks:**
  1. Configure local / S3-compatible object storage directory for raw inspection photographs.
  2. Implement Next.js upload handler validating MIME types (`image/jpeg`, `image/png`, `image/webp`) and enforcing file size caps (10MB).
  3. Strip Exif privacy/GPS metadata from uploaded files before long-term persistence.
  4. Generate and store content hash (SHA-256) to prevent duplicate image ingestion.
- **Deliverables:** Secure image upload pipeline returning persistent URL references.

---

### Phase 12: Field Inspection Form & Multimodal Ingestion UI
- **Objective:** Create a mobile-first field inspection interface for arborists on duty.
- **Tasks:**
  1. Build mobile-responsive inspection form at `/inspections/new?tree_id=<id>`.
  2. Implement camera shutter / file upload component with real-time image preview.
  3. Provide anatomical part selector (`leaf`, `bark`, `trunk`, `root`, `canopy`) and 1–5 visual condition score slider.
  4. Wire form submission to execute image upload, CLIP vectorization, and database insert into `inspections` and `inspection_images`.
- **Deliverables:** Functional field inspection UI with photo capture and instant condition scoring.

---

### Phase 13: Database Triggers for Core Operational Integrity
- **Objective:** Automate relational state synchronizations via PostgreSQL triggers.
- **Tasks:**
  1. Implement `trg_fn_update_last_inspected()`: updates `trees.last_inspected_at` upon any new inspection insert.
  2. Implement `trg_fn_audit_trail()`: captures `INSERT`, `UPDATE`, `DELETE` operations on `trees`, `diagnoses`, and `work_orders` into `audit_log`.
  3. Attach triggers to tables and write test scripts verifying audit log JSONB diffs.
- **Deliverables:** `sql/04_triggers_core.sql` maintaining real-time audit logs and timestamp integrity.

---

### Phase 14: Real-Time Pathological Risk Detection Trigger
- **Objective:** Implement active database intelligence for automated outbreak detection.
- **Tasks:**
  1. Write PL/pgSQL trigger `trg_fn_detect_severe_disease_alert()` on `inspection_images`.
  2. Implement HNSW vector cosine search inside the trigger against confirmed severe cases of the same species.
  3. If similarity $\ge 0.82$, automatically insert an alert record into `alerts` with `severity = 'CRITICAL'` and set `trees.health_status = 'under_treatment'`.
  4. Benchmark execution latency inside the transaction and tune search parameters.
- **Deliverables:** Autonomous database risk trigger that flags severe conditions without manual intervention.

---

### Phase 15: Case-Based Visual Similarity Search Engine
- **Objective:** Implement explainable precedent retrieval matching photos to past cured cases.
- **Tasks:**
  1. Build backend service function executing vector search: `ORDER BY image_embedding <=> $vector ASC LIMIT 5`.
  2. Join matched images back to historical `diagnoses`, `diseases`, and `treatment_records`.
  3. Return calculated similarity percentages, arborist notes, and treatment outcome statuses (`SUCCESSFUL`, `FAILED`).
  4. Create UI card component displaying retrieved precedent cases side-by-side with the uploaded query image.
- **Deliverables:** Case-based recommendation engine explaining visual matches with clinical history.

---

### Phase 16: Hybrid Query 1 — Spatial Proximity + Vector Similarity
- **Objective:** Implement Query 1: Nearby visually similar cases of the same species.
- **Tasks:**
  1. Implement SQL query combining `ST_DWithin(t.location_geom, target, 500)`, `t.species_id = target_species`, and `ORDER BY img.image_embedding <=> $vec LIMIT 5`.
  2. Create Next.js API route `/api/queries/nearby-similar`.
  3. Build dedicated UI view allowing users to adjust the radius slider (100m to 2000m) and view results on an interactive map split-screen.
- **Deliverables:** Operational Query 1 endpoint and interactive UI with dynamic radius buffer visualization.

---

### Phase 17: Hybrid Query 2 — Ward-Level Disease Case Search
- **Objective:** Implement Query 2: Search similar cases within a specific administrative ward.
- **Tasks:**
  1. Write SQL query filtering by `ward_id`, `species_id`, and `treatment_records.outcome_status = 'SUCCESSFUL'`, sorted by vector cosine distance.
  2. Create API endpoint `/api/queries/ward-disease-search`.
  3. Build shadcn/ui data view displaying the most effective historical treatments for the selected ward.
- **Deliverables:** Operational Query 2 endpoint and curated treatment efficacy cards.

---

### Phase 18: Hybrid Query 3 — Contagion Risk Cluster Detection
- **Objective:** Implement Query 3: Identify contagion clusters around severe outbreaks.
- **Tasks:**
  1. Write SQL query identifying trees within 500m of a confirmed critical outbreak whose recent photos match the symptom vector and haven't been treated in > 1 year.
  2. Expose endpoint `/api/queries/contagion-clusters`.
  3. Render contagion clusters on the map as translucent red hazard heat zones with list of endangered trees.
- **Deliverables:** Contagion outbreak detection query and geospatial hazard overlay.

---

### Phase 19: Hybrid Query 4 — Treatment Efficacy & Cost Ranking
- **Objective:** Implement Query 4: Aggregate treatment success rates and financial costs per disease.
- **Tasks:**
  1. Write SQL aggregation query grouping by disease and treatment, computing percentage of `SUCCESSFUL` outcomes and average cost.
  2. Expose endpoint `/api/analytics/treatment-efficacy`.
  3. Build analytical dashboard with shadcn/ui charts (Recharts bar chart comparing success rates and treatment costs).
- **Deliverables:** Analytical query and visual ROI chart for municipal arborists.

---

### Phase 20: Hybrid Query 5 & 6 — Overdue Inspections & Tree Mortality
- **Objective:** Implement Query 5 (Overdue inspections) and Query 6 (Lifespan and mortality drivers).
- **Tasks:**
  1. Implement Query 5: Trees not inspected in > 180 days, grouped by ward and ranked by days overdue.
  2. Implement Query 6: Window function calculating average lifespan at removal and top fatal disease per species.
  3. Build tabular and metric card UI components in Next.js displaying high-risk overdue trees and mortality insights.
- **Deliverables:** Operational Queries 5 and 6 integrated into the analytics dashboard.

---

### Phase 21: Clinical Diagnosis & Arborist Triage Interface
- **Objective:** Provide a clinical review screen for certified supervisors to confirm diagnoses.
- **Tasks:**
  1. Build Supervisor Triage Dashboard at `/alerts` listing all `PENDING` risk alerts.
  2. Create side-by-side inspection viewer comparing the current suspicious photo with the top retrieved reference case.
  3. Add arborist input controls to confirm disease, adjust confidence source (`manual` vs `vector_suggested`), and select treatment plan.
- **Deliverables:** Professional arborist triage portal with visual comparison and confirmation workflow.

---

### Phase 22: Stored Procedure for Atomic Work Order Dispatch
- **Objective:** Codify the ACID-compliant stored procedure `sp_confirm_diagnosis_and_dispatch_order`.
- **Tasks:**
  1. Implement PL/pgSQL stored procedure in `sql/05_procedures.sql`.
  2. Enforce `SELECT FOR UPDATE` pessimistic locking on target alerts to prevent concurrent dispatch conflicts.
  3. Atomically insert `diagnoses`, `treatment_records`, and `work_orders`, while updating `alerts.status = 'ACTIONED'`.
  4. Write integration test verifying rollback occurs if any step fails (ACID Atomicity).
- **Deliverables:** Production-grade stored procedure and API invocation route.

---

### Phase 23: Work Order Management & Crew Dispatch Kanban
- **Objective:** Build a task management system for municipal field crews.
- **Tasks:**
  1. Create Kanban-style board at `/work-orders` with columns: `PENDING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`.
  2. Support dragging or clicking to transition status, automatically recording completion timestamps.
  3. Provide crew assignment dropdown and priority badge styling (`LOW`, `MEDIUM`, `HIGH`, `EMERGENCY`).
  4. Filter work orders by assigned contractor or municipal ward.
- **Deliverables:** Fully interactive work order management interface with real-time status transitions.

---

### Phase 24: Materialized Views & Concurrent Refresh Automation
- **Objective:** Optimize reporting performance with PostgreSQL Materialized Views.
- **Tasks:**
  1. Create `mv_ward_health_summary` aggregating total trees, health indices, and overdue counts per ward.
  2. Create unique index `idx_mv_ward_health_pk` enabling non-blocking `REFRESH MATERIALIZED VIEW CONCURRENTLY`.
  3. Implement scheduled refresh trigger or Next.js background cron route `/api/cron/refresh-views`.
  4. Measure query performance improvement (target: < 5ms dashboard loads).
- **Deliverables:** Materialized view scripts and automated background refresh mechanism.

---

### Phase 25: Executive Analytics & Ward Health Dashboard
- **Objective:** Deliver executive-level municipal overview charts and KPI summaries.
- **Tasks:**
  1. Build Analytics Overview page (`/analytics`) with metric stat cards: Total Managed Trees, Active Contagion Alerts, Forest Health Index %, Overdue Inspection Count.
  2. Embed Recharts/shadcn data visualizations:
     - Health Status distribution (Donut chart)
     - Tree species biodiversity breakdown (Bar chart)
     - Ward-by-ward comparison table with health percentages
  3. Add one-click export button generating PDF/CSV summary reports.
- **Deliverables:** Executive dashboard with interactive charts and exportable metrics.

---

### Phase 26: Authentication, RBAC & Row-Level Security (RLS)
- **Objective:** Secure the system with role-based access control and database-level row isolation.
- **Tasks:**
  1. Configure NextAuth.js / JWT authentication with email and password hashing (Argon2 / bcrypt).
  2. Assign roles: `admin`, `supervisor`, `field_inspector`, `citizen_reporter`.
  3. Enable PostgreSQL Row-Level Security on `trees` and `inspections`.
  4. Inject session variables `SET LOCAL app.current_user_id` and `app.current_user_role` before executing queries.
  5. Test that field inspectors cannot read or insert data in unauthorized wards.
- **Deliverables:** Strict multi-tenant ward isolation enforced at the PostgreSQL engine level.

---

### Phase 27: Citizen Reporting Public Portal
- **Objective:** Provide a lightweight, authenticated/anonymous public interface for citizen reports.
- **Tasks:**
  1. Build public-facing page `/report` allowing citizens to snap a photo, enter an address or tap GPS, and describe hazards.
  2. Ingest report into a staging queue or unverified inspection state.
  3. Provide a public ticket lookup page where citizens can view the resolution status of their submitted report without accessing internal records.
- **Deliverables:** Responsive public reporting interface and back-office submission queue.

---

### Phase 28: System Auditing, Compliance & Backup Verification
- **Objective:** Establish data governance, audit inspection, and disaster recovery routines.
- **Tasks:**
  1. Build Admin Audit Log viewer (`/admin/audit`) querying `audit_log` with JSONB diff viewer showing changed values.
  2. Create automated database backup script using `pg_dump -Fc` with gzip compression.
  3. Document and test Point-in-Time Recovery (PITR) procedures using PostgreSQL Write-Ahead Logs (WAL).
  4. Perform data restoration drill in a temporary container to verify backup integrity.
- **Deliverables:** Working audit log viewer, automated backup script, and verified restoration guide.

---

### Phase 29: Empirical Experiments & Benchmarking Suite
- **Objective:** Execute and document the three innovative DBMS experiments required for course evaluation.
- **Tasks:**
  1. **Experiment A (Retrieval Quality):** Run precision@k test harness against a labeled test dataset comparing CLIP vs text-only baseline.
  2. **Experiment B (Hybrid Index Benchmarking):** Benchmark Query 1 latency under four scenarios (No Index, GiST only, HNSW only, Hybrid GiST + HNSW) and generate execution plan charts.
  3. **Experiment C (Trigger Calibration):** Measure recall vs false-alarm rates across cosine distance thresholds (0.70 to 0.90) to justify the 0.82 threshold.
  4. Format experimental outputs into markdown tables and charts for viva presentation.
- **Deliverables:** Automated benchmarking script `tests/benchmark_suite.py` and empirical results artifact.

---

### Phase 30: UI Polish, Documentation & Viva Presentation Sandbox
- **Objective:** Finalize shadcn/ui aesthetic replication, documentation, and live demo tools.
- **Tasks:**
  1. Replace placeholder UI components with pixel-accurate shadcn/ui styling matching user-supplied design references.
  2. Ensure smooth responsiveness across desktop, tablet, and mobile viewport sizes.
  3. Add a "Demo Seed & Reset" button in the admin panel to quickly populate or clean demo data during viva demonstrations.
  4. Prepare live demo cheat-sheet linking to pre-configured hybrid query runs.
- **Deliverables:** Production-ready web application, polished UI, and examiner-ready live demo sandbox.

---
*EverLeafDB Project Plan • Approved for Phased Execution (Do Not Push Until Explicitly Requested)*

