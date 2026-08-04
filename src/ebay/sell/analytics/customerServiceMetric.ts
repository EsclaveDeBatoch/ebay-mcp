import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/analytics-and-report/sellAnalyticsV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';
import { customerServiceMetricChart } from '@/ui/presentation/customerServiceMetric.js';

/** Exact eBay path and query fields accepted by getCustomerServiceMetric. */
export const customerServiceMetricArgumentsSchema = z
  .object({
    customer_service_metric_type: z.enum(['ITEM_NOT_AS_DESCRIBED', 'ITEM_NOT_RECEIVED']),
    evaluation_type: z.enum(['CURRENT', 'PROJECTED']),
    evaluation_marketplace_id: z.string().min(1),
  })
  .strict();

/** Validated eBay customer service metric path and query fields. */
export type CustomerServiceMetricArguments = z.infer<typeof customerServiceMetricArgumentsSchema>;

/**
 * Customer service metric generated from eBay's official Sell Analytics specification.
 *
 * @see https://developer.ebay.com/api-docs/sell/analytics/resources/customer_service_metric/methods/getCustomerServiceMetric
 */
export type CustomerServiceMetric = components['schemas']['GetCustomerServiceMetricResponse'];

/**
 * Retrieves customer service metric benchmarks for an official evaluation and marketplace.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param customerServiceMetricArguments - Exact eBay path and query fields.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 *
 * @example
 * ```ts
 * const completion = await getCustomerServiceMetric(sellerSession, {
 *   customer_service_metric_type: 'ITEM_NOT_AS_DESCRIBED',
 *   evaluation_type: 'CURRENT',
 *   evaluation_marketplace_id: 'EBAY_US',
 * });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/sell/analytics/resources/customer_service_metric/methods/getCustomerServiceMetric
 */
export const getCustomerServiceMetric = async (
  sellerSession: EbaySellerSession,
  customerServiceMetricArguments: CustomerServiceMetricArguments,
): Promise<EbayRequestCompletion<CustomerServiceMetric>> =>
  sellerSession.get<CustomerServiceMetric>({
    endpoint: `/sell/analytics/v1/customer_service_metric/${customerServiceMetricArguments.customer_service_metric_type}/${customerServiceMetricArguments.evaluation_type}`,
    searchParameters: {
      evaluation_marketplace_id: customerServiceMetricArguments.evaluation_marketplace_id,
    },
  });

/** MCP definition for the Sell Analytics customer service metric operation. */
export const getCustomerServiceMetricTool = defineTool({
  name: 'ebay_sell_analytics_get_customer_service_metric',
  namespace: 'sell.analytics',
  description: 'Get seller customer service metrics',
  argumentsSchema: customerServiceMetricArgumentsSchema,
  operationKind: 'read',
  operation: getCustomerServiceMetric,
  presentation: {
    archetype: 'chart',
    project: customerServiceMetricChart,
  },
});
