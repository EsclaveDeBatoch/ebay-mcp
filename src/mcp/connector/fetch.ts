import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import { getInventoryItem, type InventoryItem } from '@/ebay/sell/inventory/inventoryItem.js';
import { defineTool } from '@/mcp/defineTool.js';

/** ChatGPT connector fetch arguments — exact protocol wire keys. */
export const connectorFetchArgumentsSchema = z
  .object({
    id: z.string().describe('Inventory-item SKU'),
  })
  .strict();

/** Validated ChatGPT connector fetch arguments. */
export type ConnectorFetchArguments = z.infer<typeof connectorFetchArgumentsSchema>;

type InventoryProductAspects = NonNullable<InventoryItem['product']>['aspects'];

/** ChatGPT connector fetch document for one inventory item. */
export type ConnectorFetchDocument = {
  readonly id: string;
  readonly title: string;
  readonly text: string;
  readonly url: 'https://www.ebay.com/';
  readonly metadata: {
    readonly source: 'ebay_inventory';
    readonly aspects: InventoryProductAspects | undefined;
    readonly condition: InventoryItem['condition'];
  };
};

function inventoryItemTitle(inventoryItem: InventoryItem): string {
  if (inventoryItem.product === undefined) {
    return '';
  }
  if (inventoryItem.product.title === undefined) {
    return '';
  }
  return inventoryItem.product.title;
}

function inventoryItemDescription(inventoryItem: InventoryItem): string {
  if (inventoryItem.product === undefined) {
    return '';
  }
  if (inventoryItem.product.description === undefined) {
    return '';
  }
  return inventoryItem.product.description;
}

function inventoryItemAspects(inventoryItem: InventoryItem): InventoryProductAspects | undefined {
  if (inventoryItem.product === undefined) {
    return;
  }
  return inventoryItem.product.aspects;
}

/**
 * Loads one inventory item for the ChatGPT connector `fetch` protocol.
 *
 * Maps the connector `id` wire field onto Sell Inventory `getInventoryItem` SKU
 * and returns a connector-shaped document (not the raw eBay inventory item).
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param fetchArguments - Exact connector fetch wire fields (`id` = SKU).
 * @returns Connector fetch document or a propagated inventory failure.
 */
export const fetchConnectorInventoryItem = async (
  sellerSession: EbaySellerSession,
  fetchArguments: ConnectorFetchArguments,
): Promise<EbayRequestCompletion<ConnectorFetchDocument>> => {
  const inventoryItemCompletion = await getInventoryItem(sellerSession, {
    sku: fetchArguments.id,
  });
  if (inventoryItemCompletion.kind === 'ebayRequestFailed') {
    return inventoryItemCompletion;
  }

  const inventoryItem = inventoryItemCompletion.ebayDocument;
  return {
    kind: 'ebayRequestSucceeded',
    ebayDocument: {
      id: fetchArguments.id,
      title: inventoryItemTitle(inventoryItem),
      text: inventoryItemDescription(inventoryItem),
      url: 'https://www.ebay.com/',
      metadata: {
        source: 'ebay_inventory',
        aspects: inventoryItemAspects(inventoryItem),
        condition: inventoryItem.condition,
      },
    },
  };
};

/** MCP definition for the ChatGPT connector `fetch` protocol tool. */
export const fetchTool = defineTool({
  name: 'fetch',
  namespace: 'connector',
  description: 'Fetch a specific eBay inventory item by SKU',
  argumentsSchema: connectorFetchArgumentsSchema,
  operationKind: 'read',
  operation: fetchConnectorInventoryItem,
});
