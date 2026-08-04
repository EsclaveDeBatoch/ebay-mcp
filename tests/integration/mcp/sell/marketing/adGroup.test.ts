import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  AdGroup,
  AdGroupPagedCollection,
  TargetedBidsPagedCollection,
} from '@/ebay/sell/marketing/adGroup.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';

const adGroupToolNames = [
  'ebay_sell_marketing_get_ad_groups',
  'ebay_sell_marketing_create_ad_group',
  'ebay_sell_marketing_get_ad_group',
  'ebay_sell_marketing_update_ad_group',
  'ebay_sell_marketing_suggest_bids',
  'ebay_sell_marketing_suggest_keywords',
] as const;

const legacyAdGroupToolNames = [
  'ebay_get_ad_groups',
  'ebay_create_ad_group',
  'ebay_get_ad_group',
  'ebay_update_ad_group',
  'ebay_suggest_bids',
  'ebay_suggest_keywords',
] as const;

const adGroupFailureCalls = [
  { ebayArguments: { campaign_id: 'C1' }, toolName: 'ebay_sell_marketing_get_ad_groups' },
  {
    ebayArguments: {
      campaign_id: 'C1',
      name: 'Cameras',
      defaultBid: { currency: 'USD', value: '0.50' },
    },
    toolName: 'ebay_sell_marketing_create_ad_group',
  },
  {
    ebayArguments: { campaign_id: 'C1', ad_group_id: 'G1' },
    toolName: 'ebay_sell_marketing_get_ad_group',
  },
  {
    ebayArguments: {
      campaign_id: 'C1',
      ad_group_id: 'G1',
      name: 'Lenses',
    },
    toolName: 'ebay_sell_marketing_update_ad_group',
  },
  {
    ebayArguments: {
      campaign_id: 'C1',
      ad_group_id: 'G1',
      keywords: [{ keywordText: 'camera', matchType: 'EXACT' }],
    },
    toolName: 'ebay_sell_marketing_suggest_bids',
  },
  {
    ebayArguments: {
      campaign_id: 'C1',
      ad_group_id: 'G1',
      listingIds: ['1'],
      matchType: 'BROAD',
    },
    toolName: 'ebay_sell_marketing_suggest_keywords',
  },
] as const;

const adGroupFailureScenarios = adGroupFailureCalls.flatMap((adGroupCall) =>
  ebayFailures.map((ebayFailure) => ({ ebayFailure, ...adGroupCall })),
);

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Sell Marketing ad group MCP exposure', () => {
  it('exposes all six operations once without compatibility names', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);

    for (const adGroupToolName of adGroupToolNames) {
      expect(
        listedToolNames.filter((listedToolName) => listedToolName === adGroupToolName),
      ).toEqual([adGroupToolName]);
    }
    for (const legacyAdGroupToolName of legacyAdGroupToolNames) {
      expect(listedToolNames).not.toContain(legacyAdGroupToolName);
    }
    await mcpClient.close();
  });

  it('keeps only the four resource reads in read-only mode', async () => {
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
          adGroupToolNames.some((adGroupToolName) => adGroupToolName === listedToolName),
        ),
    ).toEqual([
      'ebay_sell_marketing_get_ad_groups',
      'ebay_sell_marketing_get_ad_group',
      'ebay_sell_marketing_suggest_bids',
      'ebay_sell_marketing_suggest_keywords',
    ]);
    await mcpClient.close();
  });
});

describe('Sell Marketing ad group MCP calls', () => {
  it('returns the unchanged paginated ad-group collection', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const adGroupCollection: AdGroupPagedCollection = {
      total: 1,
      adGroups: [
        {
          adGroupId: 'G1',
          name: 'Cameras',
          adGroupStatus: 'RUNNING',
          defaultBid: { currency: 'USD', value: '0.50' },
        },
      ],
    };
    const { sellerSession, getCalls } = sellerSessionReturning<AdGroupPagedCollection>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: adGroupCollection,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_get_ad_groups',
      {
        campaign_id: 'C1',
        ad_group_status: 'RUNNING',
        limit: '25',
        offset: '0',
      },
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/ad_campaign/C1/ad_group',
        searchParameters: {
          ad_group_status: 'RUNNING',
          limit: '25',
          offset: '0',
        },
      },
    ]);
    expect(toolCompletion).toEqual({
      content: [{ type: 'text', text: JSON.stringify(adGroupCollection, null, 2) }],
    });
    await mcpClient.close();
  });

  it('returns one unchanged ad group from an encoded path', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const adGroup: AdGroup = {
      adGroupId: 'G/1',
      name: 'Cameras',
      adGroupStatus: 'RUNNING',
    };
    const { sellerSession, getCalls } = sellerSessionReturning<AdGroup>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: adGroup,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_get_ad_group',
      { campaign_id: 'C/1', ad_group_id: 'G/1' },
    );

    expect(getCalls).toEqual([{ endpoint: '/sell/marketing/v1/ad_campaign/C%2F1/ad_group/G%2F1' }]);
    expect(toolCompletion).toEqual({
      content: [{ type: 'text', text: JSON.stringify(adGroup, null, 2) }],
    });
    await mcpClient.close();
  });

  it('posts a direct suggest-bids document without request wrappers', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const bidSuggestions: TargetedBidsPagedCollection = {
      suggestedBids: [{ keywordText: 'camera', matchType: 'EXACT' }],
    };
    const { sellerSession, postCalls } = sellerSessionReturning<TargetedBidsPagedCollection>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: bidSuggestions,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_suggest_bids',
      {
        campaign_id: 'C1',
        ad_group_id: 'G1',
        keywords: [{ keywordText: 'camera', matchType: 'EXACT' }],
      },
    );

    expect(postCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/ad_campaign/C1/ad_group/G1/suggest_bids',
        requestDocument: {
          keywords: [{ keywordText: 'camera', matchType: 'EXACT' }],
        },
      },
    ]);
    expect(toolCompletion).toEqual({
      content: [{ type: 'text', text: JSON.stringify(bidSuggestions, null, 2) }],
    });
    await mcpClient.close();
  });
});

describe('Sell Marketing ad group MCP failures', () => {
  it.each(adGroupFailureScenarios)(
    'translates every $ebayFailure.kind failure once for $toolName',
    async ({ ebayArguments, ebayFailure, toolName }) => {
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
