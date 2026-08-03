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
