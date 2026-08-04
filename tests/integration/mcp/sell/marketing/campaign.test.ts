import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  Campaign,
  CampaignCollection,
  CreateCampaignArguments,
} from '@/ebay/sell/marketing/campaign.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';

const campaignToolNames = [
  'ebay_sell_marketing_get_campaigns',
  'ebay_sell_marketing_get_campaign',
  'ebay_sell_marketing_create_campaign',
  'ebay_sell_marketing_clone_campaign',
  'ebay_sell_marketing_delete_campaign',
  'ebay_sell_marketing_end_campaign',
  'ebay_sell_marketing_find_campaign_by_ad_reference',
  'ebay_sell_marketing_get_campaign_by_name',
  'ebay_sell_marketing_launch_campaign',
  'ebay_sell_marketing_pause_campaign',
  'ebay_sell_marketing_resume_campaign',
  'ebay_sell_marketing_setup_quick_campaign',
  'ebay_sell_marketing_suggest_budget',
  'ebay_sell_marketing_suggest_items',
  'ebay_sell_marketing_suggest_max_cpc',
  'ebay_sell_marketing_update_ad_rate_strategy',
  'ebay_sell_marketing_update_bidding_strategy',
  'ebay_sell_marketing_update_campaign_budget',
  'ebay_sell_marketing_update_campaign_identification',
] as const;

const legacyCampaignToolNames = [
  'ebay_get_campaigns',
  'ebay_get_campaign',
  'ebay_create_campaign',
  'ebay_clone_campaign',
  'ebay_delete_campaign',
  'ebay_end_campaign',
  'ebay_find_campaign_by_ad_reference',
  'ebay_get_campaign_by_name',
  'ebay_launch_campaign',
  'ebay_pause_campaign',
  'ebay_resume_campaign',
  'ebay_setup_quick_campaign',
  'ebay_suggest_budget',
  'ebay_suggest_items',
  'ebay_suggest_max_cpc',
  'ebay_update_ad_rate_strategy',
  'ebay_update_bidding_strategy',
  'ebay_update_campaign_budget',
  'ebay_update_campaign_identification',
] as const;

const campaignCreation: CreateCampaignArguments = {
  campaignName: 'Spring sale',
  marketplaceId: 'EBAY_US',
  startDate: '2026-03-01T00:00:00Z',
  fundingStrategy: {
    fundingModel: 'COST_PER_SALE',
    bidPercentage: '5.0',
  },
};

const campaignFailureCalls = [
  { ebayArguments: {}, toolName: 'ebay_sell_marketing_get_campaigns' },
  { ebayArguments: { campaign_id: 'CAMPAIGN-1' }, toolName: 'ebay_sell_marketing_get_campaign' },
  { ebayArguments: campaignCreation, toolName: 'ebay_sell_marketing_create_campaign' },
  {
    ebayArguments: { campaign_id: 'CAMPAIGN-1', campaignName: 'Spring clone' },
    toolName: 'ebay_sell_marketing_clone_campaign',
  },
  { ebayArguments: { campaign_id: 'CAMPAIGN-1' }, toolName: 'ebay_sell_marketing_delete_campaign' },
  { ebayArguments: { campaign_id: 'CAMPAIGN-1' }, toolName: 'ebay_sell_marketing_end_campaign' },
  {
    ebayArguments: { listing_id: '110000000000' },
    toolName: 'ebay_sell_marketing_find_campaign_by_ad_reference',
  },
  {
    ebayArguments: { campaign_name: 'Spring sale' },
    toolName: 'ebay_sell_marketing_get_campaign_by_name',
  },
  { ebayArguments: { campaign_id: 'CAMPAIGN-1' }, toolName: 'ebay_sell_marketing_launch_campaign' },
  { ebayArguments: { campaign_id: 'CAMPAIGN-1' }, toolName: 'ebay_sell_marketing_pause_campaign' },
  { ebayArguments: { campaign_id: 'CAMPAIGN-1' }, toolName: 'ebay_sell_marketing_resume_campaign' },
  {
    ebayArguments: {
      campaignName: 'Priority spring',
      marketplaceId: 'EBAY_US',
      startDate: '2026-03-01T00:00:00Z',
    },
    toolName: 'ebay_sell_marketing_setup_quick_campaign',
  },
  {
    ebayArguments: { 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US' },
    toolName: 'ebay_sell_marketing_suggest_budget',
  },
  {
    ebayArguments: { campaign_id: 'CAMPAIGN-1' },
    toolName: 'ebay_sell_marketing_suggest_items',
  },
  {
    ebayArguments: { listingIds: ['110000000000'], marketplaceId: 'EBAY_US' },
    toolName: 'ebay_sell_marketing_suggest_max_cpc',
  },
  {
    ebayArguments: { campaign_id: 'CAMPAIGN-1', adRateStrategy: 'FIXED' },
    toolName: 'ebay_sell_marketing_update_ad_rate_strategy',
  },
  {
    ebayArguments: { campaign_id: 'CAMPAIGN-1', biddingStrategy: 'FIXED' },
    toolName: 'ebay_sell_marketing_update_bidding_strategy',
  },
  {
    ebayArguments: {
      campaign_id: 'CAMPAIGN-1',
      daily: { amount: { currency: 'USD', value: '50.00' } },
    },
    toolName: 'ebay_sell_marketing_update_campaign_budget',
  },
  {
    ebayArguments: { campaign_id: 'CAMPAIGN-1', campaignName: 'Spring renamed' },
    toolName: 'ebay_sell_marketing_update_campaign_identification',
  },
] as const;

const campaignFailureScenarios = campaignFailureCalls.flatMap((campaignCall) =>
  ebayFailures.map((ebayFailure) => ({ ebayFailure, ...campaignCall })),
);

const readOnlyCampaignToolNames = [
  'ebay_sell_marketing_get_campaigns',
  'ebay_sell_marketing_get_campaign',
  'ebay_sell_marketing_find_campaign_by_ad_reference',
  'ebay_sell_marketing_get_campaign_by_name',
  'ebay_sell_marketing_suggest_budget',
  'ebay_sell_marketing_suggest_items',
  'ebay_sell_marketing_suggest_max_cpc',
] as const;

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Sell Marketing campaign MCP exposure', () => {
  it('exposes all nineteen operations once without compatibility names', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);

    for (const campaignToolName of campaignToolNames) {
      expect(
        listedToolNames.filter((listedToolName) => listedToolName === campaignToolName),
      ).toEqual([campaignToolName]);
    }
    for (const legacyCampaignToolName of legacyCampaignToolNames) {
      expect(listedToolNames).not.toContain(legacyCampaignToolName);
    }
    await mcpClient.close();
  });

  it('keeps only the seven resource reads in read-only mode', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'sell.marketing');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    vi.stubEnv('EBAY_READ_ONLY', 'true');
    const { sellerSession } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    expect(
      listedTools.tools
        .map((ebayTool) => ebayTool.name)
        .filter((listedToolName) =>
          campaignToolNames.some((campaignToolName) => campaignToolName === listedToolName),
        ),
    ).toEqual([...readOnlyCampaignToolNames]);
    await mcpClient.close();
  });
});

describe('Sell Marketing campaign MCP calls', () => {
  it('returns the unchanged paginated campaign collection', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const campaignCollection: CampaignCollection = {
      total: 1,
      campaigns: [
        {
          campaignId: 'CAMPAIGN-1',
          campaignName: 'Spring sale',
          campaignStatus: 'RUNNING',
          marketplaceId: 'EBAY_US',
        },
      ],
    };
    const { sellerSession, getCalls } = sellerSessionReturning<CampaignCollection>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: campaignCollection,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_get_campaigns',
      {
        campaign_status: 'RUNNING',
        limit: '25',
        offset: '0',
      },
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/ad_campaign',
        searchParameters: {
          campaign_status: 'RUNNING',
          limit: '25',
          offset: '0',
        },
      },
    ]);
    expect(toolCompletion).toEqual({
      content: [{ type: 'text', text: JSON.stringify(campaignCollection, null, 2) }],
    });
    await mcpClient.close();
  });

  it('returns one unchanged campaign from an encoded path', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const campaign: Campaign = {
      campaignId: 'CAMPAIGN/1',
      campaignName: 'Spring sale',
      campaignStatus: 'PAUSED',
      marketplaceId: 'EBAY_US',
    };
    const { sellerSession, getCalls } = sellerSessionReturning<Campaign>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: campaign,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_get_campaign',
      { campaign_id: 'CAMPAIGN/1' },
    );

    expect(getCalls).toEqual([{ endpoint: '/sell/marketing/v1/ad_campaign/CAMPAIGN%2F1' }]);
    expect(toolCompletion).toEqual({
      content: [{ type: 'text', text: JSON.stringify(campaign, null, 2) }],
    });
    await mcpClient.close();
  });

  it('posts a direct create document and preserves the empty creation response', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const createdCampaign = {};
    const { sellerSession, postCalls } = sellerSessionReturning<typeof createdCampaign>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: createdCampaign,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_create_campaign',
      campaignCreation,
    );

    expect(postCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/ad_campaign',
        requestDocument: campaignCreation,
      },
    ]);
    expect(toolCompletion).toEqual({
      content: [{ type: 'text', text: JSON.stringify(createdCampaign, null, 2) }],
    });
    await mcpClient.close();
  });

  it('posts a clone document under an encoded campaign path', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const clonedCampaign = {};
    const { sellerSession, postCalls } = sellerSessionReturning<typeof clonedCampaign>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: clonedCampaign,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_clone_campaign',
      {
        campaign_id: 'CAMPAIGN/1',
        campaignName: 'Spring clone',
        startDate: '2026-04-01T00:00:00Z',
      },
    );

    expect(postCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/ad_campaign/CAMPAIGN%2F1/clone',
        requestDocument: {
          campaignName: 'Spring clone',
          startDate: '2026-04-01T00:00:00Z',
        },
      },
    ]);
    expect(toolCompletion).toEqual({
      content: [{ type: 'text', text: JSON.stringify(clonedCampaign, null, 2) }],
    });
    await mcpClient.close();
  });

  it('sends the exact marketplace header for budget suggestions', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const budgetSuggestion = {
      suggestedBudget: [{ campaignId: 'CAMPAIGN-1' }],
    };
    const { sellerSession, getCalls } = sellerSessionReturning<typeof budgetSuggestion>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: budgetSuggestion,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_suggest_budget',
      { 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US' },
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/ad_campaign/suggest_budget',
        requestHeaders: { 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US' },
      },
    ]);
    expect(toolCompletion).toEqual({
      content: [{ type: 'text', text: JSON.stringify(budgetSuggestion, null, 2) }],
    });
    await mcpClient.close();
  });

  it('returns empty MCP content after a 204 campaign lifecycle post', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, postCalls } = sellerSessionReturning<undefined>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_pause_campaign',
      { campaign_id: 'CAMPAIGN/1' },
    );

    expect(postCalls).toEqual([{ endpoint: '/sell/marketing/v1/ad_campaign/CAMPAIGN%2F1/pause' }]);
    expect(toolCompletion).toEqual({ content: [] });
    await mcpClient.close();
  });
});

describe('Sell Marketing campaign MCP validation', () => {
  it('rejects renamed fields and nested request wrappers before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls, postCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    const renamedCollection = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_get_campaigns',
      { campaignName: 'Spring sale', limit: 25 },
    );
    expect(renamedCollection.toolCompletion).toMatchObject({ isError: true });
    expect(getCalls).toEqual([]);
    await renamedCollection.mcpClient.close();

    const wrappedCreate = await callEbayTool(sellerSession, 'ebay_sell_marketing_create_campaign', {
      request: campaignCreation,
    });
    expect(wrappedCreate.toolCompletion).toMatchObject({ isError: true });
    expect(postCalls).toEqual([]);
    await wrappedCreate.mcpClient.close();

    const aliasedPath = await callEbayTool(sellerSession, 'ebay_sell_marketing_get_campaign', {
      campaignId: 'CAMPAIGN-1',
    });
    expect(aliasedPath.toolCompletion).toMatchObject({ isError: true });
    expect(getCalls).toEqual([]);
    await aliasedPath.mcpClient.close();
  });
});

describe('Sell Marketing campaign MCP failures', () => {
  it.each(campaignFailureScenarios)(
    'translates a $ebayFailure.kind failure for $toolName once',
    async ({ ebayFailure, ebayArguments, toolName }) => {
      vi.stubEnv('EBAY_MCP_UI', 'off');
      const { sellerSession } = sellerSessionReturning<unknown>({
        kind: 'ebayRequestFailed',
        ebayFailure,
      });

      const { mcpClient, toolCompletion } = await callEbayTool(
        sellerSession,
        toolName,
        ebayArguments,
      );

      expect(toolCompletion).toMatchObject({
        content: [{ type: 'text', text: JSON.stringify({ ebayFailure }, null, 2) }],
        isError: true,
      });
      await mcpClient.close();
    },
  );
});
