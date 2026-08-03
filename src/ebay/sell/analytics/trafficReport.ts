import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/analytics-and-report/sellAnalyticsV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';
import { trafficReportChart } from '@/ui/presentation/trafficReport.js';

/** Exact eBay query accepted by Sell Analytics getTrafficReport. */
export const trafficReportQuerySchema = z
  .object({
    dimension: z.enum(['DAY', 'LISTING']),
    filter: z.string().min(1),
    metric: z.string().min(1),
    sort: z.string().min(1).optional(),
  })
  .strict();

/** Validated eBay traffic-report query fields. */
export type TrafficReportQuery = z.infer<typeof trafficReportQuerySchema>;

/**
 * Traffic report document generated from eBay's official Sell Analytics specification.
 *
 * @see https://developer.ebay.com/api-docs/sell/analytics/resources/traffic_report/methods/getTrafficReport
 */
export type TrafficReport = components['schemas']['Report'];

/**
 * Retrieves listing traffic metrics for the authenticated seller.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param trafficReportQuery - Exact eBay traffic-report query fields.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 *
 * @example
 * ```ts
 * const completion = await getTrafficReport(sellerSession, {
 *   dimension: 'DAY',
 *   filter: 'marketplace_ids:{EBAY_US},date_range:[20260701..20260731]',
 *   metric: 'LISTING_VIEWS_TOTAL',
 * });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/sell/analytics/resources/traffic_report/methods/getTrafficReport
 */
export const getTrafficReport = async (
  sellerSession: EbaySellerSession,
  trafficReportQuery: TrafficReportQuery,
): Promise<EbayRequestCompletion<TrafficReport>> =>
  sellerSession.get<TrafficReport>({
    endpoint: '/sell/analytics/v1/traffic_report',
    searchParameters: trafficReportQuery,
  });

/** MCP definition for the Sell Analytics traffic-report operation. */
export const getTrafficReportTool = defineTool({
  name: 'ebay_sell_analytics_get_traffic_report',
  namespace: 'sell.analytics',
  description: "Retrieve traffic metrics for the seller's listings",
  argumentsSchema: trafficReportQuerySchema,
  operationKind: 'read',
  operation: getTrafficReport,
  presentation: {
    archetype: 'chart',
    project: trafficReportChart,
  },
});
