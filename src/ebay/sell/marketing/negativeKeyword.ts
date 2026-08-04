import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type {
  components,
  operations,
} from '@/generated/ebay/sell-apps/marketing-and-promotions/sellMarketingV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';

const negativeKeywordIdSchema = z.string().min(1);
const pageSizeSchema = z.string().regex(/^[1-9]\d*$/, 'limit must be a positive integer string');
const pageOffsetSchema = z
  .string()
  .regex(/^(?:0|[1-9]\d*)$/, 'offset must be a non-negative integer string');
const negativeKeywordMatchTypeSchema = z.enum(['EXACT', 'PHRASE']);
const negativeKeywordStatusSchema = z.enum(['ACTIVE', 'ARCHIVED']);

const createNegativeKeywordDocumentSchema = z
  .object({
    adGroupId: z.string().min(1).optional(),
    campaignId: z.string().min(1).optional(),
    negativeKeywordMatchType: negativeKeywordMatchTypeSchema,
    negativeKeywordText: z.string().min(1),
  })
  .strict();

const updateNegativeKeywordDocumentSchema = z
  .object({
    negativeKeywordStatus: negativeKeywordStatusSchema.optional(),
  })
  .strict();

const bulkUpdateNegativeKeywordDocumentSchema = z
  .object({
    negativeKeywordId: negativeKeywordIdSchema,
    negativeKeywordStatus: negativeKeywordStatusSchema.optional(),
  })
  .strict();

/** Exact eBay query fields accepted by getNegativeKeywords. */
export const getNegativeKeywordsArgumentsSchema = z
  .object({
    ad_group_ids: z.string().min(1).optional(),
    campaign_ids: z.string().min(1).optional(),
    limit: pageSizeSchema.optional(),
    negative_keyword_status: negativeKeywordStatusSchema.optional(),
    offset: pageOffsetSchema.optional(),
  })
  .strict();

/** Exact eBay path field accepted by getNegativeKeyword. */
export const getNegativeKeywordArgumentsSchema = z
  .object({
    negative_keyword_id: negativeKeywordIdSchema,
  })
  .strict();

/** Exact direct CreateNegativeKeywordRequest fields for createNegativeKeyword. */
export const createNegativeKeywordArgumentsSchema = createNegativeKeywordDocumentSchema;

/** Exact eBay path and direct UpdateNegativeKeywordRequest fields for updateNegativeKeyword. */
export const updateNegativeKeywordArgumentsSchema = updateNegativeKeywordDocumentSchema
  .extend({
    negative_keyword_id: negativeKeywordIdSchema,
  })
  .strict();

/** Exact direct BulkCreateNegativeKeywordRequest document for bulkCreateNegativeKeyword. */
export const bulkCreateNegativeKeywordArgumentsSchema = z
  .object({
    requests: z.array(createNegativeKeywordDocumentSchema).min(1),
  })
  .strict();

/** Exact direct BulkUpdateNegativeKeywordRequest document for bulkUpdateNegativeKeyword. */
export const bulkUpdateNegativeKeywordArgumentsSchema = z
  .object({
    requests: z.array(bulkUpdateNegativeKeywordDocumentSchema).min(1),
  })
  .strict();

/** Validated exact eBay query for getNegativeKeywords. */
export type GetNegativeKeywordsArguments = z.infer<typeof getNegativeKeywordsArgumentsSchema>;

/** Validated exact eBay path for getNegativeKeyword. */
export type GetNegativeKeywordArguments = z.infer<typeof getNegativeKeywordArgumentsSchema>;

/** Validated direct create accepted by createNegativeKeyword. */
export type CreateNegativeKeywordArguments = z.infer<typeof createNegativeKeywordArgumentsSchema>;

/** Validated direct update accepted by updateNegativeKeyword. */
export type UpdateNegativeKeywordArguments = z.infer<typeof updateNegativeKeywordArgumentsSchema>;

/** Validated direct batch accepted by bulkCreateNegativeKeyword. */
export type BulkCreateNegativeKeywordArguments = z.infer<
  typeof bulkCreateNegativeKeywordArgumentsSchema
>;

/** Validated direct batch accepted by bulkUpdateNegativeKeyword. */
export type BulkUpdateNegativeKeywordArguments = z.infer<
  typeof bulkUpdateNegativeKeywordArgumentsSchema
>;

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/pls:NegativeKeywordPagedCollectionResponse */
export type NegativeKeywordCollection =
  components['schemas']['NegativeKeywordPagedCollectionResponse'];

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/pls:NegativeKeyword */
export type NegativeKeyword = components['schemas']['NegativeKeyword'];

/** @see https://developer.ebay.com/api-docs/sell/marketing/resources/negative_keyword/methods/createNegativeKeyword */
export type CreateNegativeKeywordCompletion =
  operations['createNegativeKeyword']['responses'][201]['content']['application/json'];

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/pls:BulkCreateNegativeKeywordResponse */
export type BulkCreateNegativeKeywordCompletion =
  components['schemas']['BulkCreateNegativeKeywordResponse'];

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/pls:BulkUpdateNegativeKeywordResponse */
export type BulkUpdateNegativeKeywordCompletion =
  components['schemas']['BulkUpdateNegativeKeywordResponse'];

const negativeKeywordEndpoint = (negativeKeywordId: string): string =>
  `/sell/marketing/v1/negative_keyword/${encodeURIComponent(negativeKeywordId)}`;

/**
 * Creates negative keywords in bulk for priority strategy campaigns.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param negativeKeywordBatch - Exact direct BulkCreateNegativeKeywordRequest document.
 * @returns Explicit completion containing eBay's per-negative-keyword create statuses.
 * @example `await bulkCreateNegativeKeyword(sellerSession, { requests: [{ campaignId: '1', adGroupId: '2', negativeKeywordText: 'cheap', negativeKeywordMatchType: 'EXACT' }] })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/negative_keyword/methods/bulkCreateNegativeKeyword
 */
export const bulkCreateNegativeKeyword = (
  sellerSession: EbaySellerSession,
  negativeKeywordBatch: BulkCreateNegativeKeywordArguments,
): Promise<EbayRequestCompletion<BulkCreateNegativeKeywordCompletion>> =>
  sellerSession.post<BulkCreateNegativeKeywordCompletion>({
    endpoint: '/sell/marketing/v1/bulk_create_negative_keyword',
    requestDocument: negativeKeywordBatch,
  });

/**
 * Updates negative keyword statuses in bulk.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param negativeKeywordBatch - Exact direct BulkUpdateNegativeKeywordRequest document.
 * @returns Explicit completion containing eBay's per-negative-keyword update statuses.
 * @example `await bulkUpdateNegativeKeyword(sellerSession, { requests: [{ negativeKeywordId: '3', negativeKeywordStatus: 'ARCHIVED' }] })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/negative_keyword/methods/bulkUpdateNegativeKeyword
 */
export const bulkUpdateNegativeKeyword = (
  sellerSession: EbaySellerSession,
  negativeKeywordBatch: BulkUpdateNegativeKeywordArguments,
): Promise<EbayRequestCompletion<BulkUpdateNegativeKeywordCompletion>> =>
  sellerSession.post<BulkUpdateNegativeKeywordCompletion>({
    endpoint: '/sell/marketing/v1/bulk_update_negative_keyword',
    requestDocument: negativeKeywordBatch,
  });

/**
 * Retrieves negative keywords with exact eBay query filters.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param negativeKeywordPage - Exact eBay query fields, including underscore wire keys.
 * @returns Explicit completion containing eBay's unchanged negative keyword collection.
 * @example `await getNegativeKeywords(sellerSession, { campaign_ids: '1', ad_group_ids: '2', limit: '25' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/negative_keyword/methods/getNegativeKeywords
 */
export const getNegativeKeywords = (
  sellerSession: EbaySellerSession,
  negativeKeywordPage: GetNegativeKeywordsArguments = {},
): Promise<EbayRequestCompletion<NegativeKeywordCollection>> =>
  sellerSession.get<NegativeKeywordCollection>({
    endpoint: '/sell/marketing/v1/negative_keyword',
    searchParameters: negativeKeywordPage,
  });

/**
 * Creates one negative keyword for a priority strategy campaign.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param negativeKeywordCreation - Exact direct CreateNegativeKeywordRequest fields.
 * @returns Explicit completion after eBay creates the negative keyword.
 * @example `await createNegativeKeyword(sellerSession, { campaignId: '1', adGroupId: '2', negativeKeywordText: 'cheap', negativeKeywordMatchType: 'EXACT' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/negative_keyword/methods/createNegativeKeyword
 */
export const createNegativeKeyword = (
  sellerSession: EbaySellerSession,
  negativeKeywordCreation: CreateNegativeKeywordArguments,
): Promise<EbayRequestCompletion<CreateNegativeKeywordCompletion>> =>
  sellerSession.post<CreateNegativeKeywordCompletion>({
    endpoint: '/sell/marketing/v1/negative_keyword',
    requestDocument: negativeKeywordCreation,
  });

/**
 * Retrieves one negative keyword by identifier.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param negativeKeywordSelection - Exact negative keyword path.
 * @returns Explicit completion containing eBay's unchanged negative keyword document.
 * @example `await getNegativeKeyword(sellerSession, { negative_keyword_id: '3' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/negative_keyword/methods/getNegativeKeyword
 */
export const getNegativeKeyword = (
  sellerSession: EbaySellerSession,
  negativeKeywordSelection: GetNegativeKeywordArguments,
): Promise<EbayRequestCompletion<NegativeKeyword>> =>
  sellerSession.get<NegativeKeyword>({
    endpoint: negativeKeywordEndpoint(negativeKeywordSelection.negative_keyword_id),
  });

/**
 * Updates one negative keyword status.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param negativeKeywordReplacement - Exact path and direct UpdateNegativeKeywordRequest fields.
 * @returns Explicit completion after eBay updates the negative keyword.
 * @example `await updateNegativeKeyword(sellerSession, { negative_keyword_id: '3', negativeKeywordStatus: 'ARCHIVED' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/negative_keyword/methods/updateNegativeKeyword
 */
export const updateNegativeKeyword = (
  sellerSession: EbaySellerSession,
  negativeKeywordReplacement: UpdateNegativeKeywordArguments,
): Promise<EbayRequestCompletion<undefined>> => {
  const { negative_keyword_id: negativeKeywordId, ...negativeKeywordDocument } =
    negativeKeywordReplacement;
  return sellerSession.put<undefined>({
    endpoint: negativeKeywordEndpoint(negativeKeywordId),
    requestDocument: negativeKeywordDocument,
  });
};

/** MCP definition for Marketing API bulkCreateNegativeKeyword. */
export const bulkCreateNegativeKeywordTool = defineTool({
  name: 'ebay_sell_marketing_bulk_create_negative_keyword',
  namespace: 'sell.marketing',
  description: 'Create negative keywords in bulk for eBay priority strategy campaigns',
  argumentsSchema: bulkCreateNegativeKeywordArgumentsSchema,
  operationKind: 'write',
  operation: bulkCreateNegativeKeyword,
});

/** MCP definition for Marketing API bulkUpdateNegativeKeyword. */
export const bulkUpdateNegativeKeywordTool = defineTool({
  name: 'ebay_sell_marketing_bulk_update_negative_keyword',
  namespace: 'sell.marketing',
  description: 'Update negative keyword statuses in bulk',
  argumentsSchema: bulkUpdateNegativeKeywordArgumentsSchema,
  operationKind: 'write',
  operation: bulkUpdateNegativeKeyword,
});

/** MCP definition for Marketing API getNegativeKeywords. */
export const getNegativeKeywordsTool = defineTool({
  name: 'ebay_sell_marketing_get_negative_keywords',
  namespace: 'sell.marketing',
  description: 'Retrieve negative keywords with exact eBay filters and pagination',
  argumentsSchema: getNegativeKeywordsArgumentsSchema,
  operationKind: 'read',
  operation: getNegativeKeywords,
});

/** MCP definition for Marketing API createNegativeKeyword. */
export const createNegativeKeywordTool = defineTool({
  name: 'ebay_sell_marketing_create_negative_keyword',
  namespace: 'sell.marketing',
  description: 'Create one negative keyword for an eBay priority strategy campaign',
  argumentsSchema: createNegativeKeywordArgumentsSchema,
  operationKind: 'write',
  operation: createNegativeKeyword,
});

/** MCP definition for Marketing API getNegativeKeyword. */
export const getNegativeKeywordTool = defineTool({
  name: 'ebay_sell_marketing_get_negative_keyword',
  namespace: 'sell.marketing',
  description: 'Retrieve one eBay marketing negative keyword',
  argumentsSchema: getNegativeKeywordArgumentsSchema,
  operationKind: 'read',
  operation: getNegativeKeyword,
});

/** MCP definition for Marketing API updateNegativeKeyword. */
export const updateNegativeKeywordTool = defineTool({
  name: 'ebay_sell_marketing_update_negative_keyword',
  namespace: 'sell.marketing',
  description: 'Update one eBay marketing negative keyword status',
  argumentsSchema: updateNegativeKeywordArgumentsSchema,
  operationKind: 'write',
  operation: updateNegativeKeyword,
});
