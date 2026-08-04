import { afterEach, describe, expect, it, vi } from 'vitest';

import type { PromotionSummaryReport } from '@/ebay/sell/marketing/promotionSummaryReport.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';

const summaryReport: PromotionSummaryReport = {
  baseSale: { currency: 'USD', value: '1000.00' },
  percentageSalesLift: '12.5',
  promotionSale: { currency: 'USD', value: '125.00' },
  totalSale: { currency: 'USD', value: '1125.00' },
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Sell Marketing promotion-summary-report MCP exposure', () => {
  it('exposes the official get operation once without a compatibility name', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<PromotionSummaryReport>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: summaryReport,
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);

    expect(
      listedToolNames.filter(
        (listedToolName) => listedToolName === 'ebay_sell_marketing_get_promotion_summary_report',
      ),
    ).toEqual(['ebay_sell_marketing_get_promotion_summary_report']);
    expect(listedToolNames).not.toContain('ebay_get_promotion_summary_report');
    await mcpClient.close();
  });
});

describe('Sell Marketing promotion-summary-report MCP calls', () => {
  it('gets the summary report with the exact marketplace_id query', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls } = sellerSessionReturning<PromotionSummaryReport>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: summaryReport,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_get_promotion_summary_report',
      { marketplace_id: 'EBAY_US' },
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/promotion_summary_report',
        searchParameters: { marketplace_id: 'EBAY_US' },
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(summaryReport, null, 2) }],
    });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });
});

describe('Sell Marketing promotion-summary-report MCP validation and failures', () => {
  it('rejects renamed marketplace fields before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls } = sellerSessionReturning<PromotionSummaryReport>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: summaryReport,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_get_promotion_summary_report',
      { marketplaceId: 'EBAY_US' },
    );

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(getCalls).toEqual([]);
    await mcpClient.close();
  });

  it.each(ebayFailures)('translates a $kind lookup failure once', async (ebayFailure) => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<PromotionSummaryReport>({
      kind: 'ebayRequestFailed',
      ebayFailure,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_get_promotion_summary_report',
      { marketplace_id: 'EBAY_US' },
    );

    expect(toolCompletion).toMatchObject({ isError: true });
    await mcpClient.close();
  });
});
