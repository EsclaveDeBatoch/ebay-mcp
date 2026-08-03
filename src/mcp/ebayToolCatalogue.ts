import { getUserTool } from '@/ebay/commerce/identity/user.js';
import { translateListingTextTool } from '@/ebay/commerce/translation/language.js';
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
  getUserTool,
  translateListingTextTool,
  getTrafficReportTool,
  findSellerStandardsProfilesTool,
  getSellerStandardsProfileTool,
  getCustomerServiceMetricTool,
  findListingRecommendationsTool,
];
