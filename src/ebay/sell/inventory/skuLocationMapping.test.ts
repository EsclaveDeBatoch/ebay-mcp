import { describe, expect, it } from 'vitest';

import {
  createOrReplaceSkuLocationMapping,
  createOrReplaceSkuLocationMappingArgumentsSchema,
  deleteSkuLocationMapping,
  getSkuLocationMapping,
  skuLocationMappingPathArgumentsSchema,
} from '@/ebay/sell/inventory/skuLocationMapping.js';
import { sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

describe('Sell Inventory SKU-location-mapping schemas', () => {
  it('accepts the exact path and direct fulfillment-location document', () => {
    expect(
      skuLocationMappingPathArgumentsSchema.parse({ listingId: 'LISTING-1', sku: 'SKU-1' }),
    ).toEqual({ listingId: 'LISTING-1', sku: 'SKU-1' });

    const locationMappingReplacement = {
      listingId: 'LISTING-1',
      sku: 'SKU-1',
      locations: [{ merchantLocationKey: 'FULFILLMENT-1' }],
    };

    expect(
      createOrReplaceSkuLocationMappingArgumentsSchema.parse(locationMappingReplacement),
    ).toEqual(locationMappingReplacement);
  });

  it.each([
    { listing_id: 'LISTING-1', sku: 'SKU-1' },
    { listingId: '', sku: 'SKU-1' },
    { listingId: 'LISTING-1', sku: '' },
    { listingId: 'LISTING-1', sku: 'x'.repeat(51) },
    {
      listingId: 'LISTING-1',
      sku: 'SKU-1',
      body: { locations: [{ merchantLocationKey: 'FULFILLMENT-1' }] },
    },
    { listingId: 'LISTING-1', sku: 'SKU-1' },
    { listingId: 'LISTING-1', sku: 'SKU-1', locations: [] },
    {
      listingId: 'LISTING-1',
      sku: 'SKU-1',
      locations: [{ merchantLocationKey: '' }],
    },
    {
      listingId: 'LISTING-1',
      sku: 'SKU-1',
      'Content-Type': 'application/json',
      locations: [{ merchantLocationKey: 'FULFILLMENT-1' }],
    },
    {
      listingId: 'LISTING-1',
      sku: 'SKU-1',
      locations: [
        { merchantLocationKey: 'FULFILLMENT-1' },
        { merchantLocationKey: 'FULFILLMENT-1' },
      ],
    },
  ])('rejects aliases, wrappers, transport headers, and invalid mappings', (invalidMappingCall) => {
    expect(() =>
      createOrReplaceSkuLocationMappingArgumentsSchema.parse(invalidMappingCall),
    ).toThrow();
  });
});

describe('Sell Inventory SKU-location-mapping operations', () => {
  it('uses the encoded listing and SKU path for reads and deletes', async () => {
    const { sellerSession, getCalls, deleteCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await getSkuLocationMapping(sellerSession, { listingId: 'LISTING/1', sku: 'SKU/1' });
    await deleteSkuLocationMapping(sellerSession, { listingId: 'LISTING/1', sku: 'SKU/1' });

    expect(getCalls).toEqual([
      { endpoint: '/sell/inventory/v1/listing/LISTING%2F1/sku/SKU%2F1/locations' },
    ]);
    expect(deleteCalls).toEqual([
      { endpoint: '/sell/inventory/v1/listing/LISTING%2F1/sku/SKU%2F1/locations' },
    ]);
  });

  it('puts the direct location mapping document', async () => {
    const { sellerSession, putCalls } = sellerSessionReturning<undefined>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    });
    const locationMappingReplacement = {
      listingId: 'LISTING/1',
      sku: 'SKU/1',
      locations: [
        { merchantLocationKey: 'FULFILLMENT-1' },
        { merchantLocationKey: 'FULFILLMENT-2' },
      ],
    };

    await createOrReplaceSkuLocationMapping(sellerSession, locationMappingReplacement);

    expect(putCalls).toEqual([
      {
        endpoint: '/sell/inventory/v1/listing/LISTING%2F1/sku/SKU%2F1/locations',
        requestDocument: {
          locations: [
            { merchantLocationKey: 'FULFILLMENT-1' },
            { merchantLocationKey: 'FULFILLMENT-2' },
          ],
        },
      },
    ]);
  });
});
