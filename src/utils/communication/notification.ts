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

/** Subscription payload detail schema shared by subscription write tools. */
const payloadSchema = z
  .object({
    deliveryProtocol: z
      .string({
        invalid_type_error: 'deliveryProtocol must be a string',
        description: 'Delivery protocol',
      })
      .optional(),
    format: z
      .string({
        invalid_type_error: 'format must be a string',
        description: 'Payload format',
      })
      .optional(),
    schemaVersion: z
      .string({
        invalid_type_error: 'schemaVersion must be a string',
        description: 'Schema version for the notification topic',
      })
      .optional(),
  })
  .optional();

/** Schema for getPublicKey input. */
export const getPublicKeySchema = z.object({
  publicKeyId: idSchema('Public key ID', 'The unique identifier for the public key'),
});

/** Schema for getSubscriptions input. */
export const getSubscriptionsSchema = z.object({
  limit: limitSchema,
  continuationToken: continuationTokenSchema,
});

/** Schema for createSubscription input. */
export const createSubscriptionSchema = z.object({
  destinationId: z
    .string({
      invalid_type_error: 'destinationId must be a string',
      description: 'The unique identifier of the destination endpoint',
    })
    .optional(),
  payload: payloadSchema,
  status: z
    .string({
      invalid_type_error: 'status must be a string',
      description: 'Status: ENABLED or DISABLED',
    })
    .optional(),
  topicId: z
    .string({
      invalid_type_error: 'topicId must be a string',
      description: 'The unique identifier of the notification topic',
    })
    .optional(),
});

/** Schema for getSubscription input. */
export const getSubscriptionSchema = z.object({
  subscriptionId: idSchema('Subscription ID', 'The unique identifier for the subscription'),
});

/** Schema for updateSubscription input. */
export const updateSubscriptionSchema = z.object({
  subscriptionId: idSchema('Subscription ID', 'The unique identifier for the subscription'),
  destinationId: z
    .string({
      invalid_type_error: 'destinationId must be a string',
      description: 'The unique identifier of the destination',
    })
    .optional(),
  payload: payloadSchema,
  status: z
    .string({
      invalid_type_error: 'status must be a string',
      description: 'Status: ENABLED or DISABLED',
    })
    .optional(),
});

/** Schema for deleteSubscription input. */
export const deleteSubscriptionSchema = z.object({
  subscriptionId: idSchema('Subscription ID', 'The unique identifier for the subscription'),
});

/** Schema for disableSubscription input. */
export const disableSubscriptionSchema = z.object({
  subscriptionId: idSchema('Subscription ID', 'The unique identifier for the subscription'),
});

/** Schema for enableSubscription input. */
export const enableSubscriptionSchema = z.object({
  subscriptionId: idSchema('Subscription ID', 'The unique identifier for the subscription'),
});

/** Schema for testSubscription input. */
export const testSubscriptionSchema = z.object({
  subscriptionId: idSchema('Subscription ID', 'The unique identifier for the subscription'),
});

/** Schema for getTopic input. */
export const getTopicSchema = z.object({
  topicId: idSchema('Topic ID', 'The unique identifier for the topic'),
});

/** Schema for getTopics input. */
export const getTopicsSchema = z.object({
  limit: limitSchema,
  continuationToken: continuationTokenSchema,
});

/** Schema for createSubscriptionFilter input. */
export const createSubscriptionFilterSchema = z.object({
  subscriptionId: idSchema('Subscription ID', 'The unique identifier for the subscription'),
  filterSchema: z
    .record(z.string(), z.unknown())
    .optional()
    .describe('Valid JSON Schema Core document (version 2020-12 or later) to filter notifications'),
});

/** Schema for getSubscriptionFilter input. */
export const getSubscriptionFilterSchema = z.object({
  subscriptionId: idSchema('Subscription ID', 'The unique identifier for the subscription'),
  filterId: idSchema('Filter ID', 'The unique identifier for the filter'),
});

/** Schema for deleteSubscriptionFilter input. */
export const deleteSubscriptionFilterSchema = z.object({
  subscriptionId: idSchema('Subscription ID', 'The unique identifier for the subscription'),
  filterId: idSchema('Filter ID', 'The unique identifier for the filter'),
});
