import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/communication/commerceFeedbackV1BetaOas3.js';
import { defineTool } from '@/mcp/defineTool.js';

const ratingTypeFilterPattern =
  /(?:^|,)ratingType:(?:OVERALL_EXPERIENCE|OVERALL_EXPERIENCE_COMMENT|ON_TIME_DELIVERY|DSR_ITEM_AS_DESCRIBED|DSR_COMMUNICATION|DSR_SHIPPING_CHARGES|DSR_SHIPPING_TIME|ITEM_RATING)(?:,|$)/;

/** Exact eBay query fields accepted by getFeedbackRatingSummary. */
export const getFeedbackRatingSummaryArgumentsSchema = z
  .object({
    filter: z.string().regex(ratingTypeFilterPattern, 'filter must include a supported ratingType'),
    user_id: z.string().min(1),
  })
  .strict();

/** Validated eBay query used to retrieve a feedback rating summary. */
export type GetFeedbackRatingSummaryArguments = z.infer<
  typeof getFeedbackRatingSummaryArgumentsSchema
>;

/**
 * Feedback rating summary generated from the official Commerce Feedback specification.
 *
 * @see https://developer.ebay.com/api-docs/commerce/feedback/types/api:GetFeedbackRatingSummaryResponse
 */
export type FeedbackRatingSummary = components['schemas']['GetFeedbackRatingSummaryResponse'];

/**
 * Retrieves an eBay user's feedback metrics for one documented rating type.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param feedbackRatingSummaryArguments - Exact eBay filter and user query fields.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 *
 * @example
 * ```ts
 * const completion = await getFeedbackRatingSummary(sellerSession, {
 *   filter: 'ratingType:OVERALL_EXPERIENCE',
 *   user_id: 'seller-123',
 * });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/commerce/feedback/resources/feedback_rating_summary/methods/getFeedbackRatingSummary
 */
export const getFeedbackRatingSummary = (
  sellerSession: EbaySellerSession,
  feedbackRatingSummaryArguments: GetFeedbackRatingSummaryArguments,
): Promise<EbayRequestCompletion<FeedbackRatingSummary>> =>
  sellerSession.get<FeedbackRatingSummary>({
    endpoint: '/commerce/feedback/v1/feedback_rating_summary',
    searchParameters: feedbackRatingSummaryArguments,
  });

/** MCP definition for Commerce Feedback getFeedbackRatingSummary. */
export const getFeedbackRatingSummaryTool = defineTool({
  name: 'ebay_commerce_feedback_get_feedback_rating_summary',
  namespace: 'commerce.feedback',
  description: "Retrieve an eBay user's feedback metrics for one rating type",
  argumentsSchema: getFeedbackRatingSummaryArgumentsSchema,
  operationKind: 'read',
  operation: getFeedbackRatingSummary,
});
