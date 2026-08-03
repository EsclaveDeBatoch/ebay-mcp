import { afterEach, describe, expect, it, vi } from 'vitest';

import type { InventoryItemGroup } from '@/ebay/sell/inventory/inventoryItemGroup.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';

const inventoryItemGroupToolNames = [
  'ebay_sell_inventory_get_inventory_item_group',
  'ebay_sell_inventory_create_or_replace_inventory_item_group',
  'ebay_sell_inventory_delete_inventory_item_group',
] as const;

const legacyInventoryItemGroupToolNames = [
  'ebay_get_inventory_item_group',
  'ebay_create_or_replace_inventory_item_group',
  'ebay_delete_inventory_item_group',
] as const;

const inventoryItemGroupFailureCalls = [
  {
    ebayArguments: { inventoryItemGroupKey: 'GROUP-1' },
    toolName: 'ebay_sell_inventory_get_inventory_item_group',
  },
  {
    ebayArguments: {
      inventoryItemGroupKey: 'GROUP-1',
      'Content-Language': 'en-US',
      variantSKUs: ['SKU-1'],
    },
    toolName: 'ebay_sell_inventory_create_or_replace_inventory_item_group',
  },
  {
    ebayArguments: { inventoryItemGroupKey: 'GROUP-1' },
    toolName: 'ebay_sell_inventory_delete_inventory_item_group',
  },
] as const;

const inventoryItemGroupFailureScenarios = inventoryItemGroupFailureCalls.flatMap(
  (inventoryItemGroupCall) =>
    ebayFailures.map((ebayFailure) => ({ ebayFailure, ...inventoryItemGroupCall })),
);

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Sell Inventory item-group MCP exposure', () => {
  it('exposes all three operations once without compatibility names', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);

    for (const inventoryItemGroupToolName of inventoryItemGroupToolNames) {
      expect(
        listedToolNames.filter((listedToolName) => listedToolName === inventoryItemGroupToolName),
      ).toEqual([inventoryItemGroupToolName]);
    }
    for (const legacyInventoryItemGroupToolName of legacyInventoryItemGroupToolNames) {
      expect(listedToolNames).not.toContain(legacyInventoryItemGroupToolName);
    }
    await mcpClient.close();
  });

  it('gates the resource through sell.inventory', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'sell.inventory');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    expect(listedTools.tools.map((ebayTool) => ebayTool.name)).toEqual(inventoryItemGroupToolNames);
    await mcpClient.close();
  });

  it('keeps only the item-group read in read-only mode', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'sell.inventory');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    vi.stubEnv('EBAY_READ_ONLY', 'true');
    const { sellerSession } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    expect(listedTools.tools.map((ebayTool) => ebayTool.name)).toEqual([
      'ebay_sell_inventory_get_inventory_item_group',
    ]);
    await mcpClient.close();
  });
});

describe('Sell Inventory item-group MCP calls', () => {
  it('returns one unchanged item group', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const inventoryItemGroup: InventoryItemGroup = {
      inventoryItemGroupKey: 'GROUP-1',
      title: 'Cotton shirts',
      variantSKUs: ['SHIRT-BLUE-M', 'SHIRT-BLUE-L'],
    };
    const { sellerSession, getCalls } = sellerSessionReturning<InventoryItemGroup>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: inventoryItemGroup,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_inventory_get_inventory_item_group',
      { inventoryItemGroupKey: 'GROUP-1' },
    );

    expect(getCalls).toEqual([{ endpoint: '/sell/inventory/v1/inventory_item_group/GROUP-1' }]);
    expect(toolCompletion).toEqual({
      content: [{ type: 'text', text: JSON.stringify(inventoryItemGroup, null, 2) }],
    });
    await mcpClient.close();
  });

  it('puts the direct replacement and preserves an empty completion', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, putCalls } = sellerSessionReturning<undefined>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    });
    const inventoryItemGroupReplacement = {
      inventoryItemGroupKey: 'GROUP-1',
      'Content-Language': 'en-US',
      aspects: { Pattern: ['Solid'] },
      title: 'Cotton shirts',
      variantSKUs: ['SHIRT-BLUE-M', 'SHIRT-BLUE-L'],
    };

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_inventory_create_or_replace_inventory_item_group',
      inventoryItemGroupReplacement,
    );

    expect(putCalls).toEqual([
      {
        endpoint: '/sell/inventory/v1/inventory_item_group/GROUP-1',
        requestDocument: {
          aspects: { Pattern: ['Solid'] },
          title: 'Cotton shirts',
          variantSKUs: ['SHIRT-BLUE-M', 'SHIRT-BLUE-L'],
        },
        requestHeaders: { 'Content-Language': 'en-US' },
      },
    ]);
    expect(toolCompletion).toEqual({ content: [] });
    await mcpClient.close();
  });

  it('deletes the encoded item-group path', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, deleteCalls } = sellerSessionReturning<undefined>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_inventory_delete_inventory_item_group',
      { inventoryItemGroupKey: 'GROUP/1' },
    );

    expect(deleteCalls).toEqual([
      { endpoint: '/sell/inventory/v1/inventory_item_group/GROUP%2F1' },
    ]);
    expect(toolCompletion).toEqual({ content: [] });
    await mcpClient.close();
  });
});

describe('Sell Inventory item-group MCP validation', () => {
  it('rejects the legacy body wrapper before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, putCalls } = sellerSessionReturning<never>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined as never,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_inventory_create_or_replace_inventory_item_group',
      {
        inventoryItemGroupKey: 'GROUP-1',
        'Content-Language': 'en-US',
        body: { variantSKUs: ['SKU-1'] },
      },
    );

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(putCalls).toEqual([]);
    await mcpClient.close();
  });
});

describe('Sell Inventory item-group MCP failures', () => {
  it.each(inventoryItemGroupFailureScenarios)(
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
