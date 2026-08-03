import { z } from '@/utils/effectSchema.js';

/**
 * Effect-backed schemas for Message API input validation.
 * OpenAPI spec: specs/ebay/sell-apps/communication/commerce_message_v1_oas3.json
 */

/** Schema for bulkUpdateConversation input. */
export const bulkUpdateConversationSchema = z.object({
  conversations: z
    .array(
      z.object({
        conversationId: z
          .string({
            invalid_type_error: 'conversationId must be a string',
            description: 'The unique identifier of the conversation',
          })
          .optional(),
        conversationStatus: z
          .string({
            invalid_type_error: 'conversationStatus must be a string',
            description: 'The updated status: ACTIVE, ARCHIVE, DELETE, READ, UNREAD',
          })
          .optional(),
        conversationType: z
          .string({
            invalid_type_error: 'conversationType must be a string',
            description:
              'The existing type: FROM_MEMBERS or FROM_EBAY (required but cannot be updated)',
          })
          .optional(),
      }),
      {
        invalid_type_error: 'conversations must be an array',
        description: 'Array of conversations to update',
      },
    )
    .optional(),
});

/** Schema for sendMessage input. */
export const sendMessageSchema = z.object({
  conversationId: z
    .string({
      invalid_type_error: 'conversationId must be a string',
      description: 'ID of existing conversation (required if sending in existing conversation)',
    })
    .optional(),
  emailCopyToSender: z
    .boolean({
      invalid_type_error: 'emailCopyToSender must be a boolean',
      description: 'Whether to email a copy to the sender',
    })
    .optional(),
  messageMedia: z
    .array(
      z.object({
        mediaName: z
          .string({
            invalid_type_error: 'mediaName must be a string',
            description: 'Name of the media',
          })
          .optional(),
        mediaType: z
          .string({
            invalid_type_error: 'mediaType must be a string',
            description: 'Type of media: IMAGE, PDF, DOC, TXT',
          })
          .optional(),
        mediaUrl: z
          .string({
            invalid_type_error: 'mediaUrl must be a string',
            description: 'HTTPS URL of the self-hosted media',
          })
          .optional(),
      }),
      {
        invalid_type_error: 'messageMedia must be an array',
        description: 'Array of up to 5 media attachments',
      },
    )
    .max(5, 'Maximum 5 media attachments allowed')
    .optional(),
  messageText: z
    .string({
      invalid_type_error: 'messageText must be a string',
      description: 'The text of the message (max 2000 characters)',
    })
    .max(2000, 'messageText must be 2000 characters or less')
    .optional(),
  otherPartyUsername: z
    .string({
      invalid_type_error: 'otherPartyUsername must be a string',
      description: 'eBay username to send message to (required for new conversations)',
    })
    .optional(),
  reference: z
    .object(
      {
        referenceId: z
          .string({
            invalid_type_error: 'referenceId must be a string',
            description: 'The reference ID (e.g., item ID for LISTING)',
          })
          .optional(),
        referenceType: z
          .string({
            invalid_type_error: 'referenceType must be a string',
            description: 'The reference type (currently only LISTING is supported)',
          })
          .optional(),
      },
      {
        invalid_type_error: 'reference must be an object',
        description: 'Reference to associate with the conversation',
      },
    )
    .optional(),
});

/** Schema for updateConversation input. */
export const updateConversationSchema = z.object({
  conversationId: z
    .string({
      invalid_type_error: 'conversationId must be a string',
      description: 'The unique identifier of the conversation',
    })
    .optional(),
  conversationStatus: z
    .string({
      invalid_type_error: 'conversationStatus must be a string',
      description: 'The updated status: ACTIVE, ARCHIVE, DELETE',
    })
    .optional(),
  conversationType: z
    .string({
      invalid_type_error: 'conversationType must be a string',
      description: 'The existing type: FROM_MEMBERS or FROM_EBAY (required but cannot be updated)',
    })
    .optional(),
  read: z
    .boolean({
      invalid_type_error: 'read must be a boolean',
      description: 'The read status to set (true = read, false = unread)',
    })
    .optional(),
});
