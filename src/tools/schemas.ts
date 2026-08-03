import { z } from '@/utils/effectSchema.js';
import {
  TimeDurationUnit,
  Condition,
  LengthUnit,
  WeightUnit,
  PricingVisibility,
  FormatType,
  LocationType,
  MerchantLocationStatus,
  DayOfWeek,
  ReasonForRefund,
  FundingModel,
  MessageReferenceType,
  FeedbackRating,
  ReportedItemType,
} from '@/types/ebayEnums.js';

/**
 * Reusable Effect-backed schemas for eBay API tool input validation
 *
 * These schemas provide type-safe validation while remaining flexible
 * enough to accept the full complexity of eBay API request objects.
 */

// ============================================================================
// Common/Shared Schemas
// ============================================================================

/** Shared eBay duration object with unit and numeric value fields. */
export const timeDurationSchema = z
  .object({
    unit: z.nativeEnum(TimeDurationUnit),
    value: z.number(),
  })
  .passthrough();

/** Shared monetary amount object used by policy, refund, and listing tools. */
export const amountSchema = z
  .object({
    currency: z.string(),
    value: z.string(),
  })
  .passthrough();

// ============================================================================
// Inventory Management Schemas
// ============================================================================

/** Inventory availability payload for ship-to-location and pickup quantities. */
export const availabilitySchema = z
  .object({
    shipToLocationAvailability: z
      .object({
        quantity: z.number().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

/** Product details payload used inside inventory item requests. */
export const productSchema = z
  .object({
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
  })
  .passthrough();

/** Inventory item payload for create, replace, and bulk inventory item tools. */
export const inventoryItemSchema = z
  .object({
    availability: availabilitySchema.optional(),
    condition: z.nativeEnum(Condition).optional(),
    conditionDescription: z.string().optional(),
    packageWeightAndSize: z
      .object({
        dimensions: z
          .object({
            height: z.number().optional(),
            length: z.number().optional(),
            width: z.number().optional(),
            unit: z.nativeEnum(LengthUnit).optional(),
          })
          .passthrough()
          .optional(),
        packageType: z.string().optional(),
        weight: z
          .object({
            value: z.number().optional(),
            unit: z.nativeEnum(WeightUnit).optional(),
          })
          .passthrough()
          .optional(),
      })
      .passthrough()
      .optional(),
    product: productSchema.optional(),
  })
  .passthrough();

/** Offer pricing payload for fixed-price and auction listing tools. */
export const pricingSchema = z
  .object({
    price: amountSchema,
    pricingVisibility: z.nativeEnum(PricingVisibility).optional(),
    minimumAdvertisedPrice: amountSchema.optional(),
    originalRetailPrice: amountSchema.optional(),
  })
  .passthrough();

/** Listing policy IDs attached to offer creation and update payloads. */
export const listingPoliciesSchema = z
  .object({
    fulfillmentPolicyId: z.string().optional(),
    paymentPolicyId: z.string().optional(),
    returnPolicyId: z.string().optional(),
    eBayPlusIfEligible: z.boolean().optional(),
    bestOfferTerms: z
      .object({
        autoAcceptPrice: amountSchema.optional(),
        autoDeclinePrice: amountSchema.optional(),
        bestOfferEnabled: z.boolean().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

/** Offer payload used by inventory offer create and update tools. */
export const offerSchema = z
  .object({
    sku: z.string(),
    marketplaceId: z.string(),
    format: z.nativeEnum(FormatType),
    availableQuantity: z.number().optional(),
    categoryId: z.string().optional(),
    listingDescription: z.string().optional(),
    listingPolicies: listingPoliciesSchema.optional(),
    merchantLocationKey: z.string().optional(),
    pricingSummary: pricingSchema.optional(),
    quantityLimitPerBuyer: z.number().optional(),
    tax: z
      .object({
        applyTax: z.boolean().optional(),
        thirdPartyTaxCategory: z.string().optional(),
        vatPercentage: z.number().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

/** Inventory location payload for seller warehouse and pickup locations. */
export const locationSchema = z
  .object({
    location: z
      .object({
        address: z
          .object({
            addressLine1: z.string().optional(),
            addressLine2: z.string().optional(),
            city: z.string().optional(),
            stateOrProvince: z.string().optional(),
            postalCode: z.string().optional(),
            country: z.string().optional(),
          })
          .passthrough()
          .optional(),
      })
      .passthrough()
      .optional(),
    locationAdditionalInformation: z.string().optional(),
    locationInstructions: z.string().optional(),
    locationTypes: z.array(z.nativeEnum(LocationType)).optional(),
    locationWebUrl: z.string().optional(),
    merchantLocationStatus: z.nativeEnum(MerchantLocationStatus).optional(),
    name: z.string().optional(),
    operatingHours: z
      .array(
        z
          .object({
            dayOfWeekEnum: z.nativeEnum(DayOfWeek).optional(),
            intervals: z
              .array(
                z
                  .object({
                    open: z.string().optional(),
                    close: z.string().optional(),
                  })
                  .passthrough(),
              )
              .optional(),
          })
          .passthrough(),
      )
      .optional(),
    phone: z.string().optional(),
    specialHours: z
      .array(
        z
          .object({
            date: z.string().optional(),
            intervals: z
              .array(
                z
                  .object({
                    open: z.string().optional(),
                    close: z.string().optional(),
                  })
                  .passthrough(),
              )
              .optional(),
          })
          .passthrough(),
      )
      .optional(),
  })
  .passthrough();

// ============================================================================
// Fulfillment/Order Management Schemas
// ============================================================================

/** Line-item refund payload used inside fulfillment refund requests. */
export const lineItemRefundSchema = z
  .object({
    lineItemId: z.string(),
    refundAmount: amountSchema.optional(),
    legacyReference: z
      .object({
        legacyItemId: z.string().optional(),
        legacyTransactionId: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

/** Refund request payload for order fulfillment refund tools. */
export const refundDataSchema = z
  .object({
    reasonForRefund: z.nativeEnum(ReasonForRefund),
    comment: z.string().optional(),
    refundItems: z.array(lineItemRefundSchema).optional(),
    orderLevelRefundAmount: amountSchema.optional(),
  })
  .passthrough();

/** Shipping fulfillment payload for tracking and shipped-line-item updates. */
export const shippingFulfillmentSchema = z
  .object({
    lineItems: z.array(
      z
        .object({
          lineItemId: z.string(),
          quantity: z.number().optional(),
        })
        .passthrough(),
    ),
    shippedDate: z.string().optional(),
    shippingCarrierCode: z.string().optional(),
    trackingNumber: z.string().optional(),
  })
  .passthrough();

// ============================================================================
// Marketing Schemas
// ============================================================================

/** Campaign criterion payload for marketing campaign targeting rules. */
export const campaignCriterionSchema = z
  .object({
    autoSelectFutureInventory: z.boolean().optional(),
    criterionType: z.string().optional(),
    selectionRules: z
      .array(
        z
          .object({
            brands: z.array(z.string()).optional(),
            categoryIds: z.array(z.string()).optional(),
            categoryScope: z.string().optional(),
            listingConditionIds: z.array(z.string()).optional(),
            maxPrice: amountSchema.optional(),
            minPrice: amountSchema.optional(),
          })
          .passthrough(),
      )
      .optional(),
  })
  .passthrough();

/** Funding strategy payload for promoted listings campaign budgets. */
export const fundingStrategySchema = z
  .object({
    bidPercentage: z.string().optional(),
    fundingModel: z.nativeEnum(FundingModel).optional(),
  })
  .passthrough();

/** Marketing campaign payload for campaign creation and updates. */
export const campaignSchema = z
  .object({
    campaignName: z.string(),
    startDate: z.string(),
    endDate: z.string().optional(),
    fundingStrategy: fundingStrategySchema.optional(),
    marketplaceId: z.string().optional(),
    campaignCriterion: campaignCriterionSchema.optional(),
  })
  .passthrough();

// ============================================================================
// Communication Schemas
// ============================================================================

/** Member message payload for communication tools. */
export const messageDataSchema = z
  .object({
    messageText: z.string(),
    conversationId: z.string().optional(),
    otherPartyUsername: z.string().optional(),
    reference: z
      .object({
        referenceId: z.string().optional(),
        referenceType: z.nativeEnum(MessageReferenceType).optional(),
      })
      .passthrough()
      .optional(),
    messageMedia: z
      .array(
        z
          .object({
            mediaUrl: z.string().optional(),
            mediaType: z.string().optional(),
          })
          .passthrough(),
      )
      .optional(),
    emailCopyToSender: z.boolean().optional(),
  })
  .passthrough();

/** Buyer feedback payload for feedback submission tools. */
export const feedbackDataSchema = z
  .object({
    orderLineItemId: z.string(),
    rating: z.nativeEnum(FeedbackRating),
    feedbackText: z.string().optional(),
  })
  .passthrough();

// ============================================================================
// Metadata/Compatibility Schemas
// ============================================================================

/** Compatibility specification payload for taxonomy fitment searches. */
export const compatibilitySpecificationSchema = z
  .object({
    categoryTreeId: z.string().optional(),
    categoryId: z.string().optional(),
    compatibilityProperties: z
      .array(
        z
          .object({
            name: z.string(),
            value: z.string(),
          })
          .passthrough(),
      )
      .optional(),
  })
  .passthrough();

/** Compatibility data payload for catalog and taxonomy compatibility operations. */
export const compatibilityDataSchema = z
  .object({
    categoryTreeId: z.string().optional(),
    specification: compatibilitySpecificationSchema.optional(),
  })
  .passthrough();

// ============================================================================
// Other Schemas
// ============================================================================

/** Infringement payload used when reporting policy or rights violations. */
export const infringementDataSchema = z
  .object({
    itemId: z.string(),
    reportedItemType: z.nativeEnum(ReportedItemType).optional(),
    reportingReason: z.string().optional(),
    comments: z.string().optional(),
  })
  .passthrough();

// ============================================================================
// Bulk Operation Schemas
// ============================================================================

/** Bulk inventory item request payload for batch create and update operations. */
export const bulkInventoryItemRequestSchema = z
  .object({
    requests: z.array(
      z
        .object({
          sku: z.string(),
          product: productSchema.optional(),
          availability: availabilitySchema.optional(),
          condition: z.string().optional(),
          conditionDescription: z.string().optional(),
        })
        .passthrough(),
    ),
  })
  .passthrough();

/** Bulk price and quantity request payload for batch offer revisions. */
export const bulkPriceQuantityRequestSchema = z
  .object({
    requests: z.array(
      z
        .object({
          offerId: z.string(),
          pricingSummary: pricingSchema.optional(),
          availableQuantity: z.number().optional(),
        })
        .passthrough(),
    ),
  })
  .passthrough();

/** Bulk offer request payload for batch offer creation. */
export const bulkOfferRequestSchema = z
  .object({
    requests: z.array(offerSchema),
  })
  .passthrough();

/** Bulk publish request payload for publishing multiple offers. */
export const bulkPublishRequestSchema = z
  .object({
    requests: z.array(
      z
        .object({
          offerId: z.string(),
        })
        .passthrough(),
    ),
  })
  .passthrough();

/** Bulk migration request payload for moving listings into inventory APIs. */
export const bulkMigrateRequestSchema = z
  .object({
    requests: z.array(
      z
        .object({
          listingId: z.string(),
        })
        .passthrough(),
    ),
  })
  .passthrough();

// ============================================================================
// Helper: Offers for listing fees
// ============================================================================

/** Listing fees request payload for fee estimation tools. */
export const listingFeesRequestSchema = z
  .object({
    offers: z.array(
      z
        .object({
          offerId: z.string().optional(),
          sku: z.string().optional(),
          marketplaceId: z.string().optional(),
          format: z.nativeEnum(FormatType).optional(),
        })
        .passthrough(),
    ),
  })
  .passthrough();

// ============================================================================
// Offer to interested buyers
// ============================================================================

/** Offer-to-buyers payload for sending seller offers to interested buyers. */
export const offerToBuyersSchema = z
  .object({
    allowCounterOffer: z.boolean().optional(),
    message: z.string().optional(),
    offeredItems: z
      .array(
        z
          .object({
            offerId: z.string().optional(),
            availableQuantity: z.number().optional(),
            price: amountSchema.optional(),
          })
          .passthrough(),
      )
      .optional(),
  })
  .passthrough();
