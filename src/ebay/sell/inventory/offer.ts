import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/listing-management/sellInventoryV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';
import { mapOffersToTable, mapOfferToCard } from '@/tools/ui/maps.js';

const contentLanguageSchema = z.string().min(1);
const skuSchema = z.string().min(1).max(50);
const offerIdSchema = z.string().min(1);
const marketplaceIdSchema = z.string().min(1);
const pageSizeSchema = z.string().regex(/^[1-9]\d*$/, 'limit must be a positive integer string');
const pageOffsetSchema = z
  .string()
  .regex(/^(?:0|[1-9]\d*)$/, 'offset must be a non-negative integer string');
const listingFormatSchema = z.enum(['FIXED_PRICE', 'AUCTION']);
const nonNegativeQuantitySchema = z.number().int().nonnegative();
const positiveQuantitySchema = z.number().int().positive();

const monetaryAmountSchema = z
  .object({
    currency: z.string().regex(/^[A-Z]{3}$/, 'currency must use a three-letter ISO code'),
    value: z
      .string()
      .regex(/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/, 'amount must be a non-negative monetary string'),
  })
  .strict();

const bestOfferTermsSchema = z
  .object({
    autoAcceptPrice: monetaryAmountSchema.optional(),
    autoDeclinePrice: monetaryAmountSchema.optional(),
    bestOfferEnabled: z.boolean().optional(),
  })
  .strict();

const shippingCostOverrideSchema = z
  .object({
    additionalShippingCost: monetaryAmountSchema.optional(),
    priority: positiveQuantitySchema.optional(),
    shippingCost: monetaryAmountSchema.optional(),
    shippingServiceType: z.enum(['DOMESTIC', 'INTERNATIONAL']).optional(),
    surcharge: monetaryAmountSchema.optional(),
  })
  .strict();

const countryPolicySchema = z
  .object({
    country: z.string().min(1),
    policyIds: z.array(z.string().min(1)).min(1).optional(),
  })
  .strict();

const listingPoliciesSchema = z
  .object({
    bestOfferTerms: bestOfferTermsSchema.optional(),
    eBayPlusIfEligible: z.boolean().optional(),
    fulfillmentPolicyId: z.string().min(1).optional(),
    paymentPolicyId: z.string().min(1).optional(),
    productCompliancePolicyIds: z.array(z.string().min(1)).min(1).optional(),
    regionalProductCompliancePolicies: z
      .object({
        countryPolicies: z.array(countryPolicySchema).min(1).optional(),
      })
      .strict()
      .optional(),
    regionalTakeBackPolicies: z
      .object({
        countryPolicies: z.array(countryPolicySchema).min(1).optional(),
      })
      .strict()
      .optional(),
    returnPolicyId: z.string().min(1).optional(),
    shippingCostOverrides: z.array(shippingCostOverrideSchema).min(1).optional(),
    takeBackPolicyId: z.string().min(1).optional(),
  })
  .strict();

const pricingSummarySchema = z
  .object({
    auctionReservePrice: monetaryAmountSchema.optional(),
    auctionStartPrice: monetaryAmountSchema.optional(),
    minimumAdvertisedPrice: monetaryAmountSchema.optional(),
    originallySoldForRetailPriceOn: z.enum(['ON_EBAY', 'OFF_EBAY']).optional(),
    originalRetailPrice: monetaryAmountSchema.optional(),
    price: monetaryAmountSchema.optional(),
    pricingVisibility: z.enum(['NONE', 'PRE_CHECKOUT', 'DURING_CHECKOUT']).optional(),
  })
  .strict();

const taxSchema = z
  .object({
    applyTax: z.boolean().optional(),
    thirdPartyTaxCategory: z.string().min(1).optional(),
    vatPercentage: z.number().min(0).max(100).optional(),
  })
  .strict();

const charitySchema = z
  .object({
    charityId: z.string().min(1).optional(),
    donationPercentage: z.string().min(1).optional(),
  })
  .strict();

const extendedProducerResponsibilitySchema = z
  .object({
    ecoParticipationFee: monetaryAmountSchema.optional(),
    producerProductId: z.string().min(1).optional(),
    productDocumentationId: z.string().min(1).optional(),
    productPackageId: z.string().min(1).optional(),
    shipmentPackageId: z.string().min(1).optional(),
  })
  .strict();

const energyEfficiencyLabelSchema = z
  .object({
    imageDescription: z.string().min(1).optional(),
    imageURL: z.url().optional(),
    productInformationSheet: z.url().optional(),
  })
  .strict();

const hazmatSchema = z
  .object({
    component: z.string().min(1).optional(),
    pictograms: z.array(z.string().min(1)).min(1).optional(),
    signalWord: z.string().min(1).optional(),
    statements: z.array(z.string().min(1)).min(1).optional(),
  })
  .strict();

const productSafetySchema = z
  .object({
    component: z.string().min(1).optional(),
    pictograms: z.array(z.string().min(1)).min(1).optional(),
    statements: z.array(z.string().min(1)).min(1).optional(),
  })
  .strict();

const manufacturerSchema = z
  .object({
    addressLine1: z.string().min(1).max(180).optional(),
    addressLine2: z.string().min(1).max(180).optional(),
    city: z.string().min(1).max(64).optional(),
    companyName: z.string().min(1).max(100).optional(),
    country: z.string().length(2).optional(),
    email: z.string().min(1).optional(),
    phone: z.string().min(1).optional(),
    postalCode: z.string().min(1).max(16).optional(),
    stateOrProvince: z.string().min(1).max(64).optional(),
  })
  .strict();

const responsiblePersonSchema = z
  .object({
    addressLine1: z.string().min(1).max(180).optional(),
    addressLine2: z.string().min(1).max(180).optional(),
    city: z.string().min(1).max(64).optional(),
    companyName: z.string().min(1).max(100).optional(),
    country: z.string().length(2).optional(),
    email: z.string().min(1).optional(),
    phone: z.string().min(1).optional(),
    postalCode: z.string().min(1).max(16).optional(),
    stateOrProvince: z.string().min(1).max(64).optional(),
    types: z.array(z.string().min(1)).min(1).optional(),
  })
  .strict();

const regulatoryDocumentSchema = z
  .object({
    documentId: z.string().min(1),
  })
  .strict();

const regulatorySchema = z
  .object({
    documents: z.array(regulatoryDocumentSchema).min(1).optional(),
    energyEfficiencyLabel: energyEfficiencyLabelSchema.optional(),
    hazmat: hazmatSchema.optional(),
    manufacturer: manufacturerSchema.optional(),
    productSafety: productSafetySchema.optional(),
    repairScore: z.number().optional(),
    responsiblePersons: z.array(responsiblePersonSchema).min(1).optional(),
  })
  .strict();

const sharedOfferDocumentFields = {
  availableQuantity: nonNegativeQuantitySchema.optional(),
  categoryId: z.string().min(1).optional(),
  charity: charitySchema.optional(),
  extendedProducerResponsibility: extendedProducerResponsibilitySchema.optional(),
  hideBuyerDetails: z.boolean().optional(),
  includeCatalogProductDetails: z.boolean().optional(),
  listingDescription: z.string().min(1).optional(),
  listingDuration: z.string().min(1).optional(),
  listingPolicies: listingPoliciesSchema.optional(),
  listingStartDate: z.string().min(1).optional(),
  lotSize: positiveQuantitySchema.optional(),
  merchantLocationKey: z.string().min(1).max(36).optional(),
  pricingSummary: pricingSummarySchema.optional(),
  quantityLimitPerBuyer: positiveQuantitySchema.optional(),
  regulatory: regulatorySchema.optional(),
  secondaryCategoryId: z.string().min(1).optional(),
  storeCategoryNames: z.array(z.string().min(1)).min(1).optional(),
  tax: taxSchema.optional(),
} as const;

const ebayOfferDetailsWithKeysSchema = z
  .object({
    ...sharedOfferDocumentFields,
    format: listingFormatSchema,
    marketplaceId: marketplaceIdSchema,
    sku: skuSchema,
  })
  .strict();

const ebayOfferDetailsWithIdSchema = z.object(sharedOfferDocumentFields).strict();

function containsDuplicateIdentifiers(identifiers: readonly string[]): boolean {
  return new Set(identifiers).size !== identifiers.length;
}

/** Exact eBay query fields accepted by getOffers, including underscore wire keys. */
export const getOffersArgumentsSchema = z
  .object({
    format: listingFormatSchema.optional(),
    limit: pageSizeSchema.optional(),
    marketplace_id: marketplaceIdSchema.optional(),
    offset: pageOffsetSchema.optional(),
    sku: skuSchema.optional(),
  })
  .strict();

/** Exact offer path accepted by single-offer operations. */
export const offerIdArgumentsSchema = z.object({ offerId: offerIdSchema }).strict();

/** Exact language header and direct EbayOfferDetailsWithKeys fields for createOffer. */
export const createOfferArgumentsSchema = ebayOfferDetailsWithKeysSchema
  .extend({
    'Content-Language': contentLanguageSchema,
  })
  .strict();

/** Exact path, language header, and direct EbayOfferDetailsWithId fields for updateOffer. */
export const updateOfferArgumentsSchema = ebayOfferDetailsWithIdSchema
  .extend({
    offerId: offerIdSchema,
    'Content-Language': contentLanguageSchema,
  })
  .strict();

/** Exact language header and direct BulkEbayOfferDetailsWithKeys document for bulkCreateOffer. */
export const bulkCreateOfferArgumentsSchema = z
  .object({
    'Content-Language': contentLanguageSchema,
    requests: z.array(ebayOfferDetailsWithKeysSchema).min(1).max(25),
  })
  .strict()
  .superRefine((offerBatch, refinement) => {
    const offerKeys = offerBatch.requests.map(
      (offerRequest) => `${offerRequest.sku}|${offerRequest.marketplaceId}|${offerRequest.format}`,
    );
    if (containsDuplicateIdentifiers(offerKeys)) {
      refinement.addIssue({
        code: 'custom',
        message: 'A bulk create may contain each SKU, marketplace, and format combination once',
        path: ['requests'],
      });
    }
  });

/** Exact direct BulkOffer document for bulkPublishOffer. */
export const bulkPublishOfferArgumentsSchema = z
  .object({
    requests: z
      .array(z.object({ offerId: offerIdSchema }).strict())
      .min(1)
      .max(25),
  })
  .strict()
  .superRefine((offerBatch, refinement) => {
    const offerIdentifiers = offerBatch.requests.map((offerRequest) => offerRequest.offerId);
    if (containsDuplicateIdentifiers(offerIdentifiers)) {
      refinement.addIssue({
        code: 'custom',
        message: 'A bulk publish may contain each offer once',
        path: ['requests'],
      });
    }
  });

/** Exact direct OfferKeysWithId document for getListingFees. */
export const getListingFeesArgumentsSchema = z
  .object({
    offers: z
      .array(z.object({ offerId: offerIdSchema }).strict())
      .min(1)
      .max(250),
  })
  .strict()
  .superRefine((listingFeeSelection, refinement) => {
    const offerIdentifiers = listingFeeSelection.offers.map(
      (offerSelection) => offerSelection.offerId,
    );
    if (containsDuplicateIdentifiers(offerIdentifiers)) {
      refinement.addIssue({
        code: 'custom',
        message: 'Listing-fee lookup may contain each offer once',
        path: ['offers'],
      });
    }
  });

/** Exact direct PublishByInventoryItemGroupRequest document. */
export const publishOfferByInventoryItemGroupArgumentsSchema = z
  .object({
    inventoryItemGroupKey: z.string().min(1).max(50),
    marketplaceId: marketplaceIdSchema,
  })
  .strict();

/** Exact direct WithdrawByInventoryItemGroupRequest document. */
export const withdrawOfferByInventoryItemGroupArgumentsSchema = z
  .object({
    inventoryItemGroupKey: z.string().min(1).max(50),
    marketplaceId: marketplaceIdSchema,
  })
  .strict();

/** Validated exact eBay query for getOffers. */
export type GetOffersArguments = z.infer<typeof getOffersArgumentsSchema>;

/** Validated exact offer path. */
export type OfferIdArguments = z.infer<typeof offerIdArgumentsSchema>;

/** Validated direct create accepted by createOffer. */
export type CreateOfferArguments = z.infer<typeof createOfferArgumentsSchema>;

/** Validated direct update accepted by updateOffer. */
export type UpdateOfferArguments = z.infer<typeof updateOfferArgumentsSchema>;

/** Validated direct batch accepted by bulkCreateOffer. */
export type BulkCreateOfferArguments = z.infer<typeof bulkCreateOfferArgumentsSchema>;

/** Validated direct batch accepted by bulkPublishOffer. */
export type BulkPublishOfferArguments = z.infer<typeof bulkPublishOfferArgumentsSchema>;

/** Validated direct selection accepted by getListingFees. */
export type GetListingFeesArguments = z.infer<typeof getListingFeesArgumentsSchema>;

/** Validated direct group publish accepted by publishOfferByInventoryItemGroup. */
export type PublishOfferByInventoryItemGroupArguments = z.infer<
  typeof publishOfferByInventoryItemGroupArgumentsSchema
>;

/** Validated direct group withdraw accepted by withdrawOfferByInventoryItemGroup. */
export type WithdrawOfferByInventoryItemGroupArguments = z.infer<
  typeof withdrawOfferByInventoryItemGroupArgumentsSchema
>;

/** @see https://developer.ebay.com/api-docs/sell/inventory/types/slr:Offers */
export type OfferCollection = components['schemas']['Offers'];

/** @see https://developer.ebay.com/api-docs/sell/inventory/types/slr:EbayOfferDetailsWithAll */
export type Offer = components['schemas']['EbayOfferDetailsWithAll'];

/** @see https://developer.ebay.com/api-docs/sell/inventory/types/slr:OfferResponse */
export type OfferWriteCompletion = components['schemas']['OfferResponse'];

/** @see https://developer.ebay.com/api-docs/sell/inventory/types/slr:BulkOfferResponse */
export type BulkCreateOfferCompletion = components['schemas']['BulkOfferResponse'];

/** @see https://developer.ebay.com/api-docs/sell/inventory/types/slr:BulkPublishResponse */
export type BulkPublishOfferCompletion = components['schemas']['BulkPublishResponse'];

/** @see https://developer.ebay.com/api-docs/sell/inventory/types/slr:FeesSummaryResponse */
export type ListingFeesSummary = components['schemas']['FeesSummaryResponse'];

/** @see https://developer.ebay.com/api-docs/sell/inventory/types/slr:PublishResponse */
export type PublishOfferCompletion = components['schemas']['PublishResponse'];

/** @see https://developer.ebay.com/api-docs/sell/inventory/types/slr:WithdrawResponse */
export type WithdrawOfferCompletion = components['schemas']['WithdrawResponse'];

const offerEndpoint = (offerId: string): string =>
  `/sell/inventory/v1/offer/${encodeURIComponent(offerId)}`;

/**
 * Retrieves seller offers with exact eBay query filters and pagination.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param offerPage - Exact eBay query fields, including marketplace_id.
 * @returns Explicit completion containing eBay's unchanged offer collection.
 * @example `await getOffers(sellerSession, { sku: 'CAMERA-1', marketplace_id: 'EBAY_US', limit: '25' })`
 * @see https://developer.ebay.com/api-docs/sell/inventory/resources/offer/methods/getOffers
 */
export const getOffers = (
  sellerSession: EbaySellerSession,
  offerPage: GetOffersArguments = {},
): Promise<EbayRequestCompletion<OfferCollection>> =>
  sellerSession.get<OfferCollection>({
    endpoint: '/sell/inventory/v1/offer',
    searchParameters: offerPage,
  });

/**
 * Retrieves one offer by eBay offer identifier.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param offerSelection - Exact offer path.
 * @returns Explicit completion containing eBay's unchanged offer document.
 * @example `await getOffer(sellerSession, { offerId: 'OFFER-1' })`
 * @see https://developer.ebay.com/api-docs/sell/inventory/resources/offer/methods/getOffer
 */
export const getOffer = (
  sellerSession: EbaySellerSession,
  offerSelection: OfferIdArguments,
): Promise<EbayRequestCompletion<Offer>> =>
  sellerSession.get<Offer>({ endpoint: offerEndpoint(offerSelection.offerId) });

/**
 * Creates one offer for an inventory item.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param offerCreation - Exact language header and direct EbayOfferDetailsWithKeys fields.
 * @returns Explicit completion containing eBay's offer identifier response.
 * @example `await createOffer(sellerSession, { 'Content-Language': 'en-US', sku: 'CAMERA-1', marketplaceId: 'EBAY_US', format: 'FIXED_PRICE' })`
 * @see https://developer.ebay.com/api-docs/sell/inventory/resources/offer/methods/createOffer
 */
export const createOffer = (
  sellerSession: EbaySellerSession,
  offerCreation: CreateOfferArguments,
): Promise<EbayRequestCompletion<OfferWriteCompletion>> => {
  const { 'Content-Language': contentLanguage, ...offerDocument } = offerCreation;

  return sellerSession.post<OfferWriteCompletion>({
    endpoint: '/sell/inventory/v1/offer',
    requestDocument: offerDocument,
    requestHeaders: { 'Content-Language': contentLanguage },
  });
};

/**
 * Fully replaces one existing offer.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param offerReplacement - Exact path, language header, and direct EbayOfferDetailsWithId fields.
 * @returns Explicit completion containing eBay's offer identifier response.
 * @example `await updateOffer(sellerSession, { offerId: 'OFFER-1', 'Content-Language': 'en-US', availableQuantity: 4 })`
 * @see https://developer.ebay.com/api-docs/sell/inventory/resources/offer/methods/updateOffer
 */
export const updateOffer = (
  sellerSession: EbaySellerSession,
  offerReplacement: UpdateOfferArguments,
): Promise<EbayRequestCompletion<OfferWriteCompletion>> => {
  const { offerId, 'Content-Language': contentLanguage, ...offerDocument } = offerReplacement;

  return sellerSession.put<OfferWriteCompletion>({
    endpoint: offerEndpoint(offerId),
    requestDocument: offerDocument,
    requestHeaders: { 'Content-Language': contentLanguage },
  });
};

/**
 * Deletes one unpublished offer.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param offerSelection - Exact offer path.
 * @returns Explicit completion after eBay deletes the offer.
 * @example `await deleteOffer(sellerSession, { offerId: 'OFFER-1' })`
 * @see https://developer.ebay.com/api-docs/sell/inventory/resources/offer/methods/deleteOffer
 */
export const deleteOffer = (
  sellerSession: EbaySellerSession,
  offerSelection: OfferIdArguments,
): Promise<EbayRequestCompletion<undefined>> =>
  sellerSession.delete<undefined>({ endpoint: offerEndpoint(offerSelection.offerId) });

/**
 * Publishes one unpublished offer into a live listing.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param offerSelection - Exact offer path.
 * @returns Explicit completion containing eBay's publish response.
 * @example `await publishOffer(sellerSession, { offerId: 'OFFER-1' })`
 * @see https://developer.ebay.com/api-docs/sell/inventory/resources/offer/methods/publishOffer
 */
export const publishOffer = (
  sellerSession: EbaySellerSession,
  offerSelection: OfferIdArguments,
): Promise<EbayRequestCompletion<PublishOfferCompletion>> =>
  sellerSession.post<PublishOfferCompletion>({
    endpoint: `${offerEndpoint(offerSelection.offerId)}/publish`,
  });

/**
 * Withdraws one published offer and ends its listing.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param offerSelection - Exact offer path.
 * @returns Explicit completion containing eBay's withdraw response.
 * @example `await withdrawOffer(sellerSession, { offerId: 'OFFER-1' })`
 * @see https://developer.ebay.com/api-docs/sell/inventory/resources/offer/methods/withdrawOffer
 */
export const withdrawOffer = (
  sellerSession: EbaySellerSession,
  offerSelection: OfferIdArguments,
): Promise<EbayRequestCompletion<WithdrawOfferCompletion>> =>
  sellerSession.post<WithdrawOfferCompletion>({
    endpoint: `${offerEndpoint(offerSelection.offerId)}/withdraw`,
  });

/**
 * Creates up to 25 offers.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param offerBatch - Exact language header and direct BulkEbayOfferDetailsWithKeys document.
 * @returns Explicit completion containing eBay's per-offer statuses.
 * @example `await bulkCreateOffer(sellerSession, { 'Content-Language': 'en-US', requests: [{ sku: 'CAMERA-1', marketplaceId: 'EBAY_US', format: 'FIXED_PRICE' }] })`
 * @see https://developer.ebay.com/api-docs/sell/inventory/resources/offer/methods/bulkCreateOffer
 */
export const bulkCreateOffer = (
  sellerSession: EbaySellerSession,
  offerBatch: BulkCreateOfferArguments,
): Promise<EbayRequestCompletion<BulkCreateOfferCompletion>> => {
  const { 'Content-Language': contentLanguage, ...bulkOfferDocument } = offerBatch;

  return sellerSession.post<BulkCreateOfferCompletion>({
    endpoint: '/sell/inventory/v1/bulk_create_offer',
    requestDocument: bulkOfferDocument,
    requestHeaders: { 'Content-Language': contentLanguage },
  });
};

/**
 * Publishes up to 25 unpublished offers.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param offerSelections - Exact direct BulkOffer document.
 * @returns Explicit completion containing eBay's per-offer publish statuses.
 * @example `await bulkPublishOffer(sellerSession, { requests: [{ offerId: 'OFFER-1' }] })`
 * @see https://developer.ebay.com/api-docs/sell/inventory/resources/offer/methods/bulkPublishOffer
 */
export const bulkPublishOffer = (
  sellerSession: EbaySellerSession,
  offerSelections: BulkPublishOfferArguments,
): Promise<EbayRequestCompletion<BulkPublishOfferCompletion>> =>
  sellerSession.post<BulkPublishOfferCompletion>({
    endpoint: '/sell/inventory/v1/bulk_publish_offer',
    requestDocument: offerSelections,
  });

/**
 * Retrieves expected listing fees for up to 250 unpublished offers.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param listingFeeSelection - Exact direct OfferKeysWithId document.
 * @returns Explicit completion containing eBay's fee summary.
 * @example `await getListingFees(sellerSession, { offers: [{ offerId: 'OFFER-1' }] })`
 * @see https://developer.ebay.com/api-docs/sell/inventory/resources/offer/methods/getListingFees
 */
export const getListingFees = (
  sellerSession: EbaySellerSession,
  listingFeeSelection: GetListingFeesArguments,
): Promise<EbayRequestCompletion<ListingFeesSummary>> =>
  sellerSession.post<ListingFeesSummary>({
    endpoint: '/sell/inventory/v1/offer/get_listing_fees',
    requestDocument: listingFeeSelection,
  });

/**
 * Publishes all unpublished offers for one inventory item group.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param inventoryItemGroupPublish - Exact direct PublishByInventoryItemGroupRequest document.
 * @returns Explicit completion containing eBay's publish response.
 * @example `await publishOfferByInventoryItemGroup(sellerSession, { inventoryItemGroupKey: 'GROUP-1', marketplaceId: 'EBAY_US' })`
 * @see https://developer.ebay.com/api-docs/sell/inventory/resources/offer/methods/publishOfferByInventoryItemGroup
 */
export const publishOfferByInventoryItemGroup = (
  sellerSession: EbaySellerSession,
  inventoryItemGroupPublish: PublishOfferByInventoryItemGroupArguments,
): Promise<EbayRequestCompletion<PublishOfferCompletion>> =>
  sellerSession.post<PublishOfferCompletion>({
    endpoint: '/sell/inventory/v1/offer/publish_by_inventory_item_group',
    requestDocument: inventoryItemGroupPublish,
  });

/**
 * Withdraws all published offers for one inventory item group.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param inventoryItemGroupWithdraw - Exact direct WithdrawByInventoryItemGroupRequest document.
 * @returns Explicit completion after eBay withdraws the group listing.
 * @example `await withdrawOfferByInventoryItemGroup(sellerSession, { inventoryItemGroupKey: 'GROUP-1', marketplaceId: 'EBAY_US' })`
 * @see https://developer.ebay.com/api-docs/sell/inventory/resources/offer/methods/withdrawOfferByInventoryItemGroup
 */
export const withdrawOfferByInventoryItemGroup = (
  sellerSession: EbaySellerSession,
  inventoryItemGroupWithdraw: WithdrawOfferByInventoryItemGroupArguments,
): Promise<EbayRequestCompletion<undefined>> =>
  sellerSession.post<undefined>({
    endpoint: '/sell/inventory/v1/offer/withdraw_by_inventory_item_group',
    requestDocument: inventoryItemGroupWithdraw,
  });

/** MCP definition for Inventory API getOffers. */
export const getOffersTool = defineTool({
  name: 'ebay_sell_inventory_get_offers',
  namespace: 'sell.inventory',
  description: 'Retrieve seller offers with exact eBay filters and pagination',
  argumentsSchema: getOffersArgumentsSchema,
  operationKind: 'read',
  operation: getOffers,
  presentation: { archetype: 'table', project: mapOffersToTable },
});

/** MCP definition for Inventory API getOffer. */
export const getOfferTool = defineTool({
  name: 'ebay_sell_inventory_get_offer',
  namespace: 'sell.inventory',
  description: 'Retrieve one eBay inventory offer',
  argumentsSchema: offerIdArgumentsSchema,
  operationKind: 'read',
  operation: getOffer,
  presentation: { archetype: 'card', project: mapOfferToCard },
});

/** MCP definition for Inventory API createOffer. */
export const createOfferTool = defineTool({
  name: 'ebay_sell_inventory_create_offer',
  namespace: 'sell.inventory',
  description: 'Create one eBay inventory offer for a seller-defined SKU',
  argumentsSchema: createOfferArgumentsSchema,
  operationKind: 'write',
  operation: createOffer,
});

/** MCP definition for Inventory API updateOffer. */
export const updateOfferTool = defineTool({
  name: 'ebay_sell_inventory_update_offer',
  namespace: 'sell.inventory',
  description: 'Fully replace one eBay inventory offer',
  argumentsSchema: updateOfferArgumentsSchema,
  operationKind: 'write',
  operation: updateOffer,
});

/** MCP definition for Inventory API deleteOffer. */
export const deleteOfferTool = defineTool({
  name: 'ebay_sell_inventory_delete_offer',
  namespace: 'sell.inventory',
  description: 'Delete one unpublished eBay inventory offer',
  argumentsSchema: offerIdArgumentsSchema,
  operationKind: 'write',
  operation: deleteOffer,
});

/** MCP definition for Inventory API publishOffer. */
export const publishOfferTool = defineTool({
  name: 'ebay_sell_inventory_publish_offer',
  namespace: 'sell.inventory',
  description: 'Publish one eBay inventory offer into a live listing',
  argumentsSchema: offerIdArgumentsSchema,
  operationKind: 'write',
  operation: publishOffer,
});

/** MCP definition for Inventory API withdrawOffer. */
export const withdrawOfferTool = defineTool({
  name: 'ebay_sell_inventory_withdraw_offer',
  namespace: 'sell.inventory',
  description: 'Withdraw one published eBay inventory offer',
  argumentsSchema: offerIdArgumentsSchema,
  operationKind: 'write',
  operation: withdrawOffer,
});

/** MCP definition for Inventory API bulkCreateOffer. */
export const bulkCreateOfferTool = defineTool({
  name: 'ebay_sell_inventory_bulk_create_offer',
  namespace: 'sell.inventory',
  description: 'Create up to 25 eBay inventory offers',
  argumentsSchema: bulkCreateOfferArgumentsSchema,
  operationKind: 'write',
  operation: bulkCreateOffer,
});

/** MCP definition for Inventory API bulkPublishOffer. */
export const bulkPublishOfferTool = defineTool({
  name: 'ebay_sell_inventory_bulk_publish_offer',
  namespace: 'sell.inventory',
  description: 'Publish up to 25 eBay inventory offers',
  argumentsSchema: bulkPublishOfferArgumentsSchema,
  operationKind: 'write',
  operation: bulkPublishOffer,
});

/** MCP definition for Inventory API getListingFees. */
export const getListingFeesTool = defineTool({
  name: 'ebay_sell_inventory_get_listing_fees',
  namespace: 'sell.inventory',
  description: 'Retrieve expected listing fees for unpublished eBay offers',
  argumentsSchema: getListingFeesArgumentsSchema,
  operationKind: 'read',
  operation: getListingFees,
});

/** MCP definition for Inventory API publishOfferByInventoryItemGroup. */
export const publishOfferByInventoryItemGroupTool = defineTool({
  name: 'ebay_sell_inventory_publish_offer_by_inventory_item_group',
  namespace: 'sell.inventory',
  description: 'Publish all offers for one inventory item group',
  argumentsSchema: publishOfferByInventoryItemGroupArgumentsSchema,
  operationKind: 'write',
  operation: publishOfferByInventoryItemGroup,
});

/** MCP definition for Inventory API withdrawOfferByInventoryItemGroup. */
export const withdrawOfferByInventoryItemGroupTool = defineTool({
  name: 'ebay_sell_inventory_withdraw_offer_by_inventory_item_group',
  namespace: 'sell.inventory',
  description: 'Withdraw all offers for one inventory item group',
  argumentsSchema: withdrawOfferByInventoryItemGroupArgumentsSchema,
  operationKind: 'write',
  operation: withdrawOfferByInventoryItemGroup,
});
