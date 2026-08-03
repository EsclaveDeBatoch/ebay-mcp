import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/other-apis/commerceVeroV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';

const reportItemSchema = z
  .object({
    brand: z.string().max(50).optional(),
    copyEmailToRightsOwner: z.boolean().optional(),
    countries: z.array(z.string().length(2)).min(1).optional(),
    detailedMessage: z.string().min(1).max(1000).optional(),
    itemId: z.string().min(1),
    messageToSeller: z.string().max(1000).optional(),
    patent: z.string().min(1).max(15).optional(),
    regions: z.array(z.string().min(1)).min(1).optional(),
    veroReasonCodeId: z.string().min(1),
  })
  .strict()
  .superRefine((reportItem, refinementContext) => {
    if (reportItem.veroReasonCodeId === '9037' && reportItem.countries === undefined) {
      refinementContext.addIssue({
        code: 'custom',
        message: 'countries is required for VeRO reason code 9037',
        path: ['countries'],
      });
    }
    if (reportItem.veroReasonCodeId === '9048' && reportItem.patent === undefined) {
      refinementContext.addIssue({
        code: 'custom',
        message: 'patent is required for VeRO reason code 9048',
        path: ['patent'],
      });
    }
    if (reportItem.veroReasonCodeId === '9052' && reportItem.detailedMessage === undefined) {
      refinementContext.addIssue({
        code: 'custom',
        message: 'detailedMessage is required for VeRO reason code 9052',
        path: ['detailedMessage'],
      });
    }
    if (reportItem.veroReasonCodeId === '7052' && reportItem.detailedMessage === undefined) {
      refinementContext.addIssue({
        code: 'custom',
        message: 'detailedMessage is required for VeRO reason code 7052',
        path: ['detailedMessage'],
      });
    }
  });

/** Exact generated eBay document accepted by createVeroReport. */
export const createVeroReportArgumentsSchema = z
  .object({
    reportItems: z.array(reportItemSchema).min(1),
  })
  .strict();

/** Validated eBay document used to submit alleged listing infringements. */
export type VeroReportSubmission = z.infer<typeof createVeroReportArgumentsSchema>;

/** Exact eBay path and query fields accepted by getVeroReport. */
export const getVeroReportArgumentsSchema = z
  .object({
    vero_report_id: z.string().min(1),
    includeItemDetails: z.enum(['true', 'false']).optional(),
  })
  .strict();

/** Validated eBay path and query used to retrieve one VeRO report. */
export type VeroReportLookup = z.infer<typeof getVeroReportArgumentsSchema>;

/** Exact eBay query fields accepted by getVeroReportItems. */
export const getVeroReportItemsArgumentsSchema = z
  .object({
    filter: z.string().min(1).optional(),
    itemId: z.string().min(1).optional(),
    limit: z
      .string()
      .regex(/^[1-9]\d*$/)
      .optional(),
    offset: z.string().regex(/^\d+$/).optional(),
  })
  .strict();

/** Validated eBay query used to retrieve reported items. */
export type VeroReportedItemSearch = z.infer<typeof getVeroReportItemsArgumentsSchema>;

/**
 * VeRO report creation returned by the official Commerce VeRO specification.
 *
 * @see https://developer.ebay.com/api-docs/commerce/vero/types/VeroReportItemsResponse
 */
export type VeroReportCreation = components['schemas']['VeroReportItemsResponse'];

/**
 * VeRO report status returned by the official Commerce VeRO specification.
 *
 * @see https://developer.ebay.com/api-docs/commerce/vero/types/ReportStatusResponse
 */
export type VeroReportStatus = components['schemas']['ReportStatusResponse'];

/**
 * VeRO reported-item page returned by the official Commerce VeRO specification.
 *
 * @see https://developer.ebay.com/api-docs/commerce/vero/types/VeroReportStatusResponse
 */
export type VeroReportedItemPage = components['schemas']['VeroReportStatusResponse'];

/**
 * Submits one or more listings that allegedly infringe intellectual-property rights.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param reportSubmission - Exact generated eBay VeRO report document.
 * @returns Explicit completion containing unchanged eBay report creation or failure.
 *
 * @example
 * ```ts
 * const completion = await createVeroReport(sellerSession, {
 *   reportItems: [{ itemId: '110000000000', veroReasonCodeId: '1001' }],
 * });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/commerce/vero/resources/vero_report/methods/createVeroReport
 */
export const createVeroReport = (
  sellerSession: EbaySellerSession,
  reportSubmission: VeroReportSubmission,
): Promise<EbayRequestCompletion<VeroReportCreation>> =>
  sellerSession.post<VeroReportCreation>({
    endpoint: '/commerce/vero/v1/vero_report',
    requestDocument: reportSubmission,
  });

/**
 * Retrieves one VeRO report and optionally includes per-listing status details.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param reportLookup - Exact eBay report identifier and item-detail query field.
 * @returns Explicit completion containing unchanged eBay report status or failure.
 *
 * @example
 * ```ts
 * const completion = await getVeroReport(sellerSession, {
 *   vero_report_id: 'REPORT123',
 *   includeItemDetails: 'true',
 * });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/commerce/vero/resources/vero_report/methods/getVeroReport
 */
export const getVeroReport = (
  sellerSession: EbaySellerSession,
  reportLookup: VeroReportLookup,
): Promise<EbayRequestCompletion<VeroReportStatus>> =>
  sellerSession.get<VeroReportStatus>({
    endpoint: `/commerce/vero/v1/vero_report/${encodeURIComponent(reportLookup.vero_report_id)}`,
    searchParameters: { includeItemDetails: reportLookup.includeItemDetails },
  });

/**
 * Retrieves listings previously submitted through the VeRO reporting program.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param reportedItemSearch - Exact eBay date, item, and pagination query fields.
 * @returns Explicit completion containing unchanged eBay reported-item page or failure.
 *
 * @example
 * ```ts
 * const completion = await getVeroReportItems(sellerSession, {
 *   itemId: '110000000000',
 *   limit: '25',
 * });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/commerce/vero/resources/vero_report_items/methods/getVeroReportItems
 */
export const getVeroReportItems = (
  sellerSession: EbaySellerSession,
  reportedItemSearch: VeroReportedItemSearch = {},
): Promise<EbayRequestCompletion<VeroReportedItemPage>> =>
  sellerSession.get<VeroReportedItemPage>({
    endpoint: '/commerce/vero/v1/vero_report_items',
    searchParameters: reportedItemSearch,
  });

/** MCP definition for Commerce VeRO createVeroReport. */
export const createVeroReportTool = defineTool({
  name: 'ebay_commerce_vero_create_report',
  namespace: 'commerce.vero',
  description: 'Report listings that allegedly infringe intellectual-property rights',
  argumentsSchema: createVeroReportArgumentsSchema,
  operationKind: 'write',
  operation: createVeroReport,
});

/** MCP definition for Commerce VeRO getVeroReport. */
export const getVeroReportTool = defineTool({
  name: 'ebay_commerce_vero_get_report',
  namespace: 'commerce.vero',
  description: 'Retrieve one VeRO report and its processing status',
  argumentsSchema: getVeroReportArgumentsSchema,
  operationKind: 'read',
  operation: getVeroReport,
});

/** MCP definition for Commerce VeRO getVeroReportItems. */
export const getVeroReportItemsTool = defineTool({
  name: 'ebay_commerce_vero_get_report_items',
  namespace: 'commerce.vero',
  description: 'Retrieve listings previously submitted through VeRO',
  argumentsSchema: getVeroReportItemsArgumentsSchema,
  operationKind: 'read',
  operation: getVeroReportItems,
});
