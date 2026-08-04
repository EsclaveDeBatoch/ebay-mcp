import { describe, expect, it } from 'vitest';

import type { EbayFailure, EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { InventoryItem } from '@/ebay/sell/inventory/inventoryItem.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

import { connectorFetchArgumentsSchema, fetchConnectorInventoryItem } from './fetch.js';

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

describe('ChatGPT connector fetch', () => {
  it('accepts the exact connector fetch wire fields', () => {
    expect(connectorFetchArgumentsSchema.parse({ id: 'TEST-SKU' })).toEqual({ id: 'TEST-SKU' });
  });

  it.each([{}, { id: 1 }, { id: 'TEST-SKU', sku: 'OTHER' }, { sku: 'TEST-SKU' }])(
    'rejects invalid or unknown fetch arguments',
    (invalidFetchArguments) => {
      expect(connectorFetchArgumentsSchema.safeParse(invalidFetchArguments).success).toBe(false);
    },
  );

  it('loads one inventory item by SKU and returns the connector document', async () => {
    const successfulRequest: EbayRequestCompletion<InventoryItem> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: inventoryItem,
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulRequest);

    const requestCompletion = await fetchConnectorInventoryItem(sellerSession, {
      id: 'TEST-SKU',
    });

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/inventory/v1/inventory_item/TEST-SKU',
      },
    ]);
    expect(requestCompletion).toEqual({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {
        id: 'TEST-SKU',
        title: 'Test Product',
        text: 'Test Description',
        url: 'https://www.ebay.com/',
        metadata: {
          source: 'ebay_inventory',
          aspects: inventoryProductAspects,
          condition: 'NEW',
        },
      },
    });
  });

  it('returns empty title and text when product details are absent', async () => {
    const successfulRequest: EbayRequestCompletion<InventoryItem> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: { sku: 'BARE-SKU', condition: 'USED_GOOD' },
    };
    const { sellerSession } = sellerSessionReturning(successfulRequest);

    await expect(fetchConnectorInventoryItem(sellerSession, { id: 'BARE-SKU' })).resolves.toEqual({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {
        id: 'BARE-SKU',
        title: '',
        text: '',
        url: 'https://www.ebay.com/',
        metadata: {
          source: 'ebay_inventory',
          aspects: undefined,
          condition: 'USED_GOOD',
        },
      },
    });
  });

  it.each<EbayFailure>([...ebayFailures])(
    'propagates $kind from getInventoryItem without throwing',
    async (ebayFailure) => {
      const failedRequest: EbayRequestCompletion<InventoryItem> = {
        kind: 'ebayRequestFailed',
        ebayFailure,
      };
      const { sellerSession } = sellerSessionReturning(failedRequest);

      await expect(fetchConnectorInventoryItem(sellerSession, { id: 'TEST-SKU' })).resolves.toBe(
        failedRequest,
      );
    },
  );
});
