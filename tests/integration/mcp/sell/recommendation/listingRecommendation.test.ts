import { afterEach, describe, expect, it, vi } from 'vitest';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { ListingRecommendations } from '@/ebay/sell/recommendation/listingRecommendation.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import {
  findAllActiveListingRecommendationsArguments,
  findListingRecommendationsArguments,
  listingRecommendationsDocument,
} from '@tests/fixtures/listingRecommendation.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';

const toolName = 'ebay_sell_recommendation_find_listing_recommendations';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Sell Recommendation MCP exposure', () => {
  it('is exposed once under its official hierarchical name and namespace gate', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'sell.recommendation');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const successfulRequest: EbayRequestCompletion<ListingRecommendations> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: listingRecommendationsDocument,
    };
    const { sellerSession } = sellerSessionReturning(successfulRequest);
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    expect(listedTools.tools.filter((ebayTool) => ebayTool.name === toolName)).toHaveLength(1);
    await mcpClient.close();
  });
});

describe('Sell Recommendation successful MCP calls', () => {
  it('validates once, uses the exact wire contract, and returns the document unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const successfulRequest: EbayRequestCompletion<ListingRecommendations> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: listingRecommendationsDocument,
    };
    const { sellerSession, postCalls } = sellerSessionReturning(successfulRequest);

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      toolName,
      findListingRecommendationsArguments,
    );

    expect(postCalls).toEqual([
      {
        endpoint: '/sell/recommendation/v1/find',
        searchParameters: {
          filter: 'recommendationTypes:{AD}',
          limit: '25',
          offset: '0',
        },
        requestHeaders: { 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US' },
        requestDocument: { listingIds: ['110000000000'] },
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(listingRecommendationsDocument, null, 2) }],
    });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });

  it('requests recommendations for all active listings with an empty document', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, postCalls } = sellerSessionReturning<ListingRecommendations>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: listingRecommendationsDocument,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      toolName,
      findAllActiveListingRecommendationsArguments,
    );

    expect(postCalls).toEqual([
      {
        endpoint: '/sell/recommendation/v1/find',
        searchParameters: { filter: undefined, limit: undefined, offset: undefined },
        requestHeaders: { 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US' },
        requestDocument: {},
      },
    ]);
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });
});

describe('Sell Recommendation MCP validation', () => {
  it.each([
    { ...findListingRecommendationsArguments, filter: 'recommendationTypes:{SEO}' },
    { ...findListingRecommendationsArguments, limit: '501' },
    { ...findListingRecommendationsArguments, offset: '-1' },
    { ...findListingRecommendationsArguments, 'X-EBAY-C-MARKETPLACE-ID': '' },
    { ...findListingRecommendationsArguments, listingIds: [] },
    { ...findListingRecommendationsArguments, marketplaceId: 'EBAY_US' },
  ])('rejects invalid or unknown fields before the seller session', async (invalidArguments) => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, postCalls } = sellerSessionReturning<ListingRecommendations>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: listingRecommendationsDocument,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      toolName,
      invalidArguments,
    );

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(postCalls).toEqual([]);
    await mcpClient.close();
  });
});

describe('Sell Recommendation MCP failures', () => {
  it.each(ebayFailures)(
    'translates $kind exactly once at the MCP boundary',
    async (ebayFailure) => {
      vi.stubEnv('EBAY_MCP_UI', 'off');
      const { sellerSession } = sellerSessionReturning<ListingRecommendations>({
        kind: 'ebayRequestFailed',
        ebayFailure,
      });

      const { mcpClient, toolCompletion } = await callEbayTool(
        sellerSession,
        toolName,
        findListingRecommendationsArguments,
      );

      expect(toolCompletion).toMatchObject({
        content: [{ type: 'text', text: JSON.stringify({ ebayFailure }, null, 2) }],
        isError: true,
      });
      await mcpClient.close();
    },
  );
});
