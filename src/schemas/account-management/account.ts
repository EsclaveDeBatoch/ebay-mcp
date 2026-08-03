import { z } from '@/utils/effectSchema.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { MarketplaceId } from '@/types/ebayEnums.js';

/**
 * Account Management API Schemas
 *
 * This file contains Effect-backed schemas for all Account Management endpoints.
 * Schemas are organized by endpoint and include both input and output validation.
 */

// ============================================================================
// Common/Shared Response Schemas
// ============================================================================

const errorSchema = z.object({
  errorId: z.number().optional(),
  domain: z.string().optional(),
  category: z.string().optional(),
  message: z.string().optional(),
  longMessage: z.string().optional(),
  parameters: z
    .array(
      z.object({
        name: z.string().optional(),
        value: z.string().optional(),
      }),
    )
    .optional(),
});

// ============================================================================
// Sales Tax Schemas
// ============================================================================

/**
 * Validates the Account Management API sales tax base model.
 */
export const salesTaxBaseSchema = z.object({
  salesTaxPercentage: z.string(),
  shippingAndHandlingTaxed: z.boolean().optional(),
});

/**
 * Validates the Account Management API sales tax model.
 */
export const salesTaxSchema = z.object({
  countryCode: z.string().optional(),
  jurisdictionId: z.string().optional(),
  salesTaxPercentage: z.string().optional(),
  shippingAndHandlingTaxed: z.boolean().optional(),
});

/** Validates the Account Management API create or replace sales tax request payload. */
export const createOrReplaceSalesTaxInputSchema = z.object({
  countryCode: z.string().describe('Two-letter ISO 3166 country code'),
  jurisdictionId: z.string().describe('Tax jurisdiction ID'),
  salesTaxBase: salesTaxBaseSchema.describe('Sales tax details'),
});

/** Validates one sales tax row in a bulk create or replace request. */
export const bulkSalesTaxRequestEntrySchema = z.object({
  countryCode: z.string(),
  jurisdictionId: z.string(),
  salesTaxBase: salesTaxBaseSchema,
});

/** Validates the Account Management API bulk create or replace sales tax request payload. */
export const bulkCreateOrReplaceSalesTaxInputSchema = z.object({
  requests: z.array(bulkSalesTaxRequestEntrySchema).describe('Array of sales tax requests'),
});

/** Validates the Account Management API get sales tax request payload. */
export const getSalesTaxInputSchema = z.object({
  countryCode: z.string().describe('Two-letter ISO 3166 country code'),
  jurisdictionId: z.string().describe('Tax jurisdiction ID'),
});

/** Validates the Account Management API delete sales tax request payload. */
export const deleteSalesTaxInputSchema = getSalesTaxInputSchema;

/** Validates the Account Management API get sales taxes request payload. */
export const getSalesTaxesInputSchema = z.object({
  countryCode: z.string().describe('Required: Two-letter ISO 3166-1 country code'),
});

/**
 * Validates the Account Management API get sales taxes response payload.
 */
export const getSalesTaxesOutputSchema = z.object({
  salesTaxes: z.array(salesTaxSchema).optional(),
  warnings: z.array(errorSchema).optional(),
});

/** Validates the Account Management API payments program request payload. */
export const getPaymentsProgramInputSchema = z.object({
  marketplaceId: z.nativeEnum(MarketplaceId).describe('The eBay marketplace ID'),
  paymentsProgramType: z.string().describe('The type of payments program'),
});

/** Validates the Account Management API payments onboarding request payload. */
export const getPaymentsProgramOnboardingInputSchema = getPaymentsProgramInputSchema;

// ============================================================================
// JSON Schema Conversion Functions
// ============================================================================

/**
 * Converts Account Management API Effect-backed schemas to JSON Schema format for MCP tools.
 *
 * @returns Account Management API JSON schemas keyed by endpoint or shared model name.
 * @example
 * ```ts
 * const schemas = getAccountManagementJsonSchemas();
 * ```
 */
export const getAccountManagementJsonSchemas = () => {
  return {
    // Sales Tax
    getSalesTaxesOutput: zodToJsonSchema(getSalesTaxesOutputSchema, 'getSalesTaxesOutput'),
    salesTaxDetails: zodToJsonSchema(salesTaxSchema, 'salesTaxDetails'),
  };
};
