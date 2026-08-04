import { afterEach, describe, expect, it, vi } from 'vitest';

import type { EbayFailure, EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { TrafficReport } from '@/ebay/sell/analytics/trafficReport.js';
import { sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';
import { trafficReportDocument, trafficReportQuery } from '@tests/fixtures/trafficReport.js';

const toolName = 'ebay_sell_analytics_get_traffic_report';

describe('Sell Analytics traffic report through MCP', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('is exposed once under its official hierarchical name and namespace gate', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'sell.analytics');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const successfulRequest: EbayRequestCompletion<TrafficReport> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: trafficReportDocument,
    };
    const { sellerSession } = sellerSessionReturning(successfulRequest);
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    expect(listedTools.tools.filter((ebayTool) => ebayTool.name === toolName)).toHaveLength(1);
    await mcpClient.close();
  });

  it('validates once, calls the exact eBay wire contract, and returns the document unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const successfulRequest: EbayRequestCompletion<TrafficReport> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: trafficReportDocument,
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulRequest);

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      toolName,
      trafficReportQuery,
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/analytics/v1/traffic_report',
        searchParameters: trafficReportQuery,
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(trafficReportDocument, null, 2) }],
    });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });

  it.each([
    {
      dimension: 'DAY',
      filter: trafficReportQuery.filter,
    },
    { ...trafficReportQuery, dimension: 'MONTH' },
    { ...trafficReportQuery, filter: '' },
    { ...trafficReportQuery, metric: '' },
    { ...trafficReportQuery, sort: '' },
    { ...trafficReportQuery, marketplaceId: 'EBAY_US' },
  ])('rejects invalid or unknown arguments before the seller session', async (invalidArguments) => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls } = sellerSessionReturning({
      kind: 'ebayRequestSucceeded',
      ebayDocument: trafficReportDocument,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      toolName,
      invalidArguments,
    );

    expect(toolCompletion).toMatchObject({ isError: true });
    if (!('content' in toolCompletion)) {
      throw new Error('Expected an MCP call completion');
    }
    const toolContent = toolCompletion.content;
    if (!Array.isArray(toolContent)) {
      throw new Error('Expected MCP content blocks');
    }
    expect(toolContent[0]).toMatchObject({
      type: 'text',
      text: expect.stringContaining('Input validation error'),
    });
    expect(getCalls).toEqual([]);
    await mcpClient.close();
  });

  it.each<EbayFailure>([
    { kind: 'ebayAuthenticationFailed', message: 'Seller authorization expired' },
    { kind: 'ebayRateLimited', message: 'Request quota exhausted' },
    { kind: 'ebayRequestRejected', message: 'Invalid date range', status: 400 },
    { kind: 'ebayUnavailable', message: 'Service unavailable' },
  ])('translates $kind exactly once at the MCP boundary', async (ebayFailure) => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning({ kind: 'ebayRequestFailed', ebayFailure });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      toolName,
      trafficReportQuery,
    );

    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify({ ebayFailure }, null, 2) }],
      isError: true,
    });
    await mcpClient.close();
  });
});
