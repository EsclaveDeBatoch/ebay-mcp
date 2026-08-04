import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/marketing-and-promotions/sellMarketingV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';

const reportTaskIdSchema = z.string().min(1);
const pageSizeSchema = z.string().regex(/^[1-9]\d*$/, 'limit must be a positive integer string');
const pageOffsetSchema = z
  .string()
  .regex(/^(?:0|[1-9]\d*)$/, 'offset must be a non-negative integer string');
const channelSchema = z.enum(['OFF_SITE', 'ON_SITE']);
const fundingModelSchema = z.enum(['COST_PER_CLICK', 'COST_PER_SALE']);
const reportFormatSchema = z.literal('TSV_GZIP');

const reportDimensionSchema = z
  .object({
    annotationKeys: z.array(z.string().min(1)).min(1).optional(),
    dimensionKey: z.string().min(1).optional(),
  })
  .strict();

const inventoryReferenceSchema = z
  .object({
    inventoryReferenceId: z.string().min(1).optional(),
    inventoryReferenceType: z.enum(['INVENTORY_ITEM', 'INVENTORY_ITEM_GROUP']).optional(),
  })
  .strict();

/** Exact eBay query fields accepted by getReportTasks. */
export const getReportTasksArgumentsSchema = z
  .object({
    limit: pageSizeSchema.optional(),
    offset: pageOffsetSchema.optional(),
    report_task_statuses: z.string().min(1).optional(),
  })
  .strict();

/** Exact eBay path field accepted by getReportTask and deleteReportTask. */
export const reportTaskIdArgumentsSchema = z
  .object({
    report_task_id: reportTaskIdSchema,
  })
  .strict();

/** Exact direct CreateReportTask document fields for createReportTask. */
export const createReportTaskArgumentsSchema = z
  .object({
    additionalRecords: z.array(z.literal('NON_PERFORMING_DATA')).min(1).optional(),
    campaignIds: z.array(z.string().min(1)).min(1).max(1000).optional(),
    channels: z.array(channelSchema).min(1).max(1).optional(),
    dateFrom: z.string().min(1),
    dateTo: z.string().min(1),
    dimensions: z.array(reportDimensionSchema).min(1).optional(),
    fundingModels: z.array(fundingModelSchema).min(1).max(1).optional(),
    inventoryReferences: z.array(inventoryReferenceSchema).min(1).max(500).optional(),
    listingIds: z.array(z.string().min(1)).min(1).max(500).optional(),
    marketplaceId: z.string().min(1),
    metricKeys: z.array(z.string().min(1)).min(1).optional(),
    reportFormat: reportFormatSchema.optional(),
    reportType: z.string().min(1),
  })
  .strict();

/** Validated exact eBay query for getReportTasks. */
export type GetReportTasksArguments = z.infer<typeof getReportTasksArgumentsSchema>;

/** Validated exact eBay report task path. */
export type ReportTaskIdArguments = z.infer<typeof reportTaskIdArgumentsSchema>;

/** Validated direct create accepted by createReportTask. */
export type CreateReportTaskArguments = z.infer<typeof createReportTaskArgumentsSchema>;

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/plr:ReportTaskPagedCollection */
export type ReportTaskCollection = components['schemas']['ReportTaskPagedCollection'];

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/plr:ReportTask */
export type ReportTask = components['schemas']['ReportTask'];

const reportTaskEndpoint = (reportTaskId: string): string =>
  `/sell/marketing/v1/ad_report_task/${encodeURIComponent(reportTaskId)}`;

/**
 * Retrieves seller report tasks with exact eBay query filters.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param reportTaskPage - Exact eBay pagination and status query fields.
 * @returns Explicit completion containing eBay's unchanged report task collection.
 * @example `await getReportTasks(sellerSession, { limit: '10', offset: '0', report_task_statuses: 'SUCCESS' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/ad_report_task/methods/getReportTasks
 */
export const getReportTasks = (
  sellerSession: EbaySellerSession,
  reportTaskPage: GetReportTasksArguments = {},
): Promise<EbayRequestCompletion<ReportTaskCollection>> =>
  sellerSession.get<ReportTaskCollection>({
    endpoint: '/sell/marketing/v1/ad_report_task',
    searchParameters: reportTaskPage,
  });

/**
 * Creates one Promoted Listings report task.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param reportTaskCreation - Exact direct CreateReportTask document fields.
 * @returns Explicit completion after eBay accepts the report task.
 * @example `await createReportTask(sellerSession, { dateFrom: '2026-07-01T00:00:00.000Z', dateTo: '2026-07-31T23:59:59.000Z', marketplaceId: 'EBAY_US', metricKeys: ['CLICKS'], reportType: 'ACCOUNT_PERFORMANCE_REPORT', reportFormat: 'TSV_GZIP' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/ad_report_task/methods/createReportTask
 */
export const createReportTask = (
  sellerSession: EbaySellerSession,
  reportTaskCreation: CreateReportTaskArguments,
): Promise<EbayRequestCompletion<undefined>> =>
  sellerSession.post<undefined>({
    endpoint: '/sell/marketing/v1/ad_report_task',
    requestDocument: reportTaskCreation,
  });

/**
 * Retrieves one report task by identifier.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param reportTaskSelection - Exact eBay report task path.
 * @returns Explicit completion containing eBay's unchanged report task document.
 * @example `await getReportTask(sellerSession, { report_task_id: 'TASK-1' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/ad_report_task/methods/getReportTask
 */
export const getReportTask = (
  sellerSession: EbaySellerSession,
  reportTaskSelection: ReportTaskIdArguments,
): Promise<EbayRequestCompletion<ReportTask>> =>
  sellerSession.get<ReportTask>({
    endpoint: reportTaskEndpoint(reportTaskSelection.report_task_id),
  });

/**
 * Deletes one report task and any reports it generated.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param reportTaskSelection - Exact eBay report task path.
 * @returns Explicit completion after eBay deletes the report task.
 * @example `await deleteReportTask(sellerSession, { report_task_id: 'TASK-1' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/ad_report_task/methods/deleteReportTask
 */
export const deleteReportTask = (
  sellerSession: EbaySellerSession,
  reportTaskSelection: ReportTaskIdArguments,
): Promise<EbayRequestCompletion<undefined>> =>
  sellerSession.delete<undefined>({
    endpoint: reportTaskEndpoint(reportTaskSelection.report_task_id),
  });

/** MCP definition for Marketing API getReportTasks. */
export const getReportTasksTool = defineTool({
  name: 'ebay_sell_marketing_get_report_tasks',
  namespace: 'sell.marketing',
  description: 'Retrieve eBay Promoted Listings report tasks with exact filters',
  argumentsSchema: getReportTasksArgumentsSchema,
  operationKind: 'read',
  operation: getReportTasks,
});

/** MCP definition for Marketing API createReportTask. */
export const createReportTaskTool = defineTool({
  name: 'ebay_sell_marketing_create_report_task',
  namespace: 'sell.marketing',
  description: 'Create one eBay Promoted Listings report task',
  argumentsSchema: createReportTaskArgumentsSchema,
  operationKind: 'write',
  operation: createReportTask,
});

/** MCP definition for Marketing API getReportTask. */
export const getReportTaskTool = defineTool({
  name: 'ebay_sell_marketing_get_report_task',
  namespace: 'sell.marketing',
  description: 'Retrieve one eBay Promoted Listings report task',
  argumentsSchema: reportTaskIdArgumentsSchema,
  operationKind: 'read',
  operation: getReportTask,
});

/** MCP definition for Marketing API deleteReportTask. */
export const deleteReportTaskTool = defineTool({
  name: 'ebay_sell_marketing_delete_report_task',
  namespace: 'sell.marketing',
  description: 'Delete one eBay Promoted Listings report task and its reports',
  argumentsSchema: reportTaskIdArgumentsSchema,
  operationKind: 'write',
  operation: deleteReportTask,
});
