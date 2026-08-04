import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type {
  components,
  operations,
} from '@/generated/ebay/sell-apps/communication/commerceNotificationV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';

/** Exact eBay path and JSON Schema fields accepted by createSubscriptionFilter. */
export const createSubscriptionFilterArgumentsSchema = z
  .object({
    subscription_id: z.string().min(1),
    filterSchema: z.record(z.string(), z.json()),
  })
  .strict();

/** Validated eBay path and document used to create a subscription filter. */
export type SubscriptionFilterSubmission = z.infer<typeof createSubscriptionFilterArgumentsSchema>;

/** Exact eBay path fields accepted by subscription-filter member operations. */
export const subscriptionFilterIdsArgumentsSchema = z
  .object({
    filter_id: z.string().min(1),
    subscription_id: z.string().min(1),
  })
  .strict();

/** Validated eBay path used to address one subscription filter. */
export type SubscriptionFilterLookupArguments = z.infer<
  typeof subscriptionFilterIdsArgumentsSchema
>;

/**
 * Subscription filter generated from the official Commerce Notification specification.
 *
 * @see https://developer.ebay.com/api-docs/commerce/notification/types/api:SubscriptionFilter
 */
export type NotificationSubscriptionFilter = components['schemas']['SubscriptionFilter'];

/** Empty generated confirmation returned after subscription-filter creation. */
export type SubscriptionFilterCreationConfirmation =
  operations['createSubscriptionFilter']['responses'][201]['content']['application/json'];

/**
 * Creates a JSON Schema filter for one notification subscription.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param subscriptionFilterSubmission - Exact eBay subscription path and filter document.
 * @returns Explicit completion containing eBay's generated empty confirmation or failure.
 *
 * @example
 * ```ts
 * const completion = await createSubscriptionFilter(sellerSession, {
 *   subscription_id: 'subscription-123',
 *   filterSchema: { type: 'object', properties: { orderId: { type: 'string' } } },
 * });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/commerce/notification/resources/subscription/methods/createSubscriptionFilter
 */
export const createSubscriptionFilter = (
  sellerSession: EbaySellerSession,
  subscriptionFilterSubmission: SubscriptionFilterSubmission,
): Promise<EbayRequestCompletion<SubscriptionFilterCreationConfirmation>> => {
  const { subscription_id: subscriptionId, ...filterSubmission } = subscriptionFilterSubmission;

  return sellerSession.post<SubscriptionFilterCreationConfirmation>({
    endpoint: `/commerce/notification/v1/subscription/${encodeURIComponent(subscriptionId)}/filter`,
    requestDocument: filterSubmission,
  });
};

/**
 * Retrieves one notification subscription filter.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param subscriptionFilterLookup - Exact eBay subscription and filter path fields.
 * @returns Explicit completion containing the unchanged generated eBay filter or failure.
 *
 * @example
 * ```ts
 * const completion = await getSubscriptionFilter(sellerSession, {
 *   subscription_id: 'subscription-123',
 *   filter_id: 'filter-123',
 * });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/commerce/notification/resources/subscription/methods/getSubscriptionFilter
 */
export const getSubscriptionFilter = (
  sellerSession: EbaySellerSession,
  subscriptionFilterLookup: SubscriptionFilterLookupArguments,
): Promise<EbayRequestCompletion<NotificationSubscriptionFilter>> =>
  sellerSession.get<NotificationSubscriptionFilter>({
    endpoint: `/commerce/notification/v1/subscription/${encodeURIComponent(subscriptionFilterLookup.subscription_id)}/filter/${encodeURIComponent(subscriptionFilterLookup.filter_id)}`,
  });

/**
 * Disables the active filter on one notification subscription.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param subscriptionFilterDeletion - Exact eBay subscription and filter path fields.
 * @returns Explicit completion containing eBay's empty 204 confirmation or failure.
 *
 * @example
 * ```ts
 * const completion = await deleteSubscriptionFilter(sellerSession, {
 *   subscription_id: 'subscription-123',
 *   filter_id: 'filter-123',
 * });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/commerce/notification/resources/subscription/methods/deleteSubscriptionFilter
 */
export const deleteSubscriptionFilter = (
  sellerSession: EbaySellerSession,
  subscriptionFilterDeletion: SubscriptionFilterLookupArguments,
): Promise<EbayRequestCompletion<void>> =>
  sellerSession.delete<void>({
    endpoint: `/commerce/notification/v1/subscription/${encodeURIComponent(subscriptionFilterDeletion.subscription_id)}/filter/${encodeURIComponent(subscriptionFilterDeletion.filter_id)}`,
  });

/** MCP definition for Commerce Notification createSubscriptionFilter. */
export const createSubscriptionFilterTool = defineTool({
  name: 'ebay_commerce_notification_create_subscription_filter',
  namespace: 'commerce.notification',
  description: 'Create a JSON Schema filter for one notification subscription',
  argumentsSchema: createSubscriptionFilterArgumentsSchema,
  operationKind: 'write',
  operation: createSubscriptionFilter,
});

/** MCP definition for Commerce Notification getSubscriptionFilter. */
export const getSubscriptionFilterTool = defineTool({
  name: 'ebay_commerce_notification_get_subscription_filter',
  namespace: 'commerce.notification',
  description: 'Retrieve one notification subscription filter',
  argumentsSchema: subscriptionFilterIdsArgumentsSchema,
  operationKind: 'read',
  operation: getSubscriptionFilter,
});

/** MCP definition for Commerce Notification deleteSubscriptionFilter. */
export const deleteSubscriptionFilterTool = defineTool({
  name: 'ebay_commerce_notification_delete_subscription_filter',
  namespace: 'commerce.notification',
  description: 'Disable the active filter on one notification subscription',
  argumentsSchema: subscriptionFilterIdsArgumentsSchema,
  operationKind: 'write',
  operation: deleteSubscriptionFilter,
});
