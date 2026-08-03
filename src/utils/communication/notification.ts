import { z } from '@/utils/effectSchema.js';
import { idSchema } from '@/utils/schemaHelpers.js';

/**
 * Effect-backed schemas for Notification API input validation.
 * OpenAPI spec: specs/ebay/sell-apps/communication/commerce_notification_v1_oas3.json
 */

/** Optional positive page size accepted by Notification list endpoints. */
const limitSchema = z
  .number({
    invalid_type_error: 'limit must be a number',
    description: 'Maximum number of items to return per page (10-100)',
  })
  .positive('limit must be a positive number')
  .optional();

/** Optional continuation cursor accepted by Notification list endpoints. */
const continuationTokenSchema = z
  .string({
    message: 'Continuation token must be a string',
    invalid_type_error: 'continuationToken must be a string',
    description: 'Token for pagination',
  })
  .optional();

/** Schema for getTopic input. */
export const getTopicSchema = z.object({
  topicId: idSchema('Topic ID', 'The unique identifier for the topic'),
});

/** Schema for getTopics input. */
export const getTopicsSchema = z.object({
  limit: limitSchema,
  continuationToken: continuationTokenSchema,
});
