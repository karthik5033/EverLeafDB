import { z } from "zod";

export const diseaseSeverityEnum = z.enum([
  "LOW",
  "MEDIUM",
  "MODERATE",
  "HIGH",
  "CRITICAL"
]);

export const alertStatusEnum = z.enum([
  "PENDING",
  "REVIEWED",
  "ACTIONED",
  "DISMISSED"
]);

/**
 * Validates alert creation (automated vector trigger)
 */
export const createAlertSchema = z.object({
  tree_id: z.string().uuid("Invalid tree UUID"),
  inspection_id: z.string().uuid("Invalid inspection UUID"),
  reason: z.string().min(5, "Reason must be at least 5 characters long").max(255),
  similarity_score: z
    .number()
    .min(0, "Similarity score cannot be negative")
    .max(1, "Similarity score cannot exceed 1.0"),
  severity: diseaseSeverityEnum.default("CRITICAL"),
  status: alertStatusEnum.default("PENDING")
});

/**
 * Validates triage and status transition of an alert
 */
export const updateAlertStatusSchema = z.object({
  status: alertStatusEnum,
  action_notes: z.string().max(1000).optional()
});

/**
 * Validates alert query parameters
 */
export const alertQuerySchema = z.object({
  tree_id: z.string().uuid().optional(),
  status: alertStatusEnum.optional(),
  severity: diseaseSeverityEnum.optional(),
  min_similarity: z.coerce.number().min(0).max(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0)
});

export type CreateAlertInput = z.infer<typeof createAlertSchema>;
export type UpdateAlertStatusInput = z.infer<typeof updateAlertStatusSchema>;
export type AlertQueryParams = z.infer<typeof alertQuerySchema>;
