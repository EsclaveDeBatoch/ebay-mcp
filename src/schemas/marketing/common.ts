/**
 * Marketing API schemas — common slice.
 *
 * Effect-backed schemas for Marketing endpoints. The barrel `marketing.ts` re-exports all slices.
 */

import { z } from '@/utils/effectSchema.js';
// ============================================================================
// Common/Shared Response Schemas
// ============================================================================

/**
 * Validates the Marketing API error model.
 */
export const errorSchema = z.object({
  errorId: z.number().optional(),
  domain: z.string().optional(),
  category: z.string().optional(),
  message: z.string().optional(),
  longMessage: z.string().optional(),
  subdomain: z.string().optional(),
  inputRefIds: z.array(z.string()).optional(),
  outputRefIds: z.array(z.string()).optional(),
  parameters: z
    .array(
      z.object({
        name: z.string().optional(),
        value: z.string().optional(),
      }),
    )
    .optional(),
});

/**
 * Validates the Marketing API error parameter model.
 */
export const errorParameterSchema = z.object({
  name: z.string().optional(),
  value: z.string().optional(),
});

/**
 * Validates the Marketing API amount model.
 */
export const amountSchema = z.object({
  currency: z.string().optional(),
  value: z.string().optional(),
});

/**
 * Validates the Marketing API alert model.
 */
export const alertSchema = z.object({
  alertId: z.string().optional(),
  message: z.string().optional(),
});

/**
 * Validates the Marketing API alert details model.
 */
export const alertDetailsSchema = z.object({
  alertId: z.string().optional(),
  details: z.string().optional(),
});

/**
 * Validates the Marketing API alert dimension model.
 */
export const alertDimensionSchema = z.object({
  dimensionKey: z.string().optional(),
  value: z.string().optional(),
});

/**
 * Validates the Marketing API base response payload.
 */
export const baseResponseSchema = z.object({
  warnings: z.array(errorSchema).optional(),
});

// ============================================================================
// Inventory Reference Schemas
// ============================================================================

/**
 * Validates the Marketing API marketing inventory item model.
 */
export const marketingInventoryItemSchema = z.object({
  inventoryReferenceId: z.string().optional(),
  inventoryReferenceType: z.string().optional(),
});

/**
 * Validates the Marketing API inventory reference model.
 */
export const inventoryReferenceSchema = z.object({
  inventoryReferenceId: z.string().optional(),
  inventoryReferenceType: z.string().optional(),
});

// ============================================================================
// Aspect Schema
// ============================================================================

/**
 * Validates the Marketing API aspect model.
 */
export const aspectSchema = z.object({
  aspectValues: z.array(z.string()).optional(),
  localizedAspectName: z.string().optional(),
});
