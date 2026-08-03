import { defineTool } from '@/tools/defineTool.js';
import type { ToolEntry } from '@/tools/registry.js';
import { Effect } from 'effect';
import { getTopicSchema, getTopicsSchema } from '@/utils/communication/notification.js';

/**
 * Commerce Notification tools.
 *
 * Each tool derives its transport schema from the same Effect-backed object whose inferred
 * args are passed directly to the endpoint method. Handlers stay at the MCP
 * boundary: they run one endpoint Effect and avoid response or input reshaping.
 */
export const communicationEntries: ToolEntry[] = [
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
