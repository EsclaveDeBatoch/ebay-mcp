import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import { defineTool } from '@/mcp/defineTool.js';

/** Exact generated eBay document accepted by updateConversation. */
export const updateConversationArgumentsSchema = z
  .object({
    conversationId: z.string().min(1),
    conversationStatus: z.enum(['ACTIVE', 'ARCHIVE', 'DELETE']).optional(),
    conversationType: z.enum(['FROM_MEMBERS', 'FROM_EBAY']),
    read: z.boolean().optional(),
  })
  .strict()
  .superRefine((conversationUpdate, validation) => {
    const statusChangeSelected = conversationUpdate.conversationStatus !== undefined;
    const readChangeSelected = conversationUpdate.read !== undefined;

    if (statusChangeSelected === readChangeSelected) {
      validation.addIssue({
        code: 'custom',
        message: 'Provide exactly one of conversationStatus or read',
        path: ['conversationStatus'],
      });
    }
  });

/** Validated eBay document used to update one conversation. */
export type ConversationUpdateArguments = z.infer<typeof updateConversationArgumentsSchema>;

/**
 * Updates either the conversation status or its read state.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param conversationUpdate - Exact eBay conversation update document.
 * @returns Explicit completion containing eBay's empty 204 confirmation or failure.
 *
 * @example
 * ```ts
 * const completion = await updateConversation(sellerSession, {
 *   conversationId: 'conversation-123',
 *   conversationStatus: 'ARCHIVE',
 *   conversationType: 'FROM_MEMBERS',
 * });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/commerce/message/resources/update_conversation/methods/updateConversation
 */
export const updateConversation = (
  sellerSession: EbaySellerSession,
  conversationUpdate: ConversationUpdateArguments,
): Promise<EbayRequestCompletion<void>> =>
  sellerSession.post<void>({
    endpoint: '/commerce/message/v1/update_conversation',
    requestDocument: conversationUpdate,
  });

/** MCP definition for Commerce Message updateConversation. */
export const updateConversationTool = defineTool({
  name: 'ebay_commerce_message_update_conversation',
  namespace: 'commerce.message',
  description: 'Update one conversation status or read state',
  argumentsSchema: updateConversationArgumentsSchema,
  operationKind: 'write',
  operation: updateConversation,
});
