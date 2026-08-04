import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import { createEbaySellerSession, type EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import {
  getInventoryItem,
  getInventoryItems,
  type InventoryItem,
} from '@/ebay/sell/inventory/inventoryItem.js';
import { defineTool } from '@/tools/defineTool.js';
import type { ToolEntry } from '@/tools/registry.js';
import { z } from '@/utils/effectSchema.js';

const connectorSearchInputSchema = z.object({
  query: z.string().describe('Search query'),
  limit: z.number().optional().describe('Maximum number of matches'),
});

const connectorFetchInputSchema = z.object({
  id: z.string().describe('Inventory-item SKU'),
});

type InventoryItemWithSku = InventoryItem & { readonly sku: string };

function successfulEbayDocument<EbayDocument>(
  ebayRequestCompletion: EbayRequestCompletion<EbayDocument>,
): EbayDocument {
  if (ebayRequestCompletion.kind === 'ebayRequestFailed') {
    throw new Error(ebayRequestCompletion.ebayFailure.message);
  }
  return ebayRequestCompletion.ebayDocument;
}

function connectorMatchLimit(requestedMatchLimit: number | undefined): number {
  if (requestedMatchLimit === undefined) {
    return 10;
  }
  if (!Number.isFinite(requestedMatchLimit)) {
    return 10;
  }
  return Math.max(Math.floor(requestedMatchLimit), 1);
}

function connectorPageSize(searchPhrase: string, matchLimit: number): number {
  if (searchPhrase === '') {
    return Math.min(matchLimit, 200);
  }
  return Math.min(Math.max(matchLimit, 50), 200);
}

function hasSellerSku(inventoryItem: InventoryItem): inventoryItem is InventoryItemWithSku {
  if (inventoryItem.sku === undefined) {
    return false;
  }
  return inventoryItem.sku.trim() !== '';
}

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

function matchingPageItems(
  inventoryItems: readonly InventoryItemWithSku[],
  searchPhrase: string,
): InventoryItemWithSku[] {
  if (searchPhrase === '') {
    return [...inventoryItems];
  }
  return inventoryItems.filter((inventoryItem) =>
    inventoryItemTitle(inventoryItem).toLowerCase().includes(searchPhrase),
  );
}

async function matchingInventoryItems(
  sellerSession: EbaySellerSession,
  searchPhrase: string,
  matchLimit: number,
  pageOffset: number,
  previousMatches: readonly InventoryItemWithSku[],
): Promise<InventoryItemWithSku[]> {
  const pageSize = connectorPageSize(searchPhrase, matchLimit);
  const inventoryItemCompletion = await getInventoryItems(sellerSession, {
    limit: String(pageSize),
    offset: String(pageOffset),
  });
  const inventoryItemCollection = successfulEbayDocument(inventoryItemCompletion);
  const inventoryItems = inventoryItemCollection.inventoryItems;
  if (inventoryItems === undefined) {
    return [...previousMatches];
  }
  if (inventoryItems.length === 0) {
    return [...previousMatches];
  }

  const inventoryItemsWithSku = inventoryItems.filter(hasSellerSku);
  const currentMatches = matchingPageItems(inventoryItemsWithSku, searchPhrase);
  const combinedMatches = [...previousMatches, ...currentMatches];
  if (combinedMatches.length >= matchLimit) {
    return combinedMatches.slice(0, matchLimit);
  }
  if (inventoryItems.length < pageSize) {
    return combinedMatches;
  }
  if (inventoryItemCollection.total !== undefined) {
    const scannedInventoryItemCount = (pageOffset + 1) * pageSize;
    if (scannedInventoryItemCount >= inventoryItemCollection.total) {
      return combinedMatches;
    }
  }
  return matchingInventoryItems(
    sellerSession,
    searchPhrase,
    matchLimit,
    pageOffset + 1,
    combinedMatches,
  );
}

/**
 * OpenAI ChatGPT connector tools.
 *
 * The connector protocol fixes the names `search` and `fetch`. Both reuse the
 * strict Sell Inventory resource operations while retaining their connector wire shapes.
 */
export const connectorEntries: ToolEntry[] = [
  defineTool({
    name: 'search',
    description: 'Search for eBay inventory items',
    inputSchema: connectorSearchInputSchema.shape,
    title: 'Search',
    outputSchema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: { type: 'object' },
      },
    },
    annotations: {
      title: 'Search',
      readOnlyHint: true,
    },
    _meta: {
      category: 'chat',
      version: '1.0.0',
    },
    handler: async (ebaySellerApi, connectorArguments) => {
      const sellerSession = createEbaySellerSession(ebaySellerApi.getAuthClient());
      const matchLimit = connectorMatchLimit(connectorArguments.limit);
      const searchPhrase = connectorArguments.query.toLowerCase().trim();
      const inventoryMatches = await matchingInventoryItems(
        sellerSession,
        searchPhrase,
        matchLimit,
        0,
        [],
      );
      const connectorMatches = inventoryMatches.map((inventoryItem) => ({
        id: inventoryItem.sku,
        title: inventoryItemTitle(inventoryItem),
        url: 'https://www.ebay.com/',
      }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ results: connectorMatches }),
          },
        ],
      };
    },
  }),
  defineTool({
    name: 'fetch',
    description: 'Fetch a specific eBay inventory item by SKU',
    inputSchema: connectorFetchInputSchema.shape,
    title: 'Fetch',
    outputSchema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: { type: 'object' },
      },
    },
    annotations: {
      title: 'Fetch',
      readOnlyHint: true,
    },
    _meta: {
      category: 'chat',
      version: '1.0.0',
    },
    handler: async (ebaySellerApi, connectorArguments) => {
      const sellerSession = createEbaySellerSession(ebaySellerApi.getAuthClient());
      const inventoryItemCompletion = await getInventoryItem(sellerSession, {
        sku: connectorArguments.id,
      });
      const inventoryItem = successfulEbayDocument(inventoryItemCompletion);
      const productDetails = inventoryItem.product;
      const connectorDocument = {
        id: connectorArguments.id,
        title: inventoryItemTitle(inventoryItem),
        text: inventoryItemDescription(inventoryItem),
        url: 'https://www.ebay.com/',
        metadata: {
          source: 'ebay_inventory',
          aspects: productDetails?.aspects,
          condition: inventoryItem.condition,
        },
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(connectorDocument),
          },
        ],
      };
    },
  }),
];
