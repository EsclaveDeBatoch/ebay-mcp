import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type {
  components,
  operations,
} from '@/generated/ebay/sell-apps/communication/commerceNotificationV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';

const subscriptionPayloadSchema = z
  .object({
    deliveryProtocol: z.literal('HTTPS'),
    format: z.literal('JSON'),
    schemaVersion: z.string().min(1),
  })
  .strict();

const subscriptionSubmissionFields = {
  destinationId: z.string().min(1),
  payload: subscriptionPayloadSchema,
  status: z.enum(['ENABLED', 'DISABLED']),
} as const;

/** Exact eBay query fields accepted by getSubscriptions. */
export const getSubscriptionsArgumentsSchema = z
  .object({
    continuation_token: z.string().min(1).optional(),
    limit: z
      .string()
      .regex(/^(?:[1-9]\d|100)$/, 'limit must be an integer from 10 through 100')
      .optional(),
  })
  .strict();

/** Validated eBay query used to retrieve subscriptions. */
export type SubscriptionSearchArguments = z.infer<typeof getSubscriptionsArgumentsSchema>;

/** Exact generated eBay document accepted by createSubscription. */
export const createSubscriptionArgumentsSchema = z
  .object({
    ...subscriptionSubmissionFields,
    topicId: z.string().min(1),
  })
  .strict();

/** Validated eBay document used to create a subscription. */
export type NotificationSubscriptionSubmission = z.infer<typeof createSubscriptionArgumentsSchema>;

/** Exact eBay path field shared by subscription member and lifecycle operations. */
export const subscriptionIdArgumentsSchema = z
  .object({
    subscription_id: z.string().min(1),
  })
  .strict();

/** Validated eBay path used to address one subscription. */
export type SubscriptionLookupArguments = z.infer<typeof subscriptionIdArgumentsSchema>;

/** Exact eBay path and generated document fields accepted by updateSubscription. */
export const updateSubscriptionArgumentsSchema = z
  .object({
    subscription_id: z.string().min(1),
    ...subscriptionSubmissionFields,
  })
  .strict();

/** Validated eBay path and document used to update a subscription. */
export type NotificationSubscriptionUpdate = z.infer<typeof updateSubscriptionArgumentsSchema>;

/**
 * Subscription page generated from the official Commerce Notification specification.
 *
 * @see https://developer.ebay.com/api-docs/commerce/notification/types/api:SubscriptionSearchResponse
 */
export type SubscriptionPage = components['schemas']['SubscriptionSearchResponse'];

/**
 * Subscription generated from the official Commerce Notification specification.
 *
 * @see https://developer.ebay.com/api-docs/commerce/notification/types/api:Subscription
 */
export type NotificationSubscription = components['schemas']['Subscription'];

/** Empty generated confirmation returned after subscription creation. */
export type SubscriptionCreationConfirmation =
  operations['createSubscription']['responses'][201]['content']['application/json'];

/**
 * Retrieves configured notification subscriptions.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param subscriptionSearch - Exact eBay subscription pagination fields.
 * @returns Explicit completion containing the unchanged generated eBay page or failure.
 *
 * @example
 * ```ts
 * const completion = await getSubscriptions(sellerSession, { limit: '20' });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/commerce/notification/resources/subscription/methods/getSubscriptions
 */
export const getSubscriptions = (
  sellerSession: EbaySellerSession,
  subscriptionSearch: SubscriptionSearchArguments = {},
): Promise<EbayRequestCompletion<SubscriptionPage>> =>
  sellerSession.get<SubscriptionPage>({
    endpoint: '/commerce/notification/v1/subscription',
    searchParameters: subscriptionSearch,
  });

/**
 * Creates a notification subscription.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param subscriptionSubmission - Exact generated eBay subscription document.
 * @returns Explicit completion containing eBay's generated empty confirmation or failure.
 *
 * @example
 * ```ts
 * const completion = await createSubscription(sellerSession, {
 *   destinationId: 'destination-123',
 *   payload: { deliveryProtocol: 'HTTPS', format: 'JSON', schemaVersion: '1.0' },
 *   status: 'DISABLED',
 *   topicId: 'MARKETPLACE_ACCOUNT_DELETION',
 * });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/commerce/notification/resources/subscription/methods/createSubscription
 */
export const createSubscription = (
  sellerSession: EbaySellerSession,
  subscriptionSubmission: NotificationSubscriptionSubmission,
): Promise<EbayRequestCompletion<SubscriptionCreationConfirmation>> =>
  sellerSession.post<SubscriptionCreationConfirmation>({
    endpoint: '/commerce/notification/v1/subscription',
    requestDocument: subscriptionSubmission,
  });

/**
 * Retrieves one notification subscription.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param subscriptionLookup - Exact eBay subscription path field.
 * @returns Explicit completion containing the unchanged generated eBay subscription or failure.
 *
 * @example
 * ```ts
 * const completion = await getSubscription(sellerSession, {
 *   subscription_id: 'subscription-123',
 * });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/commerce/notification/resources/subscription/methods/getSubscription
 */
export const getSubscription = (
  sellerSession: EbaySellerSession,
  subscriptionLookup: SubscriptionLookupArguments,
): Promise<EbayRequestCompletion<NotificationSubscription>> =>
  sellerSession.get<NotificationSubscription>({
    endpoint: `/commerce/notification/v1/subscription/${encodeURIComponent(subscriptionLookup.subscription_id)}`,
  });

/**
 * Replaces one notification subscription.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param subscriptionUpdate - Exact eBay subscription path and document fields.
 * @returns Explicit completion containing eBay's empty 204 confirmation or failure.
 *
 * @example
 * ```ts
 * const completion = await updateSubscription(sellerSession, {
 *   subscription_id: 'subscription-123',
 *   destinationId: 'destination-456',
 *   payload: { deliveryProtocol: 'HTTPS', format: 'JSON', schemaVersion: '1.0' },
 *   status: 'ENABLED',
 * });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/commerce/notification/resources/subscription/methods/updateSubscription
 */
export const updateSubscription = (
  sellerSession: EbaySellerSession,
  subscriptionUpdate: NotificationSubscriptionUpdate,
): Promise<EbayRequestCompletion<void>> => {
  const { subscription_id: subscriptionId, ...subscriptionSubmission } = subscriptionUpdate;

  return sellerSession.put<void>({
    endpoint: `/commerce/notification/v1/subscription/${encodeURIComponent(subscriptionId)}`,
    requestDocument: subscriptionSubmission,
  });
};

/**
 * Deletes one notification subscription.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param subscriptionDeletion - Exact eBay subscription path field.
 * @returns Explicit completion containing eBay's empty 204 confirmation or failure.
 *
 * @example
 * ```ts
 * const completion = await deleteSubscription(sellerSession, {
 *   subscription_id: 'subscription-123',
 * });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/commerce/notification/resources/subscription/methods/deleteSubscription
 */
export const deleteSubscription = (
  sellerSession: EbaySellerSession,
  subscriptionDeletion: SubscriptionLookupArguments,
): Promise<EbayRequestCompletion<void>> =>
  sellerSession.delete<void>({
    endpoint: `/commerce/notification/v1/subscription/${encodeURIComponent(subscriptionDeletion.subscription_id)}`,
  });

/**
 * Pauses one notification subscription.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param subscriptionDisablement - Exact eBay subscription path field.
 * @returns Explicit completion containing eBay's empty 204 confirmation or failure.
 *
 * @example
 * ```ts
 * const completion = await disableSubscription(sellerSession, {
 *   subscription_id: 'subscription-123',
 * });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/commerce/notification/resources/subscription/methods/disableSubscription
 */
export const disableSubscription = (
  sellerSession: EbaySellerSession,
  subscriptionDisablement: SubscriptionLookupArguments,
): Promise<EbayRequestCompletion<void>> =>
  sellerSession.post<void>({
    endpoint: `/commerce/notification/v1/subscription/${encodeURIComponent(subscriptionDisablement.subscription_id)}/disable`,
  });

/**
 * Resumes one notification subscription.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param subscriptionEnablement - Exact eBay subscription path field.
 * @returns Explicit completion containing eBay's empty 204 confirmation or failure.
 *
 * @example
 * ```ts
 * const completion = await enableSubscription(sellerSession, {
 *   subscription_id: 'subscription-123',
 * });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/commerce/notification/resources/subscription/methods/enableSubscription
 */
export const enableSubscription = (
  sellerSession: EbaySellerSession,
  subscriptionEnablement: SubscriptionLookupArguments,
): Promise<EbayRequestCompletion<void>> =>
  sellerSession.post<void>({
    endpoint: `/commerce/notification/v1/subscription/${encodeURIComponent(subscriptionEnablement.subscription_id)}/enable`,
  });

/**
 * Sends a test notification through one subscription.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param subscriptionTest - Exact eBay subscription path field.
 * @returns Explicit completion containing eBay's empty 204 confirmation or failure.
 *
 * @example
 * ```ts
 * const completion = await testSubscription(sellerSession, {
 *   subscription_id: 'subscription-123',
 * });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/commerce/notification/resources/subscription/methods/testSubscription
 */
export const testSubscription = (
  sellerSession: EbaySellerSession,
  subscriptionTest: SubscriptionLookupArguments,
): Promise<EbayRequestCompletion<void>> =>
  sellerSession.post<void>({
    endpoint: `/commerce/notification/v1/subscription/${encodeURIComponent(subscriptionTest.subscription_id)}/test`,
  });

/** MCP definition for Commerce Notification getSubscriptions. */
export const getSubscriptionsTool = defineTool({
  name: 'ebay_commerce_notification_get_subscriptions',
  namespace: 'commerce.notification',
  description: 'Retrieve configured notification subscriptions',
  argumentsSchema: getSubscriptionsArgumentsSchema,
  operationKind: 'read',
  operation: getSubscriptions,
});

/** MCP definition for Commerce Notification createSubscription. */
export const createSubscriptionTool = defineTool({
  name: 'ebay_commerce_notification_create_subscription',
  namespace: 'commerce.notification',
  description: 'Create a notification subscription',
  argumentsSchema: createSubscriptionArgumentsSchema,
  operationKind: 'write',
  operation: createSubscription,
});

/** MCP definition for Commerce Notification getSubscription. */
export const getSubscriptionTool = defineTool({
  name: 'ebay_commerce_notification_get_subscription',
  namespace: 'commerce.notification',
  description: 'Retrieve one notification subscription',
  argumentsSchema: subscriptionIdArgumentsSchema,
  operationKind: 'read',
  operation: getSubscription,
});

/** MCP definition for Commerce Notification updateSubscription. */
export const updateSubscriptionTool = defineTool({
  name: 'ebay_commerce_notification_update_subscription',
  namespace: 'commerce.notification',
  description: 'Replace one notification subscription',
  argumentsSchema: updateSubscriptionArgumentsSchema,
  operationKind: 'write',
  operation: updateSubscription,
});

/** MCP definition for Commerce Notification deleteSubscription. */
export const deleteSubscriptionTool = defineTool({
  name: 'ebay_commerce_notification_delete_subscription',
  namespace: 'commerce.notification',
  description: 'Delete one notification subscription',
  argumentsSchema: subscriptionIdArgumentsSchema,
  operationKind: 'write',
  operation: deleteSubscription,
});

/** MCP definition for Commerce Notification disableSubscription. */
export const disableSubscriptionTool = defineTool({
  name: 'ebay_commerce_notification_disable_subscription',
  namespace: 'commerce.notification',
  description: 'Pause one notification subscription',
  argumentsSchema: subscriptionIdArgumentsSchema,
  operationKind: 'write',
  operation: disableSubscription,
});

/** MCP definition for Commerce Notification enableSubscription. */
export const enableSubscriptionTool = defineTool({
  name: 'ebay_commerce_notification_enable_subscription',
  namespace: 'commerce.notification',
  description: 'Resume one notification subscription',
  argumentsSchema: subscriptionIdArgumentsSchema,
  operationKind: 'write',
  operation: enableSubscription,
});

/** MCP definition for Commerce Notification testSubscription. */
export const testSubscriptionTool = defineTool({
  name: 'ebay_commerce_notification_test_subscription',
  namespace: 'commerce.notification',
  description: 'Send a test notification through one subscription',
  argumentsSchema: subscriptionIdArgumentsSchema,
  operationKind: 'write',
  operation: testSubscription,
});
