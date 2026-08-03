import { afterEach, describe, expect, it, vi } from 'vitest';

import type { SkuLocationMapping } from '@/ebay/sell/inventory/skuLocationMapping.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';

const skuLocationMappingToolNames = [
  'ebay_sell_inventory_get_sku_location_mapping',
  'ebay_sell_inventory_create_or_replace_sku_location_mapping',
  'ebay_sell_inventory_delete_sku_location_mapping',
] as const;

const legacySkuLocationMappingToolNames = [
  'ebay_get_sku_location_mapping',
  'ebay_create_or_replace_sku_location_mapping',
  'ebay_delete_sku_location_mapping',
] as const;

const skuLocationMappingFailureCalls = [
  {
    ebayArguments: { listingId: 'LISTING-1', sku: 'SKU-1' },
    toolName: 'ebay_sell_inventory_get_sku_location_mapping',
  },
  {
    ebayArguments: {
      listingId: 'LISTING-1',
      sku: 'SKU-1',
      locations: [{ merchantLocationKey: 'FULFILLMENT-1' }],
    },
    toolName: 'ebay_sell_inventory_create_or_replace_sku_location_mapping',
  },
  {
    ebayArguments: { listingId: 'LISTING-1', sku: 'SKU-1' },
    toolName: 'ebay_sell_inventory_delete_sku_location_mapping',
  },
] as const;

const skuLocationMappingFailureScenarios = skuLocationMappingFailureCalls.flatMap((mappingCall) =>
  ebayFailures.map((ebayFailure) => ({ ebayFailure, ...mappingCall })),
);

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Sell Inventory SKU-location-mapping MCP exposure', () => {
  it('exposes all three operations once without compatibility names', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);

    for (const skuLocationMappingToolName of skuLocationMappingToolNames) {
      expect(
        listedToolNames.filter((listedToolName) => listedToolName === skuLocationMappingToolName),
      ).toEqual([skuLocationMappingToolName]);
    }
    for (const legacySkuLocationMappingToolName of legacySkuLocationMappingToolNames) {
      expect(listedToolNames).not.toContain(legacySkuLocationMappingToolName);
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

    expect(
      listedTools.tools
        .map((ebayTool) => ebayTool.name)
        .filter((listedToolName) => listedToolName.includes('sku_location_mapping')),
    ).toEqual(skuLocationMappingToolNames);
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

    expect(
      listedTools.tools
        .map((ebayTool) => ebayTool.name)
        .filter((listedToolName) => listedToolName.includes('sku_location_mapping')),
    ).toEqual(['ebay_sell_inventory_get_sku_location_mapping']);
    await mcpClient.close();
  });
});

describe('Sell Inventory SKU-location-mapping MCP calls', () => {
  it('returns one unchanged location mapping', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const skuLocationMapping: SkuLocationMapping = {
      locations: [
        { merchantLocationKey: 'FULFILLMENT-1' },
        { merchantLocationKey: 'FULFILLMENT-2' },
      ],
    };
    const { sellerSession, getCalls } = sellerSessionReturning<SkuLocationMapping>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: skuLocationMapping,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_inventory_get_sku_location_mapping',
      { listingId: 'LISTING-1', sku: 'SKU-1' },
    );

    expect(getCalls).toEqual([
      { endpoint: '/sell/inventory/v1/listing/LISTING-1/sku/SKU-1/locations' },
    ]);
    expect(toolCompletion).toEqual({
      content: [{ type: 'text', text: JSON.stringify(skuLocationMapping, null, 2) }],
    });
    await mcpClient.close();
  });

  it('puts the direct replacement and preserves an empty completion', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, putCalls } = sellerSessionReturning<undefined>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    });
    const locationMappingReplacement = {
      listingId: 'LISTING-1',
      sku: 'SKU-1',
      locations: [{ merchantLocationKey: 'FULFILLMENT-1' }],
    };

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_inventory_create_or_replace_sku_location_mapping',
      locationMappingReplacement,
    );

    expect(putCalls).toEqual([
      {
        endpoint: '/sell/inventory/v1/listing/LISTING-1/sku/SKU-1/locations',
        requestDocument: { locations: [{ merchantLocationKey: 'FULFILLMENT-1' }] },
      },
    ]);
    expect(toolCompletion).toEqual({ content: [] });
    await mcpClient.close();
  });

  it('deletes the encoded listing and SKU path', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, deleteCalls } = sellerSessionReturning<undefined>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_inventory_delete_sku_location_mapping',
      { listingId: 'LISTING/1', sku: 'SKU/1' },
    );

    expect(deleteCalls).toEqual([
      { endpoint: '/sell/inventory/v1/listing/LISTING%2F1/sku/SKU%2F1/locations' },
    ]);
    expect(toolCompletion).toEqual({ content: [] });
    await mcpClient.close();
  });
});

describe('Sell Inventory SKU-location-mapping MCP validation', () => {
  it('rejects the legacy body wrapper before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, putCalls } = sellerSessionReturning<never>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined as never,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_inventory_create_or_replace_sku_location_mapping',
      {
        listingId: 'LISTING-1',
        sku: 'SKU-1',
        body: { locations: [{ merchantLocationKey: 'FULFILLMENT-1' }] },
      },
    );

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(putCalls).toEqual([]);
    await mcpClient.close();
  });
});

describe('Sell Inventory SKU-location-mapping MCP failures', () => {
  it.each(skuLocationMappingFailureScenarios)(
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
