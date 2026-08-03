import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/communication/commerceMessageV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';

const conversationUpdateSchema = z
  .object({
    conversationId: z.string().min(1),
    conversationStatus: z.enum(['ACTIVE', 'ARCHIVE', 'DELETE', 'READ', 'UNREAD']),
    conversationType: z.enum(['FROM_MEMBERS', 'FROM_EBAY']),
  })
  .strict();

/** Exact generated eBay document accepted by bulkUpdateConversation. */
export const bulkUpdateConversationArgumentsSchema = z
  .object({
    conversations: z.array(conversationUpdateSchema).min(1).max(10),
  })
  .strict();

/** Validated eBay document used to update up to ten conversations. */
export type BulkConversationUpdateArguments = z.infer<typeof bulkUpdateConversationArgumentsSchema>;

/**
 * Batch update report generated from the official Commerce Message specification.
 *
 * @see https://developer.ebay.com/api-docs/commerce/message/types/api:BulkUpdateConversationsResponse
 */
export type ConversationUpdateBatch = components['schemas']['BulkUpdateConversationsResponse'];

/**
 * Updates the status of up to ten conversations in one request.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param conversationUpdates - Exact eBay batch update document.
 * @returns Explicit completion containing the unchanged generated eBay report or failure.
 *
 * @example
 * ```ts
 * const completion = await bulkUpdateConversation(sellerSession, {
 *   conversations: [{
 *     conversationId: 'conversation-123',
 *     conversationStatus: 'ARCHIVE',
 *     conversationType: 'FROM_MEMBERS',
 *   }],
 * });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/commerce/message/resources/bulk_update_conversation/methods/bulkUpdateConversation
 */
export const bulkUpdateConversation = (
  sellerSession: EbaySellerSession,
  conversationUpdates: BulkConversationUpdateArguments,
): Promise<EbayRequestCompletion<ConversationUpdateBatch>> =>
  sellerSession.post<ConversationUpdateBatch>({
    endpoint: '/commerce/message/v1/bulk_update_conversation',
    requestDocument: conversationUpdates,
  });

/** MCP definition for Commerce Message bulkUpdateConversation. */
export const bulkUpdateConversationTool = defineTool({
  name: 'ebay_commerce_message_bulk_update_conversation',
  namespace: 'commerce.message',
  description: 'Update the statuses of up to ten buyer-seller conversations',
  argumentsSchema: bulkUpdateConversationArgumentsSchema,
  operationKind: 'write',
  operation: bulkUpdateConversation,
});
