import { getTrafficReportTool } from '@/ebay/sell/analytics/trafficReport.js';
import type { EbayTool } from '@/mcp/defineTool.js';

/** Explicit catalogue of migrated eBay resource tools. */
export const ebayToolCatalogue: readonly EbayTool[] = [getTrafficReportTool];
