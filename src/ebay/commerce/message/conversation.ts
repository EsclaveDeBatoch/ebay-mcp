import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/communication/commerceMessageV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';

const conversationTypeSchema = z.enum(['FROM_EBAY', 'FROM_MEMBERS']);

const conversationStatusSchema = z.enum(['ACTIVE', 'ARCHIVE', 'DELETE', 'READ', 'UNREAD']);

const conversationPageSizeSchema = z
  .string()
  .regex(/^(?:[1-9]|[1-4]\d|50)$/, 'limit must be an integer from 1 through 50');

const conversationOffsetSchema = z
  .string()
  .regex(/^(?:0|[1-9]\d*)$/, 'offset must be a non-negative integer');

/** Exact eBay query fields accepted by getConversations. */
export const getConversationsArgumentsSchema = z
  .object({
    conversation_status: conversationStatusSchema.optional(),
    conversation_type: conversationTypeSchema,
    end_time: z.iso.datetime().optional(),
    limit: conversationPageSizeSchema.optional(),
    offset: conversationOffsetSchema.optional(),
    other_party_username: z.string().min(1).optional(),
    reference_id: z
      .string()
      .regex(/^[1-9]\d*$/, 'reference_id must be a positive integer')
      .optional(),
    reference_type: z.literal('LISTING').optional(),
    start_time: z.iso.datetime().optional(),
  })
  .strict()
  .superRefine((conversationSearchArguments, validation) => {
    if (
      conversationSearchArguments.reference_id !== undefined &&
      conversationSearchArguments.reference_type === undefined
    ) {
      validation.addIssue({
        code: 'custom',
        message: 'reference_type is required when reference_id is provided',
        path: ['reference_type'],
      });
    }

    if (conversationSearchArguments.conversation_type === 'FROM_EBAY') {
      const memberTimeFilterExists = [
        conversationSearchArguments.start_time,
        conversationSearchArguments.end_time,
      ].some((conversationTime) => conversationTime !== undefined);
      if (memberTimeFilterExists) {
        validation.addIssue({
          code: 'custom',
          message: 'time filters are supported only for FROM_MEMBERS conversations',
          path: ['start_time'],
        });
      }
    }

    if (
      conversationSearchArguments.start_time !== undefined &&
      conversationSearchArguments.end_time !== undefined &&
      Date.parse(conversationSearchArguments.start_time) >=
        Date.parse(conversationSearchArguments.end_time)
    ) {
      validation.addIssue({
        code: 'custom',
        message: 'start_time must be earlier than end_time',
        path: ['start_time'],
      });
    }
  });

/** Validated eBay query used to retrieve conversations. */
export type ConversationSearchArguments = z.infer<typeof getConversationsArgumentsSchema>;

/** Exact eBay path and query fields accepted by getConversation. */
export const getConversationArgumentsSchema = z
  .object({
    conversation_id: z.string().min(1),
    conversation_type: conversationTypeSchema,
    limit: conversationPageSizeSchema.optional(),
    offset: conversationOffsetSchema.optional(),
  })
  .strict();

/** Validated eBay path and query used to retrieve one conversation. */
export type ConversationLookupArguments = z.infer<typeof getConversationArgumentsSchema>;

/**
 * Conversation page generated from the official Commerce Message specification.
 *
 * @see https://developer.ebay.com/api-docs/commerce/message/types/api:GetAllMyConversationsResponse
 */
export type ConversationPage = components['schemas']['GetAllMyConversationsResponse'];

/**
 * Conversation messages generated from the official Commerce Message specification.
 *
 * @see https://developer.ebay.com/api-docs/commerce/message/types/api:GetMessagesByConversationIdResponse
 */
export type ConversationMessages = components['schemas']['GetMessagesByConversationIdResponse'];

/**
 * Retrieves buyer-seller conversations using eBay's exact filters and pagination.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param conversationSearchArguments - Exact eBay conversation query fields.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 *
 * @example
 * ```ts
 * const completion = await getConversations(sellerSession, {
 *   conversation_type: 'FROM_MEMBERS',
 *   limit: '25',
 *   offset: '0',
 * });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/commerce/message/resources/conversation/methods/getConversations
 */
export const getConversations = (
  sellerSession: EbaySellerSession,
  conversationSearchArguments: ConversationSearchArguments,
): Promise<EbayRequestCompletion<ConversationPage>> =>
  sellerSession.get<ConversationPage>({
    endpoint: '/commerce/message/v1/conversation',
    searchParameters: conversationSearchArguments,
  });

/**
 * Retrieves the messages in one buyer-seller conversation.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param conversationLookupArguments - Exact eBay conversation path and query fields.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 *
 * @example
 * ```ts
 * const completion = await getConversation(sellerSession, {
 *   conversation_id: 'conversation-123',
 *   conversation_type: 'FROM_MEMBERS',
 *   limit: '25',
 *   offset: '0',
 * });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/commerce/message/resources/conversation/methods/getConversation
 */
export const getConversation = (
  sellerSession: EbaySellerSession,
  conversationLookupArguments: ConversationLookupArguments,
): Promise<EbayRequestCompletion<ConversationMessages>> => {
  const { conversation_id: conversationId, ...conversationSearchParameters } =
    conversationLookupArguments;

  return sellerSession.get<ConversationMessages>({
    endpoint: `/commerce/message/v1/conversation/${encodeURIComponent(conversationId)}`,
    searchParameters: conversationSearchParameters,
  });
};

/** MCP definition for Commerce Message getConversations. */
export const getConversationsTool = defineTool({
  name: 'ebay_commerce_message_get_conversations',
  namespace: 'commerce.message',
  description: 'Retrieve buyer-seller conversations with official eBay filters',
  argumentsSchema: getConversationsArgumentsSchema,
  operationKind: 'read',
  operation: getConversations,
});

/** MCP definition for Commerce Message getConversation. */
export const getConversationTool = defineTool({
  name: 'ebay_commerce_message_get_conversation',
  namespace: 'commerce.message',
  description: 'Retrieve the messages in one buyer-seller conversation',
  argumentsSchema: getConversationArgumentsSchema,
  operationKind: 'read',
  operation: getConversation,
});
