import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/marketing-and-promotions/sellMarketingV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';

const fundingModelSchema = z.enum(['COST_PER_CLICK', 'COST_PER_SALE']);
const channelSchema = z.enum(['OFF_SITE', 'ON_SITE']);
const reportTypeSchema = z.string().min(1);

/** Exact eBay query fields accepted by getReportMetadata. */
export const getReportMetadataArgumentsSchema = z
  .object({
    channel: channelSchema.optional(),
    funding_model: fundingModelSchema.optional(),
  })
  .strict();

/** Exact eBay path and query fields accepted by getReportMetadataForReportType. */
export const getReportMetadataForReportTypeArgumentsSchema = z
  .object({
    channel: channelSchema.optional(),
    funding_model: fundingModelSchema.optional(),
    report_type: reportTypeSchema,
  })
  .strict();

/** Validated exact eBay query for getReportMetadata. */
export type GetReportMetadataArguments = z.infer<typeof getReportMetadataArgumentsSchema>;

/** Validated exact eBay path and query for getReportMetadataForReportType. */
export type GetReportMetadataForReportTypeArguments = z.infer<
  typeof getReportMetadataForReportTypeArgumentsSchema
>;

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/plr:ReportMetadatas */
export type ReportMetadataCollection = components['schemas']['ReportMetadatas'];

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/plr:ReportMetadata */
export type ReportMetadata = components['schemas']['ReportMetadata'];

/**
 * Retrieves metadata for all Promoted Listings report types.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param reportMetadataSearch - Exact eBay funding_model and channel query fields.
 * @returns Explicit completion containing eBay's unchanged report metadata collection.
 * @example `await getReportMetadata(sellerSession, { funding_model: 'COST_PER_CLICK', channel: 'ON_SITE' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/ad_report_metadata/methods/getReportMetadata
 */
export const getReportMetadata = (
  sellerSession: EbaySellerSession,
  reportMetadataSearch: GetReportMetadataArguments = {},
): Promise<EbayRequestCompletion<ReportMetadataCollection>> =>
  sellerSession.get<ReportMetadataCollection>({
    endpoint: '/sell/marketing/v1/ad_report_metadata',
    searchParameters: reportMetadataSearch,
  });

/**
 * Retrieves metadata for one Promoted Listings report type.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param reportMetadataLookup - Exact report_type path and optional query filters.
 * @returns Explicit completion containing eBay's unchanged report metadata document.
 * @example `await getReportMetadataForReportType(sellerSession, { report_type: 'ACCOUNT_PERFORMANCE_REPORT' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/ad_report_metadata/methods/getReportMetadataForReportType
 */
export const getReportMetadataForReportType = (
  sellerSession: EbaySellerSession,
  reportMetadataLookup: GetReportMetadataForReportTypeArguments,
): Promise<EbayRequestCompletion<ReportMetadata>> => {
  const { report_type: reportType, ...reportMetadataSearch } = reportMetadataLookup;
  return sellerSession.get<ReportMetadata>({
    endpoint: `/sell/marketing/v1/ad_report_metadata/${encodeURIComponent(reportType)}`,
    searchParameters: reportMetadataSearch,
  });
};

/** MCP definition for Marketing API getReportMetadata. */
export const getReportMetadataTool = defineTool({
  name: 'ebay_sell_marketing_get_report_metadata',
  namespace: 'sell.marketing',
  description: 'Retrieve metadata for all eBay Promoted Listings report types',
  argumentsSchema: getReportMetadataArgumentsSchema,
  operationKind: 'read',
  operation: getReportMetadata,
});

/** MCP definition for Marketing API getReportMetadataForReportType. */
export const getReportMetadataForReportTypeTool = defineTool({
  name: 'ebay_sell_marketing_get_report_metadata_for_report_type',
  namespace: 'sell.marketing',
  description: 'Retrieve metadata for one eBay Promoted Listings report type',
  argumentsSchema: getReportMetadataForReportTypeArgumentsSchema,
  operationKind: 'read',
  operation: getReportMetadataForReportType,
});
