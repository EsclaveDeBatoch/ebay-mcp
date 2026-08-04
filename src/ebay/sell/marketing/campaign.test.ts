import { describe, expect, it } from 'vitest';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

import {
  type Campaign,
  type CampaignCollection,
  type CampaignsByAdReference,
  campaignIdArgumentsSchema,
  cloneCampaign,
  cloneCampaignArgumentsSchema,
  createCampaign,
  createCampaignArgumentsSchema,
  type CreateCampaignArguments,
  deleteCampaign,
  endCampaign,
  findCampaignByAdReference,
  findCampaignByAdReferenceArgumentsSchema,
  getCampaign,
  getCampaignByName,
  getCampaignByNameArgumentsSchema,
  getCampaigns,
  getCampaignsArgumentsSchema,
  launchCampaign,
  pauseCampaign,
  resumeCampaign,
  setupQuickCampaign,
  setupQuickCampaignArgumentsSchema,
  type SuggestedBudget,
  type SuggestedItems,
  type SuggestedMaxCpc,
  suggestBudget,
  suggestBudgetArgumentsSchema,
  suggestItems,
  suggestItemsArgumentsSchema,
  suggestMaxCpc,
  suggestMaxCpcArgumentsSchema,
  updateAdRateStrategy,
  updateAdRateStrategyArgumentsSchema,
  updateBiddingStrategy,
  updateBiddingStrategyArgumentsSchema,
  updateCampaignBudget,
  updateCampaignBudgetArgumentsSchema,
  updateCampaignIdentification,
  updateCampaignIdentificationArgumentsSchema,
} from './campaign.js';

const campaignCreation: CreateCampaignArguments = {
  campaignName: 'Spring sale',
  marketplaceId: 'EBAY_US',
  startDate: '2026-03-01T00:00:00Z',
  fundingStrategy: {
    fundingModel: 'COST_PER_SALE',
    bidPercentage: '5.0',
  },
};

const campaignPage = {
  campaign_name: 'Spring sale',
  campaign_status: 'RUNNING',
  campaign_targeting_types: 'MANUAL',
  channels: 'ON_SITE',
  end_date_range: '2026-01-01T00:00:00Z..2026-12-31T23:59:59Z',
  funding_strategy: 'COST_PER_SALE',
  limit: '25',
  offset: '0',
  start_date_range: '2026-01-01T00:00:00Z..2026-06-30T23:59:59Z',
};

describe('Sell Marketing campaign schemas', () => {
  it('accepts exact string query filters for getCampaigns', () => {
    expect(getCampaignsArgumentsSchema.parse(campaignPage)).toEqual(campaignPage);
    expect(getCampaignsArgumentsSchema.parse({})).toEqual({});
  });

  it('accepts exact campaign path and required campaign_name query', () => {
    expect(campaignIdArgumentsSchema.parse({ campaign_id: 'CAMPAIGN-1' })).toEqual({
      campaign_id: 'CAMPAIGN-1',
    });
    expect(getCampaignByNameArgumentsSchema.parse({ campaign_name: 'Spring sale' })).toEqual({
      campaign_name: 'Spring sale',
    });
  });

  it('accepts direct create, clone, and quick-setup documents', () => {
    expect(createCampaignArgumentsSchema.parse(campaignCreation)).toEqual(campaignCreation);
    expect(
      cloneCampaignArgumentsSchema.parse({
        campaign_id: 'CAMPAIGN-1',
        campaignName: 'Spring clone',
        startDate: '2026-04-01T00:00:00Z',
      }),
    ).toEqual({
      campaign_id: 'CAMPAIGN-1',
      campaignName: 'Spring clone',
      startDate: '2026-04-01T00:00:00Z',
    });
    expect(
      setupQuickCampaignArgumentsSchema.parse({
        campaignName: 'Priority spring',
        marketplaceId: 'EBAY_US',
        startDate: '2026-03-01T00:00:00Z',
        listingIds: ['110000000000'],
        budget: {
          daily: {
            amount: { currency: 'USD', value: '50.00' },
          },
        },
      }),
    ).toEqual({
      campaignName: 'Priority spring',
      marketplaceId: 'EBAY_US',
      startDate: '2026-03-01T00:00:00Z',
      listingIds: ['110000000000'],
      budget: {
        daily: {
          amount: { currency: 'USD', value: '50.00' },
        },
      },
    });
  });

  it('accepts nested funding, criterion, and update documents', () => {
    const smartTargetCreate = {
      campaignName: 'Smart targeting',
      marketplaceId: 'EBAY_US',
      startDate: '2026-03-01T00:00:00Z',
      campaignTargetingType: 'SMART',
      channels: ['ON_SITE'],
      fundingStrategy: {
        fundingModel: 'COST_PER_CLICK',
        bidPreferences: [
          {
            maxCpc: {
              amount: { currency: 'USD', value: '0.50' },
            },
          },
        ],
      },
      budget: {
        daily: {
          amount: { currency: 'USD', value: '100.00' },
        },
      },
      campaignCriterion: {
        autoSelectFutureInventory: true,
        criterionType: 'INVENTORY_PARTITION',
        selectionRules: [
          {
            categoryIds: ['31388'],
            categoryScope: 'MARKETPLACE',
            brands: ['Acme'],
            listingConditionIds: ['1000'],
            minPrice: { currency: 'USD', value: '10.00' },
            maxPrice: { currency: 'USD', value: '500.00' },
          },
        ],
      },
    };

    expect(createCampaignArgumentsSchema.parse(smartTargetCreate)).toEqual(smartTargetCreate);
    expect(
      updateAdRateStrategyArgumentsSchema.parse({
        campaign_id: 'CAMPAIGN-1',
        adRateStrategy: 'DYNAMIC',
        bidPercentage: '6.0',
        dynamicAdRatePreferences: [
          {
            adRateAdjustmentPercent: '10',
            adRateCapPercent: '20',
          },
        ],
      }),
    ).toEqual({
      campaign_id: 'CAMPAIGN-1',
      adRateStrategy: 'DYNAMIC',
      bidPercentage: '6.0',
      dynamicAdRatePreferences: [
        {
          adRateAdjustmentPercent: '10',
          adRateCapPercent: '20',
        },
      ],
    });
    expect(
      updateBiddingStrategyArgumentsSchema.parse({
        campaign_id: 'CAMPAIGN-1',
        biddingStrategy: 'DYNAMIC',
        bidPreferences: [
          {
            maxCpc: {
              amount: { currency: 'USD', value: '0.75' },
            },
          },
        ],
      }),
    ).toEqual({
      campaign_id: 'CAMPAIGN-1',
      biddingStrategy: 'DYNAMIC',
      bidPreferences: [
        {
          maxCpc: {
            amount: { currency: 'USD', value: '0.75' },
          },
        },
      ],
    });
    expect(
      updateCampaignBudgetArgumentsSchema.parse({
        campaign_id: 'CAMPAIGN-1',
        daily: {
          amount: { currency: 'USD', value: '50.00' },
        },
      }),
    ).toEqual({
      campaign_id: 'CAMPAIGN-1',
      daily: {
        amount: { currency: 'USD', value: '50.00' },
      },
    });
    expect(
      updateCampaignIdentificationArgumentsSchema.parse({
        campaign_id: 'CAMPAIGN-1',
        campaignName: 'Spring renamed',
        startDate: '2026-03-01T00:00:00Z',
        endDate: '2026-06-01T00:00:00Z',
      }),
    ).toEqual({
      campaign_id: 'CAMPAIGN-1',
      campaignName: 'Spring renamed',
      startDate: '2026-03-01T00:00:00Z',
      endDate: '2026-06-01T00:00:00Z',
    });
  });

  it('accepts suggestion and ad-reference queries with exact wire keys', () => {
    expect(
      findCampaignByAdReferenceArgumentsSchema.parse({
        inventory_reference_id: 'SKU-1',
        inventory_reference_type: 'INVENTORY_ITEM',
        listing_id: '110000000000',
      }),
    ).toEqual({
      inventory_reference_id: 'SKU-1',
      inventory_reference_type: 'INVENTORY_ITEM',
      listing_id: '110000000000',
    });
    expect(suggestBudgetArgumentsSchema.parse({ 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US' })).toEqual({
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
    });
    expect(
      suggestItemsArgumentsSchema.parse({
        campaign_id: 'CAMPAIGN-1',
        category_ids: '31388',
        limit: '10',
        offset: '0',
      }),
    ).toEqual({
      campaign_id: 'CAMPAIGN-1',
      category_ids: '31388',
      limit: '10',
      offset: '0',
    });
    expect(
      suggestMaxCpcArgumentsSchema.parse({
        listingIds: ['110000000000'],
        marketplaceId: 'EBAY_US',
      }),
    ).toEqual({
      listingIds: ['110000000000'],
      marketplaceId: 'EBAY_US',
    });
  });

  it.each([
    { limit: 25 },
    { limit: '0' },
    { offset: '-1' },
    { campaignName: 'Spring sale' },
    { campaign_id: '' },
    {
      request: campaignCreation,
    },
    {
      'Content-Type': 'application/json',
      ...campaignCreation,
    },
    {
      campaignName: 'Spring sale',
      marketplaceId: 'EBAY_US',
      startDate: '2026-03-01T00:00:00Z',
    },
    {
      campaignId: 'CAMPAIGN-1',
    },
    {
      marketplaceId: 'EBAY_US',
    },
    {
      campaign_name: '',
    },
  ])('rejects aliases, wrappers, transport headers, and invalid fields', (invalidArguments) => {
    expect(getCampaignsArgumentsSchema.safeParse(invalidArguments).success).toBe(false);
    expect(createCampaignArgumentsSchema.safeParse(invalidArguments).success).toBe(false);
    expect(campaignIdArgumentsSchema.safeParse(invalidArguments).success).toBe(false);
    expect(suggestBudgetArgumentsSchema.safeParse(invalidArguments).success).toBe(false);
    expect(getCampaignByNameArgumentsSchema.safeParse(invalidArguments).success).toBe(false);
  });

  it.each([
    { campaign_id: 'CAMPAIGN-1', request: { campaignName: 'clone' } },
    { campaignId: 'CAMPAIGN-1', campaignName: 'clone' },
    { campaignName: 'clone' },
    { campaign_id: '', campaignName: 'clone' },
  ])('rejects wrapped or aliased clone arguments', (invalidClone) => {
    expect(cloneCampaignArgumentsSchema.safeParse(invalidClone).success).toBe(false);
  });

  it.each([
    { listingIds: [], marketplaceId: 'EBAY_US' },
    { listingIds: ['110000000000'] },
    { marketplaceId: 'EBAY_US' },
    { request: { listingIds: ['110000000000'], marketplaceId: 'EBAY_US' } },
  ])('rejects incomplete or wrapped max CPC suggestions', (invalidMaxCpc) => {
    expect(suggestMaxCpcArgumentsSchema.safeParse(invalidMaxCpc).success).toBe(false);
  });
});

describe('Sell Marketing campaign operations', () => {
  it('uses exact query wire keys and encoded campaign paths for reads', async () => {
    const { sellerSession, getCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await getCampaigns(sellerSession, campaignPage);
    await getCampaign(sellerSession, { campaign_id: 'CAMPAIGN/1' });
    await findCampaignByAdReference(sellerSession, {
      inventory_reference_id: 'SKU-1',
      inventory_reference_type: 'INVENTORY_ITEM',
      listing_id: '110000000000',
    });
    await getCampaignByName(sellerSession, { campaign_name: 'Spring sale' });
    await suggestItems(sellerSession, {
      campaign_id: 'CAMPAIGN/1',
      category_ids: '31388',
      limit: '10',
      offset: '0',
    });
    await suggestBudget(sellerSession, { 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US' });

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/ad_campaign',
        searchParameters: campaignPage,
      },
      { endpoint: '/sell/marketing/v1/ad_campaign/CAMPAIGN%2F1' },
      {
        endpoint: '/sell/marketing/v1/ad_campaign/find_campaign_by_ad_reference',
        searchParameters: {
          inventory_reference_id: 'SKU-1',
          inventory_reference_type: 'INVENTORY_ITEM',
          listing_id: '110000000000',
        },
      },
      {
        endpoint: '/sell/marketing/v1/ad_campaign/get_campaign_by_name',
        searchParameters: { campaign_name: 'Spring sale' },
      },
      {
        endpoint: '/sell/marketing/v1/ad_campaign/CAMPAIGN%2F1/suggest_items',
        searchParameters: {
          category_ids: '31388',
          limit: '10',
          offset: '0',
        },
      },
      {
        endpoint: '/sell/marketing/v1/ad_campaign/suggest_budget',
        requestHeaders: { 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US' },
      },
    ]);
  });

  it('posts direct create, clone, quick-setup, and suggestion documents', async () => {
    const { sellerSession, postCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await createCampaign(sellerSession, campaignCreation);
    await cloneCampaign(sellerSession, {
      campaign_id: 'CAMPAIGN/1',
      campaignName: 'Spring clone',
      startDate: '2026-04-01T00:00:00Z',
      endDate: '2026-07-01T00:00:00Z',
    });
    await setupQuickCampaign(sellerSession, {
      campaignName: 'Priority spring',
      marketplaceId: 'EBAY_US',
      startDate: '2026-03-01T00:00:00Z',
      listingIds: ['110000000000'],
    });
    await suggestMaxCpc(sellerSession, {
      listingIds: ['110000000000'],
      marketplaceId: 'EBAY_US',
    });

    expect(postCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/ad_campaign',
        requestDocument: campaignCreation,
      },
      {
        endpoint: '/sell/marketing/v1/ad_campaign/CAMPAIGN%2F1/clone',
        requestDocument: {
          campaignName: 'Spring clone',
          startDate: '2026-04-01T00:00:00Z',
          endDate: '2026-07-01T00:00:00Z',
        },
      },
      {
        endpoint: '/sell/marketing/v1/ad_campaign/setup_quick_campaign',
        requestDocument: {
          campaignName: 'Priority spring',
          marketplaceId: 'EBAY_US',
          startDate: '2026-03-01T00:00:00Z',
          listingIds: ['110000000000'],
        },
      },
      {
        endpoint: '/sell/marketing/v1/ad_campaign/suggest_max_cpc',
        requestDocument: {
          listingIds: ['110000000000'],
          marketplaceId: 'EBAY_US',
        },
      },
    ]);
  });

  it('posts lifecycle and update operations on encoded campaign paths', async () => {
    const { sellerSession, postCalls, deleteCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    });

    await endCampaign(sellerSession, { campaign_id: 'CAMPAIGN/1' });
    await launchCampaign(sellerSession, { campaign_id: 'CAMPAIGN/1' });
    await pauseCampaign(sellerSession, { campaign_id: 'CAMPAIGN/1' });
    await resumeCampaign(sellerSession, { campaign_id: 'CAMPAIGN/1' });
    await updateAdRateStrategy(sellerSession, {
      campaign_id: 'CAMPAIGN/1',
      adRateStrategy: 'FIXED',
      bidPercentage: '5.5',
    });
    await updateBiddingStrategy(sellerSession, {
      campaign_id: 'CAMPAIGN/1',
      biddingStrategy: 'FIXED',
    });
    await updateCampaignBudget(sellerSession, {
      campaign_id: 'CAMPAIGN/1',
      daily: {
        amount: { currency: 'USD', value: '50.00' },
      },
    });
    await updateCampaignIdentification(sellerSession, {
      campaign_id: 'CAMPAIGN/1',
      campaignName: 'Spring renamed',
      startDate: '2026-03-01T00:00:00Z',
    });
    await deleteCampaign(sellerSession, { campaign_id: 'CAMPAIGN/1' });

    expect(postCalls).toEqual([
      { endpoint: '/sell/marketing/v1/ad_campaign/CAMPAIGN%2F1/end' },
      { endpoint: '/sell/marketing/v1/ad_campaign/CAMPAIGN%2F1/launch' },
      { endpoint: '/sell/marketing/v1/ad_campaign/CAMPAIGN%2F1/pause' },
      { endpoint: '/sell/marketing/v1/ad_campaign/CAMPAIGN%2F1/resume' },
      {
        endpoint: '/sell/marketing/v1/ad_campaign/CAMPAIGN%2F1/update_ad_rate_strategy',
        requestDocument: {
          adRateStrategy: 'FIXED',
          bidPercentage: '5.5',
        },
      },
      {
        endpoint: '/sell/marketing/v1/ad_campaign/CAMPAIGN%2F1/update_bidding_strategy',
        requestDocument: {
          biddingStrategy: 'FIXED',
        },
      },
      {
        endpoint: '/sell/marketing/v1/ad_campaign/CAMPAIGN%2F1/update_campaign_budget',
        requestDocument: {
          daily: {
            amount: { currency: 'USD', value: '50.00' },
          },
        },
      },
      {
        endpoint: '/sell/marketing/v1/ad_campaign/CAMPAIGN%2F1/update_campaign_identification',
        requestDocument: {
          campaignName: 'Spring renamed',
          startDate: '2026-03-01T00:00:00Z',
        },
      },
    ]);
    expect(deleteCalls).toEqual([{ endpoint: '/sell/marketing/v1/ad_campaign/CAMPAIGN%2F1' }]);
  });

  it('passes campaign documents through unchanged on success', async () => {
    const campaignDocument: Campaign = {
      campaignId: 'CAMPAIGN-1',
      campaignName: 'Spring sale',
      campaignStatus: 'RUNNING',
      marketplaceId: 'EBAY_US',
    };
    const campaignCollection: CampaignCollection = {
      total: 1,
      campaigns: [campaignDocument],
    };
    const campaignsByReference: CampaignsByAdReference = {
      campaigns: [campaignDocument],
    };
    const budgetSuggestion: SuggestedBudget = {
      suggestedBudget: [{ campaignId: 'CAMPAIGN-1' }],
    };
    const itemSuggestion: SuggestedItems = {
      total: 0,
      suggestedItems: [],
    };
    const maxCpcSuggestion: SuggestedMaxCpc = {
      amount: { currency: 'USD', value: '0.40' },
      marketplaceId: 'EBAY_US',
    };

    const successfulCollection: EbayRequestCompletion<CampaignCollection> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: campaignCollection,
    };
    const { sellerSession: collectionSession } = sellerSessionReturning(successfulCollection);
    await expect(getCampaigns(collectionSession, {})).resolves.toBe(successfulCollection);

    const successfulCampaign: EbayRequestCompletion<Campaign> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: campaignDocument,
    };
    const { sellerSession: campaignSession } = sellerSessionReturning(successfulCampaign);
    await expect(getCampaign(campaignSession, { campaign_id: 'CAMPAIGN-1' })).resolves.toBe(
      successfulCampaign,
    );

    const successfulReference: EbayRequestCompletion<CampaignsByAdReference> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: campaignsByReference,
    };
    const { sellerSession: referenceSession } = sellerSessionReturning(successfulReference);
    await expect(
      findCampaignByAdReference(referenceSession, { listing_id: '110000000000' }),
    ).resolves.toBe(successfulReference);

    const successfulBudget: EbayRequestCompletion<SuggestedBudget> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: budgetSuggestion,
    };
    const { sellerSession: budgetSession } = sellerSessionReturning(successfulBudget);
    await expect(
      suggestBudget(budgetSession, { 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US' }),
    ).resolves.toBe(successfulBudget);

    const successfulItems: EbayRequestCompletion<SuggestedItems> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: itemSuggestion,
    };
    const { sellerSession: itemsSession } = sellerSessionReturning(successfulItems);
    await expect(suggestItems(itemsSession, { campaign_id: 'CAMPAIGN-1' })).resolves.toBe(
      successfulItems,
    );

    const successfulMaxCpc: EbayRequestCompletion<SuggestedMaxCpc> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: maxCpcSuggestion,
    };
    const { sellerSession: maxCpcSession } = sellerSessionReturning(successfulMaxCpc);
    await expect(
      suggestMaxCpc(maxCpcSession, {
        listingIds: ['110000000000'],
        marketplaceId: 'EBAY_US',
      }),
    ).resolves.toBe(successfulMaxCpc);
  });

  it.each(ebayFailures)(
    'passes a $kind failure through unchanged for every campaign operation',
    async (ebayFailure) => {
      const failedLookup: EbayRequestCompletion<CampaignCollection> = {
        kind: 'ebayRequestFailed',
        ebayFailure,
      };
      const { sellerSession } = sellerSessionReturning(failedLookup);

      await expect(getCampaigns(sellerSession, {})).resolves.toBe(failedLookup);
      await expect(getCampaign(sellerSession, { campaign_id: 'CAMPAIGN-1' })).resolves.toBe(
        failedLookup,
      );
      await expect(createCampaign(sellerSession, campaignCreation)).resolves.toBe(failedLookup);
      await expect(
        cloneCampaign(sellerSession, {
          campaign_id: 'CAMPAIGN-1',
          campaignName: 'Spring clone',
        }),
      ).resolves.toBe(failedLookup);
      await expect(deleteCampaign(sellerSession, { campaign_id: 'CAMPAIGN-1' })).resolves.toBe(
        failedLookup,
      );
      await expect(endCampaign(sellerSession, { campaign_id: 'CAMPAIGN-1' })).resolves.toBe(
        failedLookup,
      );
      await expect(
        findCampaignByAdReference(sellerSession, { listing_id: '110000000000' }),
      ).resolves.toBe(failedLookup);
      await expect(
        getCampaignByName(sellerSession, { campaign_name: 'Spring sale' }),
      ).resolves.toBe(failedLookup);
      await expect(launchCampaign(sellerSession, { campaign_id: 'CAMPAIGN-1' })).resolves.toBe(
        failedLookup,
      );
      await expect(pauseCampaign(sellerSession, { campaign_id: 'CAMPAIGN-1' })).resolves.toBe(
        failedLookup,
      );
      await expect(resumeCampaign(sellerSession, { campaign_id: 'CAMPAIGN-1' })).resolves.toBe(
        failedLookup,
      );
      await expect(
        setupQuickCampaign(sellerSession, {
          campaignName: 'Priority spring',
          marketplaceId: 'EBAY_US',
          startDate: '2026-03-01T00:00:00Z',
        }),
      ).resolves.toBe(failedLookup);
      await expect(
        suggestBudget(sellerSession, { 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US' }),
      ).resolves.toBe(failedLookup);
      await expect(suggestItems(sellerSession, { campaign_id: 'CAMPAIGN-1' })).resolves.toBe(
        failedLookup,
      );
      await expect(
        suggestMaxCpc(sellerSession, {
          listingIds: ['110000000000'],
          marketplaceId: 'EBAY_US',
        }),
      ).resolves.toBe(failedLookup);
      await expect(
        updateAdRateStrategy(sellerSession, {
          campaign_id: 'CAMPAIGN-1',
          adRateStrategy: 'FIXED',
        }),
      ).resolves.toBe(failedLookup);
      await expect(
        updateBiddingStrategy(sellerSession, {
          campaign_id: 'CAMPAIGN-1',
          biddingStrategy: 'FIXED',
        }),
      ).resolves.toBe(failedLookup);
      await expect(
        updateCampaignBudget(sellerSession, {
          campaign_id: 'CAMPAIGN-1',
          daily: { amount: { currency: 'USD', value: '50.00' } },
        }),
      ).resolves.toBe(failedLookup);
      await expect(
        updateCampaignIdentification(sellerSession, {
          campaign_id: 'CAMPAIGN-1',
          campaignName: 'Spring renamed',
        }),
      ).resolves.toBe(failedLookup);
    },
  );
});
