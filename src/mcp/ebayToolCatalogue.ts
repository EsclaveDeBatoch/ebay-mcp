import { getCustomerServiceMetricTool } from '@/ebay/sell/analytics/customerServiceMetric.js';
import {
  findSellerStandardsProfilesTool,
  getSellerStandardsProfileTool,
} from '@/ebay/sell/analytics/sellerStandardsProfile.js';
import { getTrafficReportTool } from '@/ebay/sell/analytics/trafficReport.js';
import { findListingRecommendationsTool } from '@/ebay/sell/recommendation/listingRecommendation.js';
import type { EbayTool } from '@/mcp/defineTool.js';

/** Explicit catalogue of migrated eBay resource tools. */
export const ebayToolCatalogue: readonly EbayTool[] = [
  getTrafficReportTool,
  findSellerStandardsProfilesTool,
  getSellerStandardsProfileTool,
  getCustomerServiceMetricTool,
  findListingRecommendationsTool,
];
