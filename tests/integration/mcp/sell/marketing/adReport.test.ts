import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AdReport } from '@/ebay/sell/marketing/adReport.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';

const getReportToolName = 'ebay_sell_marketing_get_report';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Sell Marketing ad report MCP exposure', () => {
  it('exposes getReport once under the official namespace gate', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'sell.marketing');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    expect(
      listedTools.tools
        .map((ebayTool) => ebayTool.name)
        .filter((listedToolName) => listedToolName === getReportToolName),
    ).toEqual([getReportToolName]);
    await mcpClient.close();
  });
});

describe('Sell Marketing ad report MCP calls', () => {
  it('downloads report text from an encoded path', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const reportBody: AdReport = 'date\tclicks\n2026-07-01\t12\n';
    const { sellerSession, getCalls } = sellerSessionReturning<AdReport>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: reportBody,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(sellerSession, getReportToolName, {
      report_id: 'REPORT/1',
    });

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/ad_report/REPORT%2F1',
        responseType: 'text',
      },
    ]);
    expect(toolCompletion).toEqual({
      content: [{ type: 'text', text: JSON.stringify(reportBody, null, 2) }],
    });
    await mcpClient.close();
  });
});

describe('Sell Marketing ad report MCP failures', () => {
  it.each(ebayFailures)('surfaces $kind from getReport', async (ebayFailure) => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestFailed',
      ebayFailure,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(sellerSession, getReportToolName, {
      report_id: 'REPORT-1',
    });

    expect(toolCompletion).toMatchObject({
      isError: true,
      content: [{ type: 'text' }],
    });
    await mcpClient.close();
  });
});

describe('Sell Marketing ad report MCP validation', () => {
  it('rejects renamed path fields before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    const { mcpClient, toolCompletion } = await callEbayTool(sellerSession, getReportToolName, {
      reportId: 'REPORT-1',
    });

    expect(toolCompletion.isError).toBe(true);
    expect(getCalls).toEqual([]);
    await mcpClient.close();
  });
});
