import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type {
  components,
  operations,
} from '@/generated/ebay/sell-apps/marketing-and-promotions/sellMarketingV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';

const campaignIdSchema = z.string().min(1);
const pageSizeSchema = z.string().regex(/^[1-9]\d*$/, 'limit must be a positive integer string');
const pageOffsetSchema = z
  .string()
  .regex(/^(?:0|[1-9]\d*)$/, 'offset must be a non-negative integer string');

const amountSchema = z
  .object({
    currency: z.string().min(1),
    value: z.string().min(1),
  })
  .strict();

const budgetRequestSchema = z
  .object({
    amount: amountSchema.optional(),
  })
  .strict();

const campaignBudgetRequestSchema = z
  .object({
    daily: budgetRequestSchema.optional(),
  })
  .strict();

const selectionRuleSchema = z
  .object({
    brands: z.array(z.string().min(1)).optional(),
    categoryIds: z.array(z.string().min(1)).optional(),
    categoryScope: z.string().min(1).optional(),
    listingConditionIds: z.array(z.string().min(1)).optional(),
    maxPrice: amountSchema.optional(),
    minPrice: amountSchema.optional(),
  })
  .strict();

const campaignCriterionSchema = z
  .object({
    autoSelectFutureInventory: z.boolean().optional(),
    criterionType: z.string().min(1).optional(),
    selectionRules: z.array(selectionRuleSchema).optional(),
  })
  .strict();

const bidPreferenceSchema = z
  .object({
    maxCpc: z
      .object({
        amount: amountSchema.optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

const dynamicAdRatePreferenceSchema = z
  .object({
    adRateAdjustmentPercent: z.string().min(1).optional(),
    adRateCapPercent: z.string().min(1).optional(),
  })
  .strict();

const fundingStrategySchema = z
  .object({
    adRateStrategy: z.string().min(1).optional(),
    biddingStrategy: z.string().min(1).optional(),
    bidPercentage: z.string().min(1).optional(),
    bidPreferences: z.array(bidPreferenceSchema).optional(),
    dynamicAdRatePreferences: z.array(dynamicAdRatePreferenceSchema).optional(),
    fundingModel: z.string().min(1).optional(),
  })
  .strict();

/** Exact eBay query fields accepted by getCampaigns. */
export const getCampaignsArgumentsSchema = z
  .object({
    campaign_name: z.string().min(1).optional(),
    campaign_status: z.string().min(1).optional(),
    campaign_targeting_types: z.string().min(1).optional(),
    channels: z.string().min(1).optional(),
    end_date_range: z.string().min(1).optional(),
    funding_strategy: z.string().min(1).optional(),
    limit: pageSizeSchema.optional(),
    offset: pageOffsetSchema.optional(),
    start_date_range: z.string().min(1).optional(),
  })
  .strict();

/** Exact campaign path accepted by single-campaign operations. */
export const campaignIdArgumentsSchema = z.object({ campaign_id: campaignIdSchema }).strict();

/** Exact path and direct CloneCampaignRequest fields for cloneCampaign. */
export const cloneCampaignArgumentsSchema = z
  .object({
    campaign_id: campaignIdSchema,
    campaignName: z.string().min(1).max(80),
    endDate: z.string().min(1).optional(),
    fundingStrategy: fundingStrategySchema.optional(),
    startDate: z.string().min(1).optional(),
  })
  .strict();

/** Direct CreateCampaignRequest fields for createCampaign. */
export const createCampaignArgumentsSchema = z
  .object({
    budget: campaignBudgetRequestSchema.optional(),
    campaignCriterion: campaignCriterionSchema.optional(),
    campaignName: z.string().min(1).max(80),
    campaignTargetingType: z.string().min(1).optional(),
    channels: z.array(z.string().min(1)).optional(),
    endDate: z.string().min(1).optional(),
    fundingStrategy: fundingStrategySchema,
    marketplaceId: z.string().min(1),
    startDate: z.string().min(1),
  })
  .strict();

/** Exact eBay query fields accepted by findCampaignByAdReference. */
export const findCampaignByAdReferenceArgumentsSchema = z
  .object({
    inventory_reference_id: z.string().min(1).optional(),
    inventory_reference_type: z.string().min(1).optional(),
    listing_id: z.string().min(1).optional(),
  })
  .strict();

/** Exact eBay query accepted by getCampaignByName. */
export const getCampaignByNameArgumentsSchema = z
  .object({
    campaign_name: z.string().min(1),
  })
  .strict();

/** Direct QuickSetupRequest fields for setupQuickCampaign. */
export const setupQuickCampaignArgumentsSchema = z
  .object({
    budget: campaignBudgetRequestSchema.optional(),
    campaignName: z.string().min(1).max(80),
    endDate: z.string().min(1).optional(),
    listingIds: z.array(z.string().min(1)).optional(),
    marketplaceId: z.string().min(1),
    startDate: z.string().min(1),
  })
  .strict();

/** Exact marketplace header accepted by suggestBudget. */
export const suggestBudgetArgumentsSchema = z
  .object({
    'X-EBAY-C-MARKETPLACE-ID': z.string().min(1),
  })
  .strict();

/** Exact path and query fields accepted by suggestItems. */
export const suggestItemsArgumentsSchema = z
  .object({
    campaign_id: campaignIdSchema,
    category_ids: z.string().min(1).optional(),
    limit: pageSizeSchema.optional(),
    offset: pageOffsetSchema.optional(),
  })
  .strict();

/** Direct SuggestMaxCpcRequest fields for suggestMaxCpc. */
export const suggestMaxCpcArgumentsSchema = z
  .object({
    listingIds: z.array(z.string().min(1)).min(1),
    marketplaceId: z.string().min(1),
  })
  .strict();

/** Exact path and UpdateAdrateStrategyRequest fields. */
export const updateAdRateStrategyArgumentsSchema = z
  .object({
    campaign_id: campaignIdSchema,
    adRateStrategy: z.string().min(1).optional(),
    bidPercentage: z.string().min(1).optional(),
    dynamicAdRatePreferences: z.array(dynamicAdRatePreferenceSchema).optional(),
  })
  .strict();

/** Exact path and UpdateBiddingStrategyRequest fields. */
export const updateBiddingStrategyArgumentsSchema = z
  .object({
    campaign_id: campaignIdSchema,
    biddingStrategy: z.string().min(1).optional(),
    bidPreferences: z.array(bidPreferenceSchema).optional(),
  })
  .strict();

/** Exact path and UpdateCampaignBudgetRequest fields. */
export const updateCampaignBudgetArgumentsSchema = z
  .object({
    campaign_id: campaignIdSchema,
    daily: budgetRequestSchema.optional(),
  })
  .strict();

/** Exact path and UpdateCampaignIdentificationRequest fields. */
export const updateCampaignIdentificationArgumentsSchema = z
  .object({
    campaign_id: campaignIdSchema,
    campaignName: z.string().min(1).max(80).optional(),
    endDate: z.string().min(1).optional(),
    startDate: z.string().min(1).optional(),
  })
  .strict();

/** Validated exact eBay query for getCampaigns. */
export type GetCampaignsArguments = z.infer<typeof getCampaignsArgumentsSchema>;

/** Validated exact campaign path. */
export type CampaignIdArguments = z.infer<typeof campaignIdArgumentsSchema>;

/** Validated path and clone document. */
export type CloneCampaignArguments = z.infer<typeof cloneCampaignArgumentsSchema>;

/** Validated direct create document. */
export type CreateCampaignArguments = z.infer<typeof createCampaignArgumentsSchema>;

/** Validated exact ad-reference query. */
export type FindCampaignByAdReferenceArguments = z.infer<
  typeof findCampaignByAdReferenceArgumentsSchema
>;

/** Validated exact campaign-name query. */
export type GetCampaignByNameArguments = z.infer<typeof getCampaignByNameArgumentsSchema>;

/** Validated direct quick-setup document. */
export type SetupQuickCampaignArguments = z.infer<typeof setupQuickCampaignArgumentsSchema>;

/** Validated marketplace header for budget suggestion. */
export type SuggestBudgetArguments = z.infer<typeof suggestBudgetArgumentsSchema>;

/** Validated path and item-suggestion query. */
export type SuggestItemsArguments = z.infer<typeof suggestItemsArgumentsSchema>;

/** Validated direct max-CPC suggestion document. */
export type SuggestMaxCpcArguments = z.infer<typeof suggestMaxCpcArgumentsSchema>;

/** Validated path and ad-rate strategy update. */
export type UpdateAdRateStrategyArguments = z.infer<typeof updateAdRateStrategyArgumentsSchema>;

/** Validated path and bidding strategy update. */
export type UpdateBiddingStrategyArguments = z.infer<typeof updateBiddingStrategyArgumentsSchema>;

/** Validated path and budget update. */
export type UpdateCampaignBudgetArguments = z.infer<typeof updateCampaignBudgetArgumentsSchema>;

/** Validated path and identification update. */
export type UpdateCampaignIdentificationArguments = z.infer<
  typeof updateCampaignIdentificationArgumentsSchema
>;

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/pls:CampaignPagedCollectionResponse */
export type CampaignCollection = components['schemas']['CampaignPagedCollectionResponse'];

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/pls:Campaign */
export type Campaign = components['schemas']['Campaign'];

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/pls:Campaigns */
export type CampaignsByAdReference = components['schemas']['Campaigns'];

/** @see https://developer.ebay.com/api-docs/sell/marketing/resources/campaign/methods/createCampaign */
export type CreatedCampaign =
  operations['createCampaign']['responses'][201]['content']['application/json'];

/** @see https://developer.ebay.com/api-docs/sell/marketing/resources/campaign/methods/cloneCampaign */
export type ClonedCampaign =
  operations['cloneCampaign']['responses'][201]['content']['application/json'];

/** @see https://developer.ebay.com/api-docs/sell/marketing/resources/campaign/methods/setupQuickCampaign */
export type QuickSetupCampaign =
  operations['setupQuickCampaign']['responses'][201]['content']['application/json'];

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/pls:SuggestBudgetResponse */
export type SuggestedBudget = components['schemas']['SuggestBudgetResponse'];

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/pls:TargetedAdsPagedCollection */
export type SuggestedItems = components['schemas']['TargetedAdsPagedCollection'];

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/pls:SuggestMaxCpcResponse */
export type SuggestedMaxCpc = components['schemas']['SuggestMaxCpcResponse'];

const campaignBasePath = '/sell/marketing/v1/ad_campaign';

const campaignEndpoint = (campaignId: string): string =>
  `${campaignBasePath}/${encodeURIComponent(campaignId)}`;

/**
 * Retrieves seller campaigns with exact eBay query filters and pagination.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param campaignPage - Exact eBay query fields for campaign listing.
 * @returns Explicit completion containing eBay's unchanged campaign collection.
 * @example `await getCampaigns(sellerSession, { campaign_status: 'RUNNING', limit: '25' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/campaign/methods/getCampaigns
 */
export const getCampaigns = (
  sellerSession: EbaySellerSession,
  campaignPage: GetCampaignsArguments = {},
): Promise<EbayRequestCompletion<CampaignCollection>> =>
  sellerSession.get<CampaignCollection>({
    endpoint: campaignBasePath,
    searchParameters: campaignPage,
  });

/**
 * Retrieves one campaign by eBay campaign identifier.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param campaignSelection - Exact campaign path.
 * @returns Explicit completion containing eBay's unchanged campaign document.
 * @example `await getCampaign(sellerSession, { campaign_id: '1' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/campaign/methods/getCampaign
 */
export const getCampaign = (
  sellerSession: EbaySellerSession,
  campaignSelection: CampaignIdArguments,
): Promise<EbayRequestCompletion<Campaign>> =>
  sellerSession.get<Campaign>({ endpoint: campaignEndpoint(campaignSelection.campaign_id) });

/**
 * Creates one Promoted Listings campaign.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param campaignCreation - Direct CreateCampaignRequest fields.
 * @returns Explicit completion containing eBay's empty creation document.
 * @example `await createCampaign(sellerSession, { campaignName: 'Spring', marketplaceId: 'EBAY_US', startDate: '2026-01-01T00:00:00Z', fundingStrategy: { fundingModel: 'COST_PER_SALE', bidPercentage: '5.0' } })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/campaign/methods/createCampaign
 */
export const createCampaign = (
  sellerSession: EbaySellerSession,
  campaignCreation: CreateCampaignArguments,
): Promise<EbayRequestCompletion<CreatedCampaign>> =>
  sellerSession.post<CreatedCampaign>({
    endpoint: campaignBasePath,
    requestDocument: campaignCreation,
  });

/**
 * Clones one ended rules-based campaign.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param campaignClone - Exact path and direct CloneCampaignRequest fields.
 * @returns Explicit completion containing eBay's empty creation document.
 * @example `await cloneCampaign(sellerSession, { campaign_id: '1', campaignName: 'Spring clone', startDate: '2026-02-01T00:00:00Z' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/campaign/methods/cloneCampaign
 */
export const cloneCampaign = (
  sellerSession: EbaySellerSession,
  campaignClone: CloneCampaignArguments,
): Promise<EbayRequestCompletion<ClonedCampaign>> => {
  const { campaign_id: campaignId, ...cloneDocument } = campaignClone;
  return sellerSession.post<ClonedCampaign>({
    endpoint: `${campaignEndpoint(campaignId)}/clone`,
    requestDocument: cloneDocument,
  });
};

/**
 * Deletes one ended campaign.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param campaignSelection - Exact campaign path.
 * @returns Explicit completion after eBay deletes the campaign.
 * @example `await deleteCampaign(sellerSession, { campaign_id: '1' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/campaign/methods/deleteCampaign
 */
export const deleteCampaign = (
  sellerSession: EbaySellerSession,
  campaignSelection: CampaignIdArguments,
): Promise<EbayRequestCompletion<undefined>> =>
  sellerSession.delete<undefined>({ endpoint: campaignEndpoint(campaignSelection.campaign_id) });

/**
 * Ends one running or paused campaign.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param campaignSelection - Exact campaign path.
 * @returns Explicit completion after eBay ends the campaign.
 * @example `await endCampaign(sellerSession, { campaign_id: '1' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/campaign/methods/endCampaign
 */
export const endCampaign = (
  sellerSession: EbaySellerSession,
  campaignSelection: CampaignIdArguments,
): Promise<EbayRequestCompletion<undefined>> =>
  sellerSession.post<undefined>({
    endpoint: `${campaignEndpoint(campaignSelection.campaign_id)}/end`,
  });

/**
 * Finds campaigns associated with one listing or inventory reference.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param adReferenceLookup - Exact eBay query fields for the ad reference.
 * @returns Explicit completion containing matching campaigns.
 * @example `await findCampaignByAdReference(sellerSession, { listing_id: '110000000000' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/campaign/methods/findCampaignByAdReference
 */
export const findCampaignByAdReference = (
  sellerSession: EbaySellerSession,
  adReferenceLookup: FindCampaignByAdReferenceArguments = {},
): Promise<EbayRequestCompletion<CampaignsByAdReference>> =>
  sellerSession.get<CampaignsByAdReference>({
    endpoint: `${campaignBasePath}/find_campaign_by_ad_reference`,
    searchParameters: adReferenceLookup,
  });

/**
 * Retrieves one campaign by its seller-defined name.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param campaignNameLookup - Exact required campaign_name query.
 * @returns Explicit completion containing eBay's unchanged campaign document.
 * @example `await getCampaignByName(sellerSession, { campaign_name: 'Spring' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/campaign/methods/getCampaignByName
 */
export const getCampaignByName = (
  sellerSession: EbaySellerSession,
  campaignNameLookup: GetCampaignByNameArguments,
): Promise<EbayRequestCompletion<Campaign>> =>
  sellerSession.get<Campaign>({
    endpoint: `${campaignBasePath}/get_campaign_by_name`,
    searchParameters: campaignNameLookup,
  });

/**
 * Launches one draft priority-strategy campaign.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param campaignSelection - Exact campaign path.
 * @returns Explicit completion after eBay launches the campaign.
 * @example `await launchCampaign(sellerSession, { campaign_id: '1' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/campaign/methods/launchCampaign
 */
export const launchCampaign = (
  sellerSession: EbaySellerSession,
  campaignSelection: CampaignIdArguments,
): Promise<EbayRequestCompletion<undefined>> =>
  sellerSession.post<undefined>({
    endpoint: `${campaignEndpoint(campaignSelection.campaign_id)}/launch`,
  });

/**
 * Pauses one running campaign.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param campaignSelection - Exact campaign path.
 * @returns Explicit completion after eBay pauses the campaign.
 * @example `await pauseCampaign(sellerSession, { campaign_id: '1' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/campaign/methods/pauseCampaign
 */
export const pauseCampaign = (
  sellerSession: EbaySellerSession,
  campaignSelection: CampaignIdArguments,
): Promise<EbayRequestCompletion<undefined>> =>
  sellerSession.post<undefined>({
    endpoint: `${campaignEndpoint(campaignSelection.campaign_id)}/pause`,
  });

/**
 * Resumes one paused campaign.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param campaignSelection - Exact campaign path.
 * @returns Explicit completion after eBay resumes the campaign.
 * @example `await resumeCampaign(sellerSession, { campaign_id: '1' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/campaign/methods/resumeCampaign
 */
export const resumeCampaign = (
  sellerSession: EbaySellerSession,
  campaignSelection: CampaignIdArguments,
): Promise<EbayRequestCompletion<undefined>> =>
  sellerSession.post<undefined>({
    endpoint: `${campaignEndpoint(campaignSelection.campaign_id)}/resume`,
  });

/**
 * Creates one priority-strategy campaign through quick setup.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param quickSetup - Direct QuickSetupRequest fields.
 * @returns Explicit completion containing eBay's empty creation document.
 * @example `await setupQuickCampaign(sellerSession, { campaignName: 'Priority', marketplaceId: 'EBAY_US', startDate: '2026-01-01T00:00:00Z', listingIds: ['110000000000'] })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/campaign/methods/setupQuickCampaign
 */
export const setupQuickCampaign = (
  sellerSession: EbaySellerSession,
  quickSetup: SetupQuickCampaignArguments,
): Promise<EbayRequestCompletion<QuickSetupCampaign>> =>
  sellerSession.post<QuickSetupCampaign>({
    endpoint: `${campaignBasePath}/setup_quick_campaign`,
    requestDocument: quickSetup,
  });

/**
 * Suggests a daily budget for an offsite campaign.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param budgetSuggestion - Exact marketplace header.
 * @returns Explicit completion containing eBay's budget suggestion.
 * @example `await suggestBudget(sellerSession, { 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/campaign/methods/suggestBudget
 */
export const suggestBudget = (
  sellerSession: EbaySellerSession,
  budgetSuggestion: SuggestBudgetArguments,
): Promise<EbayRequestCompletion<SuggestedBudget>> =>
  sellerSession.get<SuggestedBudget>({
    endpoint: `${campaignBasePath}/suggest_budget`,
    requestHeaders: {
      'X-EBAY-C-MARKETPLACE-ID': budgetSuggestion['X-EBAY-C-MARKETPLACE-ID'],
    },
  });

/**
 * Suggests listings that may benefit from promotion in one campaign.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param itemSuggestion - Exact path and query fields.
 * @returns Explicit completion containing eBay's suggested items page.
 * @example `await suggestItems(sellerSession, { campaign_id: '1', limit: '10' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/campaign/methods/suggestItems
 */
export const suggestItems = (
  sellerSession: EbaySellerSession,
  itemSuggestion: SuggestItemsArguments,
): Promise<EbayRequestCompletion<SuggestedItems>> => {
  const { campaign_id: campaignId, ...itemSuggestionQuery } = itemSuggestion;
  return sellerSession.get<SuggestedItems>({
    endpoint: `${campaignEndpoint(campaignId)}/suggest_items`,
    searchParameters: itemSuggestionQuery,
  });
};

/**
 * Suggests a max CPC for a smart targeting campaign.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param maxCpcSuggestion - Direct SuggestMaxCpcRequest fields.
 * @returns Explicit completion containing eBay's max CPC suggestion.
 * @example `await suggestMaxCpc(sellerSession, { listingIds: ['110000000000'], marketplaceId: 'EBAY_US' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/campaign/methods/suggestMaxCpc
 */
export const suggestMaxCpc = (
  sellerSession: EbaySellerSession,
  maxCpcSuggestion: SuggestMaxCpcArguments,
): Promise<EbayRequestCompletion<SuggestedMaxCpc>> =>
  sellerSession.post<SuggestedMaxCpc>({
    endpoint: `${campaignBasePath}/suggest_max_cpc`,
    requestDocument: maxCpcSuggestion,
  });

/**
 * Updates the ad rate strategy for one CPS campaign.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param adRateUpdate - Exact path and UpdateAdrateStrategyRequest fields.
 * @returns Explicit completion after eBay updates the ad rate strategy.
 * @example `await updateAdRateStrategy(sellerSession, { campaign_id: '1', adRateStrategy: 'DYNAMIC' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/campaign/methods/updateAdRateStrategy
 */
export const updateAdRateStrategy = (
  sellerSession: EbaySellerSession,
  adRateUpdate: UpdateAdRateStrategyArguments,
): Promise<EbayRequestCompletion<undefined>> => {
  const { campaign_id: campaignId, ...adRateDocument } = adRateUpdate;
  return sellerSession.post<undefined>({
    endpoint: `${campaignEndpoint(campaignId)}/update_ad_rate_strategy`,
    requestDocument: adRateDocument,
  });
};

/**
 * Updates the bidding strategy for one CPC campaign.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param biddingUpdate - Exact path and UpdateBiddingStrategyRequest fields.
 * @returns Explicit completion after eBay updates the bidding strategy.
 * @example `await updateBiddingStrategy(sellerSession, { campaign_id: '1', biddingStrategy: 'DYNAMIC' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/campaign/methods/updateBiddingStrategy
 */
export const updateBiddingStrategy = (
  sellerSession: EbaySellerSession,
  biddingUpdate: UpdateBiddingStrategyArguments,
): Promise<EbayRequestCompletion<undefined>> => {
  const { campaign_id: campaignId, ...biddingDocument } = biddingUpdate;
  return sellerSession.post<undefined>({
    endpoint: `${campaignEndpoint(campaignId)}/update_bidding_strategy`,
    requestDocument: biddingDocument,
  });
};

/**
 * Updates the daily budget for one CPC campaign.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param budgetUpdate - Exact path and UpdateCampaignBudgetRequest fields.
 * @returns Explicit completion after eBay updates the campaign budget.
 * @example `await updateCampaignBudget(sellerSession, { campaign_id: '1', daily: { amount: { currency: 'USD', value: '50.00' } } })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/campaign/methods/updateCampaignBudget
 */
export const updateCampaignBudget = (
  sellerSession: EbaySellerSession,
  budgetUpdate: UpdateCampaignBudgetArguments,
): Promise<EbayRequestCompletion<undefined>> => {
  const { campaign_id: campaignId, ...budgetDocument } = budgetUpdate;
  return sellerSession.post<undefined>({
    endpoint: `${campaignEndpoint(campaignId)}/update_campaign_budget`,
    requestDocument: budgetDocument,
  });
};

/**
 * Updates the name and schedule for one campaign.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param identificationUpdate - Exact path and UpdateCampaignIdentificationRequest fields.
 * @returns Explicit completion after eBay updates the campaign identification.
 * @example `await updateCampaignIdentification(sellerSession, { campaign_id: '1', campaignName: 'Spring renamed', startDate: '2026-01-01T00:00:00Z' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/campaign/methods/updateCampaignIdentification
 */
export const updateCampaignIdentification = (
  sellerSession: EbaySellerSession,
  identificationUpdate: UpdateCampaignIdentificationArguments,
): Promise<EbayRequestCompletion<undefined>> => {
  const { campaign_id: campaignId, ...identificationDocument } = identificationUpdate;
  return sellerSession.post<undefined>({
    endpoint: `${campaignEndpoint(campaignId)}/update_campaign_identification`,
    requestDocument: identificationDocument,
  });
};

/** MCP definition for Marketing API getCampaigns. */
export const getCampaignsTool = defineTool({
  name: 'ebay_sell_marketing_get_campaigns',
  namespace: 'sell.marketing',
  description: 'Retrieve seller Promoted Listings campaigns with exact eBay filters',
  argumentsSchema: getCampaignsArgumentsSchema,
  operationKind: 'read',
  operation: getCampaigns,
});

/** MCP definition for Marketing API getCampaign. */
export const getCampaignTool = defineTool({
  name: 'ebay_sell_marketing_get_campaign',
  namespace: 'sell.marketing',
  description: 'Retrieve one eBay Promoted Listings campaign by identifier',
  argumentsSchema: campaignIdArgumentsSchema,
  operationKind: 'read',
  operation: getCampaign,
});

/** MCP definition for Marketing API createCampaign. */
export const createCampaignTool = defineTool({
  name: 'ebay_sell_marketing_create_campaign',
  namespace: 'sell.marketing',
  description: 'Create one eBay Promoted Listings campaign',
  argumentsSchema: createCampaignArgumentsSchema,
  operationKind: 'write',
  operation: createCampaign,
});

/** MCP definition for Marketing API cloneCampaign. */
export const cloneCampaignTool = defineTool({
  name: 'ebay_sell_marketing_clone_campaign',
  namespace: 'sell.marketing',
  description: 'Clone one ended rules-based eBay Promoted Listings campaign',
  argumentsSchema: cloneCampaignArgumentsSchema,
  operationKind: 'write',
  operation: cloneCampaign,
});

/** MCP definition for Marketing API deleteCampaign. */
export const deleteCampaignTool = defineTool({
  name: 'ebay_sell_marketing_delete_campaign',
  namespace: 'sell.marketing',
  description: 'Delete one ended eBay Promoted Listings campaign',
  argumentsSchema: campaignIdArgumentsSchema,
  operationKind: 'write',
  operation: deleteCampaign,
});

/** MCP definition for Marketing API endCampaign. */
export const endCampaignTool = defineTool({
  name: 'ebay_sell_marketing_end_campaign',
  namespace: 'sell.marketing',
  description: 'End one running or paused eBay Promoted Listings campaign',
  argumentsSchema: campaignIdArgumentsSchema,
  operationKind: 'write',
  operation: endCampaign,
});

/** MCP definition for Marketing API findCampaignByAdReference. */
export const findCampaignByAdReferenceTool = defineTool({
  name: 'ebay_sell_marketing_find_campaign_by_ad_reference',
  namespace: 'sell.marketing',
  description: 'Find campaigns associated with one listing or inventory reference',
  argumentsSchema: findCampaignByAdReferenceArgumentsSchema,
  operationKind: 'read',
  operation: findCampaignByAdReference,
});

/** MCP definition for Marketing API getCampaignByName. */
export const getCampaignByNameTool = defineTool({
  name: 'ebay_sell_marketing_get_campaign_by_name',
  namespace: 'sell.marketing',
  description: 'Retrieve one eBay Promoted Listings campaign by seller-defined name',
  argumentsSchema: getCampaignByNameArgumentsSchema,
  operationKind: 'read',
  operation: getCampaignByName,
});

/** MCP definition for Marketing API launchCampaign. */
export const launchCampaignTool = defineTool({
  name: 'ebay_sell_marketing_launch_campaign',
  namespace: 'sell.marketing',
  description: 'Launch one draft priority-strategy eBay Promoted Listings campaign',
  argumentsSchema: campaignIdArgumentsSchema,
  operationKind: 'write',
  operation: launchCampaign,
});

/** MCP definition for Marketing API pauseCampaign. */
export const pauseCampaignTool = defineTool({
  name: 'ebay_sell_marketing_pause_campaign',
  namespace: 'sell.marketing',
  description: 'Pause one running eBay Promoted Listings campaign',
  argumentsSchema: campaignIdArgumentsSchema,
  operationKind: 'write',
  operation: pauseCampaign,
});

/** MCP definition for Marketing API resumeCampaign. */
export const resumeCampaignTool = defineTool({
  name: 'ebay_sell_marketing_resume_campaign',
  namespace: 'sell.marketing',
  description: 'Resume one paused eBay Promoted Listings campaign',
  argumentsSchema: campaignIdArgumentsSchema,
  operationKind: 'write',
  operation: resumeCampaign,
});

/** MCP definition for Marketing API setupQuickCampaign. */
export const setupQuickCampaignTool = defineTool({
  name: 'ebay_sell_marketing_setup_quick_campaign',
  namespace: 'sell.marketing',
  description: 'Create one priority-strategy campaign through eBay quick setup',
  argumentsSchema: setupQuickCampaignArgumentsSchema,
  operationKind: 'write',
  operation: setupQuickCampaign,
});

/** MCP definition for Marketing API suggestBudget. */
export const suggestBudgetTool = defineTool({
  name: 'ebay_sell_marketing_suggest_budget',
  namespace: 'sell.marketing',
  description: 'Suggest a daily budget for an offsite Promoted Listings campaign',
  argumentsSchema: suggestBudgetArgumentsSchema,
  operationKind: 'read',
  operation: suggestBudget,
});

/** MCP definition for Marketing API suggestItems. */
export const suggestItemsTool = defineTool({
  name: 'ebay_sell_marketing_suggest_items',
  namespace: 'sell.marketing',
  description: 'Suggest listings that may benefit from promotion in one campaign',
  argumentsSchema: suggestItemsArgumentsSchema,
  operationKind: 'read',
  operation: suggestItems,
});

/** MCP definition for Marketing API suggestMaxCpc. */
export const suggestMaxCpcTool = defineTool({
  name: 'ebay_sell_marketing_suggest_max_cpc',
  namespace: 'sell.marketing',
  description: 'Suggest a max CPC for a smart targeting Promoted Listings campaign',
  argumentsSchema: suggestMaxCpcArgumentsSchema,
  operationKind: 'read',
  operation: suggestMaxCpc,
});

/** MCP definition for Marketing API updateAdRateStrategy. */
export const updateAdRateStrategyTool = defineTool({
  name: 'ebay_sell_marketing_update_ad_rate_strategy',
  namespace: 'sell.marketing',
  description: 'Update the ad rate strategy for one Cost Per Sale campaign',
  argumentsSchema: updateAdRateStrategyArgumentsSchema,
  operationKind: 'write',
  operation: updateAdRateStrategy,
});

/** MCP definition for Marketing API updateBiddingStrategy. */
export const updateBiddingStrategyTool = defineTool({
  name: 'ebay_sell_marketing_update_bidding_strategy',
  namespace: 'sell.marketing',
  description: 'Update the bidding strategy for one Cost Per Click campaign',
  argumentsSchema: updateBiddingStrategyArgumentsSchema,
  operationKind: 'write',
  operation: updateBiddingStrategy,
});

/** MCP definition for Marketing API updateCampaignBudget. */
export const updateCampaignBudgetTool = defineTool({
  name: 'ebay_sell_marketing_update_campaign_budget',
  namespace: 'sell.marketing',
  description: 'Update the daily budget for one Cost Per Click campaign',
  argumentsSchema: updateCampaignBudgetArgumentsSchema,
  operationKind: 'write',
  operation: updateCampaignBudget,
});

/** MCP definition for Marketing API updateCampaignIdentification. */
export const updateCampaignIdentificationTool = defineTool({
  name: 'ebay_sell_marketing_update_campaign_identification',
  namespace: 'sell.marketing',
  description: 'Update the name and schedule for one Promoted Listings campaign',
  argumentsSchema: updateCampaignIdentificationArgumentsSchema,
  operationKind: 'write',
  operation: updateCampaignIdentification,
});
