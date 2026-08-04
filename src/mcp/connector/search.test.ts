import { describe, expect, it } from 'vitest';

import type { EbayFailure, EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbayGetCall, EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { InventoryItemCollection } from '@/ebay/sell/inventory/inventoryItem.js';
import type { TradingDocument } from '@/ebay/trading/tradingTransport.js';
import { ebayFailures } from '@tests/fixtures/ebaySellerSession.js';

import {
  connectorSearchArgumentsSchema,
  type ConnectorSearchDocument,
  searchConnectorInventory,
} from './search.js';

const inventoryCollection: InventoryItemCollection = {
  inventoryItems: [
    { sku: 'SKU-1', product: { title: 'Blue Widget' } },
    { sku: 'SKU-2', product: { title: 'Red Gadget' } },
    { sku: '  ', product: { title: 'No SKU' } },
    { product: { title: 'Missing SKU' } },
  ],
  total: 4,
  limit: 10,
};

const successfulCollection = (
  inventoryItemCollection: InventoryItemCollection,
): EbayRequestCompletion<InventoryItemCollection> => ({
  kind: 'ebayRequestSucceeded',
  ebayDocument: inventoryItemCollection,
});

const sellerSessionWithGet = (
  completeGet: (ebayGetCall: EbayGetCall) => Promise<EbayRequestCompletion<unknown>>,
): {
  readonly sellerSession: EbaySellerSession;
  readonly getCalls: EbayGetCall[];
} => {
  const getCalls: EbayGetCall[] = [];
  const sellerSession: EbaySellerSession = {
    delete: async <EbayDocument>() =>
      ({
        kind: 'ebayRequestSucceeded',
        ebayDocument: undefined as EbayDocument,
      }) as EbayRequestCompletion<EbayDocument>,
    get: async <EbayDocument>(ebayGetCall: EbayGetCall) => {
      getCalls.push(ebayGetCall);
      return completeGet(ebayGetCall) as Promise<EbayRequestCompletion<EbayDocument>>;
    },
    post: async <EbayDocument>() =>
      ({
        kind: 'ebayRequestSucceeded',
        ebayDocument: undefined as EbayDocument,
      }) as EbayRequestCompletion<EbayDocument>,
    put: async <EbayDocument>() =>
      ({
        kind: 'ebayRequestSucceeded',
        ebayDocument: undefined as EbayDocument,
      }) as EbayRequestCompletion<EbayDocument>,
    trading: async <EbayDocument extends TradingDocument>() =>
      ({
        kind: 'ebayRequestSucceeded',
        ebayDocument: {} as EbayDocument,
      }) as EbayRequestCompletion<EbayDocument>,
  };
  return { getCalls, sellerSession };
};

describe('ChatGPT connector search', () => {
  it('accepts the exact connector search wire fields', () => {
    expect(connectorSearchArgumentsSchema.parse({ query: 'widget', limit: 5 })).toEqual({
      query: 'widget',
      limit: 5,
    });
    expect(connectorSearchArgumentsSchema.parse({ query: '' })).toEqual({ query: '' });
  });

  it.each([
    {},
    { query: 1 },
    { query: 'widget', limit: '10' },
    { query: 'widget', offset: 0 },
    { query: 'widget', marketplaceId: 'EBAY_US' },
  ])('rejects invalid or unknown search arguments', (invalidSearchArguments) => {
    expect(connectorSearchArgumentsSchema.safeParse(invalidSearchArguments).success).toBe(false);
  });

  it('lists inventory with default limit 10 and empty-query page size', async () => {
    const { sellerSession, getCalls } = sellerSessionWithGet(async () =>
      successfulCollection(inventoryCollection),
    );

    const requestCompletion = await searchConnectorInventory(sellerSession, { query: '' });

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/inventory/v1/inventory_item',
        searchParameters: { limit: '10', offset: '0' },
      },
    ]);
    expect(requestCompletion).toEqual({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {
        results: [
          { id: 'SKU-1', title: 'Blue Widget', url: 'https://www.ebay.com/' },
          { id: 'SKU-2', title: 'Red Gadget', url: 'https://www.ebay.com/' },
        ],
      } satisfies ConnectorSearchDocument,
    });
  });

  it('filters titles case-insensitively and uses the filtered page size floor of 50', async () => {
    const { sellerSession, getCalls } = sellerSessionWithGet(async () =>
      successfulCollection(inventoryCollection),
    );

    const requestCompletion = await searchConnectorInventory(sellerSession, {
      query: '  BLUE  ',
      limit: 3,
    });

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/inventory/v1/inventory_item',
        searchParameters: { limit: '50', offset: '0' },
      },
    ]);
    expect(requestCompletion).toEqual({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {
        results: [{ id: 'SKU-1', title: 'Blue Widget', url: 'https://www.ebay.com/' }],
      },
    });
  });

  it('pages inventory with item offsets until the match limit is reached', async () => {
    const firstPage: InventoryItemCollection = {
      inventoryItems: [
        { sku: 'SKU-A', product: { title: 'Alpha camera' } },
        { sku: 'SKU-B', product: { title: 'Beta lens' } },
        { product: { title: 'Missing SKU' } },
      ],
      total: 6,
      limit: 3,
    };
    const secondPage: InventoryItemCollection = {
      inventoryItems: [
        { sku: 'SKU-C', product: { title: 'Gamma flash' } },
        { sku: 'SKU-D', product: { title: 'Delta bag' } },
        { sku: 'SKU-E', product: { title: 'Epsilon tripod' } },
      ],
      total: 6,
      limit: 3,
    };
    const pages = [firstPage, secondPage];
    const { sellerSession, getCalls } = sellerSessionWithGet(async () => {
      const inventoryPage = pages[getCalls.length - 1];
      if (inventoryPage === undefined) {
        throw new Error('Unexpected extra inventory page request');
      }
      return successfulCollection(inventoryPage);
    });

    const requestCompletion = await searchConnectorInventory(sellerSession, {
      query: '',
      limit: 3,
    });

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/inventory/v1/inventory_item',
        searchParameters: { limit: '3', offset: '0' },
      },
      {
        endpoint: '/sell/inventory/v1/inventory_item',
        searchParameters: { limit: '3', offset: '3' },
      },
    ]);
    expect(requestCompletion).toEqual({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {
        results: [
          { id: 'SKU-A', title: 'Alpha camera', url: 'https://www.ebay.com/' },
          { id: 'SKU-B', title: 'Beta lens', url: 'https://www.ebay.com/' },
          { id: 'SKU-C', title: 'Gamma flash', url: 'https://www.ebay.com/' },
        ],
      },
    });
  });

  it('returns an empty result set when inventory has no SKU-bearing items', async () => {
    const { sellerSession } = sellerSessionWithGet(async () =>
      successfulCollection({
        inventoryItems: [{ product: { title: 'No SKU' } }],
        total: 1,
      }),
    );

    await expect(searchConnectorInventory(sellerSession, { query: 'no' })).resolves.toEqual({
      kind: 'ebayRequestSucceeded',
      ebayDocument: { results: [] },
    });
  });

  it.each<EbayFailure>([...ebayFailures])(
    'propagates $kind from getInventoryItems without throwing',
    async (ebayFailure) => {
      const failedRequest: EbayRequestCompletion<InventoryItemCollection> = {
        kind: 'ebayRequestFailed',
        ebayFailure,
      };
      const { sellerSession } = sellerSessionWithGet(async () => failedRequest);

      await expect(searchConnectorInventory(sellerSession, { query: '' })).resolves.toBe(
        failedRequest,
      );
    },
  );
});
