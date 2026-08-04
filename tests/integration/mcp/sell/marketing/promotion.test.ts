import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ListingSet, PromotionsPage } from '@/ebay/sell/marketing/promotion.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';

const promotionToolNames = [
  'ebay_sell_marketing_get_listing_set',
  'ebay_sell_marketing_get_promotions',
  'ebay_sell_marketing_pause_promotion',
  'ebay_sell_marketing_resume_promotion',
] as const;

const promotionsPage: PromotionsPage = {
  promotions: [
    {
      marketplaceId: 'EBAY_US',
      name: 'Weekend markdown',
      promotionId: 'PROMO-1',
      promotionStatus: 'RUNNING',
      promotionType: 'MARKDOWN_SALE',
    },
  ],
  total: 1,
};

const listingSet: ListingSet = {
  listings: [{ listingId: '110000000000', title: 'Camera' }],
  total: 1,
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Sell Marketing promotion MCP exposure', () => {
  it('exposes four official operations once without compatibility names', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<PromotionsPage>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: promotionsPage,
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);

    for (const toolName of promotionToolNames) {
      expect(listedToolNames.filter((listedToolName) => listedToolName === toolName)).toEqual([
        toolName,
      ]);
    }
    expect(listedToolNames).not.toContain('ebay_get_promotions');
    await mcpClient.close();
  });

  it('keeps only the two reads in read-only mode', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'sell.marketing');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    vi.stubEnv('EBAY_READ_ONLY', 'true');
    const { sellerSession } = sellerSessionReturning<PromotionsPage>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: promotionsPage,
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);

    expect(listedToolNames).toContain('ebay_sell_marketing_get_listing_set');
    expect(listedToolNames).toContain('ebay_sell_marketing_get_promotions');
    expect(listedToolNames).not.toContain('ebay_sell_marketing_pause_promotion');
    expect(listedToolNames).not.toContain('ebay_sell_marketing_resume_promotion');
    await mcpClient.close();
  });
});

describe('Sell Marketing promotion MCP calls', () => {
  it('gets promotions with exact underscore query keys and returns every field', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls } = sellerSessionReturning<PromotionsPage>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: promotionsPage,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_get_promotions',
      {
        limit: '25',
        marketplace_id: 'EBAY_US',
        offset: '0',
        promotion_status: 'RUNNING',
        promotion_type: 'MARKDOWN_SALE',
      },
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/promotion',
        searchParameters: {
          limit: '25',
          marketplace_id: 'EBAY_US',
          offset: '0',
          promotion_status: 'RUNNING',
          promotion_type: 'MARKDOWN_SALE',
        },
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(promotionsPage, null, 2) }],
    });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });

  it('gets a listing set with the promotion_id path and string query fields', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls } = sellerSessionReturning<ListingSet>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: listingSet,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_get_listing_set',
      { promotion_id: 'PROMO-1', limit: '25', offset: '0', status: 'ACTIVE' },
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/promotion/PROMO-1/get_listing_set',
        searchParameters: { limit: '25', offset: '0', status: 'ACTIVE' },
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(listingSet, null, 2) }],
    });
    await mcpClient.close();
  });

  it('pauses and resumes with the exact promotion_id path', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, postCalls } = sellerSessionReturning<undefined>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    });

    const pauseCall = await callEbayTool(sellerSession, 'ebay_sell_marketing_pause_promotion', {
      promotion_id: 'PROMO-1@EBAY_US',
    });
    const resumeCall = await callEbayTool(sellerSession, 'ebay_sell_marketing_resume_promotion', {
      promotion_id: 'PROMO-1@EBAY_US',
    });

    expect(postCalls).toEqual([
      { endpoint: '/sell/marketing/v1/promotion/PROMO-1%40EBAY_US/pause' },
      { endpoint: '/sell/marketing/v1/promotion/PROMO-1%40EBAY_US/resume' },
    ]);
    expect(pauseCall.toolCompletion).toEqual({ content: [] });
    expect(resumeCall.toolCompletion).toEqual({ content: [] });
    await pauseCall.mcpClient.close();
    await resumeCall.mcpClient.close();
  });
});

describe('Sell Marketing promotion MCP validation and failures', () => {
  it('rejects renamed marketplace fields before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls } = sellerSessionReturning<PromotionsPage>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: promotionsPage,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_get_promotions',
      { marketplaceId: 'EBAY_US' },
    );

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(getCalls).toEqual([]);
    await mcpClient.close();
  });

  it.each(ebayFailures)('translates a $kind lookup failure once', async (ebayFailure) => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<PromotionsPage>({
      kind: 'ebayRequestFailed',
      ebayFailure,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_get_promotions',
      { marketplace_id: 'EBAY_US' },
    );

    expect(toolCompletion).toMatchObject({ isError: true });
    await mcpClient.close();
  });
});
