import { z } from "zod";

export const organBodyPartEnum = z.enum([
  "leaf",
  "bark",
  "trunk",
  "root",
  "canopy"
]);

/**
 * Validates field inspection creation payload
 */
export const createInspectionSchema = z.object({
  tree_id: z.string().min(1, "Tree ID is required"),
  inspector_id: z.string().min(1, "Invalid inspector identifier").optional(),
  condition_score: z
    .number({ message: "Condition score must be an integer between 1 and 5" })
    .int()
    .min(1, "Condition score must be at least 1 (Severely Compromised)")
    .max(5, "Condition score cannot exceed 5 (Optimal Health)"),
  field_notes: z
    .string()
    .max(2000, "Field notes cannot exceed 2000 characters")
    .optional()
    .nullable(),
  symptom_notes: z
    .string()
    .max(2000, "Symptom notes cannot exceed 2000 characters")
    .optional()
    .nullable(),
  body_part: organBodyPartEnum.default("leaf"),
  organ: organBodyPartEnum.optional(),
  image_url: z.string().optional().nullable(),
  photo_url: z.string().optional().nullable(),
  image_embedding: z
    .array(z.number())
    .length(512, "Visual feature embedding must be exactly 512-dimensional float32 vector")
    .optional()
});

/**
 * Validates query parameters for inspections
 */
export const inspectionQuerySchema = z.object({
  tree_id: z.string().uuid().optional(),
  inspector_id: z.string().uuid().optional(),
  condition_score: z.coerce.number().int().min(1).max(5).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0)
});

export type CreateInspectionInput = z.infer<typeof createInspectionSchema>;
export type InspectionQueryParams = z.infer<typeof inspectionQuerySchema>;
