/**
 * EverLeafDB Phase 22: Stored Procedure Engine for Atomic Work Order Dispatch
 *
 * Implements and simulates PL/pgSQL stored procedure:
 *   sp_confirm_diagnosis_and_dispatch_order
 *
 * ACID Guarantees:
 * - Atomicity: All 4 table mutations (diagnoses, treatment_records, work_orders, alerts)
 *   succeed together or roll back entirely with zero partial writes.
 * - Consistency: Invariants and Foreign Key references verified before writes.
 * - Isolation: Pessimistic Row Locking (`SELECT FOR UPDATE`) prevents concurrent dispatch.
 * - Durability: Audit log entry committed with timestamp and JSON diff telemetry.
 */

import {
  ALERTS,
  DISEASES,
  TREATMENTS_SEED,
  WORK_ORDERS,
  Alert,
  WorkOrder
} from "./db";
import { AUDIT_STORE } from "./audit";
import { AuditLog } from "../types/database";

export interface StoredProcedureDispatchParams {
  alert_id: string;
  supervisor_id?: string;
  disease_id: number;
  treatment_id: number;
  assigned_crew: string;
  priority: "EMERGENCY" | "HIGH" | "STANDARD" | "MEDIUM" | "LOW";
  due_date?: string;
  supervisor_remarks?: string;
  simulate_mid_flight_error?: boolean; // For testing ACID rollback
}

export interface StoredProcedureDispatchResult {
  success: boolean;
  execution_status: "COMMITTED" | "ROLLED_BACK";
  work_order_id?: string;
  diagnosis_id?: string;
  treatment_record_id?: string;
  alert?: Alert;
  work_order?: WorkOrder;
  acid_telemetry: {
    procedure: string;
    pessimistic_lock: string;
    isolation_level: string;
    records_mutated: {
      alerts: number;
      diagnoses: number;
      treatment_records: number;
      work_orders: number;
      audit_log: number;
    };
    execution_latency_ms: number;
    timestamp: string;
  };
  message: string;
  error_code?: string;
}

// In-memory clinical diagnosis records store
export interface ClinicalDiagnosisRecord {
  diagnosis_id: string;
  inspection_id: string;
  tree_id: string;
  disease_id: number;
  disease_name: string;
  confirmed_by_id: string;
  confidence_source: "manual" | "vector_suggested" | "lab_confirmed";
  similarity_score: number;
  diagnosed_at: string;
}

export const CLINICAL_DIAGNOSES: ClinicalDiagnosisRecord[] = [];

// In-memory treatment administration records store
export interface OperationalTreatmentRecord {
  treatment_record_id: string;
  diagnosis_id: string;
  treatment_id: number;
  start_date: string;
  end_date: string | null;
  outcome_status: "ONGOING" | "SUCCESSFUL" | "PARTIAL" | "FAILED";
  inspector_remarks: string;
  created_at: string;
}

export const OPERATIONAL_TREATMENT_RECORDS: OperationalTreatmentRecord[] = [];

/**
 * Executes stored procedure `sp_confirm_diagnosis_and_dispatch_order`
 * with transactional atomicity and pessimistic row locking simulation.
 */
export function executeStoredProcedureDispatch(
  params: StoredProcedureDispatchParams
): StoredProcedureDispatchResult {
  const startTime = performance.now();
  const {
    alert_id,
    supervisor_id = "user_supervisor_01",
    disease_id,
    treatment_id,
    assigned_crew,
    priority,
    due_date,
    supervisor_remarks = "Emergency clinical dispatch issued by Municipal Tree Supervisor.",
    simulate_mid_flight_error = false
  } = params;

  // Snapshot initial state for atomic rollback resilience
  const initialAlert = ALERTS.find(a => a.alert_id === alert_id);
  const initialAlertSnapshot = initialAlert ? { ...initialAlert } : null;
  const initialDiagnosesCount = CLINICAL_DIAGNOSES.length;
  const initialTreatmentRecordsCount = OPERATIONAL_TREATMENT_RECORDS.length;
  const initialWorkOrdersCount = WORK_ORDERS.length;
  const initialAuditLogsCount = AUDIT_STORE.length;

  try {
    // Step 1: Pessimistic Row Locking (`SELECT FOR UPDATE`)
    if (!initialAlert) {
      throw {
        code: "P0002",
        message: `ATOMIC_DISPATCH_ERROR: Alert ID ${alert_id} does not exist in registry.`
      };
    }

    // Step 2: Validate Invariant Status (Must be PENDING)
    if (initialAlert.status !== "PENDING") {
      throw {
        code: "55P03",
        message: `ATOMIC_DISPATCH_CONFLICT: Alert ${alert_id} is already processed with status: ${initialAlert.status}. Concurrent dispatch rejected.`
      };
    }

    // Step 3: Validate Foreign Key Catalog References
    const disease = DISEASES.find(d => d.disease_id === disease_id);
    if (!disease) {
      throw {
        code: "23503",
        message: `ATOMIC_DISPATCH_ERROR: Invalid disease_id ${disease_id}. Disease not found in catalog.`
      };
    }

    const treatment = TREATMENTS_SEED.find(t => t.treatment_id === treatment_id);
    if (!treatment) {
      throw {
        code: "23503",
        message: `ATOMIC_DISPATCH_ERROR: Invalid treatment_id ${treatment_id}. Protocol not found in catalog.`
      };
    }

    // Step 4: Multi-Table Atomic Transaction Execution
    // 4a. Insert Diagnosis
    const diagnosisId = `diag_${Math.floor(1000 + Math.random() * 9000)}`;
    const newDiagnosis: ClinicalDiagnosisRecord = {
      diagnosis_id: diagnosisId,
      inspection_id: `insp_${alert_id.replace("ALT-", "")}`,
      tree_id: initialAlert.tree_id,
      disease_id: disease.disease_id,
      disease_name: disease.common_name,
      confirmed_by_id: supervisor_id,
      confidence_source: "vector_suggested",
      similarity_score: initialAlert.cosine_similarity || 0.89,
      diagnosed_at: new Date().toISOString()
    };
    CLINICAL_DIAGNOSES.unshift(newDiagnosis);

    // 4b. Insert Treatment Record
    const treatmentRecordId = `tr_${Math.floor(1000 + Math.random() * 9000)}`;
    const newTreatmentRecord: OperationalTreatmentRecord = {
      treatment_record_id: treatmentRecordId,
      diagnosis_id: diagnosisId,
      treatment_id: treatment.treatment_id,
      start_date: new Date().toISOString().split("T")[0],
      end_date: null,
      outcome_status: "ONGOING",
      inspector_remarks: supervisor_remarks,
      created_at: new Date().toISOString()
    };
    OPERATIONAL_TREATMENT_RECORDS.unshift(newTreatmentRecord);

    // Mid-flight intentional failure injection for ACID Rollback verification
    if (simulate_mid_flight_error) {
      throw {
        code: "40001",
        message: "SIMULATED_TRANSACTION_FAILURE: Injected constraint violation during work order allocation. Triggering atomic rollback."
      };
    }

    // 4c. Insert Work Order
    const workOrderId = `WO-${Math.floor(1000 + Math.random() * 9000)}`;
    const newWorkOrder: WorkOrder = {
      order_id: workOrderId,
      tree_id: initialAlert.tree_id,
      alert_id: initialAlert.alert_id,
      priority: priority,
      status: "DISPATCHED",
      protocol: treatment.name,
      assigned_crew: assigned_crew,
      dispatched_at: new Date().toISOString(),
      sla_hours: priority === "EMERGENCY" ? 24 : 48,
      cost_estimate_usd: treatment.standard_cost
    };
    WORK_ORDERS.unshift(newWorkOrder);

    // 4d. Update Alert status to ACTIONED
    initialAlert.status = "ACTIONED";

    // 4e. Record Audit Log Entry
    const auditEntry: AuditLog = {
      log_id: initialAuditLogsCount + 1,
      user_id: supervisor_id,
      action: "DISPATCH",
      table_name: "alerts",
      record_id: alert_id,
      old_values: { status: "PENDING", severity: initialAlertSnapshot?.severity },
      new_values: {
        status: "ACTIONED",
        work_order_id: workOrderId,
        diagnosis_id: diagnosisId,
        treatment_record_id: treatmentRecordId,
        assigned_crew: assigned_crew,
        priority: priority
      },
      performed_at: new Date().toISOString()
    };
    AUDIT_STORE.unshift(auditEntry);

    const latency = performance.now() - startTime;

    return {
      success: true,
      execution_status: "COMMITTED",
      work_order_id: workOrderId,
      diagnosis_id: diagnosisId,
      treatment_record_id: treatmentRecordId,
      alert: initialAlert,
      work_order: newWorkOrder,
      acid_telemetry: {
        procedure: "sp_confirm_diagnosis_and_dispatch_order()",
        pessimistic_lock: `SELECT FOR UPDATE ON alerts WHERE alert_id = '${alert_id}'`,
        isolation_level: "REPEATABLE READ",
        records_mutated: {
          alerts: 1,
          diagnoses: 1,
          treatment_records: 1,
          work_orders: 1,
          audit_log: 1
        },
        execution_latency_ms: Math.round(latency * 1000) / 1000,
        timestamp: new Date().toISOString()
      },
      message: `Transaction committed successfully. Dispatched Work Order ${workOrderId} for Alert ${alert_id}.`
    };
  } catch (error: any) {
    // ATOMIC ROLLBACK: Revert all in-memory mutations to exact pre-transaction state
    if (initialAlert && initialAlertSnapshot) {
      initialAlert.status = initialAlertSnapshot.status;
      initialAlert.severity = initialAlertSnapshot.severity;
    }

    if (CLINICAL_DIAGNOSES.length > initialDiagnosesCount) {
      CLINICAL_DIAGNOSES.splice(0, CLINICAL_DIAGNOSES.length - initialDiagnosesCount);
    }

    if (OPERATIONAL_TREATMENT_RECORDS.length > initialTreatmentRecordsCount) {
      OPERATIONAL_TREATMENT_RECORDS.splice(0, OPERATIONAL_TREATMENT_RECORDS.length - initialTreatmentRecordsCount);
    }

    if (WORK_ORDERS.length > initialWorkOrdersCount) {
      WORK_ORDERS.splice(0, WORK_ORDERS.length - initialWorkOrdersCount);
    }

    if (AUDIT_STORE.length > initialAuditLogsCount) {
      AUDIT_STORE.splice(0, AUDIT_STORE.length - initialAuditLogsCount);
    }

    const latency = performance.now() - startTime;

    return {
      success: false,
      execution_status: "ROLLED_BACK",
      error_code: error.code || "XX000",
      acid_telemetry: {
        procedure: "sp_confirm_diagnosis_and_dispatch_order()",
        pessimistic_lock: `SELECT FOR UPDATE ON alerts WHERE alert_id = '${alert_id}'`,
        isolation_level: "REPEATABLE READ",
        records_mutated: {
          alerts: 0,
          diagnoses: 0,
          treatment_records: 0,
          work_orders: 0,
          audit_log: 0
        },
        execution_latency_ms: Math.round(latency * 1000) / 1000,
        timestamp: new Date().toISOString()
      },
      message: error.message || "Transaction aborted due to fatal database exception."
    };
  }
}
