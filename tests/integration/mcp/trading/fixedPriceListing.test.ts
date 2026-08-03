import { afterEach, describe, expect, it, vi } from 'vitest';

import { sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';

const tradingToolNames = [
  'ebay_trading_get_active_listings',
  'ebay_trading_get_listing',
  'ebay_trading_create_listing',
  'ebay_trading_revise_listing',
  'ebay_trading_end_listing',
  'ebay_trading_relist_listing',
] as const;

const flatTradingToolNames = [
  'ebay_get_active_listings',
  'ebay_get_listing',
  'ebay_create_listing',
  'ebay_revise_listing',
  'ebay_end_listing',
  'ebay_relist_item',
] as const;

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Trading listing MCP exposure', () => {
  it('exposes hierarchical names once without flat aliases', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<Record<string, unknown>>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);

    for (const tradingToolName of tradingToolNames) {
      expect(listedToolNames.filter((listedName) => listedName === tradingToolName)).toEqual([
        tradingToolName,
      ]);
    }
    for (const flatTradingToolName of flatTradingToolNames) {
      expect(listedToolNames).not.toContain(flatTradingToolName);
    }

    await mcpClient.close();
  });

  it('exposes only Trading listing tools through the trading gate', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'trading');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<Record<string, unknown>>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    expect(listedTools.tools.map((ebayTool) => ebayTool.name)).toEqual(tradingToolNames);
    await mcpClient.close();
  });

  it('keeps only the two retrieval operations in read-only mode', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'trading');
    vi.stubEnv('EBAY_READ_ONLY', 'true');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<Record<string, unknown>>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    expect(listedTools.tools.map((ebayTool) => ebayTool.name)).toEqual([
      'ebay_trading_get_active_listings',
      'ebay_trading_get_listing',
    ]);
    await mcpClient.close();
  });
});

describe('Trading listing MCP calls', () => {
  it('passes the direct AddFixedPriceItem document to the XML boundary', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const listingDocument = {
      Item: {
        ListingType: 'FixedPriceItem',
        Quantity: 3,
        SKU: 'SKU-123',
        StartPrice: 19.99,
        Title: 'Direct Trading document',
      },
    };
    const { sellerSession, tradingCalls } = sellerSessionReturning<Record<string, unknown>>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: { Ack: 'Success', ItemID: '12345' },
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_trading_create_listing',
      listingDocument,
    );

    expect(toolCompletion.isError).not.toBe(true);
    expect(tradingCalls).toEqual([
      { callName: 'AddFixedPriceItem', requestDocument: listingDocument },
    ]);
    await mcpClient.close();
  });

  it('rejects the removed lowercase item wrapper before calling eBay', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, tradingCalls } = sellerSessionReturning<Record<string, unknown>>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_trading_create_listing',
      { item: { Title: 'Legacy wrapper' } },
    );

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(tradingCalls).toEqual([]);
    await mcpClient.close();
  });
});

describe('Trading listing MCP responses', () => {
  it('returns the complete GetItem response without extracting Item', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const getItemDocument = {
      Ack: 'Success',
      Item: [{ ItemID: '12345', Title: 'Complete response' }],
      Timestamp: '2026-08-03T15:00:00.000Z',
    };
    const { sellerSession, tradingCalls } = sellerSessionReturning<Record<string, unknown>>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: getItemDocument,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_trading_get_listing',
      { ItemID: '12345' },
    );

    expect(tradingCalls).toEqual([
      {
        callName: 'GetItem',
        requestDocument: { DetailLevel: 'ReturnAll', ItemID: '12345' },
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(getItemDocument, null, 2) }],
    });
    await mcpClient.close();
  });
});
