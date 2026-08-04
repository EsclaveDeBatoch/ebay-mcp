import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import { getInventoryItems, type InventoryItem } from '@/ebay/sell/inventory/inventoryItem.js';
import { defineTool } from '@/mcp/defineTool.js';

/** ChatGPT connector search arguments — exact protocol wire keys. */
export const connectorSearchArgumentsSchema = z
  .object({
    query: z.string().describe('Search query'),
    limit: z.number().optional().describe('Maximum number of matches'),
  })
  .strict();

/** Validated ChatGPT connector search arguments. */
export type ConnectorSearchArguments = z.infer<typeof connectorSearchArgumentsSchema>;

/** One inventory match returned by the connector search document. */
export type ConnectorSearchMatch = {
  readonly id: string;
  readonly title: string;
  readonly url: 'https://www.ebay.com/';
};

/** ChatGPT connector search document. */
export type ConnectorSearchDocument = {
  readonly results: readonly ConnectorSearchMatch[];
};

type InventoryItemWithSku = InventoryItem & { readonly sku: string };

type InventoryMatchProgress = {
  readonly sellerSession: EbaySellerSession;
  readonly searchPhrase: string;
  readonly matchLimit: number;
  readonly itemOffset: number;
  readonly previousMatches: readonly InventoryItemWithSku[];
};

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
  matchProgress: InventoryMatchProgress,
): Promise<EbayRequestCompletion<readonly InventoryItemWithSku[]>> {
  const { sellerSession, searchPhrase, matchLimit, itemOffset, previousMatches } = matchProgress;
  const pageSize = connectorPageSize(searchPhrase, matchLimit);
  const inventoryItemCompletion = await getInventoryItems(sellerSession, {
    limit: String(pageSize),
    offset: String(itemOffset),
  });
  if (inventoryItemCompletion.kind === 'ebayRequestFailed') {
    return inventoryItemCompletion;
  }

  const { inventoryItems, total } = inventoryItemCompletion.ebayDocument;
  if (inventoryItems === undefined) {
    return { kind: 'ebayRequestSucceeded', ebayDocument: previousMatches };
  }
  if (inventoryItems.length === 0) {
    return { kind: 'ebayRequestSucceeded', ebayDocument: previousMatches };
  }

  const inventoryItemsWithSku = inventoryItems.filter(hasSellerSku);
  const currentMatches = matchingPageItems(inventoryItemsWithSku, searchPhrase);
  const combinedMatches = [...previousMatches, ...currentMatches];
  if (combinedMatches.length >= matchLimit) {
    return {
      kind: 'ebayRequestSucceeded',
      ebayDocument: combinedMatches.slice(0, matchLimit),
    };
  }
  if (inventoryItems.length < pageSize) {
    return { kind: 'ebayRequestSucceeded', ebayDocument: combinedMatches };
  }
  if (total !== undefined) {
    const scannedInventoryItemCount = itemOffset + inventoryItems.length;
    if (scannedInventoryItemCount >= total) {
      return { kind: 'ebayRequestSucceeded', ebayDocument: combinedMatches };
    }
  }
  return matchingInventoryItems({
    sellerSession,
    searchPhrase,
    matchLimit,
    itemOffset: itemOffset + pageSize,
    previousMatches: combinedMatches,
  });
}

/**
 * Searches the seller's inventory for the ChatGPT connector `search` protocol.
 *
 * Pages Sell Inventory `getInventoryItems`, filters titles case-insensitively when
 * the query is non-empty, and returns connector-shaped matches (not the raw eBay
 * inventory collection).
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param searchArguments - Exact connector search wire fields.
 * @returns Connector search document or a propagated inventory failure.
 */
export const searchConnectorInventory = async (
  sellerSession: EbaySellerSession,
  searchArguments: ConnectorSearchArguments,
): Promise<EbayRequestCompletion<ConnectorSearchDocument>> => {
  const matchLimit = connectorMatchLimit(searchArguments.limit);
  const searchPhrase = searchArguments.query.toLowerCase().trim();
  const inventoryMatchCompletion = await matchingInventoryItems({
    sellerSession,
    searchPhrase,
    matchLimit,
    itemOffset: 0,
    previousMatches: [],
  });
  if (inventoryMatchCompletion.kind === 'ebayRequestFailed') {
    return inventoryMatchCompletion;
  }

  const connectorMatches = inventoryMatchCompletion.ebayDocument.map((inventoryItem) => ({
    id: inventoryItem.sku,
    title: inventoryItemTitle(inventoryItem),
    url: 'https://www.ebay.com/' as const,
  }));

  return {
    kind: 'ebayRequestSucceeded',
    ebayDocument: { results: connectorMatches },
  };
};

/** MCP definition for the ChatGPT connector `search` protocol tool. */
export const searchTool = defineTool({
  name: 'search',
  namespace: 'connector',
  description: 'Search for eBay inventory items',
  argumentsSchema: connectorSearchArgumentsSchema,
  operationKind: 'read',
  operation: searchConnectorInventory,
});
