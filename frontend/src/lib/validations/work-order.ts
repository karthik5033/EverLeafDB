import { z } from "zod";

export const workOrderPriorityEnum = z.enum([
  "LOW",
  "STANDARD",
  "MEDIUM",
  "HIGH",
  "EMERGENCY"
]);

export const workOrderStatusEnum = z.enum([
  "PENDING",
  "DISPATCHED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED"
]);

/**
 * Validates dispatching / creating a work order
 */
export const createWorkOrderSchema = z.object({
  tree_id: z.string().uuid("Invalid tree UUID"),
  diagnosis_id: z.string().uuid("Invalid diagnosis UUID").optional().nullable(),
  assigned_to_user_id: z.string().uuid("Invalid assigned user UUID"),
  priority: workOrderPriorityEnum.default("MEDIUM"),
  status: workOrderStatusEnum.default("PENDING"),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Due date must follow YYYY-MM-DD format"),
  treatment_type: z.string().optional(),
  notes: z.string().max(2000).optional()
});

/**
 * Validates updating an existing work order
 */
export const updateWorkOrderSchema = z.object({
  status: workOrderStatusEnum.optional(),
  priority: workOrderPriorityEnum.optional(),
  assigned_to_user_id: z.string().uuid().optional(),
  closed_at: z.string().datetime().optional().nullable(),
  resolution_notes: z.string().max(2000).optional()
});

/**
 * Validates work order query filters
 */
export const workOrderQuerySchema = z.object({
  tree_id: z.string().uuid().optional(),
  assigned_to: z.string().uuid().optional(),
  status: workOrderStatusEnum.optional(),
  priority: workOrderPriorityEnum.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0)
});

export type CreateWorkOrderInput = z.infer<typeof createWorkOrderSchema>;
export type UpdateWorkOrderInput = z.infer<typeof updateWorkOrderSchema>;
export type WorkOrderQueryParams = z.infer<typeof workOrderQuerySchema>;
