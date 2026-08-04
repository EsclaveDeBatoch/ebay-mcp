import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  NegativeKeyword,
  NegativeKeywordCollection,
} from '@/ebay/sell/marketing/negativeKeyword.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';

const negativeKeywordToolNames = [
  'ebay_sell_marketing_bulk_create_negative_keyword',
  'ebay_sell_marketing_bulk_update_negative_keyword',
  'ebay_sell_marketing_get_negative_keywords',
  'ebay_sell_marketing_create_negative_keyword',
  'ebay_sell_marketing_get_negative_keyword',
  'ebay_sell_marketing_update_negative_keyword',
] as const;

const negativeKeywordCreation = {
  campaignId: 'CAMPAIGN-1',
  adGroupId: 'ADGROUP-1',
  negativeKeywordMatchType: 'EXACT',
  negativeKeywordText: 'cheap',
};

const negativeKeywordFailureCalls = [
  {
    ebayArguments: { requests: [negativeKeywordCreation] },
    toolName: 'ebay_sell_marketing_bulk_create_negative_keyword',
  },
  {
    ebayArguments: {
      requests: [{ negativeKeywordId: 'NEG-1', negativeKeywordStatus: 'ARCHIVED' }],
    },
    toolName: 'ebay_sell_marketing_bulk_update_negative_keyword',
  },
  { ebayArguments: {}, toolName: 'ebay_sell_marketing_get_negative_keywords' },
  {
    ebayArguments: negativeKeywordCreation,
    toolName: 'ebay_sell_marketing_create_negative_keyword',
  },
  {
    ebayArguments: { negative_keyword_id: 'NEG-1' },
    toolName: 'ebay_sell_marketing_get_negative_keyword',
  },
  {
    ebayArguments: {
      negative_keyword_id: 'NEG-1',
      negativeKeywordStatus: 'ARCHIVED',
    },
    toolName: 'ebay_sell_marketing_update_negative_keyword',
  },
] as const;

const negativeKeywordFailureScenarios = negativeKeywordFailureCalls.flatMap((negativeKeywordCall) =>
  ebayFailures.map((ebayFailure) => ({ ebayFailure, ...negativeKeywordCall })),
);

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Sell Marketing negative keyword MCP exposure', () => {
  it('exposes all six operations once under the official namespace gate', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'sell.marketing');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);

    for (const negativeKeywordToolName of negativeKeywordToolNames) {
      expect(
        listedToolNames.filter((listedToolName) => listedToolName === negativeKeywordToolName),
      ).toEqual([negativeKeywordToolName]);
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
          negativeKeywordToolNames.some(
            (negativeKeywordToolName) => negativeKeywordToolName === listedToolName,
          ),
        ),
    ).toEqual([
      'ebay_sell_marketing_get_negative_keywords',
      'ebay_sell_marketing_get_negative_keyword',
    ]);
    await mcpClient.close();
  });
});

describe('Sell Marketing negative keyword MCP calls', () => {
  it('returns the unchanged negative keyword collection with exact query wire keys', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const negativeKeywordCollection: NegativeKeywordCollection = {
      total: 1,
      negativeKeywords: [
        {
          negativeKeywordId: 'NEG-1',
          campaignId: 'CAMPAIGN-1',
          adGroupId: 'ADGROUP-1',
          negativeKeywordText: 'cheap',
          negativeKeywordMatchType: 'EXACT',
          negativeKeywordStatus: 'ACTIVE',
        },
      ],
    };
    const { sellerSession, getCalls } = sellerSessionReturning<NegativeKeywordCollection>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: negativeKeywordCollection,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_get_negative_keywords',
      {
        ad_group_ids: 'ADGROUP-1',
        campaign_ids: 'CAMPAIGN-1',
        limit: '25',
        negative_keyword_status: 'ACTIVE',
        offset: '0',
      },
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/negative_keyword',
        searchParameters: {
          ad_group_ids: 'ADGROUP-1',
          campaign_ids: 'CAMPAIGN-1',
          limit: '25',
          negative_keyword_status: 'ACTIVE',
          offset: '0',
        },
      },
    ]);
    expect(toolCompletion).toEqual({
      content: [{ type: 'text', text: JSON.stringify(negativeKeywordCollection, null, 2) }],
    });
    await mcpClient.close();
  });

  it('returns one unchanged negative keyword from an encoded path', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const negativeKeyword: NegativeKeyword = {
      negativeKeywordId: 'NEG/1',
      negativeKeywordText: 'cheap',
      negativeKeywordMatchType: 'PHRASE',
      negativeKeywordStatus: 'ACTIVE',
    };
    const { sellerSession, getCalls } = sellerSessionReturning<NegativeKeyword>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: negativeKeyword,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_get_negative_keyword',
      { negative_keyword_id: 'NEG/1' },
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/negative_keyword/NEG%2F1',
      },
    ]);
    expect(toolCompletion).toEqual({
      content: [{ type: 'text', text: JSON.stringify(negativeKeyword, null, 2) }],
    });
    await mcpClient.close();
  });

  it('creates one negative keyword with a flattened direct document', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, postCalls } = sellerSessionReturning<Record<string, never>>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_create_negative_keyword',
      negativeKeywordCreation,
    );

    expect(postCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/negative_keyword',
        requestDocument: negativeKeywordCreation,
      },
    ]);
    expect(toolCompletion).toEqual({
      content: [{ type: 'text', text: JSON.stringify({}, null, 2) }],
    });
    await mcpClient.close();
  });
});

describe('Sell Marketing negative keyword MCP failures', () => {
  it.each(negativeKeywordFailureScenarios)(
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

describe('Sell Marketing negative keyword MCP validation', () => {
  it('rejects renamed fields and wrappers before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls, postCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    const { mcpClient: getClient, toolCompletion: getCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_get_negative_keywords',
      { campaignIds: 'CAMPAIGN-1' },
    );
    const { mcpClient: createClient, toolCompletion: createCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_create_negative_keyword',
      { request: negativeKeywordCreation },
    );

    expect(getCompletion.isError).toBe(true);
    expect(createCompletion.isError).toBe(true);
    expect(getCalls).toEqual([]);
    expect(postCalls).toEqual([]);
    await getClient.close();
    await createClient.close();
  });
});
