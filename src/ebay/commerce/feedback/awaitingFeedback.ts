import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/communication/commerceFeedbackV1BetaOas3.js';
import { defineTool } from '@/mcp/defineTool.js';

const awaitingFeedbackPageSizeSchema = z
  .string()
  .regex(/^(?:2[5-9]|[3-9]\d|1\d{2}|200)$/, 'limit must be an integer from 25 through 200');

const awaitingFeedbackOffsetSchema = z
  .string()
  .regex(/^(?:0|[1-9]\d*)$/, 'offset must be a non-negative integer');

/** Exact eBay query fields accepted by getItemsAwaitingFeedback. */
export const getItemsAwaitingFeedbackArgumentsSchema = z
  .object({
    filter: z.string().min(1).optional(),
    limit: awaitingFeedbackPageSizeSchema.optional(),
    offset: awaitingFeedbackOffsetSchema.optional(),
    sort: z.enum(['END_TIME_ASC', 'END_TIME_DESC']).optional(),
  })
  .strict();

/** Validated eBay query used to retrieve line items awaiting feedback. */
export type GetItemsAwaitingFeedbackArguments = z.infer<
  typeof getItemsAwaitingFeedbackArgumentsSchema
>;

/**
 * Awaiting-feedback page generated from the official Commerce Feedback specification.
 *
 * @see https://developer.ebay.com/api-docs/commerce/feedback/types/api:AwaitingFeedbackResponse
 */
export type ItemsAwaitingFeedback = components['schemas']['AwaitingFeedbackResponse'];

/**
 * Retrieves completed order line items for which the authenticated user still owes feedback.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param awaitingFeedbackArguments - Exact eBay filter, pagination, and sort query fields.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 *
 * @example
 * ```ts
 * const completion = await getItemsAwaitingFeedback(sellerSession, {
 *   filter: 'userRole:SELLER',
 *   limit: '25',
 *   offset: '0',
 *   sort: 'END_TIME_DESC',
 * });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/commerce/feedback/resources/awaiting_feedback/methods/getItemsAwaitingFeedback
 */
export const getItemsAwaitingFeedback = (
  sellerSession: EbaySellerSession,
  awaitingFeedbackArguments: GetItemsAwaitingFeedbackArguments,
): Promise<EbayRequestCompletion<ItemsAwaitingFeedback>> =>
  sellerSession.get<ItemsAwaitingFeedback>({
    endpoint: '/commerce/feedback/v1/awaiting_feedback',
    searchParameters: awaitingFeedbackArguments,
  });

/** MCP definition for Commerce Feedback getItemsAwaitingFeedback. */
export const getItemsAwaitingFeedbackTool = defineTool({
  name: 'ebay_commerce_feedback_get_items_awaiting_feedback',
  namespace: 'commerce.feedback',
  description: 'Retrieve completed order line items for which the user owes feedback',
  argumentsSchema: getItemsAwaitingFeedbackArgumentsSchema,
  operationKind: 'read',
  operation: getItemsAwaitingFeedback,
});
