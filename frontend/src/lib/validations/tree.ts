import { z } from "zod";

export const treeHealthStatusEnum = z.enum([
  "healthy",
  "monitor",
  "diseased",
  "critical",
  "under_treatment",
  "dead",
  "removed"
]);

/**
 * Validates tree creation / registration payload
 */
export const createTreeSchema = z.object({
  species_id: z
    .number({ message: "Species ID must be a valid integer" })
    .int()
    .positive("Species ID must be positive"),
  ward_id: z
    .number({ message: "Ward ID must be a valid integer" })
    .int()
    .positive("Ward ID must be positive"),
  latitude: z
    .number({ message: "Latitude must be a floating-point number" })
    .min(-90, "Latitude must be >= -90")
    .max(90, "Latitude must be <= 90"),
  longitude: z
    .number({ message: "Longitude must be a floating-point number" })
    .min(-180, "Longitude must be >= -180")
    .max(180, "Longitude must be <= 180"),
  planted_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Planted date must follow YYYY-MM-DD format")
    .refine((dateStr) => new Date(dateStr) <= new Date(), {
      message: "Planted date cannot be in the future"
    }),
  height_meters: z
    .number({ message: "Height must be a valid number" })
    .positive("Height must be greater than 0 meters")
    .max(150, "Height cannot exceed 150 meters"),
  girth_cm: z
    .number({ message: "Girth must be a valid number" })
    .positive("Girth must be greater than 0 centimeters")
    .max(5000, "Girth cannot exceed 5000 cm"),
  health_status: treeHealthStatusEnum.default("healthy"),
  tag_number: z.string().optional()
});

/**
 * Validates tree update payload
 */
export const updateTreeSchema = createTreeSchema.partial();

/**
 * Validates query parameters for tree filtering
 */
export const treeQuerySchema = z.object({
  species_id: z.coerce.number().int().positive().optional(),
  ward_id: z.coerce.number().int().positive().optional(),
  health_status: treeHealthStatusEnum.optional(),
  min_height: z.coerce.number().positive().optional(),
  max_height: z.coerce.number().positive().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  near_lat: z.coerce.number().min(-90).max(90).optional(),
  near_lng: z.coerce.number().min(-180).max(180).optional(),
  radius_meters: z.coerce.number().positive().default(1000)
});

export type CreateTreeInput = z.infer<typeof createTreeSchema>;
export type UpdateTreeInput = z.infer<typeof updateTreeSchema>;
export type TreeQueryParams = z.infer<typeof treeQuerySchema>;
