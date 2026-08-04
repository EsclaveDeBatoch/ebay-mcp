import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type {
  components,
  operations,
} from '@/generated/ebay/sell-apps/marketing-and-promotions/sellMarketingV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';

const campaignIdSchema = z.string().min(1);
const keywordIdSchema = z.string().min(1);
const pageSizeSchema = z.string().regex(/^[1-9]\d*$/, 'limit must be a positive integer string');
const pageOffsetSchema = z
  .string()
  .regex(/^(?:0|[1-9]\d*)$/, 'offset must be a non-negative integer string');
const keywordMatchTypeSchema = z.enum(['BROAD', 'EXACT', 'PHRASE']);
const keywordStatusSchema = z.enum(['ACTIVE', 'ARCHIVED', 'PAUSED']);

const keywordBidSchema = z
  .object({
    currency: z.string().regex(/^[A-Z]{3}$/, 'currency must use a three-letter ISO code'),
    value: z
      .string()
      .regex(/^(?:0|[1-9]\d*)(?:\.\d+)?$/, 'amount must be a non-negative monetary string'),
  })
  .strict();

const createKeywordDocumentSchema = z
  .object({
    adGroupId: z.string().min(1),
    bid: keywordBidSchema.optional(),
    keywordText: z.string().min(1).max(100),
    matchType: keywordMatchTypeSchema,
  })
  .strict();

const updateKeywordDocumentSchema = z
  .object({
    bid: keywordBidSchema.optional(),
    keywordStatus: keywordStatusSchema.optional(),
  })
  .strict();

const bulkUpdateKeywordDocumentSchema = z
  .object({
    bid: keywordBidSchema.optional(),
    keywordId: keywordIdSchema,
    keywordStatus: keywordStatusSchema.optional(),
  })
  .strict();

/** Exact eBay path and query fields accepted by getKeywords. */
export const getKeywordsArgumentsSchema = z
  .object({
    ad_group_ids: z.string().min(1).optional(),
    campaign_id: campaignIdSchema,
    keyword_status: keywordStatusSchema.optional(),
    limit: pageSizeSchema.optional(),
    offset: pageOffsetSchema.optional(),
  })
  .strict();

/** Exact eBay path fields accepted by getKeyword. */
export const getKeywordArgumentsSchema = z
  .object({
    campaign_id: campaignIdSchema,
    keyword_id: keywordIdSchema,
  })
  .strict();

/** Exact eBay path and direct CreateKeywordRequest fields for createKeyword. */
export const createKeywordArgumentsSchema = createKeywordDocumentSchema
  .extend({
    campaign_id: campaignIdSchema,
  })
  .strict();

/** Exact eBay path and direct UpdateKeywordRequest fields for updateKeyword. */
export const updateKeywordArgumentsSchema = updateKeywordDocumentSchema
  .extend({
    campaign_id: campaignIdSchema,
    keyword_id: keywordIdSchema,
  })
  .strict();

/** Exact eBay path and direct BulkCreateKeywordRequest document for bulkCreateKeyword. */
export const bulkCreateKeywordArgumentsSchema = z
  .object({
    campaign_id: campaignIdSchema,
    requests: z.array(createKeywordDocumentSchema).min(1),
  })
  .strict();

/** Exact eBay path and direct BulkUpdateKeywordRequest document for bulkUpdateKeyword. */
export const bulkUpdateKeywordArgumentsSchema = z
  .object({
    campaign_id: campaignIdSchema,
    requests: z.array(bulkUpdateKeywordDocumentSchema).min(1),
  })
  .strict();

/** Validated exact eBay path and query for getKeywords. */
export type GetKeywordsArguments = z.infer<typeof getKeywordsArgumentsSchema>;

/** Validated exact eBay path for getKeyword. */
export type GetKeywordArguments = z.infer<typeof getKeywordArgumentsSchema>;

/** Validated direct create accepted by createKeyword. */
export type CreateKeywordArguments = z.infer<typeof createKeywordArgumentsSchema>;

/** Validated direct update accepted by updateKeyword. */
export type UpdateKeywordArguments = z.infer<typeof updateKeywordArgumentsSchema>;

/** Validated direct batch accepted by bulkCreateKeyword. */
export type BulkCreateKeywordArguments = z.infer<typeof bulkCreateKeywordArgumentsSchema>;

/** Validated direct batch accepted by bulkUpdateKeyword. */
export type BulkUpdateKeywordArguments = z.infer<typeof bulkUpdateKeywordArgumentsSchema>;

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/pls:KeywordPagedCollectionResponse */
export type KeywordCollection = components['schemas']['KeywordPagedCollectionResponse'];

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/pls:Keyword */
export type Keyword = components['schemas']['Keyword'];

/** @see https://developer.ebay.com/api-docs/sell/marketing/resources/keyword/methods/createKeyword */
export type CreateKeywordCompletion =
  operations['createKeyword']['responses'][201]['content']['application/json'];

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/pls:UpdateKeywordResponse */
export type UpdateKeywordCompletion = components['schemas']['UpdateKeywordResponse'] | undefined;

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/pls:BulkCreateKeywordResponse */
export type BulkCreateKeywordCompletion = components['schemas']['BulkCreateKeywordResponse'];

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/pls:BulkUpdateKeywordResponse */
export type BulkUpdateKeywordCompletion = components['schemas']['BulkUpdateKeywordResponse'];

const campaignKeywordEndpoint = (campaignId: string): string =>
  `/sell/marketing/v1/ad_campaign/${encodeURIComponent(campaignId)}/keyword`;

const keywordEndpoint = (campaignId: string, keywordId: string): string =>
  `/sell/marketing/v1/ad_campaign/${encodeURIComponent(campaignId)}/keyword/${encodeURIComponent(keywordId)}`;

/**
 * Creates keywords in bulk for one priority strategy campaign.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param keywordBatch - Exact campaign path and direct BulkCreateKeywordRequest document.
 * @returns Explicit completion containing eBay's per-keyword create statuses.
 * @example `await bulkCreateKeyword(sellerSession, { campaign_id: '1', requests: [{ adGroupId: '2', keywordText: 'camera', matchType: 'EXACT' }] })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/keyword/methods/bulkCreateKeyword
 */
export const bulkCreateKeyword = (
  sellerSession: EbaySellerSession,
  keywordBatch: BulkCreateKeywordArguments,
): Promise<EbayRequestCompletion<BulkCreateKeywordCompletion>> => {
  const { campaign_id: campaignId, ...bulkKeywordDocument } = keywordBatch;
  return sellerSession.post<BulkCreateKeywordCompletion>({
    endpoint: `/sell/marketing/v1/ad_campaign/${encodeURIComponent(campaignId)}/bulk_create_keyword`,
    requestDocument: bulkKeywordDocument,
  });
};

/**
 * Updates keywords in bulk for one priority strategy campaign.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param keywordBatch - Exact campaign path and direct BulkUpdateKeywordRequest document.
 * @returns Explicit completion containing eBay's per-keyword update statuses.
 * @example `await bulkUpdateKeyword(sellerSession, { campaign_id: '1', requests: [{ keywordId: '3', keywordStatus: 'PAUSED' }] })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/keyword/methods/bulkUpdateKeyword
 */
export const bulkUpdateKeyword = (
  sellerSession: EbaySellerSession,
  keywordBatch: BulkUpdateKeywordArguments,
): Promise<EbayRequestCompletion<BulkUpdateKeywordCompletion>> => {
  const { campaign_id: campaignId, ...bulkKeywordDocument } = keywordBatch;
  return sellerSession.post<BulkUpdateKeywordCompletion>({
    endpoint: `/sell/marketing/v1/ad_campaign/${encodeURIComponent(campaignId)}/bulk_update_keyword`,
    requestDocument: bulkKeywordDocument,
  });
};

/**
 * Retrieves keywords for one campaign with exact eBay query filters.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param keywordPage - Exact campaign path and query fields, including underscore wire keys.
 * @returns Explicit completion containing eBay's unchanged keyword collection.
 * @example `await getKeywords(sellerSession, { campaign_id: '1', ad_group_ids: '2', limit: '25' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/keyword/methods/getKeywords
 */
export const getKeywords = (
  sellerSession: EbaySellerSession,
  keywordPage: GetKeywordsArguments,
): Promise<EbayRequestCompletion<KeywordCollection>> => {
  const { campaign_id: campaignId, ...keywordSearch } = keywordPage;
  return sellerSession.get<KeywordCollection>({
    endpoint: campaignKeywordEndpoint(campaignId),
    searchParameters: keywordSearch,
  });
};

/**
 * Creates one keyword for a priority strategy campaign ad group.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param keywordCreation - Exact campaign path and direct CreateKeywordRequest fields.
 * @returns Explicit completion after eBay creates the keyword.
 * @example `await createKeyword(sellerSession, { campaign_id: '1', adGroupId: '2', keywordText: 'camera', matchType: 'EXACT' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/keyword/methods/createKeyword
 */
export const createKeyword = (
  sellerSession: EbaySellerSession,
  keywordCreation: CreateKeywordArguments,
): Promise<EbayRequestCompletion<CreateKeywordCompletion>> => {
  const { campaign_id: campaignId, ...keywordDocument } = keywordCreation;
  return sellerSession.post<CreateKeywordCompletion>({
    endpoint: campaignKeywordEndpoint(campaignId),
    requestDocument: keywordDocument,
  });
};

/**
 * Retrieves one keyword by campaign and keyword identifiers.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param keywordSelection - Exact campaign and keyword path fields.
 * @returns Explicit completion containing eBay's unchanged keyword document.
 * @example `await getKeyword(sellerSession, { campaign_id: '1', keyword_id: '3' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/keyword/methods/getKeyword
 */
export const getKeyword = (
  sellerSession: EbaySellerSession,
  keywordSelection: GetKeywordArguments,
): Promise<EbayRequestCompletion<Keyword>> =>
  sellerSession.get<Keyword>({
    endpoint: keywordEndpoint(keywordSelection.campaign_id, keywordSelection.keyword_id),
  });

/**
 * Updates one keyword bid or status.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param keywordReplacement - Exact path and direct UpdateKeywordRequest fields.
 * @returns Explicit completion containing eBay's update response or empty success.
 * @example `await updateKeyword(sellerSession, { campaign_id: '1', keyword_id: '3', keywordStatus: 'PAUSED' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/keyword/methods/updateKeyword
 */
export const updateKeyword = (
  sellerSession: EbaySellerSession,
  keywordReplacement: UpdateKeywordArguments,
): Promise<EbayRequestCompletion<UpdateKeywordCompletion>> => {
  const { campaign_id: campaignId, keyword_id: keywordId, ...keywordDocument } = keywordReplacement;
  return sellerSession.put<UpdateKeywordCompletion>({
    endpoint: keywordEndpoint(campaignId, keywordId),
    requestDocument: keywordDocument,
  });
};

/** MCP definition for Marketing API bulkCreateKeyword. */
export const bulkCreateKeywordTool = defineTool({
  name: 'ebay_sell_marketing_bulk_create_keyword',
  namespace: 'sell.marketing',
  description: 'Create keywords in bulk for one eBay priority strategy campaign',
  argumentsSchema: bulkCreateKeywordArgumentsSchema,
  operationKind: 'write',
  operation: bulkCreateKeyword,
});

/** MCP definition for Marketing API bulkUpdateKeyword. */
export const bulkUpdateKeywordTool = defineTool({
  name: 'ebay_sell_marketing_bulk_update_keyword',
  namespace: 'sell.marketing',
  description: 'Update keywords in bulk for one eBay priority strategy campaign',
  argumentsSchema: bulkUpdateKeywordArgumentsSchema,
  operationKind: 'write',
  operation: bulkUpdateKeyword,
});

/** MCP definition for Marketing API getKeywords. */
export const getKeywordsTool = defineTool({
  name: 'ebay_sell_marketing_get_keywords',
  namespace: 'sell.marketing',
  description: 'Retrieve keywords for one eBay marketing campaign with exact filters',
  argumentsSchema: getKeywordsArgumentsSchema,
  operationKind: 'read',
  operation: getKeywords,
});

/** MCP definition for Marketing API createKeyword. */
export const createKeywordTool = defineTool({
  name: 'ebay_sell_marketing_create_keyword',
  namespace: 'sell.marketing',
  description: 'Create one keyword for an eBay priority strategy campaign ad group',
  argumentsSchema: createKeywordArgumentsSchema,
  operationKind: 'write',
  operation: createKeyword,
});

/** MCP definition for Marketing API getKeyword. */
export const getKeywordTool = defineTool({
  name: 'ebay_sell_marketing_get_keyword',
  namespace: 'sell.marketing',
  description: 'Retrieve one eBay marketing keyword by campaign and keyword identifiers',
  argumentsSchema: getKeywordArgumentsSchema,
  operationKind: 'read',
  operation: getKeyword,
});

/** MCP definition for Marketing API updateKeyword. */
export const updateKeywordTool = defineTool({
  name: 'ebay_sell_marketing_update_keyword',
  namespace: 'sell.marketing',
  description: 'Update one eBay marketing keyword bid or status',
  argumentsSchema: updateKeywordArgumentsSchema,
  operationKind: 'write',
  operation: updateKeyword,
});
