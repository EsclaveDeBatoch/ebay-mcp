import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/analytics-and-report/sellAnalyticsV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';
import { sellerStandardsProfileCard } from '@/ui/presentation/sellerStandardsProfile.js';

/** Strict empty argument contract for listing every seller standards profile. */
export const findSellerStandardsProfilesArgumentsSchema = z.object({}).strict();

/** Exact eBay path accepted by Sell Analytics getSellerStandardsProfile. */
export const sellerStandardsProfilePathSchema = z
  .object({
    program: z.enum(['PROGRAM_DE', 'PROGRAM_UK', 'PROGRAM_US', 'PROGRAM_GLOBAL']),
    cycle: z.enum(['CURRENT', 'PROJECTED']),
  })
  .strict();

/** Validated eBay seller standards profile path. */
export type SellerStandardsProfilePath = z.infer<typeof sellerStandardsProfilePathSchema>;

/**
 * Seller standards profile collection generated from eBay's official Sell Analytics specification.
 *
 * @see https://developer.ebay.com/api-docs/sell/analytics/resources/seller_standards_profile/methods/findSellerStandardsProfiles
 */
export type SellerStandardsProfiles = components['schemas']['FindSellerStandardsProfilesResponse'];

/**
 * Seller standards profile generated from eBay's official Sell Analytics specification.
 *
 * @see https://developer.ebay.com/api-docs/sell/analytics/resources/seller_standards_profile/methods/getSellerStandardsProfile
 */
export type SellerStandardsProfile = components['schemas']['StandardsProfile'];

/**
 * Retrieves every seller standards profile available to the authenticated seller.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 *
 * @example
 * ```ts
 * const completion = await findSellerStandardsProfiles(sellerSession);
 * ```
 *
 * @see https://developer.ebay.com/api-docs/sell/analytics/resources/seller_standards_profile/methods/findSellerStandardsProfiles
 */
export const findSellerStandardsProfiles = async (
  sellerSession: EbaySellerSession,
): Promise<EbayRequestCompletion<SellerStandardsProfiles>> =>
  sellerSession.get<SellerStandardsProfiles>({
    endpoint: '/sell/analytics/v1/seller_standards_profile',
  });

/**
 * Retrieves one seller standards profile for an official program and evaluation cycle.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param sellerStandardsProfilePath - Exact eBay program and cycle path fields.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 *
 * @example
 * ```ts
 * const completion = await getSellerStandardsProfile(sellerSession, {
 *   program: 'PROGRAM_US',
 *   cycle: 'CURRENT',
 * });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/sell/analytics/resources/seller_standards_profile/methods/getSellerStandardsProfile
 */
export const getSellerStandardsProfile = async (
  sellerSession: EbaySellerSession,
  sellerStandardsProfilePath: SellerStandardsProfilePath,
): Promise<EbayRequestCompletion<SellerStandardsProfile>> =>
  sellerSession.get<SellerStandardsProfile>({
    endpoint: `/sell/analytics/v1/seller_standards_profile/${sellerStandardsProfilePath.program}/${sellerStandardsProfilePath.cycle}`,
  });

/** MCP definition for listing every Sell Analytics seller standards profile. */
export const findSellerStandardsProfilesTool = defineTool({
  name: 'ebay_sell_analytics_find_seller_standards_profiles',
  namespace: 'sell.analytics',
  description: 'Find every seller standards profile',
  argumentsSchema: findSellerStandardsProfilesArgumentsSchema,
  operation: findSellerStandardsProfiles,
});

/** MCP definition for retrieving one Sell Analytics seller standards profile. */
export const getSellerStandardsProfileTool = defineTool({
  name: 'ebay_sell_analytics_get_seller_standards_profile',
  namespace: 'sell.analytics',
  description: 'Get one seller standards profile',
  argumentsSchema: sellerStandardsProfilePathSchema,
  operation: getSellerStandardsProfile,
  presentation: {
    archetype: 'card',
    project: sellerStandardsProfileCard,
  },
});
