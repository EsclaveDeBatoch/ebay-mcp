import { z } from '@/utils/effectSchema.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { MessageReferenceType } from '@/types/ebayEnums.js';

/**
 * Communication API Schemas - Messages, Feedback, and Notifications
 *
 * This file contains Effect-backed schemas for all Communication endpoints including:
 * - Message API
 * - Feedback API
 * - Notification API
 */

// ============================================================================
// Common Schemas
// ============================================================================

const errorSchema = z.object({
  errorId: z.number().optional(),
  domain: z.string().optional(),
  category: z.string().optional(),
  message: z.string().optional(),
  longMessage: z.string().optional(),
  parameters: z
    .array(
      z.object({
        name: z.string().optional(),
        value: z.string().optional(),
      }),
    )
    .optional(),
});

// ============================================================================
// Message API Schemas
// ============================================================================

const messageReferenceSchema = z.object({
  referenceId: z.string().optional(),
  referenceType: z.nativeEnum(MessageReferenceType).optional(),
});

const messageMediaSchema = z.object({
  mediaUrl: z.string().optional(),
  mediaType: z.string().optional(),
});

/**
 * Validates the Communication API send message request payload.
 */
export const sendMessageInputSchema = z.object({
  messageText: z.string().describe('The text content of the message'),
  conversationId: z
    .string()
    .optional()
    .describe('The ID of the conversation to send the message in'),
  otherPartyUsername: z
    .string()
    .optional()
    .describe('The username of the other party (required if conversationId not provided)'),
  reference: messageReferenceSchema
    .optional()
    .describe('Reference information for the message (e.g., item or order ID)'),
  messageMedia: z
    .array(messageMediaSchema)
    .optional()
    .describe('Media attachments for the message'),
  emailCopyToSender: z.boolean().optional().describe('Whether to send an email copy to the sender'),
});

/**
 * Validates the Communication API send message response payload.
 */
export const sendMessageOutputSchema = z.object({
  messageId: z.string().optional(),
  conversationId: z.string().optional(),
  warnings: z.array(errorSchema).optional(),
});

// ============================================================================
// Notification API Schemas
// ============================================================================

const deliveryConfigSchema = z.object({
  endpoint: z.string().optional(),
  format: z.string().optional(),
});

/**
 * Validates the Communication API create notification destination request payload.
 */
export const createNotificationDestinationInputSchema = z.object({
  name: z.string().describe('The name of the notification destination'),
  endpoint: z.string().describe('The endpoint URL for notifications'),
  verificationToken: z.string().optional().describe('Verification token for the endpoint'),
});

/**
 * Validates the Communication API create notification destination response payload.
 */
export const createNotificationDestinationOutputSchema = z.object({
  destinationId: z.string().optional(),
  warnings: z.array(errorSchema).optional(),
});

/**
 * Validates the Communication API get notification destinations request payload.
 */
export const getNotificationDestinationsInputSchema = z.object({
  limit: z.number().optional().describe('Number of destinations to return'),
  continuationToken: z.string().optional().describe('Token for pagination'),
});

/**
 * Validates the Communication API get notification destinations response payload.
 */
export const getNotificationDestinationsOutputSchema = z.object({
  destinations: z
    .array(
      z.object({
        destinationId: z.string().optional(),
        name: z.string().optional(),
        endpoint: z.string().optional(),
        status: z.string().optional(),
      }),
    )
    .optional(),
  limit: z.number().optional(),
  next: z.string().optional(),
  total: z.number().optional(),
  warnings: z.array(errorSchema).optional(),
});

/**
 * Validates the Communication API create notification subscription request payload.
 */
export const createNotificationSubscriptionInputSchema = z.object({
  topicId: z.string().describe('The topic ID to subscribe to'),
  destinationId: z.string().describe('The destination ID for notifications'),
  deliveryConfig: deliveryConfigSchema.optional().describe('Delivery configuration'),
});

/**
 * Validates the Communication API create notification subscription response payload.
 */
export const createNotificationSubscriptionOutputSchema = z.object({
  subscriptionId: z.string().optional(),
  warnings: z.array(errorSchema).optional(),
});

/**
 * Validates the Communication API get notification subscriptions request payload.
 */
export const getNotificationSubscriptionsInputSchema = z.object({
  limit: z.number().optional().describe('Number of subscriptions to return'),
  continuationToken: z.string().optional().describe('Token for pagination'),
});

/**
 * Validates the Communication API get notification subscriptions response payload.
 */
export const getNotificationSubscriptionsOutputSchema = z.object({
  subscriptions: z
    .array(
      z.object({
        subscriptionId: z.string().optional(),
        topicId: z.string().optional(),
        destinationId: z.string().optional(),
        status: z.string().optional(),
        enabled: z.boolean().optional(),
      }),
    )
    .optional(),
  limit: z.number().optional(),
  next: z.string().optional(),
  total: z.number().optional(),
  warnings: z.array(errorSchema).optional(),
});

/**
 * Validates the Communication API get notification topics response payload.
 */
export const getNotificationTopicsOutputSchema = z.object({
  topics: z
    .array(
      z.object({
        topicId: z.string().optional(),
        description: z.string().optional(),
        category: z.string().optional(),
      }),
    )
    .optional(),
  warnings: z.array(errorSchema).optional(),
});

// ============================================================================
// JSON Schema Conversion Functions
// ============================================================================

/**
 * Converts Communication API Effect-backed schemas to JSON Schema format for MCP tools.
 *
 * @returns Communication API JSON schemas keyed by endpoint or shared model name.
 * @example
 * ```ts
 * const schemas = getCommunicationJsonSchemas();
 * ```
 */
export const getCommunicationJsonSchemas = () => {
  return {
    // Message API
    sendMessageInput: zodToJsonSchema(sendMessageInputSchema, 'sendMessageInput'),
    sendMessageOutput: zodToJsonSchema(sendMessageOutputSchema, 'sendMessageOutput'),

    // Notification API
    createNotificationDestinationInput: zodToJsonSchema(
      createNotificationDestinationInputSchema,
      'createNotificationDestinationInput',
    ),
    createNotificationDestinationOutput: zodToJsonSchema(
      createNotificationDestinationOutputSchema,
      'createNotificationDestinationOutput',
    ),
    getNotificationDestinationsInput: zodToJsonSchema(
      getNotificationDestinationsInputSchema,
      'getNotificationDestinationsInput',
    ),
    getNotificationDestinationsOutput: zodToJsonSchema(
      getNotificationDestinationsOutputSchema,
      'getNotificationDestinationsOutput',
    ),
    createNotificationSubscriptionInput: zodToJsonSchema(
      createNotificationSubscriptionInputSchema,
      'createNotificationSubscriptionInput',
    ),
    createNotificationSubscriptionOutput: zodToJsonSchema(
      createNotificationSubscriptionOutputSchema,
      'createNotificationSubscriptionOutput',
    ),
    getNotificationSubscriptionsInput: zodToJsonSchema(
      getNotificationSubscriptionsInputSchema,
      'getNotificationSubscriptionsInput',
    ),
    getNotificationSubscriptionsOutput: zodToJsonSchema(
      getNotificationSubscriptionsOutputSchema,
      'getNotificationSubscriptionsOutput',
    ),
    getNotificationTopicsOutput: zodToJsonSchema(
      getNotificationTopicsOutputSchema,
      'getNotificationTopicsOutput',
    ),
  };
};
