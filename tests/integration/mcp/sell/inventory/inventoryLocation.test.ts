import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  InventoryLocation,
  InventoryLocationCollection,
} from '@/ebay/sell/inventory/inventoryLocation.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';

const inventoryLocationToolNames = [
  'ebay_sell_inventory_get_inventory_locations',
  'ebay_sell_inventory_get_inventory_location',
  'ebay_sell_inventory_create_inventory_location',
  'ebay_sell_inventory_delete_inventory_location',
  'ebay_sell_inventory_disable_inventory_location',
  'ebay_sell_inventory_enable_inventory_location',
  'ebay_sell_inventory_update_inventory_location',
] as const;

const sellInventoryToolNames = [
  'ebay_sell_inventory_get_inventory_items',
  'ebay_sell_inventory_get_inventory_item',
  'ebay_sell_inventory_create_or_replace_inventory_item',
  'ebay_sell_inventory_delete_inventory_item',
  'ebay_sell_inventory_bulk_create_or_replace_inventory_item',
  'ebay_sell_inventory_bulk_get_inventory_item',
  'ebay_sell_inventory_bulk_update_price_quantity',
  'ebay_sell_inventory_bulk_migrate_listing',
  'ebay_sell_inventory_get_inventory_item_group',
  'ebay_sell_inventory_create_or_replace_inventory_item_group',
  'ebay_sell_inventory_delete_inventory_item_group',
  'ebay_sell_inventory_get_product_compatibility',
  'ebay_sell_inventory_create_or_replace_product_compatibility',
  'ebay_sell_inventory_delete_product_compatibility',
  'ebay_sell_inventory_get_sku_location_mapping',
  'ebay_sell_inventory_create_or_replace_sku_location_mapping',
  'ebay_sell_inventory_delete_sku_location_mapping',
  ...inventoryLocationToolNames,
] as const;

const legacyInventoryLocationToolNames = [
  'ebay_get_inventory_locations',
  'ebay_get_inventory_location',
  'ebay_create_inventory_location',
  'ebay_delete_inventory_location',
  'ebay_disable_inventory_location',
  'ebay_enable_inventory_location',
  'ebay_update_inventory_location',
] as const;

const warehouseCreation = {
  merchantLocationKey: 'WAREHOUSE-1',
  location: { address: { country: 'US', postalCode: '94107' } },
  locationTypes: ['WAREHOUSE'],
  name: 'West warehouse',
} as const;

const inventoryLocationFailureCalls = [
  { ebayArguments: {}, toolName: 'ebay_sell_inventory_get_inventory_locations' },
  {
    ebayArguments: { merchantLocationKey: 'WAREHOUSE-1' },
    toolName: 'ebay_sell_inventory_get_inventory_location',
  },
  {
    ebayArguments: warehouseCreation,
    toolName: 'ebay_sell_inventory_create_inventory_location',
  },
  {
    ebayArguments: { merchantLocationKey: 'WAREHOUSE-1' },
    toolName: 'ebay_sell_inventory_delete_inventory_location',
  },
  {
    ebayArguments: { merchantLocationKey: 'WAREHOUSE-1' },
    toolName: 'ebay_sell_inventory_disable_inventory_location',
  },
  {
    ebayArguments: { merchantLocationKey: 'WAREHOUSE-1' },
    toolName: 'ebay_sell_inventory_enable_inventory_location',
  },
  {
    ebayArguments: { merchantLocationKey: 'WAREHOUSE-1', name: 'Renamed warehouse' },
    toolName: 'ebay_sell_inventory_update_inventory_location',
  },
] as const;

const inventoryLocationFailureScenarios = inventoryLocationFailureCalls.flatMap(
  (inventoryLocationCall) =>
    ebayFailures.map((ebayFailure) => ({ ebayFailure, ...inventoryLocationCall })),
);

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Sell Inventory location MCP exposure', () => {
  it('exposes all seven operations once without compatibility names', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);

    for (const inventoryLocationToolName of inventoryLocationToolNames) {
      expect(
        listedToolNames.filter((listedToolName) => listedToolName === inventoryLocationToolName),
      ).toEqual([inventoryLocationToolName]);
    }
    for (const legacyInventoryLocationToolName of legacyInventoryLocationToolNames) {
      expect(listedToolNames).not.toContain(legacyInventoryLocationToolName);
    }
    await mcpClient.close();
  });

  it('gates the current namespace through sell.inventory', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'sell.inventory');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    expect(listedTools.tools.map((ebayTool) => ebayTool.name)).toEqual(sellInventoryToolNames);
    await mcpClient.close();
  });

  it('keeps only the resource reads in read-only mode', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'sell.inventory');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    vi.stubEnv('EBAY_READ_ONLY', 'true');
    const { sellerSession } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    expect(listedTools.tools.map((ebayTool) => ebayTool.name)).toEqual([
      'ebay_sell_inventory_get_inventory_items',
      'ebay_sell_inventory_get_inventory_item',
      'ebay_sell_inventory_bulk_get_inventory_item',
      'ebay_sell_inventory_get_inventory_item_group',
      'ebay_sell_inventory_get_product_compatibility',
      'ebay_sell_inventory_get_sku_location_mapping',
      'ebay_sell_inventory_get_inventory_locations',
      'ebay_sell_inventory_get_inventory_location',
    ]);
    await mcpClient.close();
  });
});

describe('Sell Inventory location MCP calls', () => {
  it('returns the unchanged paginated location collection', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const inventoryLocationCollection: InventoryLocationCollection = {
      total: 1,
      locations: [
        {
          merchantLocationKey: 'WAREHOUSE-1',
          merchantLocationStatus: 'ENABLED',
          name: 'West warehouse',
          locationTypes: ['WAREHOUSE'],
        },
      ],
    };
    const { sellerSession, getCalls } = sellerSessionReturning<InventoryLocationCollection>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: inventoryLocationCollection,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_inventory_get_inventory_locations',
      { limit: '20', offset: '0' },
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/inventory/v1/location',
        searchParameters: { limit: '20', offset: '0' },
      },
    ]);
    expect(toolCompletion).toEqual({
      content: [{ type: 'text', text: JSON.stringify(inventoryLocationCollection, null, 2) }],
    });
    await mcpClient.close();
  });

  it('returns one unchanged inventory location', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const inventoryLocation: InventoryLocation = {
      merchantLocationKey: 'WAREHOUSE-1',
      merchantLocationStatus: 'ENABLED',
      name: 'West warehouse',
      locationTypes: ['WAREHOUSE'],
    };
    const { sellerSession, getCalls } = sellerSessionReturning<InventoryLocation>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: inventoryLocation,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_inventory_get_inventory_location',
      { merchantLocationKey: 'WAREHOUSE/1' },
    );

    expect(getCalls).toEqual([{ endpoint: '/sell/inventory/v1/location/WAREHOUSE%2F1' }]);
    expect(toolCompletion).toEqual({
      content: [{ type: 'text', text: JSON.stringify(inventoryLocation, null, 2) }],
    });
    await mcpClient.close();
  });

  it('posts a direct create document and preserves an empty completion', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, postCalls } = sellerSessionReturning<undefined>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_inventory_create_inventory_location',
      warehouseCreation,
    );

    expect(postCalls).toEqual([
      {
        endpoint: '/sell/inventory/v1/location/WAREHOUSE-1',
        requestDocument: {
          location: { address: { country: 'US', postalCode: '94107' } },
          locationTypes: ['WAREHOUSE'],
          name: 'West warehouse',
        },
      },
    ]);
    expect(toolCompletion).toEqual({ content: [] });
    await mcpClient.close();
  });

  it('deletes and changes status without invented documents', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, deleteCalls, postCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    const deleteCall = await callEbayTool(
      sellerSession,
      'ebay_sell_inventory_delete_inventory_location',
      { merchantLocationKey: 'WAREHOUSE/1' },
    );
    const disableCall = await callEbayTool(
      sellerSession,
      'ebay_sell_inventory_disable_inventory_location',
      { merchantLocationKey: 'WAREHOUSE/1' },
    );
    const enableCall = await callEbayTool(
      sellerSession,
      'ebay_sell_inventory_enable_inventory_location',
      { merchantLocationKey: 'WAREHOUSE/1' },
    );

    expect(deleteCalls).toEqual([{ endpoint: '/sell/inventory/v1/location/WAREHOUSE%2F1' }]);
    expect(postCalls).toEqual([
      { endpoint: '/sell/inventory/v1/location/WAREHOUSE%2F1/disable' },
      { endpoint: '/sell/inventory/v1/location/WAREHOUSE%2F1/enable' },
    ]);
    expect(deleteCall.toolCompletion).toEqual({
      content: [{ type: 'text', text: JSON.stringify({}, null, 2) }],
    });
    expect(disableCall.toolCompletion).toEqual({
      content: [{ type: 'text', text: JSON.stringify({}, null, 2) }],
    });
    expect(enableCall.toolCompletion).toEqual({
      content: [{ type: 'text', text: JSON.stringify({}, null, 2) }],
    });
    await deleteCall.mcpClient.close();
    await disableCall.mcpClient.close();
    await enableCall.mcpClient.close();
  });

  it('posts a direct update document', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, postCalls } = sellerSessionReturning<undefined>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_inventory_update_inventory_location',
      { merchantLocationKey: 'WAREHOUSE/1', name: 'Renamed warehouse' },
    );

    expect(postCalls).toEqual([
      {
        endpoint: '/sell/inventory/v1/location/WAREHOUSE%2F1/update_location_details',
        requestDocument: { name: 'Renamed warehouse' },
      },
    ]);
    expect(toolCompletion).toEqual({ content: [] });
    await mcpClient.close();
  });
});

describe('Sell Inventory location MCP validation', () => {
  it('rejects the legacy body wrapper before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, postCalls } = sellerSessionReturning<never>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined as never,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_inventory_create_inventory_location',
      {
        merchantLocationKey: 'WAREHOUSE-1',
        body: { location: { address: { country: 'US', postalCode: '94107' } } },
      },
    );

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(postCalls).toEqual([]);
    await mcpClient.close();
  });
});

describe('Sell Inventory location MCP failures', () => {
  it.each(inventoryLocationFailureScenarios)(
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
