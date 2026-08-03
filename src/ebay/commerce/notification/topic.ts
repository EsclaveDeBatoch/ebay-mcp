import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/communication/commerceNotificationV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';

/** Exact eBay path field accepted by getTopic. */
export const getTopicArgumentsSchema = z
  .object({
    topic_id: z.string().min(1),
  })
  .strict();

/** Validated eBay path used to retrieve one notification topic. */
export type TopicLookupArguments = z.infer<typeof getTopicArgumentsSchema>;

/** Exact eBay query fields accepted by getTopics. */
export const getTopicsArgumentsSchema = z
  .object({
    continuation_token: z.string().min(1).optional(),
    limit: z
      .string()
      .regex(/^(?:[1-9]\d|100)$/, 'limit must be an integer from 10 through 100')
      .optional(),
  })
  .strict();

/** Validated eBay query used to retrieve notification topics. */
export type TopicSearchArguments = z.infer<typeof getTopicsArgumentsSchema>;

/**
 * Notification topic generated from the official Commerce Notification specification.
 *
 * @see https://developer.ebay.com/api-docs/commerce/notification/types/api:Topic
 */
export type NotificationTopic = components['schemas']['Topic'];

/**
 * Notification topic page generated from the official Commerce Notification specification.
 *
 * @see https://developer.ebay.com/api-docs/commerce/notification/types/api:TopicSearchResponse
 */
export type NotificationTopicPage = components['schemas']['TopicSearchResponse'];

/**
 * Retrieves one notification topic.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param topicLookup - Exact eBay topic path field.
 * @returns Explicit completion containing the unchanged generated eBay topic or failure.
 *
 * @example
 * ```ts
 * const completion = await getTopic(sellerSession, {
 *   topic_id: 'MARKETPLACE_ACCOUNT_DELETION',
 * });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/commerce/notification/resources/topic/methods/getTopic
 */
export const getTopic = (
  sellerSession: EbaySellerSession,
  topicLookup: TopicLookupArguments,
): Promise<EbayRequestCompletion<NotificationTopic>> =>
  sellerSession.get<NotificationTopic>({
    endpoint: `/commerce/notification/v1/topic/${encodeURIComponent(topicLookup.topic_id)}`,
  });

/**
 * Retrieves available notification topics.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param topicSearch - Exact optional eBay pagination fields.
 * @returns Explicit completion containing the unchanged generated eBay topic page or failure.
 *
 * @example
 * ```ts
 * const completion = await getTopics(sellerSession, { limit: '20' });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/commerce/notification/resources/topic/methods/getTopics
 */
export const getTopics = (
  sellerSession: EbaySellerSession,
  topicSearch: TopicSearchArguments = {},
): Promise<EbayRequestCompletion<NotificationTopicPage>> =>
  sellerSession.get<NotificationTopicPage>({
    endpoint: '/commerce/notification/v1/topic',
    searchParameters: topicSearch,
  });

/** MCP definition for Commerce Notification getTopic. */
export const getTopicTool = defineTool({
  name: 'ebay_commerce_notification_get_topic',
  namespace: 'commerce.notification',
  description: 'Retrieve one available notification topic',
  argumentsSchema: getTopicArgumentsSchema,
  operationKind: 'read',
  operation: getTopic,
});

/** MCP definition for Commerce Notification getTopics. */
export const getTopicsTool = defineTool({
  name: 'ebay_commerce_notification_get_topics',
  namespace: 'commerce.notification',
  description: 'Retrieve available notification topics',
  argumentsSchema: getTopicsArgumentsSchema,
  operationKind: 'read',
  operation: getTopics,
});
