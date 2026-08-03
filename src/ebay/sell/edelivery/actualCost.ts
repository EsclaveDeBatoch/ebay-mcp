import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/other-apis/sellEdeliveryInternationalShippingOas3.js';
import { defineTool } from '@/mcp/defineTool.js';

const utcTimestampSchema = z.iso.datetime({ offset: true });

/** Exact eBay query fields accepted by getActualCosts. */
export const getActualCostsArgumentsSchema = z
  .object({
    tracking_numbers: z.string().min(1).optional(),
    trans_begin_time: utcTimestampSchema.optional(),
    trans_end_time: utcTimestampSchema.optional(),
  })
  .strict()
  .superRefine((actualCostSearch, validation) => {
    if (actualCostSearch.tracking_numbers !== undefined) {
      if (actualCostSearch.trans_begin_time !== undefined) {
        validation.addIssue({
          code: 'custom',
          message: 'tracking_numbers cannot be combined with trans_begin_time',
          path: ['trans_begin_time'],
        });
      }
      if (actualCostSearch.trans_end_time !== undefined) {
        validation.addIssue({
          code: 'custom',
          message: 'tracking_numbers cannot be combined with trans_end_time',
          path: ['trans_end_time'],
        });
      }
      return;
    }
    if (actualCostSearch.trans_begin_time === undefined) {
      validation.addIssue({
        code: 'custom',
        message: 'trans_begin_time is required when tracking_numbers is omitted',
        path: ['trans_begin_time'],
      });
    }
    if (actualCostSearch.trans_end_time === undefined) {
      validation.addIssue({
        code: 'custom',
        message: 'trans_end_time is required when tracking_numbers is omitted',
        path: ['trans_end_time'],
      });
    }
  });

/** Validated eBay package selector used to retrieve actual shipping costs. */
export type ActualCostSearch = z.infer<typeof getActualCostsArgumentsSchema>;

/**
 * Actual package weights and costs generated from the official eDelivery specification.
 *
 * @see https://developer.ebay.com/api-docs/sell/edelivery_international_shipping/types/api:GetActualCostResponses
 */
export type ActualCostCollection = components['schemas']['GetActualCostResponses'];

/**
 * Retrieves actual weights and shipping costs by tracking number or transaction window.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param actualCostSearch - Exact eBay tracking-number or transaction-window query.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 *
 * @example
 * ```ts
 * const completion = await getActualCosts(sellerSession, {
 *   tracking_numbers: 'ES000000001',
 * });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/sell/edelivery_international_shipping/resources/actual_costs/methods/getActualCosts
 */
export const getActualCosts = (
  sellerSession: EbaySellerSession,
  actualCostSearch: ActualCostSearch,
): Promise<EbayRequestCompletion<ActualCostCollection>> =>
  sellerSession.get<ActualCostCollection>({
    endpoint: '/sell/edelivery_international_shipping/v1/actual_costs',
    searchParameters: actualCostSearch,
  });

/** MCP definition for Sell eDelivery getActualCosts. */
export const getActualCostsTool = defineTool({
  name: 'ebay_sell_edelivery_get_actual_costs',
  namespace: 'sell.edelivery',
  description: 'Retrieve actual eDelivery package weights and shipping costs',
  argumentsSchema: getActualCostsArgumentsSchema,
  operationKind: 'read',
  operation: getActualCosts,
});
