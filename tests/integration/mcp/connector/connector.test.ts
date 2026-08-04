import { afterEach, describe, expect, it, vi } from 'vitest';

import type { EbayFailure, EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type {
  InventoryItem,
  InventoryItemCollection,
} from '@/ebay/sell/inventory/inventoryItem.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';

const inventoryCollection: InventoryItemCollection = {
  inventoryItems: [
    { sku: 'SKU-1', product: { title: 'Blue Widget' } },
    { sku: 'SKU-2', product: { title: 'Red Gadget' } },
  ],
  total: 2,
  limit: 10,
};

const inventoryProductAspects = { Brand: ['TestBrand'] } as unknown as string;

const inventoryItem: InventoryItem = {
  sku: 'TEST-SKU',
  product: {
    title: 'Test Product',
    description: 'Test Description',
    aspects: inventoryProductAspects,
  },
  condition: 'NEW',
};

const searchDocument = {
  results: [
    { id: 'SKU-1', title: 'Blue Widget', url: 'https://www.ebay.com/' },
    { id: 'SKU-2', title: 'Red Gadget', url: 'https://www.ebay.com/' },
  ],
};

const fetchDocument = {
  id: 'TEST-SKU',
  title: 'Test Product',
  text: 'Test Description',
  url: 'https://www.ebay.com/',
  metadata: {
    source: 'ebay_inventory',
    aspects: inventoryProductAspects,
    condition: 'NEW',
  },
};

describe('ChatGPT connector tools through MCP', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('exposes search and fetch once under the connector namespace gate', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'connector');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const successfulRequest: EbayRequestCompletion<InventoryItemCollection> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: inventoryCollection,
    };
    const { sellerSession } = sellerSessionReturning(successfulRequest);
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    const listedNames = listedTools.tools.map((ebayTool) => ebayTool.name).sort();
    expect(listedNames).toEqual(['fetch', 'search']);
    await mcpClient.close();
  });

  it('validates search once, pages inventory, and returns the connector document', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const successfulRequest: EbayRequestCompletion<InventoryItemCollection> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: inventoryCollection,
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulRequest);

    const { mcpClient, toolCompletion } = await callEbayTool(sellerSession, 'search', {
      query: '',
      limit: 10,
    });

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/inventory/v1/inventory_item',
        searchParameters: { limit: '10', offset: '0' },
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(searchDocument, null, 2) }],
    });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });

  it('validates fetch once, loads the SKU path, and returns the connector document', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const successfulRequest: EbayRequestCompletion<InventoryItem> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: inventoryItem,
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulRequest);

    const { mcpClient, toolCompletion } = await callEbayTool(sellerSession, 'fetch', {
      id: 'TEST-SKU',
    });

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/inventory/v1/inventory_item/TEST-SKU',
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(fetchDocument, null, 2) }],
    });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });

  it.each([
    {},
    { query: 1 },
    { query: 'widget', limit: '10' },
    { query: 'widget', marketplaceId: 'EBAY_US' },
  ])('rejects invalid search arguments before the seller session', async (invalidArguments) => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls } = sellerSessionReturning({
      kind: 'ebayRequestSucceeded',
      ebayDocument: inventoryCollection,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'search',
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

  it.each([{}, { id: 1 }, { id: 'TEST-SKU', sku: 'OTHER' }, { sku: 'TEST-SKU' }])(
    'rejects invalid fetch arguments before the seller session',
    async (invalidArguments) => {
      vi.stubEnv('EBAY_MCP_UI', 'off');
      const { sellerSession, getCalls } = sellerSessionReturning({
        kind: 'ebayRequestSucceeded',
        ebayDocument: inventoryItem,
      });

      const { mcpClient, toolCompletion } = await callEbayTool(
        sellerSession,
        'fetch',
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
    },
  );

  it.each<EbayFailure>([...ebayFailures])(
    'translates search $kind exactly once at the MCP boundary',
    async (ebayFailure) => {
      vi.stubEnv('EBAY_MCP_UI', 'off');
      const { sellerSession } = sellerSessionReturning({ kind: 'ebayRequestFailed', ebayFailure });

      const { mcpClient, toolCompletion } = await callEbayTool(sellerSession, 'search', {
        query: '',
      });

      expect(toolCompletion).toMatchObject({
        content: [{ type: 'text', text: JSON.stringify({ ebayFailure }, null, 2) }],
        isError: true,
      });
      await mcpClient.close();
    },
  );

  it.each<EbayFailure>([...ebayFailures])(
    'translates fetch $kind exactly once at the MCP boundary',
    async (ebayFailure) => {
      vi.stubEnv('EBAY_MCP_UI', 'off');
      const { sellerSession } = sellerSessionReturning({ kind: 'ebayRequestFailed', ebayFailure });

      const { mcpClient, toolCompletion } = await callEbayTool(sellerSession, 'fetch', {
        id: 'TEST-SKU',
      });

      expect(toolCompletion).toMatchObject({
        content: [{ type: 'text', text: JSON.stringify({ ebayFailure }, null, 2) }],
        isError: true,
      });
      await mcpClient.close();
    },
  );
});
