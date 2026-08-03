import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ProductCompatibility } from '@/ebay/sell/inventory/productCompatibility.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';

const productCompatibilityToolNames = [
  'ebay_sell_inventory_get_product_compatibility',
  'ebay_sell_inventory_create_or_replace_product_compatibility',
  'ebay_sell_inventory_delete_product_compatibility',
] as const;

const sellInventoryToolNames = [
  'ebay_sell_inventory_get_inventory_item_group',
  'ebay_sell_inventory_create_or_replace_inventory_item_group',
  'ebay_sell_inventory_delete_inventory_item_group',
  ...productCompatibilityToolNames,
] as const;

const legacyProductCompatibilityToolNames = [
  'ebay_get_product_compatibility',
  'ebay_create_or_replace_product_compatibility',
  'ebay_delete_product_compatibility',
] as const;

const productCompatibilityFailureCalls = [
  {
    ebayArguments: { sku: 'BRAKE-PAD-1' },
    toolName: 'ebay_sell_inventory_get_product_compatibility',
  },
  {
    ebayArguments: {
      sku: 'BRAKE-PAD-1',
      'Content-Language': 'en-US',
      compatibleProducts: [],
    },
    toolName: 'ebay_sell_inventory_create_or_replace_product_compatibility',
  },
  {
    ebayArguments: { sku: 'BRAKE-PAD-1' },
    toolName: 'ebay_sell_inventory_delete_product_compatibility',
  },
] as const;

const productCompatibilityFailureScenarios = productCompatibilityFailureCalls.flatMap(
  (productCompatibilityCall) =>
    ebayFailures.map((ebayFailure) => ({ ebayFailure, ...productCompatibilityCall })),
);

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Sell Inventory product-compatibility MCP exposure', () => {
  it('exposes all three operations once without compatibility names', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);

    for (const productCompatibilityToolName of productCompatibilityToolNames) {
      expect(
        listedToolNames.filter((listedToolName) => listedToolName === productCompatibilityToolName),
      ).toEqual([productCompatibilityToolName]);
    }
    for (const legacyProductCompatibilityToolName of legacyProductCompatibilityToolNames) {
      expect(listedToolNames).not.toContain(legacyProductCompatibilityToolName);
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
      'ebay_sell_inventory_get_inventory_item_group',
      'ebay_sell_inventory_get_product_compatibility',
    ]);
    await mcpClient.close();
  });
});

describe('Sell Inventory product-compatibility MCP calls', () => {
  it('returns one unchanged compatibility list', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const productCompatibility: ProductCompatibility = {
      sku: 'BRAKE-PAD-1',
      compatibleProducts: [
        {
          compatibilityProperties: [
            { name: 'make', value: 'Toyota' },
            { name: 'model', value: 'Camry' },
          ],
        },
      ],
    };
    const { sellerSession, getCalls } = sellerSessionReturning<ProductCompatibility>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: productCompatibility,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_inventory_get_product_compatibility',
      { sku: 'BRAKE-PAD-1' },
    );

    expect(getCalls).toEqual([
      { endpoint: '/sell/inventory/v1/inventory_item/BRAKE-PAD-1/product_compatibility' },
    ]);
    expect(toolCompletion).toEqual({
      content: [{ type: 'text', text: JSON.stringify(productCompatibility, null, 2) }],
    });
    await mcpClient.close();
  });

  it('puts the direct replacement and preserves an empty completion', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, putCalls } = sellerSessionReturning<undefined>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    });
    const compatibilityReplacement = {
      sku: 'BRAKE-PAD-1',
      'Content-Language': 'en-US',
      compatibleProducts: [{ productIdentifier: { epid: '123456789' } }],
    };

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_inventory_create_or_replace_product_compatibility',
      compatibilityReplacement,
    );

    expect(putCalls).toEqual([
      {
        endpoint: '/sell/inventory/v1/inventory_item/BRAKE-PAD-1/product_compatibility',
        requestDocument: {
          compatibleProducts: [{ productIdentifier: { epid: '123456789' } }],
        },
        requestHeaders: { 'Content-Language': 'en-US' },
      },
    ]);
    expect(toolCompletion).toEqual({ content: [] });
    await mcpClient.close();
  });

  it('deletes the encoded SKU path', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, deleteCalls } = sellerSessionReturning<undefined>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_inventory_delete_product_compatibility',
      { sku: 'BRAKE/PAD' },
    );

    expect(deleteCalls).toEqual([
      { endpoint: '/sell/inventory/v1/inventory_item/BRAKE%2FPAD/product_compatibility' },
    ]);
    expect(toolCompletion).toEqual({ content: [] });
    await mcpClient.close();
  });
});

describe('Sell Inventory product-compatibility MCP validation', () => {
  it('rejects the legacy body wrapper before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, putCalls } = sellerSessionReturning<never>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined as never,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_inventory_create_or_replace_product_compatibility',
      {
        sku: 'BRAKE-PAD-1',
        'Content-Language': 'en-US',
        body: { compatibleProducts: [] },
      },
    );

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(putCalls).toEqual([]);
    await mcpClient.close();
  });
});

describe('Sell Inventory product-compatibility MCP failures', () => {
  it.each(productCompatibilityFailureScenarios)(
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
