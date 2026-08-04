import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { operations } from '@/generated/ebay/sell-apps/communication/commerceFeedbackV1BetaOas3.js';
import { defineTool } from '@/mcp/defineTool.js';

/** Exact generated eBay document accepted by respondToFeedback. */
export const respondToFeedbackArgumentsSchema = z
  .object({
    feedbackId: z.string().min(1),
    recipientUserId: z.string().min(1),
    responseText: z.string().min(1).max(500),
    responseType: z.enum(['REPLY', 'FOLLOW_UP']),
  })
  .strict();

/** Validated eBay document used to reply to feedback. */
export type FeedbackReplyArguments = z.infer<typeof respondToFeedbackArgumentsSchema>;

/**
 * Empty confirmation generated for a successful Commerce Feedback reply.
 *
 * @see https://developer.ebay.com/api-docs/commerce/feedback/resources/respond_to_feedback/methods/respondToFeedback
 */
export type FeedbackReplyConfirmation =
  operations['respondToFeedback']['responses'][200]['content']['application/json'];

/**
 * Replies to feedback received from another eBay user.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param feedbackReplyArguments - Exact eBay feedback reply document.
 * @returns Explicit completion containing eBay's empty confirmation or failure.
 *
 * @example
 * ```ts
 * const completion = await respondToFeedback(sellerSession, {
 *   feedbackId: 'feedback-123',
 *   recipientUserId: 'buyer-123',
 *   responseText: 'Thank you for sharing your experience.',
 *   responseType: 'REPLY',
 * });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/commerce/feedback/resources/respond_to_feedback/methods/respondToFeedback
 */
export const respondToFeedback = (
  sellerSession: EbaySellerSession,
  feedbackReplyArguments: FeedbackReplyArguments,
): Promise<EbayRequestCompletion<FeedbackReplyConfirmation>> =>
  sellerSession.post<FeedbackReplyConfirmation>({
    endpoint: '/commerce/feedback/v1/respond_to_feedback',
    requestDocument: feedbackReplyArguments,
  });

/** MCP definition for Commerce Feedback respondToFeedback. */
export const respondToFeedbackTool = defineTool({
  name: 'ebay_commerce_feedback_respond_to_feedback',
  namespace: 'commerce.feedback',
  description: 'Reply to feedback received from another eBay user',
  argumentsSchema: respondToFeedbackArgumentsSchema,
  operationKind: 'write',
  operation: respondToFeedback,
});
