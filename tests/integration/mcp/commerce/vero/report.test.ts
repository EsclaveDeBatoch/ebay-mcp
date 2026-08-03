import { afterEach, describe, expect, it, vi } from 'vitest';

import { sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';

const veroToolNames = [
  'ebay_commerce_vero_create_report',
  'ebay_commerce_vero_get_report',
  'ebay_commerce_vero_get_report_items',
  'ebay_commerce_vero_get_reason_code',
  'ebay_commerce_vero_get_reason_codes',
] as const;

const flatVeroToolNames = [
  'ebay_create_vero_report',
  'ebay_get_vero_report',
  'ebay_get_vero_report_items',
  'ebay_get_vero_reason_code',
  'ebay_get_vero_reason_codes',
] as const;

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Commerce VeRO MCP exposure', () => {
  it('exposes hierarchical names once without flat compatibility names', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const sellerSession = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    }).sellerSession;
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);

    for (const veroToolName of veroToolNames) {
      expect(listedToolNames.filter((listedToolName) => listedToolName === veroToolName)).toEqual([
        veroToolName,
      ]);
    }
    for (const flatVeroToolName of flatVeroToolNames) {
      expect(listedToolNames).not.toContain(flatVeroToolName);
    }

    await mcpClient.close();
  });

  it('exposes only VeRO through commerce.vero', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'commerce.vero');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const sellerSession = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    }).sellerSession;
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    expect(listedTools.tools.map((ebayTool) => ebayTool.name)).toEqual(veroToolNames);
    await mcpClient.close();
  });

  it('removes report creation in read-only mode', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'commerce.vero');
    vi.stubEnv('EBAY_READ_ONLY', 'true');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const sellerSession = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    }).sellerSession;
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    expect(listedTools.tools.map((ebayTool) => ebayTool.name)).toEqual(veroToolNames.slice(1));
    await mcpClient.close();
  });
});

describe('Commerce VeRO MCP calls', () => {
  it('posts the direct eBay report document', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const veroReport = {
      reportItems: [{ itemId: '110000000000', veroReasonCodeId: '1001' }],
    };
    const { sellerSession, postCalls } = sellerSessionReturning({
      kind: 'ebayRequestSucceeded',
      ebayDocument: { veroReportId: 'REPORT123', veroReportStatus: 'PENDING' },
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_commerce_vero_create_report',
      veroReport,
    );

    expect(toolCompletion.isError).not.toBe(true);
    expect(postCalls).toEqual([
      {
        endpoint: '/commerce/vero/v1/vero_report',
        requestDocument: veroReport,
      },
    ]);
    await mcpClient.close();
  });

  it('rejects the removed reportData wrapper before calling eBay', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, postCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_commerce_vero_create_report',
      {
        reportData: {
          reportItems: [{ itemId: '110000000000', veroReasonCodeId: '1001' }],
        },
      },
    );

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(postCalls).toEqual([]);
    await mcpClient.close();
  });

  it('sends the official marketplace header for reason-code lookup', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls } = sellerSessionReturning({
      kind: 'ebayRequestSucceeded',
      ebayDocument: { veroReasonCodes: [] },
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_commerce_vero_get_reason_codes',
      { 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US' },
    );

    expect(toolCompletion.isError).not.toBe(true);
    expect(getCalls).toEqual([
      {
        endpoint: '/commerce/vero/v1/vero_reason_code',
        requestHeaders: { 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US' },
      },
    ]);
    await mcpClient.close();
  });
});
