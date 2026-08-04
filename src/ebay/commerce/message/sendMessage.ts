import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/communication/commerceMessageV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';

const messageAttachmentSchema = z
  .object({
    mediaName: z.string().min(1),
    mediaType: z.enum(['IMAGE', 'PDF', 'DOC', 'TXT']),
    mediaUrl: z
      .url()
      .refine((mediaLocation) => mediaLocation.startsWith('https://'), 'mediaUrl must use HTTPS'),
  })
  .strict();

const listingReferenceSchema = z
  .object({
    referenceId: z.string().regex(/^[1-9]\d*$/, 'referenceId must be a positive integer'),
    referenceType: z.literal('LISTING'),
  })
  .strict();

/** Exact generated eBay document accepted by sendMessage. */
export const sendMessageArgumentsSchema = z
  .object({
    conversationId: z.string().min(1).optional(),
    emailCopyToSender: z.boolean().optional(),
    messageMedia: z.array(messageAttachmentSchema).min(1).max(5).optional(),
    messageText: z.string().min(1).max(2000).optional(),
    otherPartyUsername: z.string().min(1).optional(),
    reference: listingReferenceSchema.optional(),
  })
  .strict()
  .superRefine((messageSubmission, validation) => {
    const existingConversationSelected = messageSubmission.conversationId !== undefined;
    const newRecipientSelected = messageSubmission.otherPartyUsername !== undefined;

    if (existingConversationSelected === newRecipientSelected) {
      validation.addIssue({
        code: 'custom',
        message: 'Provide exactly one of conversationId or otherPartyUsername',
        path: ['conversationId'],
      });
    }

    const messageTextExists = messageSubmission.messageText !== undefined;
    const attachmentExists = messageSubmission.messageMedia !== undefined;
    if (!messageTextExists && !attachmentExists) {
      validation.addIssue({
        code: 'custom',
        message: 'Provide messageText or at least one messageMedia attachment',
        path: ['messageText'],
      });
    }
  });

/** Validated eBay document used to send a buyer-seller message. */
export type SendMessageArguments = z.infer<typeof sendMessageArgumentsSchema>;

/**
 * Sent message generated from the official Commerce Message specification.
 *
 * @see https://developer.ebay.com/api-docs/commerce/message/types/api:SendMessageResponse
 */
export type SentMessage = components['schemas']['SendMessageResponse'];

/**
 * Sends a message in an existing conversation or starts one with another eBay user.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param messageSubmission - Exact eBay message document.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 *
 * @example
 * ```ts
 * const completion = await sendMessage(sellerSession, {
 *   messageText: 'The camera includes its original case.',
 *   otherPartyUsername: 'buyer-123',
 * });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/commerce/message/resources/send_message/methods/sendMessage
 */
export const sendMessage = (
  sellerSession: EbaySellerSession,
  messageSubmission: SendMessageArguments,
): Promise<EbayRequestCompletion<SentMessage>> =>
  sellerSession.post<SentMessage>({
    endpoint: '/commerce/message/v1/send_message',
    requestDocument: messageSubmission,
  });

/** MCP definition for Commerce Message sendMessage. */
export const sendMessageTool = defineTool({
  name: 'ebay_commerce_message_send_message',
  namespace: 'commerce.message',
  description: 'Send a buyer-seller message or start a new conversation',
  argumentsSchema: sendMessageArgumentsSchema,
  operationKind: 'write',
  operation: sendMessage,
});
