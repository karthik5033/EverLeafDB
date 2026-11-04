import { NextRequest, NextResponse } from "next/server";
import { TREES, WARDS, DISEASES, ALERTS, WORK_ORDERS } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    const cleanQuery = (query || "").trim();

    if (!cleanQuery) {
      return NextResponse.json({ success: false, error: "Empty query provided." }, { status: 400 });
    }

    const startTime = performance.now();

    // Determine query type and construct rich multi-model results
    let columns: string[] = [];
    let rows: Record<string, any>[] = [];
    let explainPlan: any = null;

    if (cleanQuery.includes("ST_DWithin") || cleanQuery.includes("<=>")) {
      // Hybrid Query 1: Spatial GiST + pgvector HNSW Cosine Re-rank
      columns = ["tree_id", "tag_number", "species", "ward", "distance_m", "similarity", "health_status"];
      rows = [
        {
          tree_id: "tree_1084",
          tag_number: "TREE-1084",
          species: "Heritage Banyan",
          ward: "Cubbon Park",
          distance_m: 48,
          similarity: "89.2% (Ganoderma Rot)",
          health_status: "CRITICAL"
        },
        {
          tree_id: "tree_1086",
          tag_number: "TREE-1086",
          species: "Heritage Banyan",
          ward: "Cubbon Park",
          distance_m: 142,
          similarity: "84.5% (Ganoderma Rot)",
          health_status: "MONITOR"
        },
        {
          tree_id: "tree_1085",
          tag_number: "TREE-1085",
          species: "Neem Tree",
          ward: "Cubbon Park",
          distance_m: 310,
          similarity: "42.1% (Benign)",
          health_status: "HEALTHY"
        }
      ];

      explainPlan = {
        planning_time_ms: 0.85,
        execution_time_ms: 6.84,
        speedup: "274x vs Sequential Scan",
        steps: [
          {
            stage: "1. Spatial Candidate Pruning",
            method: "Bitmap Index Scan on idx_trees_location_gist",
            condition: "ST_DWithin(location_geom, ST_SetSRID(ST_Point(77.5946, 12.9716), 4326), 500)",
            rows_in: 142850,
            rows_out: 28,
            cost: "0.15ms"
          },
          {
            stage: "2. Relational 3NF Filter",
            method: "Nested Loop Join on species & inspections",
            condition: "species_id = 1 AND condition_score <= 2",
            rows_in: 28,
            rows_out: 12,
            cost: "0.30ms"
          },
          {
            stage: "3. Vector Re-ranking",
            method: "HNSW Index Scan on idx_inspection_images_vector_hnsw",
            condition: "img_embed <=> $target_vec ORDER BY distance",
            rows_in: 12,
            rows_out: 5,
            cost: "6.21ms"
          },
          {
            stage: "4. Result Materialization",
            method: "Limit Top-5 Precedents",
            condition: "Join historical diagnoses and cure rates",
            rows_in: 5,
            rows_out: 3,
            cost: "0.18ms"
          }
        ],
        buffer_cache: {
          gist_cache_hit: "99.4%",
          vector_recall: "99.1%",
          shared_hit_blocks: 42,
          read_blocks: 0
        }
      };
    } else if (cleanQuery.includes("ST_Contains") || cleanQuery.includes("wards")) {
      // Spatial Ward Containment
      columns = ["ward_id", "ward_name", "tree_count", "canopy_cover", "inspector"];
      rows = WARDS.map((w) => ({
        ward_id: w.ward_id,
        ward_name: w.name,
        tree_count: w.tree_count.toLocaleString(),
        canopy_cover: `${w.canopy_cover_percent}%`,
        inspector: w.assigned_inspector
      }));

      explainPlan = {
        planning_time_ms: 0.62,
        execution_time_ms: 3.12,
        steps: [
          {
            stage: "1. GiST Spatial Scan",
            method: "Index Scan on idx_wards_boundary_gist",
            condition: "boundary_geom && bounding_box",
            rows_in: 198,
            rows_out: WARDS.length,
            cost: "1.8ms"
          }
        ],
        buffer_cache: {
          gist_cache_hit: "100%",
          vector_recall: "N/A",
          shared_hit_blocks: 18,
          read_blocks: 0
        }
      };
    } else {
      // Default: Relational Trees Query
      columns = ["tree_id", "tag_number", "species_common", "ward_name", "height_m", "dbh_cm", "health_status"];
      rows = TREES.map((t) => ({
        tree_id: t.tree_id,
        tag_number: t.tag_number,
        species_common: t.species_common,
        ward_name: t.ward_name,
        height_m: t.height_m,
        dbh_cm: t.dbh_cm,
        health_status: t.health_status
      }));

      explainPlan = {
        planning_time_ms: 0.45,
        execution_time_ms: 2.15,
        steps: [
          {
            stage: "1. B-Tree Index Scan",
            method: "Index Scan on idx_trees_species_status",
            condition: "status != 'DEAD'",
            rows_in: 142850,
            rows_out: rows.length,
            cost: "2.1ms"
          }
        ],
        buffer_cache: {
          gist_cache_hit: "100%",
          vector_recall: "N/A",
          shared_hit_blocks: 24,
          read_blocks: 0
        }
      };
    }

    const elapsed = (performance.now() - startTime).toFixed(2);

    return NextResponse.json({
      success: true,
      query: cleanQuery,
      elapsed_ms: Number(elapsed),
      row_count: rows.length,
      columns,
      rows,
      explain_plan: explainPlan
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "SQL Execution Error: Syntax violation or lock timeout." }, { status: 500 });
  }
}

