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

const amountSchema = z.object({
  currency: z.string().optional(),
  value: z.string().optional(),
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

// ============================================================================
// Program Schemas
// ============================================================================

/**
 * Validates the Account Management API program request model.
 */
export const programRequestSchema = z.object({
  programType: z.string(),
});

/** Validates the Account Management API program opt-in request payload. */
export const optInToProgramInputSchema = z.object({
  request: programRequestSchema.describe('Program opt-in request'),
});

/** Validates the Account Management API program opt-out request payload. */
export const optOutOfProgramInputSchema = z.object({
  request: programRequestSchema.describe('Program opt-out request'),
});

/** Validates the Account Management API get opted-in programs request payload. */
export const getOptedInProgramsInputSchema = z.object({});

/**
 * Validates the Account Management API programs response payload.
 */
export const programsOutputSchema = z.object({
  programs: z
    .array(
      z.object({
        programType: z.string().optional(),
        programStatus: z.string().optional(),
      }),
    )
    .optional(),
  warnings: z.array(errorSchema).optional(),
});

// ============================================================================
// KYC Schemas
// ============================================================================

/**
 * Validates the Account Management API KYC response payload.
 */
export const kycOutputSchema = z.object({
  kycCheck: z.string().optional(),
  detailedStatus: z.string().optional(),
  warnings: z.array(errorSchema).optional(),
});

/** Validates the Account Management API get KYC request payload. */
export const getKycInputSchema = z.object({});

/** Validates the Account Management API payments program request payload. */
export const getPaymentsProgramInputSchema = z.object({
  marketplaceId: z.nativeEnum(MarketplaceId).describe('The eBay marketplace ID'),
  paymentsProgramType: z.string().describe('The type of payments program'),
});

/** Validates the Account Management API payments onboarding request payload. */
export const getPaymentsProgramOnboardingInputSchema = getPaymentsProgramInputSchema;

/** Validates the Account Management API subscription request payload. */
export const getSubscriptionInputSchema = z.object({
  limit: z.string().optional().describe('Optional subscription page size limit'),
  continuationToken: z.string().optional().describe('Optional continuation token'),
});

/** Validates the Account Management API get rate tables request payload. */
export const getRateTablesInputSchema = z.object({});

/** Validates the Account Management API advertising eligibility request payload. */
export const getAdvertisingEligibilityInputSchema = z.object({
  marketplaceId: z
    .nativeEnum(MarketplaceId)
    .describe('eBay marketplace ID to check eligibility for'),
  programTypes: z
    .string()
    .optional()
    .describe('Optional comma-separated list of program types to check eligibility for'),
});

// ============================================================================
// Privileges Schemas
// ============================================================================

/**
 * Validates the Account Management API privileges response payload.
 */
export const privilegesOutputSchema = z.object({
  sellingLimit: z
    .object({
      amount: amountSchema.optional(),
      quantity: z.number().optional(),
    })
    .optional(),
  qualifiesForSelling: z.boolean().optional(),
  sellerRegistrationCompleted: z.boolean().optional(),
  warnings: z.array(errorSchema).optional(),
});

/** Validates the Account Management API get privileges request payload. */
export const getPrivilegesInputSchema = z.object({});

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

    // Programs
    programRequest: zodToJsonSchema(programRequestSchema, 'programRequest'),
    getOptedInProgramsInput: zodToJsonSchema(
      getOptedInProgramsInputSchema,
      'getOptedInProgramsInput',
    ),
    programsOutput: zodToJsonSchema(programsOutputSchema, 'programsOutput'),

    // KYC & Privileges
    getKycInput: zodToJsonSchema(getKycInputSchema, 'getKycInput'),
    kycOutput: zodToJsonSchema(kycOutputSchema, 'kycOutput'),
    getRateTablesInput: zodToJsonSchema(getRateTablesInputSchema, 'getRateTablesInput'),
    getPrivilegesInput: zodToJsonSchema(getPrivilegesInputSchema, 'getPrivilegesInput'),
    privilegesOutput: zodToJsonSchema(privilegesOutputSchema, 'privilegesOutput'),
  };
};
