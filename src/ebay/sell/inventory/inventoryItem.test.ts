import { describe, expect, it } from 'vitest';

import {
  bulkCreateOrReplaceInventoryItem,
  bulkCreateOrReplaceInventoryItemArgumentsSchema,
  bulkGetInventoryItem,
  bulkGetInventoryItemArgumentsSchema,
  bulkMigrateListing,
  bulkMigrateListingArgumentsSchema,
  bulkUpdatePriceQuantity,
  bulkUpdatePriceQuantityArgumentsSchema,
  createOrReplaceInventoryItem,
  createOrReplaceInventoryItemArgumentsSchema,
  deleteInventoryItem,
  getInventoryItem,
  getInventoryItems,
  inventoryItemPageArgumentsSchema,
  inventoryItemSkuArgumentsSchema,
} from '@/ebay/sell/inventory/inventoryItem.js';
import type { CreateOrReplaceInventoryItemArguments } from '@/ebay/sell/inventory/inventoryItem.js';
import { sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

const inventoryItemReplacement: CreateOrReplaceInventoryItemArguments = {
  sku: 'CAMERA-1',
  'Content-Language': 'en-US',
  availability: {
    pickupAtLocationAvailability: [
      {
        availabilityType: 'IN_STOCK',
        fulfillmentTime: { unit: 'BUSINESS_DAY', value: 1 },
        merchantLocationKey: 'WAREHOUSE-1',
        quantity: 2,
      },
    ],
    shipToLocationAvailability: {
      availabilityDistributions: [
        {
          fulfillmentTime: { unit: 'BUSINESS_DAY', value: 2 },
          merchantLocationKey: 'WAREHOUSE-1',
          quantity: 3,
        },
      ],
      quantity: 3,
    },
  },
  condition: 'USED_EXCELLENT',
  conditionDescription: 'Minor signs of careful use',
  packageWeightAndSize: {
    dimensions: { height: 5, length: 8, unit: 'INCH', width: 6 },
    packageType: 'PACKAGE_THICK_ENVELOPE',
    weight: { unit: 'POUND', value: 2.5 },
  },
  product: {
    aspects: { Brand: ['Example'] },
    brand: 'Example',
    imageUrls: ['https://i.ebayimg.com/images/g/example.jpg'],
    title: 'Mirrorless camera',
  },
};

describe('Sell Inventory item schemas', () => {
  it('accepts exact string pagination, SKU paths, and direct replacement fields', () => {
    expect(inventoryItemPageArgumentsSchema.parse({ limit: '200', offset: '0' })).toEqual({
      limit: '200',
      offset: '0',
    });
    expect(inventoryItemSkuArgumentsSchema.parse({ sku: 'CAMERA-1' })).toEqual({ sku: 'CAMERA-1' });
    expect(createOrReplaceInventoryItemArgumentsSchema.parse(inventoryItemReplacement)).toEqual(
      inventoryItemReplacement,
    );
  });

  it.each([
    { limit: 25 },
    { limit: '0' },
    { limit: '201' },
    { offset: '-1' },
    { sku: '' },
    { sku: 'x'.repeat(51) },
    { sku: 'CAMERA-1', 'Content-Language': 'en-US', body: { condition: 'NEW' } },
    {
      sku: 'CAMERA-1',
      'Content-Language': 'en-US',
      'Content-Type': 'application/json',
    },
    { sku: 'CAMERA-1', condition: 'NEW' },
  ])(
    'rejects aliases, wrappers, transport headers, and invalid exact fields',
    (invalidArguments) => {
      expect(() => createOrReplaceInventoryItemArgumentsSchema.parse(invalidArguments)).toThrow();
    },
  );

  it.each([
    {
      sku: 'CAMERA-1',
      'Content-Language': 'en-US',
      condition: 'NEW',
      conditionDescription: 'Unused',
    },
    {
      sku: 'CAMERA-1',
      'Content-Language': 'en-US',
      availability: {
        pickupAtLocationAvailability: [
          {
            availabilityType: 'OUT_OF_STOCK',
            fulfillmentTime: { unit: 'BUSINESS_DAY', value: 1 },
            merchantLocationKey: 'WAREHOUSE-1',
            quantity: 1,
          },
        ],
      },
    },
    {
      sku: 'CAMERA-1',
      'Content-Language': 'en-US',
      availability: { shipToLocationAvailability: {} },
    },
    {
      sku: 'CAMERA-1',
      'Content-Language': 'en-US',
      packageWeightAndSize: { dimensions: { height: 5, length: 8, width: 6 } },
    },
    {
      sku: 'CAMERA-1',
      'Content-Language': 'en-US',
      product: { imageUrls: ['http://example.com/camera.jpg'] },
    },
  ])(
    'enforces documented condition, availability, package, and image rules',
    (invalidArguments) => {
      expect(() => createOrReplaceInventoryItemArgumentsSchema.parse(invalidArguments)).toThrow();
    },
  );

  it('accepts direct bulk documents with their documented limits', () => {
    expect(
      bulkCreateOrReplaceInventoryItemArgumentsSchema.parse({
        'Content-Language': 'en-US',
        requests: [{ sku: 'CAMERA-1', condition: 'NEW' }],
      }),
    ).toEqual({
      'Content-Language': 'en-US',
      requests: [{ sku: 'CAMERA-1', condition: 'NEW' }],
    });
    expect(bulkGetInventoryItemArgumentsSchema.parse({ requests: [{ sku: 'CAMERA-1' }] })).toEqual({
      requests: [{ sku: 'CAMERA-1' }],
    });
    expect(
      bulkMigrateListingArgumentsSchema.parse({ requests: [{ listingId: '123456789012' }] }),
    ).toEqual({ requests: [{ listingId: '123456789012' }] });
  });

  it.each([
    { 'Content-Language': 'en-US', requests: [] },
    {
      'Content-Language': 'en-US',
      requests: Array.from({ length: 26 }, (_, index) => ({ sku: `SKU-${index}` })),
    },
    { 'Content-Language': 'en-US', requests: [{ sku: 'DUPLICATE' }, { sku: 'DUPLICATE' }] },
    { 'Content-Language': 'en-US', body: { requests: [{ sku: 'CAMERA-1' }] } },
  ])('rejects empty, oversized, duplicate, and wrapped bulk replacements', (invalidArguments) => {
    expect(() => bulkCreateOrReplaceInventoryItemArgumentsSchema.parse(invalidArguments)).toThrow();
  });

  it.each([
    { requests: [] },
    { requests: [{ sku: 'DUPLICATE' }, { sku: 'DUPLICATE' }] },
    { requests: [{ sku: '' }] },
    { requests: Array.from({ length: 26 }, (_, index) => ({ sku: `SKU-${index}` })) },
  ])('rejects invalid bulk retrieval selections', (invalidArguments) => {
    expect(() => bulkGetInventoryItemArgumentsSchema.parse(invalidArguments)).toThrow();
  });

  it('accepts offer changes and SKU-backed inventory quantity changes', () => {
    expect(
      bulkUpdatePriceQuantityArgumentsSchema.parse({
        requests: [
          {
            offers: [
              {
                availableQuantity: 4,
                offerId: 'OFFER-1',
                price: { currency: 'USD', value: '49.95' },
              },
            ],
          },
          {
            shipToLocationAvailability: { quantity: 8 },
            sku: 'CAMERA-1',
          },
        ],
      }),
    ).toEqual({
      requests: [
        {
          offers: [
            {
              availableQuantity: 4,
              offerId: 'OFFER-1',
              price: { currency: 'USD', value: '49.95' },
            },
          ],
        },
        { shipToLocationAvailability: { quantity: 8 }, sku: 'CAMERA-1' },
      ],
    });
  });

  it.each([
    { requests: [{ offers: [{ offerId: 'OFFER-1' }] }] },
    { requests: [{ sku: 'CAMERA-1' }] },
    { requests: [{ shipToLocationAvailability: { quantity: 8 } }] },
    {
      requests: [
        {
          offers: [
            { availableQuantity: 2, offerId: 'DUPLICATE' },
            { availableQuantity: 3, offerId: 'DUPLICATE' },
          ],
        },
      ],
    },
    {
      requests: [{ offers: [{ offerId: 'OFFER-1', price: { currency: 'US', value: 'free' } }] }],
    },
  ])('rejects ambiguous or incomplete price and quantity changes', (invalidArguments) => {
    expect(() => bulkUpdatePriceQuantityArgumentsSchema.parse(invalidArguments)).toThrow();
  });

  it.each([
    { requests: [] },
    { requests: [{ listingId: 'DUPLICATE' }, { listingId: 'DUPLICATE' }] },
    {
      requests: Array.from({ length: 6 }, (_, index) => ({ listingId: `LISTING-${index}` })),
    },
  ])('rejects invalid bulk migration selections', (invalidArguments) => {
    expect(() => bulkMigrateListingArgumentsSchema.parse(invalidArguments)).toThrow();
  });
});

describe('Sell Inventory item operations', () => {
  it('uses exact pagination and encoded SKU paths for reads and deletes', async () => {
    const { sellerSession, deleteCalls, getCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await getInventoryItems(sellerSession, { limit: '200', offset: '1' });
    await getInventoryItem(sellerSession, { sku: 'CAMERA/1' });
    await deleteInventoryItem(sellerSession, { sku: 'CAMERA/1' });

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/inventory/v1/inventory_item',
        searchParameters: { limit: '200', offset: '1' },
      },
      { endpoint: '/sell/inventory/v1/inventory_item/CAMERA%2F1' },
    ]);
    expect(deleteCalls).toEqual([{ endpoint: '/sell/inventory/v1/inventory_item/CAMERA%2F1' }]);
  });

  it('puts a direct replacement with only the authored language header', async () => {
    const { sellerSession, putCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await createOrReplaceInventoryItem(sellerSession, inventoryItemReplacement);

    const {
      sku,
      'Content-Language': contentLanguage,
      ...inventoryItemDocument
    } = inventoryItemReplacement;
    expect(putCalls).toEqual([
      {
        endpoint: `/sell/inventory/v1/inventory_item/${sku}`,
        requestDocument: inventoryItemDocument,
        requestHeaders: { 'Content-Language': contentLanguage },
      },
    ]);
  });

  it('posts each direct bulk document to its exact endpoint', async () => {
    const { sellerSession, postCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await bulkCreateOrReplaceInventoryItem(sellerSession, {
      'Content-Language': 'en-US',
      requests: [{ sku: 'CAMERA-1', condition: 'NEW' }],
    });
    await bulkGetInventoryItem(sellerSession, { requests: [{ sku: 'CAMERA-1' }] });
    await bulkUpdatePriceQuantity(sellerSession, {
      requests: [{ shipToLocationAvailability: { quantity: 8 }, sku: 'CAMERA-1' }],
    });
    await bulkMigrateListing(sellerSession, { requests: [{ listingId: '123456789012' }] });

    expect(postCalls).toEqual([
      {
        endpoint: '/sell/inventory/v1/bulk_create_or_replace_inventory_item',
        requestDocument: { requests: [{ sku: 'CAMERA-1', condition: 'NEW' }] },
        requestHeaders: { 'Content-Language': 'en-US' },
      },
      {
        endpoint: '/sell/inventory/v1/bulk_get_inventory_item',
        requestDocument: { requests: [{ sku: 'CAMERA-1' }] },
      },
      {
        endpoint: '/sell/inventory/v1/bulk_update_price_quantity',
        requestDocument: {
          requests: [{ shipToLocationAvailability: { quantity: 8 }, sku: 'CAMERA-1' }],
        },
      },
      {
        endpoint: '/sell/inventory/v1/bulk_migrate_listing',
        requestDocument: { requests: [{ listingId: '123456789012' }] },
      },
    ]);
  });
});
