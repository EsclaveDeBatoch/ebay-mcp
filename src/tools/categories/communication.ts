import { defineTool } from '@/tools/defineTool.js';
import type { ToolEntry } from '@/tools/registry.js';
import { Effect } from 'effect';
import {
  createSubscriptionFilterSchema,
  createSubscriptionSchema,
  deleteSubscriptionFilterSchema,
  deleteSubscriptionSchema,
  disableSubscriptionSchema,
  enableSubscriptionSchema,
  getPublicKeySchema,
  getSubscriptionFilterSchema,
  getSubscriptionSchema,
  getSubscriptionsSchema,
  getTopicSchema,
  getTopicsSchema,
  testSubscriptionSchema,
  updateSubscriptionSchema,
} from '@/utils/communication/notification.js';

/**
 * Commerce Notification tools.
 *
 * Each tool derives its transport schema from the same Effect-backed object whose inferred
 * args are passed directly to the endpoint method. Handlers stay at the MCP
 * boundary: they run one endpoint Effect and avoid response or input reshaping.
 */
export const communicationEntries: ToolEntry[] = [
  // Notification API - Subscription CRUD
  defineTool({
    name: 'ebay_get_notification_subscriptions',
    description: 'Get all notification subscriptions (paginated)',
    inputSchema: getSubscriptionsSchema.shape,
    handler: (api, args) => Effect.runPromise(api.notification.getSubscriptions(args)),
  }),
  defineTool({
    name: 'ebay_create_notification_subscription',
    description: 'Create a notification subscription',
    inputSchema: createSubscriptionSchema.shape,
    handler: (api, args) => Effect.runPromise(api.notification.createSubscription(args)),
  }),
  defineTool({
    name: 'ebay_get_notification_subscription',
    description: 'Get a specific notification subscription by ID',
    inputSchema: getSubscriptionSchema.shape,
    handler: (api, args) => Effect.runPromise(api.notification.getSubscription(args)),
  }),
  defineTool({
    name: 'ebay_update_notification_subscription',
    description: 'Update a notification subscription',
    inputSchema: updateSubscriptionSchema.shape,
    handler: (api, args) => Effect.runPromise(api.notification.updateSubscription(args)),
  }),
  defineTool({
    name: 'ebay_delete_notification_subscription',
    description: 'Delete a notification subscription',
    inputSchema: deleteSubscriptionSchema.shape,
    handler: (api, args) => Effect.runPromise(api.notification.deleteSubscription(args)),
  }),
  defineTool({
    name: 'ebay_disable_notification_subscription',
    description: 'Disable a notification subscription',
    inputSchema: disableSubscriptionSchema.shape,
    handler: (api, args) => Effect.runPromise(api.notification.disableSubscription(args)),
  }),
  defineTool({
    name: 'ebay_enable_notification_subscription',
    description: 'Enable a notification subscription',
    inputSchema: enableSubscriptionSchema.shape,
    handler: (api, args) => Effect.runPromise(api.notification.enableSubscription(args)),
  }),
  defineTool({
    name: 'ebay_test_notification_subscription',
    description: 'Test a notification subscription by sending a test message',
    inputSchema: testSubscriptionSchema.shape,
    handler: (api, args) => Effect.runPromise(api.notification.testSubscription(args)),
  }),
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
  // Notification API - Public Key
  defineTool({
    name: 'ebay_get_notification_public_key',
    description: 'Get a public key for verifying notification signatures',
    inputSchema: getPublicKeySchema.shape,
    handler: (api, args) => Effect.runPromise(api.notification.getPublicKey(args)),
  }),
];
