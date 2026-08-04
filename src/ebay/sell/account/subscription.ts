import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/account-management/sellAccountV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';

/** Exact optional eBay pagination query accepted by getSubscription. */
export const getSubscriptionArgumentsSchema = z
  .object({
    continuation_token: z.string().min(1).optional(),
    limit: z.string().min(1).optional(),
  })
  .strict();

/** Validated exact eBay subscription pagination query. */
export type GetSubscriptionArguments = z.infer<typeof getSubscriptionArgumentsSchema>;

/** @see https://developer.ebay.com/api-docs/sell/account/types/api:SubscriptionResponse */
export type SubscriptionCollection = components['schemas']['SubscriptionResponse'];

/**
 * Retrieves the seller's marketplace subscriptions.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param subscriptionSelection - Exact optional eBay pagination query.
 * @returns Explicit completion containing eBay's unchanged subscription collection.
 * @example `await getSubscription(sellerSession, { continuation_token: 'NEXT-1', limit: '20' })`
 * @see https://developer.ebay.com/api-docs/sell/account/resources/subscription/methods/getSubscription
 */
export const getSubscription = (
  sellerSession: EbaySellerSession,
  subscriptionSelection: GetSubscriptionArguments,
): Promise<EbayRequestCompletion<SubscriptionCollection>> => {
  const continuationToken = subscriptionSelection.continuation_token;
  const subscriptionLimit = subscriptionSelection.limit;
  if (continuationToken === undefined && subscriptionLimit === undefined) {
    return sellerSession.get<SubscriptionCollection>({
      endpoint: '/sell/account/v1/subscription',
    });
  }
  if (continuationToken === undefined) {
    return sellerSession.get<SubscriptionCollection>({
      endpoint: '/sell/account/v1/subscription',
      searchParameters: { limit: subscriptionLimit },
    });
  }
  if (subscriptionLimit === undefined) {
    return sellerSession.get<SubscriptionCollection>({
      endpoint: '/sell/account/v1/subscription',
      searchParameters: { continuation_token: continuationToken },
    });
  }
  return sellerSession.get<SubscriptionCollection>({
    endpoint: '/sell/account/v1/subscription',
    searchParameters: {
      continuation_token: continuationToken,
      limit: subscriptionLimit,
    },
  });
};

/** MCP definition for the Account API getSubscription operation. */
export const getSubscriptionTool = defineTool({
  name: 'ebay_sell_account_get_subscription',
  namespace: 'sell.account',
  description: 'Retrieve seller marketplace subscriptions with exact eBay pagination',
  argumentsSchema: getSubscriptionArgumentsSchema,
  operationKind: 'read',
  operation: getSubscription,
});
