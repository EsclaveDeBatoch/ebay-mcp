import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/marketing-and-promotions/sellMarketingV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';

const campaignIdSchema = z.string().min(1);
const adGroupIdSchema = z.string().min(1);
const pageSizeSchema = z.string().regex(/^[1-9]\d*$/, 'limit must be a positive integer string');
const pageOffsetSchema = z
  .string()
  .regex(/^(?:0|[1-9]\d*)$/, 'offset must be a non-negative integer string');
const matchTypeSchema = z.enum(['BROAD', 'EXACT', 'PHRASE']);

const amountSchema = z
  .object({
    currency: z.string().regex(/^[A-Z]{3}$/, 'currency must use a three-letter ISO code'),
    value: z.string().min(1),
  })
  .strict();

const keywordRequestSchema = z
  .object({
    keywordText: z.string().min(1).max(100).optional(),
    matchType: matchTypeSchema.optional(),
  })
  .strict();

const createAdGroupRequestSchema = z
  .object({
    defaultBid: amountSchema.optional(),
    name: z.string().min(1).optional(),
  })
  .strict();

const updateAdGroupRequestSchema = z
  .object({
    adGroupStatus: z.string().min(1).optional(),
    defaultBid: amountSchema.optional(),
    name: z.string().min(1).optional(),
  })
  .strict();

/** Exact path and query wire keys accepted by getAdGroups. */
export const getAdGroupsArgumentsSchema = z
  .object({
    ad_group_status: z.string().min(1).optional(),
    campaign_id: campaignIdSchema,
    limit: pageSizeSchema.optional(),
    offset: pageOffsetSchema.optional(),
  })
  .strict();

/** Exact path and direct CreateAdGroupRequest fields. */
export const createAdGroupArgumentsSchema = createAdGroupRequestSchema
  .extend({
    campaign_id: campaignIdSchema,
  })
  .strict();

/** Exact campaign and ad-group path accepted by getAdGroup. */
export const adGroupPathArgumentsSchema = z
  .object({
    ad_group_id: adGroupIdSchema,
    campaign_id: campaignIdSchema,
  })
  .strict();

/** Exact path and direct UpdateAdGroupRequest fields. */
export const updateAdGroupArgumentsSchema = updateAdGroupRequestSchema
  .extend({
    ad_group_id: adGroupIdSchema,
    campaign_id: campaignIdSchema,
  })
  .strict();

/** Exact path and direct TargetedBidRequest fields. */
export const suggestBidsArgumentsSchema = z
  .object({
    ad_group_id: adGroupIdSchema,
    campaign_id: campaignIdSchema,
    keywords: z.array(keywordRequestSchema).min(1).max(500).optional(),
  })
  .strict();

/** Exact path and direct TargetedKeywordRequest fields. */
export const suggestKeywordsArgumentsSchema = z
  .object({
    additionalInfo: z.array(z.string().min(1)).min(1).optional(),
    ad_group_id: adGroupIdSchema,
    campaign_id: campaignIdSchema,
    exclusions: z.array(z.string().min(1)).min(1).optional(),
    listingIds: z.array(z.string().min(1)).min(1).max(300).optional(),
    matchType: matchTypeSchema.optional(),
  })
  .strict();

/** Validated getAdGroups path and query. */
export type GetAdGroupsArguments = z.infer<typeof getAdGroupsArgumentsSchema>;

/** Validated createAdGroup path and document. */
export type CreateAdGroupArguments = z.infer<typeof createAdGroupArgumentsSchema>;

/** Validated single ad-group path. */
export type AdGroupPathArguments = z.infer<typeof adGroupPathArgumentsSchema>;

/** Validated updateAdGroup path and document. */
export type UpdateAdGroupArguments = z.infer<typeof updateAdGroupArgumentsSchema>;

/** Validated suggestBids path and document. */
export type SuggestBidsArguments = z.infer<typeof suggestBidsArgumentsSchema>;

/** Validated suggestKeywords path and document. */
export type SuggestKeywordsArguments = z.infer<typeof suggestKeywordsArgumentsSchema>;

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/pls:AdGroupPagedCollectionResponse */
export type AdGroupPagedCollection = components['schemas']['AdGroupPagedCollectionResponse'];

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/pls:AdGroup */
export type AdGroup = components['schemas']['AdGroup'];

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/pls:TargetedBidsPagedCollection */
export type TargetedBidsPagedCollection = components['schemas']['TargetedBidsPagedCollection'];

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/pls:TargetedKeywordsPagedCollection */
export type TargetedKeywordsPagedCollection =
  components['schemas']['TargetedKeywordsPagedCollection'];

function campaignEndpoint(campaignId: string): string {
  return `/sell/marketing/v1/ad_campaign/${encodeURIComponent(campaignId)}`;
}

function adGroupEndpoint(campaignId: string, adGroupId: string): string {
  return `${campaignEndpoint(campaignId)}/ad_group/${encodeURIComponent(adGroupId)}`;
}

/**
 * Retrieves ad groups for one campaign with exact eBay query filters.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param adGroupPage - Exact campaign path and snake_case query wire keys.
 * @returns Explicit completion containing eBay's unchanged ad-group collection.
 * @example `await getAdGroups(sellerSession, { campaign_id: 'C1', ad_group_status: 'RUNNING', limit: '25', offset: '0' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/ad_group/methods/getAdGroups
 */
export const getAdGroups = (
  sellerSession: EbaySellerSession,
  adGroupPage: GetAdGroupsArguments,
): Promise<EbayRequestCompletion<AdGroupPagedCollection>> => {
  const { campaign_id: campaignId, ...adGroupSearch } = adGroupPage;
  return sellerSession.get<AdGroupPagedCollection>({
    endpoint: `${campaignEndpoint(campaignId)}/ad_group`,
    searchParameters: adGroupSearch,
  });
};

/**
 * Creates one ad group in a campaign.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param adGroupCreation - Exact campaign path and direct CreateAdGroupRequest fields.
 * @returns Explicit completion after eBay creates the ad group.
 * @example `await createAdGroup(sellerSession, { campaign_id: 'C1', name: 'Cameras', defaultBid: { currency: 'USD', value: '0.50' } })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/ad_group/methods/createAdGroup
 */
export const createAdGroup = (
  sellerSession: EbaySellerSession,
  adGroupCreation: CreateAdGroupArguments,
): Promise<EbayRequestCompletion<undefined>> => {
  const { campaign_id: campaignId, ...adGroupDocument } = adGroupCreation;
  return sellerSession.post<undefined>({
    endpoint: `${campaignEndpoint(campaignId)}/ad_group`,
    requestDocument: adGroupDocument,
  });
};

/**
 * Retrieves one ad group by campaign and ad-group identifiers.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param adGroupSelection - Exact campaign and ad-group path wire keys.
 * @returns Explicit completion containing eBay's unchanged ad-group document.
 * @example `await getAdGroup(sellerSession, { campaign_id: 'C1', ad_group_id: 'G1' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/ad_group/methods/getAdGroup
 */
export const getAdGroup = (
  sellerSession: EbaySellerSession,
  adGroupSelection: AdGroupPathArguments,
): Promise<EbayRequestCompletion<AdGroup>> =>
  sellerSession.get<AdGroup>({
    endpoint: adGroupEndpoint(adGroupSelection.campaign_id, adGroupSelection.ad_group_id),
  });

/**
 * Fully updates one ad group.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param adGroupReplacement - Exact path and direct UpdateAdGroupRequest fields.
 * @returns Explicit completion after eBay updates the ad group.
 * @example `await updateAdGroup(sellerSession, { campaign_id: 'C1', ad_group_id: 'G1', name: 'Lenses', adGroupStatus: 'RUNNING' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/ad_group/methods/updateAdGroup
 */
export const updateAdGroup = (
  sellerSession: EbaySellerSession,
  adGroupReplacement: UpdateAdGroupArguments,
): Promise<EbayRequestCompletion<undefined>> => {
  const {
    ad_group_id: adGroupId,
    campaign_id: campaignId,
    ...adGroupDocument
  } = adGroupReplacement;
  return sellerSession.put<undefined>({
    endpoint: adGroupEndpoint(campaignId, adGroupId),
    requestDocument: adGroupDocument,
  });
};

/**
 * Suggests bids for keywords in one ad group.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param bidSuggestion - Exact path and direct TargetedBidRequest fields.
 * @returns Explicit completion containing eBay's unchanged suggested bids.
 * @example `await suggestBids(sellerSession, { campaign_id: 'C1', ad_group_id: 'G1', keywords: [{ keywordText: 'camera', matchType: 'EXACT' }] })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/ad_group/methods/suggestBids
 */
export const suggestBids = (
  sellerSession: EbaySellerSession,
  bidSuggestion: SuggestBidsArguments,
): Promise<EbayRequestCompletion<TargetedBidsPagedCollection>> => {
  const { ad_group_id: adGroupId, campaign_id: campaignId, ...bidDocument } = bidSuggestion;
  return sellerSession.post<TargetedBidsPagedCollection>({
    endpoint: `${adGroupEndpoint(campaignId, adGroupId)}/suggest_bids`,
    requestDocument: bidDocument,
  });
};

/**
 * Suggests keywords for one ad group.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param keywordSuggestion - Exact path and direct TargetedKeywordRequest fields.
 * @returns Explicit completion containing eBay's unchanged suggested keywords.
 * @example `await suggestKeywords(sellerSession, { campaign_id: 'C1', ad_group_id: 'G1', listingIds: ['1'], matchType: 'BROAD' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/ad_group/methods/suggestKeywords
 */
export const suggestKeywords = (
  sellerSession: EbaySellerSession,
  keywordSuggestion: SuggestKeywordsArguments,
): Promise<EbayRequestCompletion<TargetedKeywordsPagedCollection>> => {
  const { ad_group_id: adGroupId, campaign_id: campaignId, ...keywordDocument } = keywordSuggestion;
  return sellerSession.post<TargetedKeywordsPagedCollection>({
    endpoint: `${adGroupEndpoint(campaignId, adGroupId)}/suggest_keywords`,
    requestDocument: keywordDocument,
  });
};

/** MCP definition for Marketing API getAdGroups. */
export const getAdGroupsTool = defineTool({
  name: 'ebay_sell_marketing_get_ad_groups',
  namespace: 'sell.marketing',
  description: 'Retrieve Promoted Listings ad groups for one campaign',
  argumentsSchema: getAdGroupsArgumentsSchema,
  operationKind: 'read',
  operation: getAdGroups,
});

/** MCP definition for Marketing API createAdGroup. */
export const createAdGroupTool = defineTool({
  name: 'ebay_sell_marketing_create_ad_group',
  namespace: 'sell.marketing',
  description: 'Create one Promoted Listings ad group in a campaign',
  argumentsSchema: createAdGroupArgumentsSchema,
  operationKind: 'write',
  operation: createAdGroup,
});

/** MCP definition for Marketing API getAdGroup. */
export const getAdGroupTool = defineTool({
  name: 'ebay_sell_marketing_get_ad_group',
  namespace: 'sell.marketing',
  description: 'Retrieve one Promoted Listings ad group by campaign and ad-group identifiers',
  argumentsSchema: adGroupPathArgumentsSchema,
  operationKind: 'read',
  operation: getAdGroup,
});

/** MCP definition for Marketing API updateAdGroup. */
export const updateAdGroupTool = defineTool({
  name: 'ebay_sell_marketing_update_ad_group',
  namespace: 'sell.marketing',
  description: 'Update one Promoted Listings ad group',
  argumentsSchema: updateAdGroupArgumentsSchema,
  operationKind: 'write',
  operation: updateAdGroup,
});

/** MCP definition for Marketing API suggestBids. */
export const suggestBidsTool = defineTool({
  name: 'ebay_sell_marketing_suggest_bids',
  namespace: 'sell.marketing',
  description: 'Suggest bids for keywords in one Promoted Listings ad group',
  argumentsSchema: suggestBidsArgumentsSchema,
  operationKind: 'read',
  operation: suggestBids,
});

/** MCP definition for Marketing API suggestKeywords. */
export const suggestKeywordsTool = defineTool({
  name: 'ebay_sell_marketing_suggest_keywords',
  namespace: 'sell.marketing',
  description: 'Suggest keywords for one Promoted Listings ad group',
  argumentsSchema: suggestKeywordsArgumentsSchema,
  operationKind: 'read',
  operation: suggestKeywords,
});
