import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import { defineTool } from '@/mcp/defineTool.js';

/** Exact eBay path field accepted by getReport. */
export const getReportArgumentsSchema = z
  .object({
    report_id: z.string().min(1),
  })
  .strict();

/** Validated exact eBay report path. */
export type GetReportArguments = z.infer<typeof getReportArgumentsSchema>;

/**
 * Promoted Listings report download body.
 *
 * OpenAPI documents `text/tab-separated-values`. Generated reports use TSV (often gzipped),
 * so the seller session returns the response as text without JSON parsing.
 *
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/ad_report/methods/getReport
 */
export type AdReport = string;

/**
 * Downloads one generated Promoted Listings report by report identifier.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param reportSelection - Exact eBay report path.
 * @returns Explicit completion containing the unchanged report body as text.
 * @example `await getReport(sellerSession, { report_id: 'REPORT-1' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/ad_report/methods/getReport
 */
export const getReport = (
  sellerSession: EbaySellerSession,
  reportSelection: GetReportArguments,
): Promise<EbayRequestCompletion<AdReport>> =>
  sellerSession.get<AdReport>({
    endpoint: `/sell/marketing/v1/ad_report/${encodeURIComponent(reportSelection.report_id)}`,
    responseType: 'text',
  });

/** MCP definition for Marketing API getReport. */
export const getReportTool = defineTool({
  name: 'ebay_sell_marketing_get_report',
  namespace: 'sell.marketing',
  description: 'Download one generated eBay Promoted Listings report as tab-separated values',
  argumentsSchema: getReportArgumentsSchema,
  operationKind: 'read',
  operation: getReport,
});
