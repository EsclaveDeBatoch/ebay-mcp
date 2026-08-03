import { describe, expect, it } from 'vitest';

import {
  createOrReplaceProductCompatibility,
  createOrReplaceProductCompatibilityArgumentsSchema,
  deleteProductCompatibility,
  getProductCompatibility,
  productCompatibilitySkuArgumentsSchema,
} from '@/ebay/sell/inventory/productCompatibility.js';
import { sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

describe('Sell Inventory product-compatibility schemas', () => {
  it('accepts the exact SKU path and direct compatibility document', () => {
    expect(productCompatibilitySkuArgumentsSchema.parse({ sku: 'BRAKE-PAD-1' })).toEqual({
      sku: 'BRAKE-PAD-1',
    });

    const compatibilityReplacement = {
      sku: 'BRAKE-PAD-1',
      'Content-Language': 'en-US',
      compatibleProducts: [
        {
          compatibilityProperties: [
            { name: 'make', value: 'Toyota' },
            { name: 'model', value: 'Camry' },
            { name: 'year', value: '2020' },
          ],
          notes: 'Front axle',
        },
      ],
    };

    expect(
      createOrReplaceProductCompatibilityArgumentsSchema.parse(compatibilityReplacement),
    ).toEqual(compatibilityReplacement);
  });

  it.each([
    { inventorySku: 'BRAKE-PAD-1' },
    { sku: '' },
    { sku: 'x'.repeat(51) },
    {
      sku: 'BRAKE-PAD-1',
      'Content-Language': 'en-US',
      body: { compatibleProducts: [] },
    },
    { sku: 'BRAKE-PAD-1', compatibleProducts: [] },
    {
      sku: 'BRAKE-PAD-1',
      'Content-Language': 'en-US',
      'Content-Type': 'application/json',
      compatibleProducts: [],
    },
    {
      sku: 'BRAKE-PAD-1',
      'Content-Language': 'en-US',
      compatibleProducts: [{ productFamilyProperties: { make: 'Toyota' } }],
    },
  ])('rejects aliases, wrappers, transport headers, and deprecated fields', (invalidCall) => {
    expect(() => createOrReplaceProductCompatibilityArgumentsSchema.parse(invalidCall)).toThrow();
  });
});

describe('Sell Inventory product-compatibility operations', () => {
  it('uses the encoded SKU path for reads and deletes', async () => {
    const { sellerSession, getCalls, deleteCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await getProductCompatibility(sellerSession, { sku: 'BRAKE/PAD' });
    await deleteProductCompatibility(sellerSession, { sku: 'BRAKE/PAD' });

    expect(getCalls).toEqual([
      { endpoint: '/sell/inventory/v1/inventory_item/BRAKE%2FPAD/product_compatibility' },
    ]);
    expect(deleteCalls).toEqual([
      { endpoint: '/sell/inventory/v1/inventory_item/BRAKE%2FPAD/product_compatibility' },
    ]);
  });

  it('puts the direct compatibility document with Content-Language', async () => {
    const { sellerSession, putCalls } = sellerSessionReturning<undefined>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    });
    const compatibilityReplacement = {
      sku: 'BRAKE/PAD',
      'Content-Language': 'en-US',
      compatibleProducts: [
        {
          productIdentifier: { epid: '123456789' },
          notes: 'Front axle',
        },
      ],
    };

    await createOrReplaceProductCompatibility(sellerSession, compatibilityReplacement);

    expect(putCalls).toEqual([
      {
        endpoint: '/sell/inventory/v1/inventory_item/BRAKE%2FPAD/product_compatibility',
        requestDocument: {
          compatibleProducts: [
            {
              productIdentifier: { epid: '123456789' },
              notes: 'Front axle',
            },
          ],
        },
        requestHeaders: { 'Content-Language': 'en-US' },
      },
    ]);
  });
});
