import { describe, expect, it } from 'vitest';

import {
  createOrReplaceInventoryItemGroup,
  createOrReplaceInventoryItemGroupArgumentsSchema,
  deleteInventoryItemGroup,
  getInventoryItemGroup,
  inventoryItemGroupKeyArgumentsSchema,
} from '@/ebay/sell/inventory/inventoryItemGroup.js';
import { sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

describe('Sell Inventory item-group schemas', () => {
  it('accepts the exact path and direct replacement document', () => {
    expect(
      inventoryItemGroupKeyArgumentsSchema.parse({ inventoryItemGroupKey: 'GROUP-1' }),
    ).toEqual({ inventoryItemGroupKey: 'GROUP-1' });

    const inventoryItemGroupReplacement = {
      inventoryItemGroupKey: 'GROUP-1',
      'Content-Language': 'en-US',
      aspects: { Pattern: ['Solid'] },
      title: 'Cotton shirts',
      variantSKUs: ['SHIRT-BLUE-M', 'SHIRT-BLUE-L'],
      variesBy: {
        aspectsImageVariesBy: ['Color'],
        specifications: [{ name: 'Size', values: ['M', 'L'] }],
      },
    };

    expect(
      createOrReplaceInventoryItemGroupArgumentsSchema.parse(inventoryItemGroupReplacement),
    ).toEqual(inventoryItemGroupReplacement);
  });

  it.each([
    { inventory_item_group_key: 'GROUP-1' },
    { inventoryItemGroupKey: '' },
    { inventoryItemGroupKey: 'x'.repeat(51) },
    {
      inventoryItemGroupKey: 'GROUP-1',
      'Content-Language': 'en-US',
      body: { variantSKUs: ['SKU-1'] },
    },
    { inventoryItemGroupKey: 'GROUP-1', variantSKUs: ['SKU-1'] },
    {
      inventoryItemGroupKey: 'GROUP-1',
      'Content-Language': 'en-US',
      variantSKUs: [],
    },
  ])('rejects aliases, wrappers, missing headers, and invalid identifiers', (invalidGroupCall) => {
    expect(() =>
      createOrReplaceInventoryItemGroupArgumentsSchema.parse(invalidGroupCall),
    ).toThrow();
  });
});

describe('Sell Inventory item-group operations', () => {
  it('uses the encoded item-group path for reads and deletes', async () => {
    const { sellerSession, getCalls, deleteCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await getInventoryItemGroup(sellerSession, { inventoryItemGroupKey: 'GROUP/1' });
    await deleteInventoryItemGroup(sellerSession, { inventoryItemGroupKey: 'GROUP/1' });

    expect(getCalls).toEqual([{ endpoint: '/sell/inventory/v1/inventory_item_group/GROUP%2F1' }]);
    expect(deleteCalls).toEqual([
      { endpoint: '/sell/inventory/v1/inventory_item_group/GROUP%2F1' },
    ]);
  });

  it('puts the direct item-group document with Content-Language', async () => {
    const { sellerSession, putCalls } = sellerSessionReturning<undefined>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    });
    const inventoryItemGroupReplacement = {
      inventoryItemGroupKey: 'GROUP/1',
      'Content-Language': 'en-US',
      aspects: { Pattern: ['Solid'] },
      title: 'Cotton shirts',
      variantSKUs: ['SHIRT-BLUE-M', 'SHIRT-BLUE-L'],
    };

    await createOrReplaceInventoryItemGroup(sellerSession, inventoryItemGroupReplacement);

    expect(putCalls).toEqual([
      {
        endpoint: '/sell/inventory/v1/inventory_item_group/GROUP%2F1',
        requestDocument: {
          aspects: { Pattern: ['Solid'] },
          title: 'Cotton shirts',
          variantSKUs: ['SHIRT-BLUE-M', 'SHIRT-BLUE-L'],
        },
        requestHeaders: { 'Content-Language': 'en-US' },
      },
    ]);
  });
});
