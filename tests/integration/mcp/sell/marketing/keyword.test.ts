import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Keyword, KeywordCollection } from '@/ebay/sell/marketing/keyword.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';

const keywordToolNames = [
  'ebay_sell_marketing_bulk_create_keyword',
  'ebay_sell_marketing_bulk_update_keyword',
  'ebay_sell_marketing_get_keywords',
  'ebay_sell_marketing_create_keyword',
  'ebay_sell_marketing_get_keyword',
  'ebay_sell_marketing_update_keyword',
] as const;

const keywordFailureCalls = [
  {
    ebayArguments: {
      campaign_id: 'CAMPAIGN-1',
      requests: [{ adGroupId: 'ADGROUP-1', keywordText: 'camera', matchType: 'EXACT' }],
    },
    toolName: 'ebay_sell_marketing_bulk_create_keyword',
  },
  {
    ebayArguments: {
      campaign_id: 'CAMPAIGN-1',
      requests: [{ keywordId: 'KEYWORD-1', keywordStatus: 'PAUSED' }],
    },
    toolName: 'ebay_sell_marketing_bulk_update_keyword',
  },
  { ebayArguments: { campaign_id: 'CAMPAIGN-1' }, toolName: 'ebay_sell_marketing_get_keywords' },
  {
    ebayArguments: {
      campaign_id: 'CAMPAIGN-1',
      adGroupId: 'ADGROUP-1',
      keywordText: 'camera',
      matchType: 'EXACT',
    },
    toolName: 'ebay_sell_marketing_create_keyword',
  },
  {
    ebayArguments: { campaign_id: 'CAMPAIGN-1', keyword_id: 'KEYWORD-1' },
    toolName: 'ebay_sell_marketing_get_keyword',
  },
  {
    ebayArguments: {
      campaign_id: 'CAMPAIGN-1',
      keyword_id: 'KEYWORD-1',
      keywordStatus: 'PAUSED',
    },
    toolName: 'ebay_sell_marketing_update_keyword',
  },
] as const;

const keywordFailureScenarios = keywordFailureCalls.flatMap((keywordCall) =>
  ebayFailures.map((ebayFailure) => ({ ebayFailure, ...keywordCall })),
);

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Sell Marketing keyword MCP exposure', () => {
  it('exposes all six operations once under the official namespace gate', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'sell.marketing');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);

    for (const keywordToolName of keywordToolNames) {
      expect(
        listedToolNames.filter((listedToolName) => listedToolName === keywordToolName),
      ).toEqual([keywordToolName]);
    }
    await mcpClient.close();
  });

  it('keeps only the two resource reads in read-only mode', async () => {
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
          keywordToolNames.some((keywordToolName) => keywordToolName === listedToolName),
        ),
    ).toEqual(['ebay_sell_marketing_get_keywords', 'ebay_sell_marketing_get_keyword']);
    await mcpClient.close();
  });
});

describe('Sell Marketing keyword MCP calls', () => {
  it('returns the unchanged keyword collection with exact query wire keys', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const keywordCollection: KeywordCollection = {
      total: 1,
      keywords: [
        {
          keywordId: 'KEYWORD-1',
          adGroupId: 'ADGROUP-1',
          keywordText: 'camera',
          matchType: 'EXACT',
          keywordStatus: 'ACTIVE',
        },
      ],
    };
    const { sellerSession, getCalls } = sellerSessionReturning<KeywordCollection>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: keywordCollection,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_get_keywords',
      {
        campaign_id: 'CAMPAIGN-1',
        ad_group_ids: 'ADGROUP-1',
        keyword_status: 'ACTIVE',
        limit: '25',
        offset: '0',
      },
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/ad_campaign/CAMPAIGN-1/keyword',
        searchParameters: {
          ad_group_ids: 'ADGROUP-1',
          keyword_status: 'ACTIVE',
          limit: '25',
          offset: '0',
        },
      },
    ]);
    expect(toolCompletion).toEqual({
      content: [{ type: 'text', text: JSON.stringify(keywordCollection, null, 2) }],
    });
    await mcpClient.close();
  });

  it('returns one unchanged keyword from an encoded path', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const keyword: Keyword = {
      keywordId: 'KEYWORD/1',
      adGroupId: 'ADGROUP-1',
      keywordText: 'camera lens',
      matchType: 'PHRASE',
      keywordStatus: 'ACTIVE',
    };
    const { sellerSession, getCalls } = sellerSessionReturning<Keyword>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: keyword,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_get_keyword',
      { campaign_id: 'CAMPAIGN/1', keyword_id: 'KEYWORD/1' },
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/ad_campaign/CAMPAIGN%2F1/keyword/KEYWORD%2F1',
      },
    ]);
    expect(toolCompletion).toEqual({
      content: [{ type: 'text', text: JSON.stringify(keyword, null, 2) }],
    });
    await mcpClient.close();
  });

  it('creates one keyword with a flattened direct document', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, postCalls } = sellerSessionReturning<Record<string, never>>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_create_keyword',
      {
        campaign_id: 'CAMPAIGN-1',
        adGroupId: 'ADGROUP-1',
        keywordText: 'camera',
        matchType: 'EXACT',
        bid: { currency: 'USD', value: '0.50' },
      },
    );

    expect(postCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/ad_campaign/CAMPAIGN-1/keyword',
        requestDocument: {
          adGroupId: 'ADGROUP-1',
          keywordText: 'camera',
          matchType: 'EXACT',
          bid: { currency: 'USD', value: '0.50' },
        },
      },
    ]);
    expect(toolCompletion).toEqual({
      content: [{ type: 'text', text: JSON.stringify({}, null, 2) }],
    });
    await mcpClient.close();
  });
});

describe('Sell Marketing keyword MCP failures', () => {
  it.each(keywordFailureScenarios)(
    'surfaces $ebayFailure.kind from $toolName',
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
        isError: true,
        content: [{ type: 'text' }],
      });
      await mcpClient.close();
    },
  );
});

describe('Sell Marketing keyword MCP validation', () => {
  it('rejects renamed fields and wrappers before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls, postCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    const { mcpClient: getClient, toolCompletion: getCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_get_keywords',
      { campaignId: 'CAMPAIGN-1' },
    );
    const { mcpClient: createClient, toolCompletion: createCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_create_keyword',
      {
        campaign_id: 'CAMPAIGN-1',
        request: {
          adGroupId: 'ADGROUP-1',
          keywordText: 'camera',
          matchType: 'EXACT',
        },
      },
    );

    expect(getCompletion.isError).toBe(true);
    expect(createCompletion.isError).toBe(true);
    expect(getCalls).toEqual([]);
    expect(postCalls).toEqual([]);
    await getClient.close();
    await createClient.close();
  });
});
