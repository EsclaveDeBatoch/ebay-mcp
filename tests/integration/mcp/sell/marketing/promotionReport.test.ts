import { afterEach, describe, expect, it, vi } from 'vitest';

import type { PromotionReportsPage } from '@/ebay/sell/marketing/promotionReport.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';

const promotionReportsPage: PromotionReportsPage = {
  promotionReports: [
    {
      promotionId: 'PROMO-1',
      promotionReportId: 'REPORT-1',
      percentageSalesLift: '12.5',
    },
  ],
  total: 1,
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Sell Marketing promotion-report MCP exposure', () => {
  it('exposes the official get operation once without a compatibility name', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<PromotionReportsPage>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: promotionReportsPage,
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);

    expect(
      listedToolNames.filter(
        (listedToolName) => listedToolName === 'ebay_sell_marketing_get_promotion_reports',
      ),
    ).toEqual(['ebay_sell_marketing_get_promotion_reports']);
    expect(listedToolNames).not.toContain('ebay_get_promotion_reports');
    await mcpClient.close();
  });
});

describe('Sell Marketing promotion-report MCP calls', () => {
  it('gets promotion reports with exact underscore query keys', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls } = sellerSessionReturning<PromotionReportsPage>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: promotionReportsPage,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_get_promotion_reports',
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
        endpoint: '/sell/marketing/v1/promotion_report',
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
      content: [{ type: 'text', text: JSON.stringify(promotionReportsPage, null, 2) }],
    });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });
});

describe('Sell Marketing promotion-report MCP validation and failures', () => {
  it('rejects renamed marketplace fields before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls } = sellerSessionReturning<PromotionReportsPage>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: promotionReportsPage,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_get_promotion_reports',
      { marketplaceId: 'EBAY_US' },
    );

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(getCalls).toEqual([]);
    await mcpClient.close();
  });

  it.each(ebayFailures)('translates a $kind lookup failure once', async (ebayFailure) => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<PromotionReportsPage>({
      kind: 'ebayRequestFailed',
      ebayFailure,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_get_promotion_reports',
      { marketplace_id: 'EBAY_US' },
    );

    expect(toolCompletion).toMatchObject({ isError: true });
    await mcpClient.close();
  });
});
