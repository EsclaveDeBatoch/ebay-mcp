import { defineTool } from '@/tools/defineTool.js';
import type { ToolEntry } from '@/tools/registry.js';
import { Effect } from 'effect';
import {
  createSubscriptionFilterSchema,
  deleteSubscriptionFilterSchema,
  getSubscriptionFilterSchema,
  getTopicSchema,
  getTopicsSchema,
} from '@/utils/communication/notification.js';

/**
 * Commerce Notification tools.
 *
 * Each tool derives its transport schema from the same Effect-backed object whose inferred
 * args are passed directly to the endpoint method. Handlers stay at the MCP
 * boundary: they run one endpoint Effect and avoid response or input reshaping.
 */
export const communicationEntries: ToolEntry[] = [
  // Notification API - Subscription Filters
  defineTool({
    name: 'ebay_create_notification_subscription_filter',
    description: 'Create a filter for a notification subscription',
    inputSchema: createSubscriptionFilterSchema.shape,
    handler: (api, args) => Effect.runPromise(api.notification.createSubscriptionFilter(args)),
  }),
  defineTool({
    name: 'ebay_get_notification_subscription_filter',
    description: 'Get a specific subscription filter',
    inputSchema: getSubscriptionFilterSchema.shape,
    handler: (api, args) => Effect.runPromise(api.notification.getSubscriptionFilter(args)),
  }),
  defineTool({
    name: 'ebay_delete_notification_subscription_filter',
    description: 'Delete a subscription filter',
    inputSchema: deleteSubscriptionFilterSchema.shape,
    handler: (api, args) => Effect.runPromise(api.notification.deleteSubscriptionFilter(args)),
  }),
  // Notification API - Topics
  defineTool({
    name: 'ebay_get_notification_topic',
    description: 'Get a specific notification topic by ID',
    inputSchema: getTopicSchema.shape,
    handler: (api, args) => Effect.runPromise(api.notification.getTopic(args)),
  }),
  defineTool({
    name: 'ebay_get_notification_topics',
    description: 'Get all available notification topics (paginated)',
    inputSchema: getTopicsSchema.shape,
    handler: (api, args) => Effect.runPromise(api.notification.getTopics(args)),
  }),
];
