import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/marketing-and-promotions/sellMarketingV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';

const promotionIdSchema = z.string().min(1);
const marketplaceIdSchema = z.string().min(1);
const pageSizeSchema = z.string().regex(/^[1-9]\d*$/, 'limit must be a positive integer string');
const pageOffsetSchema = z
  .string()
  .regex(/^(?:0|[1-9]\d*)$/, 'offset must be a non-negative integer string');

/** Exact eBay path and query fields accepted by getListingSet. */
export const getListingSetArgumentsSchema = z
  .object({
    limit: pageSizeSchema.optional(),
    offset: pageOffsetSchema.optional(),
    promotion_id: promotionIdSchema,
    q: z.string().min(1).optional(),
    sort: z.string().min(1).optional(),
    status: z.string().min(1).optional(),
  })
  .strict();

/** Exact eBay query fields accepted by getPromotions, including underscore wire keys. */
export const getPromotionsArgumentsSchema = z
  .object({
    limit: pageSizeSchema.optional(),
    marketplace_id: marketplaceIdSchema,
    offset: pageOffsetSchema.optional(),
    promotion_status: z.string().min(1).optional(),
    promotion_type: z.string().min(1).optional(),
    q: z.string().min(1).optional(),
    sort: z.string().min(1).optional(),
  })
  .strict();

/** Exact eBay path accepted by pausePromotion and resumePromotion. */
export const promotionIdArgumentsSchema = z
  .object({
    promotion_id: promotionIdSchema,
  })
  .strict();

/** Validated path and query for getListingSet. */
export type GetListingSetArguments = z.infer<typeof getListingSetArgumentsSchema>;

/** Validated exact eBay query for getPromotions. */
export type GetPromotionsArguments = z.infer<typeof getPromotionsArgumentsSchema>;

/** Validated exact promotion path. */
export type PromotionIdArguments = z.infer<typeof promotionIdArgumentsSchema>;

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/sme:ItemsPagedCollection */
export type ListingSet = components['schemas']['ItemsPagedCollection'];

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/sme:PromotionsPagedCollection */
export type PromotionsPage = components['schemas']['PromotionsPagedCollection'];

const promotionEndpoint = (promotionId: string): string =>
  `/sell/marketing/v1/promotion/${encodeURIComponent(promotionId)}`;

/**
 * Retrieves the listing set included in one discount.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param listingSetSelection - Exact eBay promotion_id path and listing-set query fields.
 * @returns Explicit completion containing eBay's unchanged listing-set collection.
 * @example `await getListingSet(sellerSession, { promotion_id: 'PROMO-1', limit: '25', offset: '0' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/promotion/methods/getListingSet
 */
export const getListingSet = (
  sellerSession: EbaySellerSession,
  listingSetSelection: GetListingSetArguments,
): Promise<EbayRequestCompletion<ListingSet>> => {
  const { promotion_id: promotionId, ...listingSetQuery } = listingSetSelection;
  return sellerSession.get<ListingSet>({
    endpoint: `${promotionEndpoint(promotionId)}/get_listing_set`,
    searchParameters: listingSetQuery,
  });
};

/**
 * Retrieves seller discounts with exact eBay query filters and pagination.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param promotionsPage - Exact eBay query fields, including marketplace_id.
 * @returns Explicit completion containing eBay's unchanged promotions collection.
 * @example `await getPromotions(sellerSession, { marketplace_id: 'EBAY_US', limit: '25' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/promotion/methods/getPromotions
 */
export const getPromotions = (
  sellerSession: EbaySellerSession,
  promotionsPage: GetPromotionsArguments,
): Promise<EbayRequestCompletion<PromotionsPage>> =>
  sellerSession.get<PromotionsPage>({
    endpoint: '/sell/marketing/v1/promotion',
    searchParameters: promotionsPage,
  });

/**
 * Pauses one running discount.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param promotionSelection - Exact eBay promotion_id path.
 * @returns Explicit completion after eBay pauses the discount.
 * @example `await pausePromotion(sellerSession, { promotion_id: 'PROMO-1@EBAY_US' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/promotion/methods/pausePromotion
 */
export const pausePromotion = (
  sellerSession: EbaySellerSession,
  promotionSelection: PromotionIdArguments,
): Promise<EbayRequestCompletion<undefined>> =>
  sellerSession.post<undefined>({
    endpoint: `${promotionEndpoint(promotionSelection.promotion_id)}/pause`,
  });

/**
 * Resumes one paused discount.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param promotionSelection - Exact eBay promotion_id path.
 * @returns Explicit completion after eBay resumes the discount.
 * @example `await resumePromotion(sellerSession, { promotion_id: 'PROMO-1@EBAY_US' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/promotion/methods/resumePromotion
 */
export const resumePromotion = (
  sellerSession: EbaySellerSession,
  promotionSelection: PromotionIdArguments,
): Promise<EbayRequestCompletion<undefined>> =>
  sellerSession.post<undefined>({
    endpoint: `${promotionEndpoint(promotionSelection.promotion_id)}/resume`,
  });

/** MCP definition for Sell Marketing getListingSet. */
export const getListingSetTool = defineTool({
  name: 'ebay_sell_marketing_get_listing_set',
  namespace: 'sell.marketing',
  description: "Retrieve the listings included in one of the seller's discounts",
  argumentsSchema: getListingSetArgumentsSchema,
  operationKind: 'read',
  operation: getListingSet,
});

/** MCP definition for Sell Marketing getPromotions. */
export const getPromotionsTool = defineTool({
  name: 'ebay_sell_marketing_get_promotions',
  namespace: 'sell.marketing',
  description: "Retrieve the seller's discounts with exact eBay marketplace and status filters",
  argumentsSchema: getPromotionsArgumentsSchema,
  operationKind: 'read',
  operation: getPromotions,
});

/** MCP definition for Sell Marketing pausePromotion. */
export const pausePromotionTool = defineTool({
  name: 'ebay_sell_marketing_pause_promotion',
  namespace: 'sell.marketing',
  description: 'Pause one running discount by its exact eBay promotion_id',
  argumentsSchema: promotionIdArgumentsSchema,
  operationKind: 'write',
  operation: pausePromotion,
});

/** MCP definition for Sell Marketing resumePromotion. */
export const resumePromotionTool = defineTool({
  name: 'ebay_sell_marketing_resume_promotion',
  namespace: 'sell.marketing',
  description: 'Resume one paused discount by its exact eBay promotion_id',
  argumentsSchema: promotionIdArgumentsSchema,
  operationKind: 'write',
  operation: resumePromotion,
});
