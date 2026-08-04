import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  InventoryItem,
  InventoryItemCollection,
} from '@/ebay/sell/inventory/inventoryItem.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';

const inventoryItemToolNames = [
  'ebay_sell_inventory_get_inventory_items',
  'ebay_sell_inventory_get_inventory_item',
  'ebay_sell_inventory_create_or_replace_inventory_item',
  'ebay_sell_inventory_delete_inventory_item',
  'ebay_sell_inventory_bulk_create_or_replace_inventory_item',
  'ebay_sell_inventory_bulk_get_inventory_item',
  'ebay_sell_inventory_bulk_update_price_quantity',
  'ebay_sell_inventory_bulk_migrate_listing',
] as const;

const legacyInventoryItemToolNames = [
  'ebay_get_inventory_items',
  'ebay_get_inventory_item',
  'ebay_create_or_replace_inventory_item',
  'ebay_delete_inventory_item',
  'ebay_bulk_create_or_replace_inventory_item',
  'ebay_bulk_get_inventory_item',
  'ebay_bulk_update_price_quantity',
  'ebay_bulk_migrate_listing',
] as const;

const inventoryItemFailureCalls = [
  { ebayArguments: {}, toolName: 'ebay_sell_inventory_get_inventory_items' },
  { ebayArguments: { sku: 'CAMERA-1' }, toolName: 'ebay_sell_inventory_get_inventory_item' },
  {
    ebayArguments: { sku: 'CAMERA-1', 'Content-Language': 'en-US', condition: 'NEW' },
    toolName: 'ebay_sell_inventory_create_or_replace_inventory_item',
  },
  { ebayArguments: { sku: 'CAMERA-1' }, toolName: 'ebay_sell_inventory_delete_inventory_item' },
  {
    ebayArguments: {
      'Content-Language': 'en-US',
      requests: [{ sku: 'CAMERA-1', condition: 'NEW' }],
    },
    toolName: 'ebay_sell_inventory_bulk_create_or_replace_inventory_item',
  },
  {
    ebayArguments: { requests: [{ sku: 'CAMERA-1' }] },
    toolName: 'ebay_sell_inventory_bulk_get_inventory_item',
  },
  {
    ebayArguments: {
      requests: [{ shipToLocationAvailability: { quantity: 8 }, sku: 'CAMERA-1' }],
    },
    toolName: 'ebay_sell_inventory_bulk_update_price_quantity',
  },
  {
    ebayArguments: { requests: [{ listingId: '123456789012' }] },
    toolName: 'ebay_sell_inventory_bulk_migrate_listing',
  },
] as const;

const inventoryItemFailureScenarios = inventoryItemFailureCalls.flatMap((inventoryItemCall) =>
  ebayFailures.map((ebayFailure) => ({ ebayFailure, ...inventoryItemCall })),
);

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Sell Inventory item MCP exposure', () => {
  it('exposes all eight operations once without compatibility names', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);

    for (const inventoryItemToolName of inventoryItemToolNames) {
      expect(
        listedToolNames.filter((listedToolName) => listedToolName === inventoryItemToolName),
      ).toEqual([inventoryItemToolName]);
    }
    for (const legacyInventoryItemToolName of legacyInventoryItemToolNames) {
      expect(listedToolNames).not.toContain(legacyInventoryItemToolName);
    }
    await mcpClient.close();
  });

  it('gates only the resource through sell.inventory', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'sell.inventory');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    expect(
      listedTools.tools
        .map((ebayTool) => ebayTool.name)
        .filter((listedToolName) =>
          inventoryItemToolNames.some(
            (inventoryItemToolName) => inventoryItemToolName === listedToolName,
          ),
        ),
    ).toEqual(inventoryItemToolNames);
    await mcpClient.close();
  });

  it('keeps only the three resource reads in read-only mode', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'sell.inventory');
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
          inventoryItemToolNames.some(
            (inventoryItemToolName) => inventoryItemToolName === listedToolName,
          ),
        ),
    ).toEqual([
      'ebay_sell_inventory_get_inventory_items',
      'ebay_sell_inventory_get_inventory_item',
      'ebay_sell_inventory_bulk_get_inventory_item',
    ]);
    await mcpClient.close();
  });
});

describe('Sell Inventory item MCP calls', () => {
  it('returns the unchanged paginated inventory-item collection', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const inventoryItemCollection: InventoryItemCollection = {
      total: 1,
      inventoryItems: [
        {
          sku: 'CAMERA-1',
          condition: 'USED_EXCELLENT',
          product: { title: 'Mirrorless camera' },
        },
      ],
    };
    const { sellerSession, getCalls } = sellerSessionReturning<InventoryItemCollection>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: inventoryItemCollection,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_inventory_get_inventory_items',
      { limit: '25', offset: '0' },
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/inventory/v1/inventory_item',
        searchParameters: { limit: '25', offset: '0' },
      },
    ]);
    expect(toolCompletion).toEqual({
      content: [{ type: 'text', text: JSON.stringify(inventoryItemCollection, null, 2) }],
    });
    await mcpClient.close();
  });

  it('returns one unchanged inventory item from an encoded SKU path', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const inventoryItem: InventoryItem = {
      sku: 'CAMERA/1',
      condition: 'USED_EXCELLENT',
      product: { title: 'Mirrorless camera' },
    };
    const { sellerSession, getCalls } = sellerSessionReturning<InventoryItem>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: inventoryItem,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_inventory_get_inventory_item',
      { sku: 'CAMERA/1' },
    );

    expect(getCalls).toEqual([{ endpoint: '/sell/inventory/v1/inventory_item/CAMERA%2F1' }]);
    expect(toolCompletion).toEqual({
      content: [{ type: 'text', text: JSON.stringify(inventoryItem, null, 2) }],
    });
    await mcpClient.close();
  });

  it('puts a direct replacement and preserves an empty completion', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, putCalls } = sellerSessionReturning<undefined>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_inventory_create_or_replace_inventory_item',
      {
        sku: 'CAMERA/1',
        'Content-Language': 'en-US',
        condition: 'USED_EXCELLENT',
        product: { title: 'Mirrorless camera' },
      },
    );

    expect(putCalls).toEqual([
      {
        endpoint: '/sell/inventory/v1/inventory_item/CAMERA%2F1',
        requestDocument: {
          condition: 'USED_EXCELLENT',
          product: { title: 'Mirrorless camera' },
        },
        requestHeaders: { 'Content-Language': 'en-US' },
      },
    ]);
    expect(toolCompletion).toEqual({ content: [] });
    await mcpClient.close();
  });

  it('posts direct bulk documents and returns unchanged eBay documents', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const ebayBulkCompletion = { responses: [{ statusCode: 200 }] };
    const { sellerSession, postCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: ebayBulkCompletion,
    });
    const bulkCalls = [
      {
        toolName: 'ebay_sell_inventory_bulk_create_or_replace_inventory_item',
        ebayArguments: {
          'Content-Language': 'en-US',
          requests: [{ sku: 'CAMERA-1', condition: 'NEW' }],
        },
      },
      {
        toolName: 'ebay_sell_inventory_bulk_get_inventory_item',
        ebayArguments: { requests: [{ sku: 'CAMERA-1' }] },
      },
      {
        toolName: 'ebay_sell_inventory_bulk_update_price_quantity',
        ebayArguments: {
          requests: [{ shipToLocationAvailability: { quantity: 8 }, sku: 'CAMERA-1' }],
        },
      },
      {
        toolName: 'ebay_sell_inventory_bulk_migrate_listing',
        ebayArguments: { requests: [{ listingId: '123456789012' }] },
      },
    ] as const;
    const mcpClients = [];

    for (const bulkCall of bulkCalls) {
      const { mcpClient, toolCompletion } = await callEbayTool(
        sellerSession,
        bulkCall.toolName,
        bulkCall.ebayArguments,
      );
      mcpClients.push(mcpClient);
      expect(toolCompletion).toEqual({
        content: [{ type: 'text', text: JSON.stringify(ebayBulkCompletion, null, 2) }],
      });
    }

    expect(postCalls).toEqual([
      {
        endpoint: '/sell/inventory/v1/bulk_create_or_replace_inventory_item',
        requestDocument: { requests: [{ sku: 'CAMERA-1', condition: 'NEW' }] },
        requestHeaders: { 'Content-Language': 'en-US' },
      },
      {
        endpoint: '/sell/inventory/v1/bulk_get_inventory_item',
        requestDocument: { requests: [{ sku: 'CAMERA-1' }] },
      },
      {
        endpoint: '/sell/inventory/v1/bulk_update_price_quantity',
        requestDocument: {
          requests: [{ shipToLocationAvailability: { quantity: 8 }, sku: 'CAMERA-1' }],
        },
      },
      {
        endpoint: '/sell/inventory/v1/bulk_migrate_listing',
        requestDocument: { requests: [{ listingId: '123456789012' }] },
      },
    ]);
    for (const mcpClient of mcpClients) {
      await mcpClient.close();
    }
  });

  it('deletes one encoded SKU without an invented document', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, deleteCalls } = sellerSessionReturning<undefined>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_inventory_delete_inventory_item',
      { sku: 'CAMERA/1' },
    );

    expect(deleteCalls).toEqual([{ endpoint: '/sell/inventory/v1/inventory_item/CAMERA%2F1' }]);
    expect(toolCompletion).toEqual({ content: [] });
    await mcpClient.close();
  });
});

describe('Sell Inventory item MCP validation', () => {
  it('rejects the legacy body wrapper and transport header before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, putCalls } = sellerSessionReturning<never>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined as never,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_inventory_create_or_replace_inventory_item',
      {
        sku: 'CAMERA-1',
        'Content-Language': 'en-US',
        'Content-Type': 'application/json',
        body: { condition: 'NEW' },
      },
    );

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(putCalls).toEqual([]);
    await mcpClient.close();
  });
});

describe('Sell Inventory item MCP failures', () => {
  it.each(inventoryItemFailureScenarios)(
    'translates every $ebayFailure.kind failure once for $toolName',
    async ({ ebayArguments, ebayFailure, toolName }) => {
      vi.stubEnv('EBAY_MCP_UI', 'off');
      const { sellerSession } = sellerSessionReturning<never>({
        kind: 'ebayRequestFailed',
        ebayFailure,
      });

      const { mcpClient, toolCompletion } = await callEbayTool(
        sellerSession,
        toolName,
        ebayArguments,
      );

      expect(toolCompletion).toMatchObject({
        content: [{ type: 'text', text: JSON.stringify({ ebayFailure }, null, 2) }],
        isError: true,
      });
      await mcpClient.close();
    },
  );
});
