import { describe, expect, it } from 'vitest';

import {
  bulkCreateOffer,
  bulkCreateOfferArgumentsSchema,
  bulkPublishOffer,
  bulkPublishOfferArgumentsSchema,
  createOffer,
  createOfferArgumentsSchema,
  deleteOffer,
  getListingFees,
  getListingFeesArgumentsSchema,
  getOffer,
  getOffers,
  getOffersArgumentsSchema,
  offerIdArgumentsSchema,
  publishOffer,
  publishOfferByInventoryItemGroup,
  publishOfferByInventoryItemGroupArgumentsSchema,
  updateOffer,
  updateOfferArgumentsSchema,
  withdrawOffer,
  withdrawOfferByInventoryItemGroup,
  withdrawOfferByInventoryItemGroupArgumentsSchema,
} from '@/ebay/sell/inventory/offer.js';
import type { CreateOfferArguments } from '@/ebay/sell/inventory/offer.js';
import { sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

const offerCreation: CreateOfferArguments = {
  'Content-Language': 'en-US',
  sku: 'CAMERA-1',
  marketplaceId: 'EBAY_US',
  format: 'FIXED_PRICE',
  availableQuantity: 4,
  categoryId: '31388',
  listingDuration: 'GTC',
  listingPolicies: {
    fulfillmentPolicyId: 'FULFILL-1',
    paymentPolicyId: 'PAY-1',
    returnPolicyId: 'RETURN-1',
  },
  merchantLocationKey: 'WAREHOUSE-1',
  pricingSummary: {
    price: { currency: 'USD', value: '149.99' },
  },
};

describe('Sell Inventory offer schemas', () => {
  it('accepts exact string query filters and direct offer documents', () => {
    expect(
      getOffersArgumentsSchema.parse({
        format: 'FIXED_PRICE',
        limit: '25',
        marketplace_id: 'EBAY_US',
        offset: '0',
        sku: 'CAMERA-1',
      }),
    ).toEqual({
      format: 'FIXED_PRICE',
      limit: '25',
      marketplace_id: 'EBAY_US',
      offset: '0',
      sku: 'CAMERA-1',
    });
    expect(offerIdArgumentsSchema.parse({ offerId: 'OFFER-1' })).toEqual({ offerId: 'OFFER-1' });
    expect(createOfferArgumentsSchema.parse(offerCreation)).toEqual(offerCreation);
    expect(
      updateOfferArgumentsSchema.parse({
        offerId: 'OFFER-1',
        'Content-Language': 'en-US',
        availableQuantity: 8,
        pricingSummary: { price: { currency: 'USD', value: '129.99' } },
      }),
    ).toEqual({
      offerId: 'OFFER-1',
      'Content-Language': 'en-US',
      availableQuantity: 8,
      pricingSummary: { price: { currency: 'USD', value: '129.99' } },
    });
  });

  it.each([
    { limit: 25 },
    { limit: '0' },
    { marketplaceId: 'EBAY_US' },
    { format: 'AUCTION_ONLY' },
    { offerId: '' },
    {
      'Content-Language': 'en-US',
      body: {
        sku: 'CAMERA-1',
        marketplaceId: 'EBAY_US',
        format: 'FIXED_PRICE',
      },
    },
    {
      sku: 'CAMERA-1',
      marketplaceId: 'EBAY_US',
      format: 'FIXED_PRICE',
    },
    {
      'Content-Language': 'en-US',
      'Content-Type': 'application/json',
      sku: 'CAMERA-1',
      marketplaceId: 'EBAY_US',
      format: 'FIXED_PRICE',
    },
  ])('rejects aliases, wrappers, transport headers, and invalid fields', (invalidArguments) => {
    expect(() => createOfferArgumentsSchema.parse(invalidArguments)).toThrow();
  });

  it('accepts direct bulk and group documents with documented limits', () => {
    expect(
      bulkCreateOfferArgumentsSchema.parse({
        'Content-Language': 'en-US',
        requests: [
          {
            sku: 'CAMERA-1',
            marketplaceId: 'EBAY_US',
            format: 'FIXED_PRICE',
          },
        ],
      }),
    ).toEqual({
      'Content-Language': 'en-US',
      requests: [
        {
          sku: 'CAMERA-1',
          marketplaceId: 'EBAY_US',
          format: 'FIXED_PRICE',
        },
      ],
    });
    expect(bulkPublishOfferArgumentsSchema.parse({ requests: [{ offerId: 'OFFER-1' }] })).toEqual({
      requests: [{ offerId: 'OFFER-1' }],
    });
    expect(getListingFeesArgumentsSchema.parse({ offers: [{ offerId: 'OFFER-1' }] })).toEqual({
      offers: [{ offerId: 'OFFER-1' }],
    });
    expect(
      publishOfferByInventoryItemGroupArgumentsSchema.parse({
        inventoryItemGroupKey: 'GROUP-1',
        marketplaceId: 'EBAY_US',
      }),
    ).toEqual({
      inventoryItemGroupKey: 'GROUP-1',
      marketplaceId: 'EBAY_US',
    });
    expect(
      withdrawOfferByInventoryItemGroupArgumentsSchema.parse({
        inventoryItemGroupKey: 'GROUP-1',
        marketplaceId: 'EBAY_US',
      }),
    ).toEqual({
      inventoryItemGroupKey: 'GROUP-1',
      marketplaceId: 'EBAY_US',
    });
  });

  it.each([
    { 'Content-Language': 'en-US', requests: [] },
    {
      'Content-Language': 'en-US',
      requests: Array.from({ length: 26 }, (_, index) => ({
        sku: `SKU-${index}`,
        marketplaceId: 'EBAY_US',
        format: 'FIXED_PRICE' as const,
      })),
    },
    {
      'Content-Language': 'en-US',
      requests: [
        { sku: 'CAMERA-1', marketplaceId: 'EBAY_US', format: 'FIXED_PRICE' as const },
        { sku: 'CAMERA-1', marketplaceId: 'EBAY_US', format: 'FIXED_PRICE' as const },
      ],
    },
    {
      'Content-Language': 'en-US',
      body: {
        requests: [{ sku: 'CAMERA-1', marketplaceId: 'EBAY_US', format: 'FIXED_PRICE' }],
      },
    },
  ])('rejects empty, oversized, duplicate, and wrapped bulk creates', (invalidArguments) => {
    expect(() => bulkCreateOfferArgumentsSchema.parse(invalidArguments)).toThrow();
  });

  it.each([
    { requests: [] },
    { requests: [{ offerId: 'DUPLICATE' }, { offerId: 'DUPLICATE' }] },
    { offers: [{ offerId: 'OFFER-1' }] },
    {
      requests: Array.from({ length: 26 }, (_, index) => ({ offerId: `OFFER-${index}` })),
    },
  ])('rejects invalid bulk publish selections', (invalidArguments) => {
    expect(() => bulkPublishOfferArgumentsSchema.parse(invalidArguments)).toThrow();
  });

  it.each([
    { offers: [] },
    { offers: [{ offerId: 'DUPLICATE' }, { offerId: 'DUPLICATE' }] },
    { requests: [{ offerId: 'OFFER-1' }] },
    {
      offers: Array.from({ length: 251 }, (_, index) => ({ offerId: `OFFER-${index}` })),
    },
  ])('rejects invalid listing-fee selections', (invalidArguments) => {
    expect(() => getListingFeesArgumentsSchema.parse(invalidArguments)).toThrow();
  });
});

describe('Sell Inventory offer operations', () => {
  it('uses exact query wire keys and encoded offer paths', async () => {
    const { sellerSession, getCalls, deleteCalls, postCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await getOffers(sellerSession, {
      format: 'FIXED_PRICE',
      limit: '25',
      marketplace_id: 'EBAY_US',
      offset: '0',
      sku: 'CAMERA-1',
    });
    await getOffer(sellerSession, { offerId: 'OFFER/1' });
    await deleteOffer(sellerSession, { offerId: 'OFFER/1' });
    await publishOffer(sellerSession, { offerId: 'OFFER/1' });
    await withdrawOffer(sellerSession, { offerId: 'OFFER/1' });

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/inventory/v1/offer',
        searchParameters: {
          format: 'FIXED_PRICE',
          limit: '25',
          marketplace_id: 'EBAY_US',
          offset: '0',
          sku: 'CAMERA-1',
        },
      },
      { endpoint: '/sell/inventory/v1/offer/OFFER%2F1' },
    ]);
    expect(deleteCalls).toEqual([{ endpoint: '/sell/inventory/v1/offer/OFFER%2F1' }]);
    expect(postCalls).toEqual([
      { endpoint: '/sell/inventory/v1/offer/OFFER%2F1/publish' },
      { endpoint: '/sell/inventory/v1/offer/OFFER%2F1/withdraw' },
    ]);
  });

  it('posts and puts direct offer documents with Content-Language', async () => {
    const { sellerSession, postCalls, putCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: { offerId: 'OFFER-1' },
    });

    await createOffer(sellerSession, offerCreation);
    await updateOffer(sellerSession, {
      offerId: 'OFFER/1',
      'Content-Language': 'en-US',
      availableQuantity: 8,
    });
    await bulkCreateOffer(sellerSession, {
      'Content-Language': 'en-US',
      requests: [
        {
          sku: 'CAMERA-1',
          marketplaceId: 'EBAY_US',
          format: 'FIXED_PRICE',
        },
      ],
    });
    await bulkPublishOffer(sellerSession, { requests: [{ offerId: 'OFFER-1' }] });
    await getListingFees(sellerSession, { offers: [{ offerId: 'OFFER-1' }] });
    await publishOfferByInventoryItemGroup(sellerSession, {
      inventoryItemGroupKey: 'GROUP-1',
      marketplaceId: 'EBAY_US',
    });
    await withdrawOfferByInventoryItemGroup(sellerSession, {
      inventoryItemGroupKey: 'GROUP-1',
      marketplaceId: 'EBAY_US',
    });

    expect(postCalls).toEqual([
      {
        endpoint: '/sell/inventory/v1/offer',
        requestDocument: {
          sku: 'CAMERA-1',
          marketplaceId: 'EBAY_US',
          format: 'FIXED_PRICE',
          availableQuantity: 4,
          categoryId: '31388',
          listingDuration: 'GTC',
          listingPolicies: {
            fulfillmentPolicyId: 'FULFILL-1',
            paymentPolicyId: 'PAY-1',
            returnPolicyId: 'RETURN-1',
          },
          merchantLocationKey: 'WAREHOUSE-1',
          pricingSummary: {
            price: { currency: 'USD', value: '149.99' },
          },
        },
        requestHeaders: { 'Content-Language': 'en-US' },
      },
      {
        endpoint: '/sell/inventory/v1/bulk_create_offer',
        requestDocument: {
          requests: [
            {
              sku: 'CAMERA-1',
              marketplaceId: 'EBAY_US',
              format: 'FIXED_PRICE',
            },
          ],
        },
        requestHeaders: { 'Content-Language': 'en-US' },
      },
      {
        endpoint: '/sell/inventory/v1/bulk_publish_offer',
        requestDocument: { requests: [{ offerId: 'OFFER-1' }] },
      },
      {
        endpoint: '/sell/inventory/v1/offer/get_listing_fees',
        requestDocument: { offers: [{ offerId: 'OFFER-1' }] },
      },
      {
        endpoint: '/sell/inventory/v1/offer/publish_by_inventory_item_group',
        requestDocument: {
          inventoryItemGroupKey: 'GROUP-1',
          marketplaceId: 'EBAY_US',
        },
      },
      {
        endpoint: '/sell/inventory/v1/offer/withdraw_by_inventory_item_group',
        requestDocument: {
          inventoryItemGroupKey: 'GROUP-1',
          marketplaceId: 'EBAY_US',
        },
      },
    ]);
    expect(putCalls).toEqual([
      {
        endpoint: '/sell/inventory/v1/offer/OFFER%2F1',
        requestDocument: { availableQuantity: 8 },
        requestHeaders: { 'Content-Language': 'en-US' },
      },
    ]);
  });
});
