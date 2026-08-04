import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/application-settings/developerAnalyticsV1BetaOas3.js';
import { defineTool } from '@/mcp/defineTool.js';
import { applicationRateLimitsStat, userRateLimitsStat } from '@/ui/presentation/rateLimits.js';

/** Exact optional eBay query fields accepted by both Developer Analytics rate-limit operations. */
export const getRateLimitsArgumentsSchema = z
  .object({
    api_context: z.string().min(1).optional(),
    api_name: z.string().min(1).optional(),
  })
  .strict();

/** Validated eBay filters used to retrieve rate-limit utilization. */
export type RateLimitSearchArguments = z.infer<typeof getRateLimitsArgumentsSchema>;

/**
 * Rate-limit utilization generated from the official Developer Analytics specification.
 *
 * @see https://developer.ebay.com/api-docs/developer/analytics/types/RateLimitsResponse
 */
export type DeveloperRateLimits = components['schemas']['RateLimitsResponse'];

/**
 * Retrieves application rate-limit utilization across eBay APIs.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param rateLimitSearch - Exact optional eBay API context and name filters.
 * @returns Explicit completion containing unchanged generated application limits or failure.
 *
 * @example
 * ```ts
 * const completion = await getRateLimits(sellerSession, {
 *   api_context: 'sell',
 *   api_name: 'inventory',
 * });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/developer/analytics/resources/rate_limit/methods/getRateLimits
 */
export const getRateLimits = (
  sellerSession: EbaySellerSession,
  rateLimitSearch: RateLimitSearchArguments = {},
): Promise<EbayRequestCompletion<DeveloperRateLimits>> =>
  sellerSession.get<DeveloperRateLimits>({
    endpoint: '/developer/analytics/v1_beta/rate_limit/',
    searchParameters: rateLimitSearch,
  });

/**
 * Retrieves user-specific rate-limit utilization across eBay APIs.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param rateLimitSearch - Exact optional eBay API context and name filters.
 * @returns Explicit completion containing unchanged generated user limits or failure.
 *
 * @example
 * ```ts
 * const completion = await getUserRateLimits(sellerSession, { api_context: 'sell' });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/developer/analytics/resources/user_rate_limit/methods/getUserRateLimits
 */
export const getUserRateLimits = (
  sellerSession: EbaySellerSession,
  rateLimitSearch: RateLimitSearchArguments = {},
): Promise<EbayRequestCompletion<DeveloperRateLimits>> =>
  sellerSession.get<DeveloperRateLimits>({
    endpoint: '/developer/analytics/v1_beta/user_rate_limit/',
    searchParameters: rateLimitSearch,
  });

/** MCP definition for Developer Analytics getRateLimits. */
export const getRateLimitsTool = defineTool({
  name: 'ebay_developer_analytics_get_rate_limits',
  namespace: 'developer.analytics',
  description: 'Retrieve application rate-limit utilization across eBay APIs',
  argumentsSchema: getRateLimitsArgumentsSchema,
  operationKind: 'read',
  operation: getRateLimits,
  presentation: {
    archetype: 'stat',
    project: applicationRateLimitsStat,
  },
});

/** MCP definition for Developer Analytics getUserRateLimits. */
export const getUserRateLimitsTool = defineTool({
  name: 'ebay_developer_analytics_get_user_rate_limits',
  namespace: 'developer.analytics',
  description: 'Retrieve user-specific rate-limit utilization across eBay APIs',
  argumentsSchema: getRateLimitsArgumentsSchema,
  operationKind: 'read',
  operation: getUserRateLimits,
  presentation: {
    archetype: 'stat',
    project: userRateLimitsStat,
  },
});
