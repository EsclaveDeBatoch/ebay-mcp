import { z } from '@/utils/effectSchema.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  Condition,
  LengthUnit,
  WeightUnit,
  PricingVisibility,
  FormatType,
  MarketplaceId,
} from '@/types/ebayEnums.js';

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
// Inventory Item Schemas
// ============================================================================

const availabilitySchema = z.object({
  shipToLocationAvailability: z
    .object({
      quantity: z.number().optional(),
      availabilityDistributions: z
        .array(
          z.object({
            fulfillmentTime: z
              .object({
                unit: z.string().optional(),
                value: z.number().optional(),
              })
              .optional(),
            merchantLocationKey: z.string().optional(),
            quantity: z.number().optional(),
          }),
        )
        .optional(),
    })
    .optional(),
});

const productIdentifierSchema = z.object({
  epid: z.string().optional(),
  gtin: z.string().optional(),
  ktype: z.string().optional(),
});

const productSchema = z.object({
  title: z.string().optional(),
  aspects: z.record(z.array(z.string())).optional(),
  brand: z.string().optional(),
  description: z.string().optional(),
  imageUrls: z.array(z.string()).optional(),
  mpn: z.string().optional(),
  ean: z.array(z.string()).optional(),
  isbn: z.array(z.string()).optional(),
  upc: z.array(z.string()).optional(),
  epid: z.string().optional(),
  subtitle: z.string().optional(),
  videoIds: z.array(z.string()).optional(),
});

const dimensionsSchema = z.object({
  height: z.number().optional(),
  length: z.number().optional(),
  width: z.number().optional(),
  unit: z.nativeEnum(LengthUnit).optional(),
});

const weightSchema = z.object({
  value: z.number().optional(),
  unit: z.nativeEnum(WeightUnit).optional(),
});

const packageWeightAndSizeSchema = z.object({
  dimensions: dimensionsSchema.optional(),
  packageType: z.string().optional(),
  weight: weightSchema.optional(),
});

/**
 * Validates the Inventory Management API inventory item model.
 */
export const inventoryItemSchema = z.object({
  availability: availabilitySchema.optional(),
  condition: z.nativeEnum(Condition).optional(),
  conditionDescription: z.string().optional(),
  conditionDescriptors: z
    .array(
      z.object({
        name: z.string().optional(),
        values: z.array(z.string()).optional(),
      }),
    )
    .optional(),
  packageWeightAndSize: packageWeightAndSizeSchema.optional(),
  product: productSchema.optional(),
  locale: z.string().optional(),
});

/**
 * Validates the Inventory Management API get inventory items request payload.
 */
export const getInventoryItemsInputSchema = z.object({
  limit: z.number().optional().describe('Number of items to return per page'),
  offset: z.number().optional().describe('Number of items to skip for pagination'),
});

/**
 * Validates the Inventory Management API get inventory items response payload.
 */
export const getInventoryItemsOutputSchema = z.object({
  inventoryItems: z
    .array(
      z.object({
        sku: z.string().optional(),
        locale: z.string().optional(),
        availability: availabilitySchema.optional(),
        condition: z.string().optional(),
        conditionDescription: z.string().optional(),
        packageWeightAndSize: packageWeightAndSizeSchema.optional(),
        product: productSchema.optional(),
      }),
    )
    .optional(),
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
 * Validates the Inventory Management API get inventory item request payload.
 */
export const getInventoryItemInputSchema = z.object({
  sku: z.string().describe('The seller-defined SKU value for the inventory item'),
});

/**
 * Validates the Inventory Management API get inventory item response payload.
 */
export const getInventoryItemOutputSchema = inventoryItemSchema.extend({
  sku: z.string().optional(),
  warnings: z.array(errorSchema).optional(),
});

/**
 * Validates the Inventory Management API create inventory item request payload.
 */
export const createInventoryItemInputSchema = z.object({
  sku: z.string().describe('The seller-defined SKU value for the inventory item'),
  body: inventoryItemSchema,
});

/**
 * Validates the Inventory Management API create inventory item response payload.
 */
export const createInventoryItemOutputSchema = z.object({
  warnings: z.array(errorSchema).optional(),
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
 * Validates the Inventory Management API bulk inventory item request model.
 */
export const bulkInventoryItemRequestSchema = z.object({
  requests: z.array(
    z.object({
      sku: z.string(),
      product: productSchema.optional(),
      availability: availabilitySchema.optional(),
      condition: z.nativeEnum(Condition).optional(),
      conditionDescription: z.string().optional(),
    }),
  ),
});

/**
 * Validates the Inventory Management API bulk inventory item response payload.
 */
export const bulkInventoryItemResponseSchema = z.object({
  responses: z
    .array(
      z.object({
        sku: z.string().optional(),
        statusCode: z.number().optional(),
        errors: z.array(errorSchema).optional(),
        warnings: z.array(errorSchema).optional(),
      }),
    )
    .optional(),
});

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
    // Inventory Items
    getInventoryItemsInput: zodToJsonSchema(getInventoryItemsInputSchema, 'getInventoryItemsInput'),
    getInventoryItemsOutput: zodToJsonSchema(
      getInventoryItemsOutputSchema,
      'getInventoryItemsOutput',
    ),
    getInventoryItemInput: zodToJsonSchema(getInventoryItemInputSchema, 'getInventoryItemInput'),
    getInventoryItemOutput: zodToJsonSchema(getInventoryItemOutputSchema, 'getInventoryItemOutput'),
    createInventoryItemInput: zodToJsonSchema(
      createInventoryItemInputSchema,
      'createInventoryItemInput',
    ),
    createInventoryItemOutput: zodToJsonSchema(
      createInventoryItemOutputSchema,
      'createInventoryItemOutput',
    ),

    // Offers
    getOffersInput: zodToJsonSchema(getOffersInputSchema, 'getOffersInput'),
    getOffersOutput: zodToJsonSchema(getOffersOutputSchema, 'getOffersOutput'),
    createOfferInput: zodToJsonSchema(createOfferInputSchema, 'createOfferInput'),
    createOfferOutput: zodToJsonSchema(createOfferOutputSchema, 'createOfferOutput'),
    publishOfferInput: zodToJsonSchema(publishOfferInputSchema, 'publishOfferInput'),
    publishOfferOutput: zodToJsonSchema(publishOfferOutputSchema, 'publishOfferOutput'),
    offerDetails: zodToJsonSchema(offerResponseSchema, 'offerDetails'),

    // Bulk Operations
    bulkInventoryItemRequest: zodToJsonSchema(
      bulkInventoryItemRequestSchema,
      'bulkInventoryItemRequest',
    ),
    bulkInventoryItemResponse: zodToJsonSchema(
      bulkInventoryItemResponseSchema,
      'bulkInventoryItemResponse',
    ),
    bulkOfferRequest: zodToJsonSchema(bulkOfferRequestSchema, 'bulkOfferRequest'),
    bulkOfferResponse: zodToJsonSchema(bulkOfferResponseSchema, 'bulkOfferResponse'),
    bulkPublishRequest: zodToJsonSchema(bulkPublishRequestSchema, 'bulkPublishRequest'),
    bulkPublishResponse: zodToJsonSchema(bulkPublishResponseSchema, 'bulkPublishResponse'),
  };
};
