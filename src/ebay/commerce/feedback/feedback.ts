import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/communication/commerceFeedbackV1BetaOas3.js';
import { defineTool } from '@/mcp/defineTool.js';

const feedbackPageSizeSchema = z
  .string()
  .regex(/^(?:2[5-9]|[3-9]\d|1\d{2}|200)$/, 'limit must be an integer from 25 through 200');

const feedbackOffsetSchema = z
  .string()
  .regex(/^(?:0|[1-9]\d*)$/, 'offset must be a non-negative integer');

const feedbackImageSchema = z
  .object({
    url: z.url(),
  })
  .strict();

const sellerRatingSchema = z
  .object({
    key: z.enum([
      'ON_TIME_DELIVERY',
      'ITEM_AS_DESCRIBED',
      'COMMUNICATION',
      'SHIPPING_CHARGES',
      'SHIPPING_TIME',
    ]),
    value: z.enum(['1', '2', '3', '4', '5']),
  })
  .strict();

/** Exact eBay query fields accepted by getFeedback. */
export const getFeedbackArgumentsSchema = z
  .object({
    feedback_id: z.string().min(1).optional(),
    feedback_type: z.enum(['FEEDBACK_RECEIVED', 'FEEDBACK_SENT']),
    filter: z.string().min(1).optional(),
    limit: feedbackPageSizeSchema.optional(),
    listing_id: z.string().min(1).optional(),
    offset: feedbackOffsetSchema.optional(),
    order_line_item_id: z.string().min(1).optional(),
    sort: z.enum(['RELEVANCE', 'TIME']).optional(),
    transaction_id: z.string().min(1).optional(),
    user_id: z.string().min(1),
  })
  .strict()
  .superRefine((feedbackSearchArguments, validation) => {
    if (feedbackSearchArguments.feedback_id !== undefined) {
      const competingFeedbackSelectorExists = [
        feedbackSearchArguments.filter,
        feedbackSearchArguments.listing_id,
        feedbackSearchArguments.order_line_item_id,
        feedbackSearchArguments.transaction_id,
      ].some((feedbackSelector) => feedbackSelector !== undefined);
      if (competingFeedbackSelectorExists) {
        validation.addIssue({
          code: 'custom',
          message: 'feedback_id cannot be combined with another feedback selector',
          path: ['feedback_id'],
        });
      }
    }
    if (feedbackSearchArguments.order_line_item_id !== undefined) {
      const competingLineItemSelectorExists = [
        feedbackSearchArguments.feedback_id,
        feedbackSearchArguments.filter,
        feedbackSearchArguments.listing_id,
        feedbackSearchArguments.transaction_id,
      ].some((feedbackSelector) => feedbackSelector !== undefined);
      if (competingLineItemSelectorExists) {
        validation.addIssue({
          code: 'custom',
          message: 'order_line_item_id cannot be combined with another feedback selector',
          path: ['order_line_item_id'],
        });
      }
    }
  });

/** Validated eBay query used to retrieve feedback. */
export type FeedbackSearchArguments = z.infer<typeof getFeedbackArgumentsSchema>;

/** Exact generated eBay document accepted by leaveFeedback. */
export const leaveFeedbackArgumentsSchema = z
  .object({
    commentText: z.string().min(1).max(500),
    commentType: z.enum(['POSITIVE', 'NEUTRAL', 'NEGATIVE']),
    images: z
      .array(feedbackImageSchema)
      .max(5, 'images must contain at most 5 attachments')
      .optional(),
    listingId: z.string().min(1),
    orderLineItemId: z.string().min(1),
    sellerRatings: z.array(sellerRatingSchema).optional(),
    transactionId: z.string().min(1),
  })
  .strict();

/** Validated eBay document used to leave feedback for an order partner. */
export type LeaveFeedbackArguments = z.infer<typeof leaveFeedbackArgumentsSchema>;

/**
 * Feedback page generated from the official Commerce Feedback specification.
 *
 * @see https://developer.ebay.com/api-docs/commerce/feedback/types/api:GetFeedbackResponse
 */
export type FeedbackPage = components['schemas']['GetFeedbackResponse'];

/**
 * Feedback submission confirmation generated from the official Commerce Feedback specification.
 *
 * @see https://developer.ebay.com/api-docs/commerce/feedback/types/api:LeaveFeedbackResponse
 */
export type FeedbackSubmissionConfirmation = components['schemas']['LeaveFeedbackResponse'];

/**
 * Retrieves feedback sent or received by one eBay user.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param feedbackSearchArguments - Exact eBay selectors, pagination, and sort fields.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 *
 * @example
 * ```ts
 * const completion = await getFeedback(sellerSession, {
 *   feedback_type: 'FEEDBACK_RECEIVED',
 *   limit: '25',
 *   user_id: 'seller-123',
 * });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/commerce/feedback/resources/feedback/methods/getFeedback
 */
export const getFeedback = (
  sellerSession: EbaySellerSession,
  feedbackSearchArguments: FeedbackSearchArguments,
): Promise<EbayRequestCompletion<FeedbackPage>> =>
  sellerSession.get<FeedbackPage>({
    endpoint: '/commerce/feedback/v1/feedback',
    searchParameters: feedbackSearchArguments,
  });

/**
 * Leaves feedback for the authenticated user's order partner.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param leaveFeedbackArguments - Exact eBay feedback and transaction document.
 * @returns Explicit completion containing the unchanged generated eBay confirmation or failure.
 *
 * @example
 * ```ts
 * const completion = await leaveFeedback(sellerSession, {
 *   commentText: 'Fast payment and clear communication.',
 *   commentType: 'POSITIVE',
 *   listingId: '110000000000',
 *   orderLineItemId: '110000000000-220000000000',
 *   transactionId: '220000000000',
 * });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/commerce/feedback/resources/feedback/methods/leaveFeedback
 */
export const leaveFeedback = (
  sellerSession: EbaySellerSession,
  leaveFeedbackArguments: LeaveFeedbackArguments,
): Promise<EbayRequestCompletion<FeedbackSubmissionConfirmation>> =>
  sellerSession.post<FeedbackSubmissionConfirmation>({
    endpoint: '/commerce/feedback/v1/feedback',
    requestDocument: leaveFeedbackArguments,
  });

/** MCP definition for Commerce Feedback getFeedback. */
export const getFeedbackTool = defineTool({
  name: 'ebay_commerce_feedback_get_feedback',
  namespace: 'commerce.feedback',
  description: 'Retrieve feedback sent or received by one eBay user',
  argumentsSchema: getFeedbackArgumentsSchema,
  operationKind: 'read',
  operation: getFeedback,
});

/** MCP definition for Commerce Feedback leaveFeedback. */
export const leaveFeedbackTool = defineTool({
  name: 'ebay_commerce_feedback_leave_feedback',
  namespace: 'commerce.feedback',
  description: "Leave feedback for the authenticated user's eBay order partner",
  argumentsSchema: leaveFeedbackArgumentsSchema,
  operationKind: 'write',
  operation: leaveFeedback,
});
