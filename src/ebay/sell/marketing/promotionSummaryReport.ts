import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/marketing-and-promotions/sellMarketingV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';

const marketplaceIdSchema = z.string().min(1);

/** Exact eBay query field accepted by getPromotionSummaryReport. */
export const getPromotionSummaryReportArgumentsSchema = z
  .object({
    marketplace_id: marketplaceIdSchema,
  })
  .strict();

/** Validated exact eBay query for getPromotionSummaryReport. */
export type GetPromotionSummaryReportArguments = z.infer<
  typeof getPromotionSummaryReportArgumentsSchema
>;

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/sme:SummaryReportResponse */
export type PromotionSummaryReport = components['schemas']['SummaryReportResponse'];

/**
 * Retrieves the seller-level discount summary report for one marketplace.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param marketplaceSelection - Exact eBay marketplace_id query.
 * @returns Explicit completion containing eBay's unchanged summary-report document.
 * @example `await getPromotionSummaryReport(sellerSession, { marketplace_id: 'EBAY_US' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/promotion_summary_report/methods/getPromotionSummaryReport
 */
export const getPromotionSummaryReport = (
  sellerSession: EbaySellerSession,
  marketplaceSelection: GetPromotionSummaryReportArguments,
): Promise<EbayRequestCompletion<PromotionSummaryReport>> =>
  sellerSession.get<PromotionSummaryReport>({
    endpoint: '/sell/marketing/v1/promotion_summary_report',
    searchParameters: marketplaceSelection,
  });

/** MCP definition for Sell Marketing getPromotionSummaryReport. */
export const getPromotionSummaryReportTool = defineTool({
  name: 'ebay_sell_marketing_get_promotion_summary_report',
  namespace: 'sell.marketing',
  description: "Retrieve the seller's discount summary report for one marketplace",
  argumentsSchema: getPromotionSummaryReportArgumentsSchema,
  operationKind: 'read',
  operation: getPromotionSummaryReport,
});
