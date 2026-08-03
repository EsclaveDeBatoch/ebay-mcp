import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/marketing-and-promotions/sellRecommendationV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';

const recommendationPageSizeSchema = z
  .string()
  .regex(/^(?:[1-9]|[1-9]\d|[1-4]\d{2}|500)$/, 'limit must be an integer from 1 through 500');

const recommendationOffsetSchema = z
  .string()
  .regex(/^(?:0|[1-9]\d*)$/, 'offset must be a non-negative integer');

function selectedListingsDocument(
  listingIds: string[] | undefined,
): components['schemas']['FindListingRecommendationRequest'] {
  if (listingIds === undefined) {
    return {};
  }
  return { listingIds };
}

/** Exact eBay query, header, and document fields accepted by findListingRecommendations. */
export const findListingRecommendationsArgumentsSchema = z
  .object({
    filter: z.literal('recommendationTypes:{AD}').optional(),
    limit: recommendationPageSizeSchema.optional(),
    offset: recommendationOffsetSchema.optional(),
    'X-EBAY-C-MARKETPLACE-ID': z.string().min(1),
    listingIds: z.array(z.string().min(1)).min(1).max(500).optional(),
  })
  .strict();

/** Validated eBay query, header, and document fields for listing recommendations. */
export type FindListingRecommendationsArguments = z.infer<
  typeof findListingRecommendationsArgumentsSchema
>;

/**
 * Listing recommendations generated from eBay's official Sell Recommendation specification.
 *
 * @see https://developer.ebay.com/api-docs/sell/recommendation/resources/find/methods/findListingRecommendations
 */
export type ListingRecommendations = components['schemas']['PagedListingRecommendationCollection'];

/**
 * Finds Promoted Listings recommendations for active listings in one marketplace.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param recommendationArguments - Exact eBay query, header, and document fields.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 *
 * @example
 * ```ts
 * const completion = await findListingRecommendations(sellerSession, {
 *   filter: 'recommendationTypes:{AD}',
 *   limit: '25',
 *   'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
 *   listingIds: ['110000000000'],
 * });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/sell/recommendation/resources/find/methods/findListingRecommendations
 */
export const findListingRecommendations = async (
  sellerSession: EbaySellerSession,
  recommendationArguments: FindListingRecommendationsArguments,
): Promise<EbayRequestCompletion<ListingRecommendations>> =>
  sellerSession.post<ListingRecommendations>({
    endpoint: '/sell/recommendation/v1/find',
    searchParameters: {
      filter: recommendationArguments.filter,
      limit: recommendationArguments.limit,
      offset: recommendationArguments.offset,
    },
    requestHeaders: {
      'X-EBAY-C-MARKETPLACE-ID': recommendationArguments['X-EBAY-C-MARKETPLACE-ID'],
    },
    requestDocument: selectedListingsDocument(recommendationArguments.listingIds),
  });

/** MCP definition for the Sell Recommendation listing-recommendations operation. */
export const findListingRecommendationsTool = defineTool({
  name: 'ebay_sell_recommendation_find_listing_recommendations',
  namespace: 'sell.recommendation',
  description: 'Find Promoted Listings recommendations for active eBay listings',
  argumentsSchema: findListingRecommendationsArgumentsSchema,
  operation: findListingRecommendations,
});
