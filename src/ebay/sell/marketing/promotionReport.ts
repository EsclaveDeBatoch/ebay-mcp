import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/marketing-and-promotions/sellMarketingV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';

const marketplaceIdSchema = z.string().min(1);
const pageSizeSchema = z.string().regex(/^[1-9]\d*$/, 'limit must be a positive integer string');
const pageOffsetSchema = z
  .string()
  .regex(/^(?:0|[1-9]\d*)$/, 'offset must be a non-negative integer string');

/** Exact eBay query fields accepted by getPromotionReports, including underscore wire keys. */
export const getPromotionReportsArgumentsSchema = z
  .object({
    limit: pageSizeSchema.optional(),
    marketplace_id: marketplaceIdSchema,
    offset: pageOffsetSchema.optional(),
    promotion_status: z.string().min(1).optional(),
    promotion_type: z.string().min(1).optional(),
    q: z.string().min(1).optional(),
  })
  .strict();

/** Validated exact eBay query for getPromotionReports. */
export type GetPromotionReportsArguments = z.infer<typeof getPromotionReportsArgumentsSchema>;

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/sme:PromotionsReportPagedCollection */
export type PromotionReportsPage = components['schemas']['PromotionsReportPagedCollection'];

/**
 * Retrieves seller discount reports with exact eBay query filters and pagination.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param promotionReportsPage - Exact eBay query fields, including marketplace_id.
 * @returns Explicit completion containing eBay's unchanged promotion-report collection.
 * @example `await getPromotionReports(sellerSession, { marketplace_id: 'EBAY_US', limit: '25' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/promotion_report/methods/getPromotionReports
 */
export const getPromotionReports = (
  sellerSession: EbaySellerSession,
  promotionReportsPage: GetPromotionReportsArguments,
): Promise<EbayRequestCompletion<PromotionReportsPage>> =>
  sellerSession.get<PromotionReportsPage>({
    endpoint: '/sell/marketing/v1/promotion_report',
    searchParameters: promotionReportsPage,
  });

/** MCP definition for Sell Marketing getPromotionReports. */
export const getPromotionReportsTool = defineTool({
  name: 'ebay_sell_marketing_get_promotion_reports',
  namespace: 'sell.marketing',
  description: "Retrieve the seller's discount reports with exact eBay marketplace filters",
  argumentsSchema: getPromotionReportsArgumentsSchema,
  operationKind: 'read',
  operation: getPromotionReports,
});
