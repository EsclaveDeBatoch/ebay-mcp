import { z } from '@/utils/effectSchema.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { PricingVisibility, FormatType, MarketplaceId } from '@/types/ebayEnums.js';

/**
 * Inventory Management API Schemas
 *
 * This file contains Effect-backed schemas for all Inventory Management endpoints.
 * Schemas are organized by endpoint and include both input and output validation.
 */

// ============================================================================
// Common Schemas
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
  currency: z.string(),
  value: z.string(),
});

// ============================================================================
// Offer Schemas
// ============================================================================

const listingPoliciesSchema = z.object({
  fulfillmentPolicyId: z.string().optional(),
  paymentPolicyId: z.string().optional(),
  returnPolicyId: z.string().optional(),
  productCompliancePolicyIds: z.array(z.string()).optional(),
  takeBackPolicyIds: z.array(z.string()).optional(),
  eBayPlusIfEligible: z.boolean().optional(),
  bestOfferTerms: z
    .object({
      autoAcceptPrice: amountSchema.optional(),
      autoDeclinePrice: amountSchema.optional(),
      bestOfferEnabled: z.boolean().optional(),
    })
    .optional(),
});

const pricingSchema = z.object({
  price: amountSchema,
  pricingVisibility: z.nativeEnum(PricingVisibility).optional(),
  minimumAdvertisedPrice: amountSchema.optional(),
  originalRetailPrice: amountSchema.optional(),
});

const taxSchema = z.object({
  applyTax: z.boolean().optional(),
  thirdPartyTaxCategory: z.string().optional(),
  vatPercentage: z.number().optional(),
});

/**
 * Validates the Inventory Management API offer model.
 */
export const offerSchema = z.object({
  sku: z.string(),
  marketplaceId: z.nativeEnum(MarketplaceId),
  format: z.nativeEnum(FormatType),
  availableQuantity: z.number().optional(),
  categoryId: z.string().optional(),
  charity: z
    .object({
      charityId: z.string().optional(),
      donationPercentage: z.string().optional(),
    })
    .optional(),
  extendedProducerResponsibility: z
    .object({
      producerProductId: z.string().optional(),
      productPackageId: z.string().optional(),
      shipmentPackageId: z.string().optional(),
      productDocumentationId: z.string().optional(),
    })
    .optional(),
  hideBuyerDetails: z.boolean().optional(),
  includeCatalogProductDetails: z.boolean().optional(),
  listingDescription: z.string().optional(),
  listingDuration: z.string().optional(),
  listingPolicies: listingPoliciesSchema.optional(),
  listingStartDate: z.string().optional(),
  lotSize: z.number().optional(),
  merchantLocationKey: z.string().optional(),
  pricingSummary: pricingSchema.optional(),
  quantityLimitPerBuyer: z.number().optional(),
  secondaryCategoryId: z.string().optional(),
  storeCategoryNames: z.array(z.string()).optional(),
  tax: taxSchema.optional(),
});

/**
 * Validates the Inventory Management API offer response payload.
 */
export const offerResponseSchema = offerSchema.extend({
  offerId: z.string().optional(),
  listing: z
    .object({
      listingId: z.string().optional(),
      listingStatus: z.string().optional(),
      soldQuantity: z.number().optional(),
    })
    .optional(),
  status: z.string().optional(),
  statusDuration: z.string().optional(),
  warnings: z.array(errorSchema).optional(),
});

/**
 * Validates the Inventory Management API get offers request payload.
 */
export const getOffersInputSchema = z.object({
  format: z.string().optional().describe('Filter offers by listing format'),
  sku: z.string().optional().describe('Filter offers by SKU'),
  marketplaceId: z.nativeEnum(MarketplaceId).optional().describe('Filter offers by marketplace'),
  limit: z.number().optional().describe('Number of offers to return'),
  offset: z.number().optional().describe('Number of offers to skip'),
});

/**
 * Validates the Inventory Management API get offers response payload.
 */
export const getOffersOutputSchema = z.object({
  offers: z.array(offerResponseSchema).optional(),
  href: z.string().optional(),
  limit: z.number().optional(),
  next: z.string().optional(),
  offset: z.number().optional(),
  prev: z.string().optional(),
  size: z.number().optional(),
  total: z.number().optional(),
  warnings: z.array(errorSchema).optional(),
});

/**
 * Validates the Inventory Management API create offer request payload.
 */
export const createOfferInputSchema = z.object({
  body: offerSchema,
});

/**
 * Validates the Inventory Management API create offer response payload.
 */
export const createOfferOutputSchema = z.object({
  offerId: z.string().optional(),
  warnings: z.array(errorSchema).optional(),
});

/**
 * Validates the Inventory Management API publish offer request payload.
 */
export const publishOfferInputSchema = z.object({
  offerId: z.string().describe('The unique identifier of the offer to publish'),
});

/**
 * Validates the Inventory Management API publish offer response payload.
 */
export const publishOfferOutputSchema = z.object({
  listingId: z.string().optional(),
  warnings: z.array(errorSchema).optional(),
});

// ============================================================================
// Bulk Operation Schemas
// ============================================================================

/**
 * Validates the Inventory Management API bulk offer request model.
 */
export const bulkOfferRequestSchema = z.object({
  requests: z.array(offerSchema),
});

/**
 * Validates the Inventory Management API bulk offer response payload.
 */
export const bulkOfferResponseSchema = z.object({
  responses: z
    .array(
      z.object({
        offerId: z.string().optional(),
        statusCode: z.number().optional(),
        errors: z.array(errorSchema).optional(),
        warnings: z.array(errorSchema).optional(),
      }),
    )
    .optional(),
});

/**
 * Validates the Inventory Management API bulk publish request model.
 */
export const bulkPublishRequestSchema = z.object({
  requests: z.array(
    z.object({
      offerId: z.string(),
    }),
  ),
});

/**
 * Validates the Inventory Management API bulk publish response payload.
 */
export const bulkPublishResponseSchema = z.object({
  responses: z
    .array(
      z.object({
        offerId: z.string().optional(),
        listingId: z.string().optional(),
        statusCode: z.number().optional(),
        errors: z.array(errorSchema).optional(),
        warnings: z.array(errorSchema).optional(),
      }),
    )
    .optional(),
});

// ============================================================================
// JSON Schema Conversion Functions
// ============================================================================

/**
 * Converts Inventory Management API Effect-backed schemas to JSON Schema format for MCP tools.
 *
 * @returns Inventory Management API JSON schemas keyed by endpoint or shared model name.
 * @example
 * ```ts
 * const schemas = getInventoryManagementJsonSchemas();
 * ```
 */
export const getInventoryManagementJsonSchemas = () => {
  return {
    // Offers
    getOffersInput: zodToJsonSchema(getOffersInputSchema, 'getOffersInput'),
    getOffersOutput: zodToJsonSchema(getOffersOutputSchema, 'getOffersOutput'),
    createOfferInput: zodToJsonSchema(createOfferInputSchema, 'createOfferInput'),
    createOfferOutput: zodToJsonSchema(createOfferOutputSchema, 'createOfferOutput'),
    publishOfferInput: zodToJsonSchema(publishOfferInputSchema, 'publishOfferInput'),
    publishOfferOutput: zodToJsonSchema(publishOfferOutputSchema, 'publishOfferOutput'),
    offerDetails: zodToJsonSchema(offerResponseSchema, 'offerDetails'),

    // Bulk Operations
    bulkOfferRequest: zodToJsonSchema(bulkOfferRequestSchema, 'bulkOfferRequest'),
    bulkOfferResponse: zodToJsonSchema(bulkOfferResponseSchema, 'bulkOfferResponse'),
    bulkPublishRequest: zodToJsonSchema(bulkPublishRequestSchema, 'bulkPublishRequest'),
    bulkPublishResponse: zodToJsonSchema(bulkPublishResponseSchema, 'bulkPublishResponse'),
  };
};
