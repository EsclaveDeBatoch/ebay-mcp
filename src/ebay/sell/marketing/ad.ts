import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/marketing-and-promotions/sellMarketingV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';

const campaignIdSchema = z.string().min(1);
const adIdSchema = z.string().min(1);
const listingIdSchema = z.string().min(1);
const pageSizeSchema = z.string().regex(/^[1-9]\d*$/, 'limit must be a positive integer string');
const pageOffsetSchema = z
  .string()
  .regex(/^(?:0|[1-9]\d*)$/, 'offset must be a non-negative integer string');
const bidPercentageSchema = z.string().min(1);
const inventoryReferenceIdSchema = z.string().min(1);
const inventoryReferenceTypeSchema = z.enum(['INVENTORY_ITEM', 'INVENTORY_ITEM_GROUP']);
const adStatusSchema = z.enum(['ACTIVE', 'PAUSED', 'ARCHIVED']);

const createAdRequestSchema = z
  .object({
    adGroupId: z.string().min(1).optional(),
    bidPercentage: bidPercentageSchema.optional(),
    listingId: listingIdSchema.optional(),
  })
  .strict();

const createAdsByInventoryReferenceRequestSchema = z
  .object({
    adGroupId: z.string().min(1).optional(),
    bidPercentage: bidPercentageSchema.optional(),
    inventoryReferenceId: inventoryReferenceIdSchema.optional(),
    inventoryReferenceType: inventoryReferenceTypeSchema.optional(),
  })
  .strict();

const deleteAdsByInventoryReferenceRequestSchema = z
  .object({
    inventoryReferenceId: inventoryReferenceIdSchema.optional(),
    inventoryReferenceType: inventoryReferenceTypeSchema.optional(),
  })
  .strict();

const deleteAdRequestSchema = z
  .object({
    listingId: listingIdSchema.optional(),
  })
  .strict();

const updateAdStatusRequestSchema = z
  .object({
    adId: adIdSchema.optional(),
    adStatus: adStatusSchema.optional(),
  })
  .strict();

const updateAdStatusByListingIdRequestSchema = z
  .object({
    adGroupId: z.string().min(1).optional(),
    adStatus: adStatusSchema.optional(),
    listingId: listingIdSchema.optional(),
  })
  .strict();

const bulkCreateAdsByInventoryReferenceDocumentSchema = z
  .object({
    requests: z.array(createAdsByInventoryReferenceRequestSchema).min(1).max(500),
  })
  .strict();

const bulkCreateAdDocumentSchema = z
  .object({
    requests: z.array(createAdRequestSchema).min(1).max(500),
  })
  .strict();

const bulkDeleteAdsByInventoryReferenceDocumentSchema = z
  .object({
    requests: z.array(deleteAdsByInventoryReferenceRequestSchema).min(1).max(500),
  })
  .strict();

const bulkDeleteAdDocumentSchema = z
  .object({
    requests: z.array(deleteAdRequestSchema).min(1).max(500),
  })
  .strict();

const bulkUpdateAdStatusDocumentSchema = z
  .object({
    requests: z.array(updateAdStatusRequestSchema).min(1).max(500),
  })
  .strict();

const bulkUpdateAdStatusByListingIdDocumentSchema = z
  .object({
    requests: z.array(updateAdStatusByListingIdRequestSchema).min(1).max(500),
  })
  .strict();

/** Exact path and direct bulk inventory-reference create document. */
export const bulkCreateAdsByInventoryReferenceArgumentsSchema =
  bulkCreateAdsByInventoryReferenceDocumentSchema
    .extend({
      campaign_id: campaignIdSchema,
    })
    .strict();

/** Exact path and direct bulk listing-id create document. */
export const bulkCreateAdsByListingIdArgumentsSchema = bulkCreateAdDocumentSchema
  .extend({
    campaign_id: campaignIdSchema,
  })
  .strict();

/** Exact path and direct bulk inventory-reference delete document. */
export const bulkDeleteAdsByInventoryReferenceArgumentsSchema =
  bulkDeleteAdsByInventoryReferenceDocumentSchema
    .extend({
      campaign_id: campaignIdSchema,
    })
    .strict();

/** Exact path and direct bulk listing-id delete document. */
export const bulkDeleteAdsByListingIdArgumentsSchema = bulkDeleteAdDocumentSchema
  .extend({
    campaign_id: campaignIdSchema,
  })
  .strict();

/** Exact path and direct bulk inventory-reference bid update document. */
export const bulkUpdateAdsBidByInventoryReferenceArgumentsSchema =
  bulkCreateAdsByInventoryReferenceDocumentSchema
    .extend({
      campaign_id: campaignIdSchema,
    })
    .strict();

/** Exact path and direct bulk listing-id bid update document. */
export const bulkUpdateAdsBidByListingIdArgumentsSchema = bulkCreateAdDocumentSchema
  .extend({
    campaign_id: campaignIdSchema,
  })
  .strict();

/** Exact path and direct bulk ad-status update document. */
export const bulkUpdateAdsStatusArgumentsSchema = bulkUpdateAdStatusDocumentSchema
  .extend({
    campaign_id: campaignIdSchema,
  })
  .strict();

/** Exact path and direct bulk listing-id status update document. */
export const bulkUpdateAdsStatusByListingIdArgumentsSchema =
  bulkUpdateAdStatusByListingIdDocumentSchema
    .extend({
      campaign_id: campaignIdSchema,
    })
    .strict();

/** Exact path and query wire keys accepted by getAds. */
export const getAdsArgumentsSchema = z
  .object({
    ad_group_ids: z.string().min(1).optional(),
    ad_status: z.string().min(1).optional(),
    campaign_id: campaignIdSchema,
    limit: pageSizeSchema.optional(),
    listing_ids: z.string().min(1).optional(),
    offset: pageOffsetSchema.optional(),
  })
  .strict();

/** Exact path and direct CreateAdRequest fields for createAdByListingId. */
export const createAdByListingIdArgumentsSchema = createAdRequestSchema
  .extend({
    campaign_id: campaignIdSchema,
  })
  .strict();

/** Exact path and direct CreateAdsByInventoryReferenceRequest fields. */
export const createAdsByInventoryReferenceArgumentsSchema =
  createAdsByInventoryReferenceRequestSchema
    .extend({
      campaign_id: campaignIdSchema,
    })
    .strict();

/** Exact campaign and ad path accepted by getAd and deleteAd. */
export const adPathArgumentsSchema = z
  .object({
    ad_id: adIdSchema,
    campaign_id: campaignIdSchema,
  })
  .strict();

/** Exact path and direct DeleteAdsByInventoryReferenceRequest fields. */
export const deleteAdsByInventoryReferenceArgumentsSchema =
  deleteAdsByInventoryReferenceRequestSchema
    .extend({
      campaign_id: campaignIdSchema,
    })
    .strict();

/** Exact path and required inventory-reference query wire keys. */
export const getAdsByInventoryReferenceArgumentsSchema = z
  .object({
    campaign_id: campaignIdSchema,
    inventory_reference_id: inventoryReferenceIdSchema,
    inventory_reference_type: inventoryReferenceTypeSchema,
  })
  .strict();

/** Exact path and direct UpdateBidPercentageRequest fields. */
export const updateBidArgumentsSchema = z
  .object({
    ad_id: adIdSchema,
    bidPercentage: bidPercentageSchema.optional(),
    campaign_id: campaignIdSchema,
  })
  .strict();

/** Validated bulk create by inventory reference. */
export type BulkCreateAdsByInventoryReferenceArguments = z.infer<
  typeof bulkCreateAdsByInventoryReferenceArgumentsSchema
>;

/** Validated bulk create by listing id. */
export type BulkCreateAdsByListingIdArguments = z.infer<
  typeof bulkCreateAdsByListingIdArgumentsSchema
>;

/** Validated bulk delete by inventory reference. */
export type BulkDeleteAdsByInventoryReferenceArguments = z.infer<
  typeof bulkDeleteAdsByInventoryReferenceArgumentsSchema
>;

/** Validated bulk delete by listing id. */
export type BulkDeleteAdsByListingIdArguments = z.infer<
  typeof bulkDeleteAdsByListingIdArgumentsSchema
>;

/** Validated bulk bid update by inventory reference. */
export type BulkUpdateAdsBidByInventoryReferenceArguments = z.infer<
  typeof bulkUpdateAdsBidByInventoryReferenceArgumentsSchema
>;

/** Validated bulk bid update by listing id. */
export type BulkUpdateAdsBidByListingIdArguments = z.infer<
  typeof bulkUpdateAdsBidByListingIdArgumentsSchema
>;

/** Validated bulk ad status update. */
export type BulkUpdateAdsStatusArguments = z.infer<typeof bulkUpdateAdsStatusArgumentsSchema>;

/** Validated bulk ad status update by listing id. */
export type BulkUpdateAdsStatusByListingIdArguments = z.infer<
  typeof bulkUpdateAdsStatusByListingIdArgumentsSchema
>;

/** Validated getAds path and query. */
export type GetAdsArguments = z.infer<typeof getAdsArgumentsSchema>;

/** Validated createAdByListingId path and document. */
export type CreateAdByListingIdArguments = z.infer<typeof createAdByListingIdArgumentsSchema>;

/** Validated createAdsByInventoryReference path and document. */
export type CreateAdsByInventoryReferenceArguments = z.infer<
  typeof createAdsByInventoryReferenceArgumentsSchema
>;

/** Validated single-ad path. */
export type AdPathArguments = z.infer<typeof adPathArgumentsSchema>;

/** Validated deleteAdsByInventoryReference path and document. */
export type DeleteAdsByInventoryReferenceArguments = z.infer<
  typeof deleteAdsByInventoryReferenceArgumentsSchema
>;

/** Validated getAdsByInventoryReference path and query. */
export type GetAdsByInventoryReferenceArguments = z.infer<
  typeof getAdsByInventoryReferenceArgumentsSchema
>;

/** Validated updateBid path and document. */
export type UpdateBidArguments = z.infer<typeof updateBidArgumentsSchema>;

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/pls:BulkCreateAdsByInventoryReferenceResponse */
export type BulkCreateAdsByInventoryReferenceCompletion =
  components['schemas']['BulkCreateAdsByInventoryReferenceResponse'];

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/pls:BulkAdResponse */
export type BulkCreateAdsByListingIdCompletion = components['schemas']['BulkAdResponse'];

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/pls:BulkDeleteAdsByInventoryReferenceResponse */
export type BulkDeleteAdsByInventoryReferenceCompletion =
  components['schemas']['BulkDeleteAdsByInventoryReferenceResponse'];

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/pls:BulkDeleteAdResponse */
export type BulkDeleteAdsByListingIdCompletion = components['schemas']['BulkDeleteAdResponse'];

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/pls:BulkUpdateAdsByInventoryReferenceResponse */
export type BulkUpdateAdsBidByInventoryReferenceCompletion =
  components['schemas']['BulkUpdateAdsByInventoryReferenceResponse'];

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/pls:BulkAdUpdateResponse */
export type BulkUpdateAdsBidByListingIdCompletion = components['schemas']['BulkAdUpdateResponse'];

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/pls:BulkAdUpdateStatusResponse */
export type BulkUpdateAdsStatusCompletion = components['schemas']['BulkAdUpdateStatusResponse'];

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/pls:BulkAdUpdateStatusByListingIdResponse */
export type BulkUpdateAdsStatusByListingIdCompletion =
  components['schemas']['BulkAdUpdateStatusByListingIdResponse'];

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/pls:AdPagedCollectionResponse */
export type AdPagedCollection = components['schemas']['AdPagedCollectionResponse'];

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/pls:AdReferences */
export type AdReferences = components['schemas']['AdReferences'];

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/pls:Ad */
export type Ad = components['schemas']['Ad'];

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/pls:AdIds */
export type AdIds = components['schemas']['AdIds'];

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/pls:Ads */
export type Ads = components['schemas']['Ads'];

function campaignEndpoint(campaignId: string): string {
  return `/sell/marketing/v1/ad_campaign/${encodeURIComponent(campaignId)}`;
}

function adEndpoint(campaignId: string, adId: string): string {
  return `${campaignEndpoint(campaignId)}/ad/${encodeURIComponent(adId)}`;
}

/**
 * Creates ads in bulk from inventory reference IDs.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param bulkAdCreation - Exact campaign path and direct bulk inventory-reference document.
 * @returns Explicit completion containing eBay's unchanged bulk create response.
 * @example `await bulkCreateAdsByInventoryReference(sellerSession, { campaign_id: 'C1', requests: [{ inventoryReferenceId: 'SKU-1', inventoryReferenceType: 'INVENTORY_ITEM', bidPercentage: '5.0' }] })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/ad/methods/bulkCreateAdsByInventoryReference
 */
export const bulkCreateAdsByInventoryReference = (
  sellerSession: EbaySellerSession,
  bulkAdCreation: BulkCreateAdsByInventoryReferenceArguments,
): Promise<EbayRequestCompletion<BulkCreateAdsByInventoryReferenceCompletion>> => {
  const { campaign_id: campaignId, ...bulkDocument } = bulkAdCreation;
  return sellerSession.post<BulkCreateAdsByInventoryReferenceCompletion>({
    endpoint: `${campaignEndpoint(campaignId)}/bulk_create_ads_by_inventory_reference`,
    requestDocument: bulkDocument,
  });
};

/**
 * Creates ads in bulk from listing IDs.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param bulkAdCreation - Exact campaign path and direct bulk listing-id document.
 * @returns Explicit completion containing eBay's unchanged bulk create response.
 * @example `await bulkCreateAdsByListingId(sellerSession, { campaign_id: 'C1', requests: [{ listingId: '1', bidPercentage: '5.0' }] })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/ad/methods/bulkCreateAdsByListingId
 */
export const bulkCreateAdsByListingId = (
  sellerSession: EbaySellerSession,
  bulkAdCreation: BulkCreateAdsByListingIdArguments,
): Promise<EbayRequestCompletion<BulkCreateAdsByListingIdCompletion>> => {
  const { campaign_id: campaignId, ...bulkDocument } = bulkAdCreation;
  return sellerSession.post<BulkCreateAdsByListingIdCompletion>({
    endpoint: `${campaignEndpoint(campaignId)}/bulk_create_ads_by_listing_id`,
    requestDocument: bulkDocument,
  });
};

/**
 * Deletes ads in bulk by inventory reference IDs.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param bulkAdDeletion - Exact campaign path and direct bulk inventory-reference document.
 * @returns Explicit completion containing eBay's unchanged bulk delete response.
 * @example `await bulkDeleteAdsByInventoryReference(sellerSession, { campaign_id: 'C1', requests: [{ inventoryReferenceId: 'SKU-1', inventoryReferenceType: 'INVENTORY_ITEM' }] })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/ad/methods/bulkDeleteAdsByInventoryReference
 */
export const bulkDeleteAdsByInventoryReference = (
  sellerSession: EbaySellerSession,
  bulkAdDeletion: BulkDeleteAdsByInventoryReferenceArguments,
): Promise<EbayRequestCompletion<BulkDeleteAdsByInventoryReferenceCompletion>> => {
  const { campaign_id: campaignId, ...bulkDocument } = bulkAdDeletion;
  return sellerSession.post<BulkDeleteAdsByInventoryReferenceCompletion>({
    endpoint: `${campaignEndpoint(campaignId)}/bulk_delete_ads_by_inventory_reference`,
    requestDocument: bulkDocument,
  });
};

/**
 * Deletes ads in bulk by listing IDs.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param bulkAdDeletion - Exact campaign path and direct bulk listing-id document.
 * @returns Explicit completion containing eBay's unchanged bulk delete response.
 * @example `await bulkDeleteAdsByListingId(sellerSession, { campaign_id: 'C1', requests: [{ listingId: '1' }] })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/ad/methods/bulkDeleteAdsByListingId
 */
export const bulkDeleteAdsByListingId = (
  sellerSession: EbaySellerSession,
  bulkAdDeletion: BulkDeleteAdsByListingIdArguments,
): Promise<EbayRequestCompletion<BulkDeleteAdsByListingIdCompletion>> => {
  const { campaign_id: campaignId, ...bulkDocument } = bulkAdDeletion;
  return sellerSession.post<BulkDeleteAdsByListingIdCompletion>({
    endpoint: `${campaignEndpoint(campaignId)}/bulk_delete_ads_by_listing_id`,
    requestDocument: bulkDocument,
  });
};

/**
 * Updates ad bids in bulk by inventory reference IDs.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param bulkBidUpdate - Exact campaign path and direct bulk inventory-reference document.
 * @returns Explicit completion containing eBay's unchanged bulk bid update response.
 * @example `await bulkUpdateAdsBidByInventoryReference(sellerSession, { campaign_id: 'C1', requests: [{ inventoryReferenceId: 'SKU-1', inventoryReferenceType: 'INVENTORY_ITEM', bidPercentage: '6.0' }] })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/ad/methods/bulkUpdateAdsBidByInventoryReference
 */
export const bulkUpdateAdsBidByInventoryReference = (
  sellerSession: EbaySellerSession,
  bulkBidUpdate: BulkUpdateAdsBidByInventoryReferenceArguments,
): Promise<EbayRequestCompletion<BulkUpdateAdsBidByInventoryReferenceCompletion>> => {
  const { campaign_id: campaignId, ...bulkDocument } = bulkBidUpdate;
  return sellerSession.post<BulkUpdateAdsBidByInventoryReferenceCompletion>({
    endpoint: `${campaignEndpoint(campaignId)}/bulk_update_ads_bid_by_inventory_reference`,
    requestDocument: bulkDocument,
  });
};

/**
 * Updates ad bids in bulk by listing IDs.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param bulkBidUpdate - Exact campaign path and direct bulk listing-id document.
 * @returns Explicit completion containing eBay's unchanged bulk bid update response.
 * @example `await bulkUpdateAdsBidByListingId(sellerSession, { campaign_id: 'C1', requests: [{ listingId: '1', bidPercentage: '6.0' }] })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/ad/methods/bulkUpdateAdsBidByListingId
 */
export const bulkUpdateAdsBidByListingId = (
  sellerSession: EbaySellerSession,
  bulkBidUpdate: BulkUpdateAdsBidByListingIdArguments,
): Promise<EbayRequestCompletion<BulkUpdateAdsBidByListingIdCompletion>> => {
  const { campaign_id: campaignId, ...bulkDocument } = bulkBidUpdate;
  return sellerSession.post<BulkUpdateAdsBidByListingIdCompletion>({
    endpoint: `${campaignEndpoint(campaignId)}/bulk_update_ads_bid_by_listing_id`,
    requestDocument: bulkDocument,
  });
};

/**
 * Updates ad statuses in bulk by ad IDs.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param bulkStatusUpdate - Exact campaign path and direct bulk status document.
 * @returns Explicit completion containing eBay's unchanged bulk status update response.
 * @example `await bulkUpdateAdsStatus(sellerSession, { campaign_id: 'C1', requests: [{ adId: 'A1', adStatus: 'PAUSED' }] })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/ad/methods/bulkUpdateAdsStatus
 */
export const bulkUpdateAdsStatus = (
  sellerSession: EbaySellerSession,
  bulkStatusUpdate: BulkUpdateAdsStatusArguments,
): Promise<EbayRequestCompletion<BulkUpdateAdsStatusCompletion>> => {
  const { campaign_id: campaignId, ...bulkDocument } = bulkStatusUpdate;
  return sellerSession.post<BulkUpdateAdsStatusCompletion>({
    endpoint: `${campaignEndpoint(campaignId)}/bulk_update_ads_status`,
    requestDocument: bulkDocument,
  });
};

/**
 * Updates ad statuses in bulk by listing IDs.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param bulkStatusUpdate - Exact campaign path and direct bulk listing-status document.
 * @returns Explicit completion containing eBay's unchanged bulk status update response.
 * @example `await bulkUpdateAdsStatusByListingId(sellerSession, { campaign_id: 'C1', requests: [{ listingId: '1', adStatus: 'ACTIVE' }] })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/ad/methods/bulkUpdateAdsStatusByListingId
 */
export const bulkUpdateAdsStatusByListingId = (
  sellerSession: EbaySellerSession,
  bulkStatusUpdate: BulkUpdateAdsStatusByListingIdArguments,
): Promise<EbayRequestCompletion<BulkUpdateAdsStatusByListingIdCompletion>> => {
  const { campaign_id: campaignId, ...bulkDocument } = bulkStatusUpdate;
  return sellerSession.post<BulkUpdateAdsStatusByListingIdCompletion>({
    endpoint: `${campaignEndpoint(campaignId)}/bulk_update_ads_status_by_listing_id`,
    requestDocument: bulkDocument,
  });
};

/**
 * Retrieves ads for one campaign with exact eBay query filters.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param adPage - Exact campaign path and snake_case query wire keys.
 * @returns Explicit completion containing eBay's unchanged ad collection.
 * @example `await getAds(sellerSession, { campaign_id: 'C1', ad_status: 'ACTIVE', limit: '25', offset: '0' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/ad/methods/getAds
 */
export const getAds = (
  sellerSession: EbaySellerSession,
  adPage: GetAdsArguments,
): Promise<EbayRequestCompletion<AdPagedCollection>> => {
  const { campaign_id: campaignId, ...adSearch } = adPage;
  return sellerSession.get<AdPagedCollection>({
    endpoint: `${campaignEndpoint(campaignId)}/ad`,
    searchParameters: adSearch,
  });
};

/**
 * Creates one ad from a listing ID.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param adCreation - Exact campaign path and direct CreateAdRequest fields.
 * @returns Explicit completion after eBay creates the ad.
 * @example `await createAdByListingId(sellerSession, { campaign_id: 'C1', listingId: '1', bidPercentage: '5.0' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/ad/methods/createAdByListingId
 */
export const createAdByListingId = (
  sellerSession: EbaySellerSession,
  adCreation: CreateAdByListingIdArguments,
): Promise<EbayRequestCompletion<undefined>> => {
  const { campaign_id: campaignId, ...adDocument } = adCreation;
  return sellerSession.post<undefined>({
    endpoint: `${campaignEndpoint(campaignId)}/ad`,
    requestDocument: adDocument,
  });
};

/**
 * Creates ads from one inventory reference.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param adCreation - Exact campaign path and direct inventory-reference document.
 * @returns Explicit completion containing eBay's unchanged ad references.
 * @example `await createAdsByInventoryReference(sellerSession, { campaign_id: 'C1', inventoryReferenceId: 'SKU-1', inventoryReferenceType: 'INVENTORY_ITEM', bidPercentage: '5.0' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/ad/methods/createAdsByInventoryReference
 */
export const createAdsByInventoryReference = (
  sellerSession: EbaySellerSession,
  adCreation: CreateAdsByInventoryReferenceArguments,
): Promise<EbayRequestCompletion<AdReferences>> => {
  const { campaign_id: campaignId, ...adDocument } = adCreation;
  return sellerSession.post<AdReferences>({
    endpoint: `${campaignEndpoint(campaignId)}/create_ads_by_inventory_reference`,
    requestDocument: adDocument,
  });
};

/**
 * Retrieves one ad by campaign and ad identifiers.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param adSelection - Exact campaign and ad path wire keys.
 * @returns Explicit completion containing eBay's unchanged ad document.
 * @example `await getAd(sellerSession, { campaign_id: 'C1', ad_id: 'A1' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/ad/methods/getAd
 */
export const getAd = (
  sellerSession: EbaySellerSession,
  adSelection: AdPathArguments,
): Promise<EbayRequestCompletion<Ad>> =>
  sellerSession.get<Ad>({
    endpoint: adEndpoint(adSelection.campaign_id, adSelection.ad_id),
  });

/**
 * Deletes one ad by campaign and ad identifiers.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param adSelection - Exact campaign and ad path wire keys.
 * @returns Explicit completion after eBay deletes the ad.
 * @example `await deleteAd(sellerSession, { campaign_id: 'C1', ad_id: 'A1' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/ad/methods/deleteAd
 */
export const deleteAd = (
  sellerSession: EbaySellerSession,
  adSelection: AdPathArguments,
): Promise<EbayRequestCompletion<undefined>> =>
  sellerSession.delete<undefined>({
    endpoint: adEndpoint(adSelection.campaign_id, adSelection.ad_id),
  });

/**
 * Deletes ads for one inventory reference.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param adDeletion - Exact campaign path and direct inventory-reference document.
 * @returns Explicit completion containing eBay's unchanged deleted ad identifiers.
 * @example `await deleteAdsByInventoryReference(sellerSession, { campaign_id: 'C1', inventoryReferenceId: 'SKU-1', inventoryReferenceType: 'INVENTORY_ITEM' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/ad/methods/deleteAdsByInventoryReference
 */
export const deleteAdsByInventoryReference = (
  sellerSession: EbaySellerSession,
  adDeletion: DeleteAdsByInventoryReferenceArguments,
): Promise<EbayRequestCompletion<AdIds>> => {
  const { campaign_id: campaignId, ...adDocument } = adDeletion;
  return sellerSession.post<AdIds>({
    endpoint: `${campaignEndpoint(campaignId)}/delete_ads_by_inventory_reference`,
    requestDocument: adDocument,
  });
};

/**
 * Retrieves ads for one inventory reference.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param inventoryAdLookup - Exact campaign path and inventory-reference query wire keys.
 * @returns Explicit completion containing eBay's unchanged ads document.
 * @example `await getAdsByInventoryReference(sellerSession, { campaign_id: 'C1', inventory_reference_id: 'SKU-1', inventory_reference_type: 'INVENTORY_ITEM' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/ad/methods/getAdsByInventoryReference
 */
export const getAdsByInventoryReference = (
  sellerSession: EbaySellerSession,
  inventoryAdLookup: GetAdsByInventoryReferenceArguments,
): Promise<EbayRequestCompletion<Ads>> => {
  const { campaign_id: campaignId, ...inventorySearch } = inventoryAdLookup;
  return sellerSession.get<Ads>({
    endpoint: `${campaignEndpoint(campaignId)}/get_ads_by_inventory_reference`,
    searchParameters: inventorySearch,
  });
};

/**
 * Updates the bid percentage for one ad.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param bidUpdate - Exact campaign and ad path with direct bid document.
 * @returns Explicit completion after eBay updates the bid.
 * @example `await updateBid(sellerSession, { campaign_id: 'C1', ad_id: 'A1', bidPercentage: '7.5' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/ad/methods/updateBid
 */
export const updateBid = (
  sellerSession: EbaySellerSession,
  bidUpdate: UpdateBidArguments,
): Promise<EbayRequestCompletion<undefined>> => {
  const { ad_id: adId, campaign_id: campaignId, ...bidDocument } = bidUpdate;
  return sellerSession.post<undefined>({
    endpoint: `${adEndpoint(campaignId, adId)}/update_bid`,
    requestDocument: bidDocument,
  });
};

/** MCP definition for Marketing API bulkCreateAdsByInventoryReference. */
export const bulkCreateAdsByInventoryReferenceTool = defineTool({
  name: 'ebay_sell_marketing_bulk_create_ads_by_inventory_reference',
  namespace: 'sell.marketing',
  description: 'Create Promoted Listings ads in bulk from inventory reference IDs',
  argumentsSchema: bulkCreateAdsByInventoryReferenceArgumentsSchema,
  operationKind: 'write',
  operation: bulkCreateAdsByInventoryReference,
});

/** MCP definition for Marketing API bulkCreateAdsByListingId. */
export const bulkCreateAdsByListingIdTool = defineTool({
  name: 'ebay_sell_marketing_bulk_create_ads_by_listing_id',
  namespace: 'sell.marketing',
  description: 'Create Promoted Listings ads in bulk from listing IDs',
  argumentsSchema: bulkCreateAdsByListingIdArgumentsSchema,
  operationKind: 'write',
  operation: bulkCreateAdsByListingId,
});

/** MCP definition for Marketing API bulkDeleteAdsByInventoryReference. */
export const bulkDeleteAdsByInventoryReferenceTool = defineTool({
  name: 'ebay_sell_marketing_bulk_delete_ads_by_inventory_reference',
  namespace: 'sell.marketing',
  description: 'Delete Promoted Listings ads in bulk by inventory reference IDs',
  argumentsSchema: bulkDeleteAdsByInventoryReferenceArgumentsSchema,
  operationKind: 'write',
  operation: bulkDeleteAdsByInventoryReference,
});

/** MCP definition for Marketing API bulkDeleteAdsByListingId. */
export const bulkDeleteAdsByListingIdTool = defineTool({
  name: 'ebay_sell_marketing_bulk_delete_ads_by_listing_id',
  namespace: 'sell.marketing',
  description: 'Delete Promoted Listings ads in bulk by listing IDs',
  argumentsSchema: bulkDeleteAdsByListingIdArgumentsSchema,
  operationKind: 'write',
  operation: bulkDeleteAdsByListingId,
});

/** MCP definition for Marketing API bulkUpdateAdsBidByInventoryReference. */
export const bulkUpdateAdsBidByInventoryReferenceTool = defineTool({
  name: 'ebay_sell_marketing_bulk_update_ads_bid_by_inventory_reference',
  namespace: 'sell.marketing',
  description: 'Update Promoted Listings ad bids in bulk by inventory reference IDs',
  argumentsSchema: bulkUpdateAdsBidByInventoryReferenceArgumentsSchema,
  operationKind: 'write',
  operation: bulkUpdateAdsBidByInventoryReference,
});

/** MCP definition for Marketing API bulkUpdateAdsBidByListingId. */
export const bulkUpdateAdsBidByListingIdTool = defineTool({
  name: 'ebay_sell_marketing_bulk_update_ads_bid_by_listing_id',
  namespace: 'sell.marketing',
  description: 'Update Promoted Listings ad bids in bulk by listing IDs',
  argumentsSchema: bulkUpdateAdsBidByListingIdArgumentsSchema,
  operationKind: 'write',
  operation: bulkUpdateAdsBidByListingId,
});

/** MCP definition for Marketing API bulkUpdateAdsStatus. */
export const bulkUpdateAdsStatusTool = defineTool({
  name: 'ebay_sell_marketing_bulk_update_ads_status',
  namespace: 'sell.marketing',
  description: 'Update Promoted Listings ad statuses in bulk by ad IDs',
  argumentsSchema: bulkUpdateAdsStatusArgumentsSchema,
  operationKind: 'write',
  operation: bulkUpdateAdsStatus,
});

/** MCP definition for Marketing API bulkUpdateAdsStatusByListingId. */
export const bulkUpdateAdsStatusByListingIdTool = defineTool({
  name: 'ebay_sell_marketing_bulk_update_ads_status_by_listing_id',
  namespace: 'sell.marketing',
  description: 'Update Promoted Listings ad statuses in bulk by listing IDs',
  argumentsSchema: bulkUpdateAdsStatusByListingIdArgumentsSchema,
  operationKind: 'write',
  operation: bulkUpdateAdsStatusByListingId,
});

/** MCP definition for Marketing API getAds. */
export const getAdsTool = defineTool({
  name: 'ebay_sell_marketing_get_ads',
  namespace: 'sell.marketing',
  description: 'Retrieve Promoted Listings ads for one campaign with exact eBay filters',
  argumentsSchema: getAdsArgumentsSchema,
  operationKind: 'read',
  operation: getAds,
});

/** MCP definition for Marketing API createAdByListingId. */
export const createAdByListingIdTool = defineTool({
  name: 'ebay_sell_marketing_create_ad_by_listing_id',
  namespace: 'sell.marketing',
  description: 'Create one Promoted Listings ad from a listing ID',
  argumentsSchema: createAdByListingIdArgumentsSchema,
  operationKind: 'write',
  operation: createAdByListingId,
});

/** MCP definition for Marketing API createAdsByInventoryReference. */
export const createAdsByInventoryReferenceTool = defineTool({
  name: 'ebay_sell_marketing_create_ads_by_inventory_reference',
  namespace: 'sell.marketing',
  description: 'Create Promoted Listings ads from one inventory reference',
  argumentsSchema: createAdsByInventoryReferenceArgumentsSchema,
  operationKind: 'write',
  operation: createAdsByInventoryReference,
});

/** MCP definition for Marketing API getAd. */
export const getAdTool = defineTool({
  name: 'ebay_sell_marketing_get_ad',
  namespace: 'sell.marketing',
  description: 'Retrieve one Promoted Listings ad by campaign and ad identifiers',
  argumentsSchema: adPathArgumentsSchema,
  operationKind: 'read',
  operation: getAd,
});

/** MCP definition for Marketing API deleteAd. */
export const deleteAdTool = defineTool({
  name: 'ebay_sell_marketing_delete_ad',
  namespace: 'sell.marketing',
  description: 'Delete one Promoted Listings ad by campaign and ad identifiers',
  argumentsSchema: adPathArgumentsSchema,
  operationKind: 'write',
  operation: deleteAd,
});

/** MCP definition for Marketing API deleteAdsByInventoryReference. */
export const deleteAdsByInventoryReferenceTool = defineTool({
  name: 'ebay_sell_marketing_delete_ads_by_inventory_reference',
  namespace: 'sell.marketing',
  description: 'Delete Promoted Listings ads for one inventory reference',
  argumentsSchema: deleteAdsByInventoryReferenceArgumentsSchema,
  operationKind: 'write',
  operation: deleteAdsByInventoryReference,
});

/** MCP definition for Marketing API getAdsByInventoryReference. */
export const getAdsByInventoryReferenceTool = defineTool({
  name: 'ebay_sell_marketing_get_ads_by_inventory_reference',
  namespace: 'sell.marketing',
  description: 'Retrieve Promoted Listings ads for one inventory reference',
  argumentsSchema: getAdsByInventoryReferenceArgumentsSchema,
  operationKind: 'read',
  operation: getAdsByInventoryReference,
});

/** MCP definition for Marketing API updateBid. */
export const updateBidTool = defineTool({
  name: 'ebay_sell_marketing_update_bid',
  namespace: 'sell.marketing',
  description: 'Update the bid percentage for one Promoted Listings ad',
  argumentsSchema: updateBidArgumentsSchema,
  operationKind: 'write',
  operation: updateBid,
});
