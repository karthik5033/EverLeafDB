# EverLeafDB: Product Requirements Document (PRD)

| Metadata | Details |
| :--- | :--- |
| **Product Name** | **EverLeafDB** |
| **Document Version** | v1.0.0 (Final Architecture Spec) |
| **Project Type** | Enterprise Spatial & Vector DBMS for Urban Forestry |
| **Academic Department** | Dept. of Information Science & Engineering, RVCE |
| **Subject** | Database Management Systems (DBMS Novel Project) |
| **Target Database Engine**| PostgreSQL 16 + PostGIS 3.4 + pgvector 0.7 |
| **Document Status** | Approved for Implementation |

---

## 1. Executive Summary & Problem Space

### 1.1 Context
Municipal governments, botanical gardens, and university campuses oversee tens of thousands of urban trees that provide air filtration, stormwater mitigation, urban heat island reduction, and psychological well-being. Despite their ecological value, the management of urban tree populations remains antiquated.

### 1.2 The Core Problem
1. **Data Fragmentation:** Crucial lifecycle information (planting date, GPS location, crown measurements, disease history, work orders) is siloed across hand-written field notebooks, spreadsheet files, and disconnected chat groups.
2. **Subjective & Inconsistent Diagnosis:** Disease identification relies almost entirely on the individual field inspector's memory. Novice inspectors frequently misdiagnose early-stage fungal cankers, root rots, or beetle borers.
3. **Reactive Rather than Preventive Care:** Trees are typically flagged for maintenance only after catastrophic limb failure, severe dieback, or public citizen complaints occur.
4. **Zero Visual Searchability:** Municipalities capture thousands of smartphone inspection photos, but these photos are dumped into unindexed file systems with zero ability to search: *"Show me all oak trees within this ward displaying similar leaf scorch patterns."*

### 1.3 Solution Overview: EverLeafDB
**EverLeafDB** solves this by unifying **Relational Tree Lifecycle Management**, **PostGIS Geospatial Coordinates**, and **pgvector High-Dimensional Image Embeddings** inside a single ACID-compliant database. It does not replace field inspectors with a black-box machine learning classifier. Instead, it operates on a **Case-Based Retrieval** paradigm: an inspector uploads a photo of an ailing branch and the database instantly returns the top 5 most similar past cases of that exact tree species in the same locality, complete with confirmed diagnoses and historical treatment outcomes.

---

## 2. Product Principles & Philosophy

1. **Relational Foundation First:** Geospatial and vector features must serve relational entities, not exist as detached external silos. ACID properties govern all state transitions (e.g., an alert, diagnosis, and work order are created together or not at all).
2. **Explainability Over Black-Box Classification:** Standard AI classifiers output opaque probability distributions (e.g., `87% Ficus Blight`) with no historical reference. EverLeafDB returns concrete, human-verifiable precedent cases: *"This matches Tree #1042 inspected 14 months ago; 200ml Propiconazole injection restored health."*
3. **Spatial Proximity as a First-Class Citizen:** Pathological infections are vector-borne and contagious. Proximity queries (`ST_DWithin`) must seamlessly compose with visual cosine similarity search.
4. **Strict Data Hygiene & Normalization:** All operational data adheres to 3NF standards to eliminate update, insertion, and deletion anomalies.

---

## 3. Target User Personas & Permissions Matrix

| Persona | Primary Needs & Responsibilities | Core Interactions with EverLeafDB |
| :--- | :--- | :--- |
| **Municipal Admin** | Manages system integrity, municipal ward boundaries, user credentials, audit trails, and master botanical species taxonomies. | DDL operations, user creation, ward boundary imports, system-wide configuration, audit log inspection. |
| **Municipal Tree Supervisor** | Validates diagnoses, reviews automated system alerts, selects treatment protocols, assigns work orders to crews, reviews ward-level mortality metrics. | Alert triage, Stored Procedure dispatch (`sp_confirm_diagnosis_and_dispatch_order`), analytical queries, materialized view refreshes. |
| **Field Inspector** | Conducts field visits, updates tree dimensions (girth, height), records health scores, uploads photos of bark/leaves, queries visual precedents. | Tree registration, inspection logging, photo upload, real-time spatial + vector similarity queries. Constrained by Row-Level Security (RLS) to assigned ward. |
| **Citizen Reporter (Optional)** | Reports fallen branches, sidewalk root damage, or diseased community trees via public portal. | Read-only access to self-submitted hazard tickets; anonymous submissions generate pending inspection requests. |

### Permissions Matrix
| Action / Entity | Municipal Admin | Municipal Tree Supervisor | Field Inspector | Citizen Reporter |
| :--- | :---: | :---: | :---: | :---: |
| Create / Edit Species & Diseases | **CRUD** | Read-Only | Read-Only | None |
| Create / Modify Wards (GIS) | **CRUD** | Read-Only | Read-Only | None |
| Register Living Trees | **CRUD** | **CRUD** | **Create/Update** (Own Ward) | None |
| Create Inspection & Upload Image | **CRUD** | **CRUD** | **Create** (Own Ward) | None |
| Trigger Hybrid Similarity Query | Execute | Execute | Execute | None |
| Confirm Diagnosis & Prescribe Treatment | **CRUD** | **CRUD** | None | None |
| Dispatch Work Orders | **CRUD** | **CRUD** | Update Status (Assigned) | None |
| Submit Public Hazard Report | N/A | N/A | N/A | **Create** |
| Access Raw Audit Logs | **Full** | None | None | None |

---

## 4. User Journeys & End-to-End Use Cases

### Journey 1: Routine Field Inspection with Precedent Retrieval
1. Field Inspector arrives at a registered Neem tree (*Azadirachta indica*) in Ward 3.
2. The web application retrieves the tree profile via geolocation (`ST_DWithin` auto-match).
3. The inspector notices powdery white residue on the lower foliage.
4. Inspector snaps a photo via mobile web interface; selects `Body Part: Leaf`.
5. Application computes the 512-d CLIP vector embedding in-memory and transmits `INSERT INTO inspections` and `INSERT INTO inspection_images`.
6. EverLeafDB checks for known severe matches. Finding none above critical threshold, it returns the top-3 historically similar cases within a 2-km radius.
7. Inspector reviews the matched cases: *"Powdery Mildew - Resolved via Neem Oil Emulsion Spray"*. Inspector notes this preliminary observation and submits the inspection.

### Journey 2: Autonomous Early-Warning Detection & Atomic Work Dispatch
1. An inspector uploads a photo of an ancient Heritage Banyan tree showing deep bark necrosis.
2. The `trg_check_symptom_alert` trigger activates on insert into `inspection_images`.
3. The trigger executes an ANN vector search (`<=>`) against confirmed cases of *Ganoderma lucidum* (severe root and trunk rot) for that species.
4. Similarity returns **0.89** (exceeding the 0.82 critical threshold).
5. The trigger automatically creates an entry in `alerts` with `severity = 'CRITICAL'` and updates the tree status to `under_treatment`.
6. Supervisor logs in and sees an urgent alert badge on their dashboard.
7. Supervisor inspects the side-by-side comparison: Current photo vs. Confirmed *Ganoderma* reference.
8. Supervisor executes `sp_confirm_diagnosis_and_dispatch_order()`, which atomically logs the official diagnosis, schedules systemic antifungal root drenching, assigns an emergency work order to Crew A with a 48-hour due date, and resolves the alert.

---

## 5. Functional Requirements (FR)

### Module 1: Botanical & Spatial Tree Registry
- **FR-1.1:** System shall store species taxonomy with scientific name, common name, growth rate, typical lifespan, and foliage type.
- **FR-1.2:** System shall record each tree's physical location as a PostGIS 2D point geometry with SRID 4326.
- **FR-1.3:** System shall validate upon insert that the tree's coordinates fall completely within the boundary polygon of its assigned administrative ward (`ST_Contains`).
- **FR-1.4:** System shall record tree metrics: height in meters (positive numeric), girth in centimeters (positive numeric), planting date, and health status (`healthy`, `under_treatment`, `critical`, `removed`).

### Module 2: Inspection & Multimodal Data Capture
- **FR-2.1:** System shall record periodic inspections linked to a valid tree, including timestamp, condition score (integer 1 to 5), and free-text notes.
- **FR-2.2:** System shall support uploading one or more photographs per inspection event.
- **FR-2.3:** System shall require labeling the botanical organ depicted: `leaf`, `bark`, `trunk`, `root`, or `canopy`.
- **FR-2.4:** System shall validate that incoming vector embeddings are exactly 512 dimensions (`vector(512)`).

### Module 3: Case-Based Similarity Retrieval Engine
- **FR-3.1:** System shall support cosine similarity ranking (`<=>`) between a query vector and stored historical inspection image embeddings.
- **FR-3.2:** System shall allow arbitrary combination of spatial filters (`ST_DWithin`, ward boundaries), relational filters (`species_id`, `outcome_status`), and vector distance in a single query.
- **FR-3.3:** Search results must return: matched tree ID, common name, confirmed historical disease, treatment name, treatment outcome (`SUCCESSFUL`, `FAILED`), and calculated similarity percentage.

### Module 4: Active Database Risk Monitoring & Alerting
- **FR-4.1:** System shall execute an `AFTER INSERT` trigger on `inspection_images` to evaluate similarity against known severe diseases.
- **FR-4.2:** If cosine similarity $\ge 0.82$, an alert record must be inserted automatically into the `alerts` table.
- **FR-4.3:** The tree's `health_status` must be escalated automatically to `under_treatment`.
- **FR-4.4:** System shall execute a trigger on `inspections` to update the parent tree's `last_inspected_at` column.

### Module 5: Clinical Diagnosis & Work Order Lifecycle
- **FR-5.1:** System shall provide an ACID-compliant stored procedure to transition an alert into a confirmed diagnosis, treatment plan, and work order.
- **FR-5.2:** Work orders must contain: target tree ID, diagnosis ID, assigned contractor ID, priority level (`LOW`, `MEDIUM`, `HIGH`, `EMERGENCY`), status (`PENDING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`), and due date.
- **FR-5.3:** Work order updates must lock the target row (`SELECT FOR UPDATE`) to eliminate concurrent assignment conflicts.

### Module 6: Executive Analytics & Ward Health Dashboards
- **FR-6.1:** System shall provide a Materialized View summarizing ward-level forest health (healthy %, critical count, overdue inspections).
- **FR-6.2:** System shall identify spatial clusters of contagion within 500 meters of any confirmed critical outbreak.
- **FR-6.3:** System shall calculate treatment efficacy rates and average intervention costs grouped by pathogen.
- **FR-6.4:** System shall provide an urban forestry mortality report analyzing average lifespan at removal and primary causes of tree death.

### Module 7: Security, RBAC & Row-Level Isolation
- **FR-7.1:** System shall enforce PostgreSQL Row-Level Security (RLS) on `inspections` and `trees`, ensuring field inspectors only access records located within their assigned ward.
- **FR-7.2:** System shall maintain an append-only `audit_log` recording all modifications to sensitive tables (`trees`, `diagnoses`, `work_orders`).

---

## 6. Non-Functional Requirements (NFR)

### 6.1 Performance & Query Latency
- **NFR-1.1:** Hybrid queries combining 500m spatial filtering, species matching, and top-5 vector similarity must return in **< 50 milliseconds** on a dataset of 100,000 trees.
- **NFR-1.2:** Standalone HNSW vector index lookups must execute in **< 15 milliseconds**.
- **NFR-1.3:** Materialized view refreshes (`mv_ward_health_summary`) must execute concurrently without blocking read operations.

### 6.2 Data Integrity & Normalization
- **NFR-2.1:** All tables must strictly adhere to Third Normal Form (3NF) to eliminate insertion, deletion, and update anomalies.
- **NFR-2.2:** Foreign keys must enforce referential integrity (`ON DELETE RESTRICT` for master entities, `ON DELETE CASCADE` for dependent inspection images).
- **NFR-2.3:** Domain constraints (`CHECK` constraints) must reject invalid geometries, negative measurements, out-of-range health scores, and future planting dates.

### 6.3 Concurrency & Transaction Isolation
- **NFR-3.1:** Database must guarantee Read Committed isolation as baseline, escalating to Serializable for multi-record work order allocations.
- **NFR-3.2:** System must support at least 50 concurrent field inspectors writing inspection logs simultaneously without lock contention or deadlocks.

### 6.4 Security, Privacy & Compliance
- **NFR-4.1:** Passwords must be hashed using Argon2id or bcrypt before transmission to database storage; no plaintext credentials.
- **NFR-4.2:** Photo inspection uploads must validate MIME types (rejecting non-image payloads) and strip Exif metadata containing personal identifiable information (PII) before vectorization.

---

## 7. System Interfaces & Data Flow

```
[ Mobile / Web Client ] 
       │
       │ (HTTPS / REST API)
       ▼
[ FastAPI / Python Middleware ]
   ├── Authenticates JWT & Injects Session Context (app.current_user_id)
   ├── Processes Uploaded Image -> Computes 512-d CLIP Embedding
   └── Formats Spatial Coordinates -> WKT Point
       │
       │ (Native Connection Pool / asyncpg)
       ▼
[ EverLeafDB Core (PostgreSQL 16) ]
   ├── PostGIS: Evaluates ST_Contains, ST_DWithin
   ├── pgvector: Evaluates HNSW <=> Cosine Distance
   ├── Triggers: Fires Severe Disease Alert Check
   └── RLS: Validates Ward Ownership
```

---

## 8. Success Metrics & Key Performance Indicators (KPIs)

1. **Retrieval Precision@5:** $\ge 85\%$ of retrieved historical cases match the true disease category on the benchmark test set.
2. **Mean Time to Detection & Dispatch (MTTD):** Reduction of critical disease intervention from an average of **18 days** (manual paper log) to **< 24 hours** (automated EverLeafDB trigger alert).
3. **Hybrid Query Latency:** Sub-20ms P95 query response time under concurrent inspector workloads.
4. **False Alarm Trigger Rate:** Kept below **12%** at the calibrated 0.82 cosine similarity cutoff.
5. **Database Normalization Purity:** Zero transitive or partial dependencies across all operational relations.

---

## 9. Release Plan & Phased Milestones

| Phase | Duration | Scope & Deliverables |
| :--- | :--- | :--- |
| **Phase 1: Relational & Spatial Core** | Weeks 1–2 | Database schema creation, 3NF normalization, PostGIS extensions, ward boundaries, synthetic tree generation, B-Tree & GiST indexes. |
| **Phase 2: Vector Layer & Embeddings** | Weeks 3–4 | Integration of pgvector, CLIP embedding pipeline, HNSW indexing, Cosine similarity search, image storage linking. |
| **Phase 3: Active Logic & Work Orders** | Weeks 5–6 | Implementation of triggers (risk alert, last-inspected), stored procedures (`sp_confirm_diagnosis_and_dispatch_order`), audit logging. |
| **Phase 4: Views, Security & Hybrid Queries** | Weeks 7–8 | Materialized views, Row-Level Security policies, optimization of the 6 hybrid queries, EXPLAIN ANALYZE tuning. |
| **Phase 5: Evaluation & Viva Defense** | Weeks 9–10 | Running Experiments A, B, and C (retrieval precision, hybrid index latency, trigger calibration), final report generation. |

---
*Approved by Academic & Engineering Review Panel • EverLeafDB Project*

