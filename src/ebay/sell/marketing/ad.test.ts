import { describe, expect, it } from 'vitest';

import {
  adPathArgumentsSchema,
  bulkCreateAdsByInventoryReference,
  bulkCreateAdsByInventoryReferenceArgumentsSchema,
  bulkCreateAdsByListingId,
  bulkCreateAdsByListingIdArgumentsSchema,
  bulkDeleteAdsByInventoryReference,
  bulkDeleteAdsByInventoryReferenceArgumentsSchema,
  bulkDeleteAdsByListingId,
  bulkDeleteAdsByListingIdArgumentsSchema,
  bulkUpdateAdsBidByInventoryReference,
  bulkUpdateAdsBidByInventoryReferenceArgumentsSchema,
  bulkUpdateAdsBidByListingId,
  bulkUpdateAdsBidByListingIdArgumentsSchema,
  bulkUpdateAdsStatus,
  bulkUpdateAdsStatusArgumentsSchema,
  bulkUpdateAdsStatusByListingId,
  bulkUpdateAdsStatusByListingIdArgumentsSchema,
  createAdByListingId,
  createAdByListingIdArgumentsSchema,
  createAdsByInventoryReference,
  createAdsByInventoryReferenceArgumentsSchema,
  deleteAd,
  deleteAdsByInventoryReference,
  deleteAdsByInventoryReferenceArgumentsSchema,
  getAd,
  getAds,
  getAdsArgumentsSchema,
  getAdsByInventoryReference,
  getAdsByInventoryReferenceArgumentsSchema,
  updateBid,
  updateBidArgumentsSchema,
} from '@/ebay/sell/marketing/ad.js';
import { sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

describe('Sell Marketing ad schemas', () => {
  it('accepts exact path, query wire keys, and direct documents', () => {
    expect(
      getAdsArgumentsSchema.parse({
        campaign_id: 'C1',
        ad_group_ids: 'G1,G2',
        ad_status: 'ACTIVE',
        limit: '25',
        listing_ids: '1,2',
        offset: '0',
      }),
    ).toEqual({
      campaign_id: 'C1',
      ad_group_ids: 'G1,G2',
      ad_status: 'ACTIVE',
      limit: '25',
      listing_ids: '1,2',
      offset: '0',
    });
    expect(adPathArgumentsSchema.parse({ campaign_id: 'C1', ad_id: 'A1' })).toEqual({
      campaign_id: 'C1',
      ad_id: 'A1',
    });
    expect(
      createAdByListingIdArgumentsSchema.parse({
        campaign_id: 'C1',
        listingId: '1',
        bidPercentage: '5.0',
      }),
    ).toEqual({
      campaign_id: 'C1',
      listingId: '1',
      bidPercentage: '5.0',
    });
    expect(
      createAdsByInventoryReferenceArgumentsSchema.parse({
        campaign_id: 'C1',
        inventoryReferenceId: 'SKU-1',
        inventoryReferenceType: 'INVENTORY_ITEM',
        bidPercentage: '5.0',
      }),
    ).toEqual({
      campaign_id: 'C1',
      inventoryReferenceId: 'SKU-1',
      inventoryReferenceType: 'INVENTORY_ITEM',
      bidPercentage: '5.0',
    });
    expect(
      getAdsByInventoryReferenceArgumentsSchema.parse({
        campaign_id: 'C1',
        inventory_reference_id: 'SKU-1',
        inventory_reference_type: 'INVENTORY_ITEM',
      }),
    ).toEqual({
      campaign_id: 'C1',
      inventory_reference_id: 'SKU-1',
      inventory_reference_type: 'INVENTORY_ITEM',
    });
    expect(
      updateBidArgumentsSchema.parse({
        campaign_id: 'C1',
        ad_id: 'A1',
        bidPercentage: '7.5',
      }),
    ).toEqual({
      campaign_id: 'C1',
      ad_id: 'A1',
      bidPercentage: '7.5',
    });
    expect(
      bulkCreateAdsByListingIdArgumentsSchema.parse({
        campaign_id: 'C1',
        requests: [{ listingId: '1', bidPercentage: '5.0' }],
      }),
    ).toEqual({
      campaign_id: 'C1',
      requests: [{ listingId: '1', bidPercentage: '5.0' }],
    });
    expect(
      bulkCreateAdsByInventoryReferenceArgumentsSchema.parse({
        campaign_id: 'C1',
        requests: [
          {
            inventoryReferenceId: 'SKU-1',
            inventoryReferenceType: 'INVENTORY_ITEM',
            bidPercentage: '5.0',
          },
        ],
      }),
    ).toEqual({
      campaign_id: 'C1',
      requests: [
        {
          inventoryReferenceId: 'SKU-1',
          inventoryReferenceType: 'INVENTORY_ITEM',
          bidPercentage: '5.0',
        },
      ],
    });
    expect(
      bulkDeleteAdsByListingIdArgumentsSchema.parse({
        campaign_id: 'C1',
        requests: [{ listingId: '1' }],
      }),
    ).toEqual({
      campaign_id: 'C1',
      requests: [{ listingId: '1' }],
    });
    expect(
      bulkDeleteAdsByInventoryReferenceArgumentsSchema.parse({
        campaign_id: 'C1',
        requests: [
          {
            inventoryReferenceId: 'SKU-1',
            inventoryReferenceType: 'INVENTORY_ITEM',
          },
        ],
      }),
    ).toEqual({
      campaign_id: 'C1',
      requests: [
        {
          inventoryReferenceId: 'SKU-1',
          inventoryReferenceType: 'INVENTORY_ITEM',
        },
      ],
    });
    expect(
      bulkUpdateAdsBidByListingIdArgumentsSchema.parse({
        campaign_id: 'C1',
        requests: [{ listingId: '1', bidPercentage: '6.0' }],
      }),
    ).toEqual({
      campaign_id: 'C1',
      requests: [{ listingId: '1', bidPercentage: '6.0' }],
    });
    expect(
      bulkUpdateAdsBidByInventoryReferenceArgumentsSchema.parse({
        campaign_id: 'C1',
        requests: [
          {
            inventoryReferenceId: 'SKU-1',
            inventoryReferenceType: 'INVENTORY_ITEM',
            bidPercentage: '6.0',
          },
        ],
      }),
    ).toEqual({
      campaign_id: 'C1',
      requests: [
        {
          inventoryReferenceId: 'SKU-1',
          inventoryReferenceType: 'INVENTORY_ITEM',
          bidPercentage: '6.0',
        },
      ],
    });
    expect(
      bulkUpdateAdsStatusArgumentsSchema.parse({
        campaign_id: 'C1',
        requests: [{ adId: 'A1', adStatus: 'PAUSED' }],
      }),
    ).toEqual({
      campaign_id: 'C1',
      requests: [{ adId: 'A1', adStatus: 'PAUSED' }],
    });
    expect(
      bulkUpdateAdsStatusByListingIdArgumentsSchema.parse({
        campaign_id: 'C1',
        requests: [{ listingId: '1', adStatus: 'ACTIVE' }],
      }),
    ).toEqual({
      campaign_id: 'C1',
      requests: [{ listingId: '1', adStatus: 'ACTIVE' }],
    });
    expect(
      deleteAdsByInventoryReferenceArgumentsSchema.parse({
        campaign_id: 'C1',
        inventoryReferenceId: 'SKU-1',
        inventoryReferenceType: 'INVENTORY_ITEM',
      }),
    ).toEqual({
      campaign_id: 'C1',
      inventoryReferenceId: 'SKU-1',
      inventoryReferenceType: 'INVENTORY_ITEM',
    });
  });

  it.each([
    { campaignId: 'C1' },
    { campaign_id: 'C1', limit: 25 },
    { campaign_id: 'C1', limit: '0' },
    { campaign_id: 'C1', adGroupIds: 'G1' },
    {
      campaign_id: 'C1',
      request: { listingId: '1', bidPercentage: '5.0' },
    },
    {
      campaign_id: 'C1',
      body: { listingId: '1', bidPercentage: '5.0' },
    },
    {
      campaign_id: 'C1',
      'Content-Type': 'application/json',
      listingId: '1',
    },
    { ad_id: 'A1' },
    { campaign_id: '', ad_id: 'A1' },
  ])('rejects aliases, wrappers, transport headers, and invalid fields', (invalidArguments) => {
    expect(() => createAdByListingIdArgumentsSchema.parse(invalidArguments)).toThrow();
    expect(() => getAdsArgumentsSchema.parse(invalidArguments)).toThrow();
    expect(() => adPathArgumentsSchema.parse(invalidArguments)).toThrow();
  });

  it.each([
    { campaign_id: 'C1', requests: [] },
    {
      campaign_id: 'C1',
      body: { requests: [{ listingId: '1' }] },
    },
    {
      campaign_id: 'C1',
      request: { requests: [{ listingId: '1' }] },
    },
  ])('rejects empty and wrapped bulk documents', (invalidArguments) => {
    expect(() => bulkCreateAdsByListingIdArgumentsSchema.parse(invalidArguments)).toThrow();
    expect(() => bulkDeleteAdsByListingIdArgumentsSchema.parse(invalidArguments)).toThrow();
    expect(() => bulkUpdateAdsStatusArgumentsSchema.parse(invalidArguments)).toThrow();
  });
});

describe('Sell Marketing ad operations', () => {
  it('uses exact query wire keys and encoded campaign and ad paths', async () => {
    const { sellerSession, getCalls, deleteCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await getAds(sellerSession, {
      campaign_id: 'C/1',
      ad_group_ids: 'G1,G2',
      ad_status: 'ACTIVE',
      limit: '25',
      listing_ids: '1,2',
      offset: '0',
    });
    await getAd(sellerSession, { campaign_id: 'C/1', ad_id: 'A/1' });
    await deleteAd(sellerSession, { campaign_id: 'C/1', ad_id: 'A/1' });
    await getAdsByInventoryReference(sellerSession, {
      campaign_id: 'C/1',
      inventory_reference_id: 'SKU/1',
      inventory_reference_type: 'INVENTORY_ITEM',
    });

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/ad_campaign/C%2F1/ad',
        searchParameters: {
          ad_group_ids: 'G1,G2',
          ad_status: 'ACTIVE',
          limit: '25',
          listing_ids: '1,2',
          offset: '0',
        },
      },
      { endpoint: '/sell/marketing/v1/ad_campaign/C%2F1/ad/A%2F1' },
      {
        endpoint: '/sell/marketing/v1/ad_campaign/C%2F1/get_ads_by_inventory_reference',
        searchParameters: {
          inventory_reference_id: 'SKU/1',
          inventory_reference_type: 'INVENTORY_ITEM',
        },
      },
    ]);
    expect(deleteCalls).toEqual([{ endpoint: '/sell/marketing/v1/ad_campaign/C%2F1/ad/A%2F1' }]);
  });

  it('posts and puts direct ad documents without path or transport wrappers', async () => {
    const { sellerSession, postCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await createAdByListingId(sellerSession, {
      campaign_id: 'C/1',
      listingId: '1',
      bidPercentage: '5.0',
      adGroupId: 'G1',
    });
    await createAdsByInventoryReference(sellerSession, {
      campaign_id: 'C/1',
      inventoryReferenceId: 'SKU-1',
      inventoryReferenceType: 'INVENTORY_ITEM',
      bidPercentage: '5.0',
    });
    await deleteAdsByInventoryReference(sellerSession, {
      campaign_id: 'C/1',
      inventoryReferenceId: 'SKU-1',
      inventoryReferenceType: 'INVENTORY_ITEM',
    });
    await updateBid(sellerSession, {
      campaign_id: 'C/1',
      ad_id: 'A/1',
      bidPercentage: '7.5',
    });
    await bulkCreateAdsByListingId(sellerSession, {
      campaign_id: 'C/1',
      requests: [{ listingId: '1', bidPercentage: '5.0' }],
    });
    await bulkCreateAdsByInventoryReference(sellerSession, {
      campaign_id: 'C/1',
      requests: [
        {
          inventoryReferenceId: 'SKU-1',
          inventoryReferenceType: 'INVENTORY_ITEM',
          bidPercentage: '5.0',
        },
      ],
    });
    await bulkDeleteAdsByListingId(sellerSession, {
      campaign_id: 'C/1',
      requests: [{ listingId: '1' }],
    });
    await bulkDeleteAdsByInventoryReference(sellerSession, {
      campaign_id: 'C/1',
      requests: [
        {
          inventoryReferenceId: 'SKU-1',
          inventoryReferenceType: 'INVENTORY_ITEM',
        },
      ],
    });
    await bulkUpdateAdsBidByListingId(sellerSession, {
      campaign_id: 'C/1',
      requests: [{ listingId: '1', bidPercentage: '6.0' }],
    });
    await bulkUpdateAdsBidByInventoryReference(sellerSession, {
      campaign_id: 'C/1',
      requests: [
        {
          inventoryReferenceId: 'SKU-1',
          inventoryReferenceType: 'INVENTORY_ITEM',
          bidPercentage: '6.0',
        },
      ],
    });
    await bulkUpdateAdsStatus(sellerSession, {
      campaign_id: 'C/1',
      requests: [{ adId: 'A1', adStatus: 'PAUSED' }],
    });
    await bulkUpdateAdsStatusByListingId(sellerSession, {
      campaign_id: 'C/1',
      requests: [{ listingId: '1', adStatus: 'ACTIVE' }],
    });

    expect(postCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/ad_campaign/C%2F1/ad',
        requestDocument: {
          listingId: '1',
          bidPercentage: '5.0',
          adGroupId: 'G1',
        },
      },
      {
        endpoint: '/sell/marketing/v1/ad_campaign/C%2F1/create_ads_by_inventory_reference',
        requestDocument: {
          inventoryReferenceId: 'SKU-1',
          inventoryReferenceType: 'INVENTORY_ITEM',
          bidPercentage: '5.0',
        },
      },
      {
        endpoint: '/sell/marketing/v1/ad_campaign/C%2F1/delete_ads_by_inventory_reference',
        requestDocument: {
          inventoryReferenceId: 'SKU-1',
          inventoryReferenceType: 'INVENTORY_ITEM',
        },
      },
      {
        endpoint: '/sell/marketing/v1/ad_campaign/C%2F1/ad/A%2F1/update_bid',
        requestDocument: { bidPercentage: '7.5' },
      },
      {
        endpoint: '/sell/marketing/v1/ad_campaign/C%2F1/bulk_create_ads_by_listing_id',
        requestDocument: {
          requests: [{ listingId: '1', bidPercentage: '5.0' }],
        },
      },
      {
        endpoint: '/sell/marketing/v1/ad_campaign/C%2F1/bulk_create_ads_by_inventory_reference',
        requestDocument: {
          requests: [
            {
              inventoryReferenceId: 'SKU-1',
              inventoryReferenceType: 'INVENTORY_ITEM',
              bidPercentage: '5.0',
            },
          ],
        },
      },
      {
        endpoint: '/sell/marketing/v1/ad_campaign/C%2F1/bulk_delete_ads_by_listing_id',
        requestDocument: {
          requests: [{ listingId: '1' }],
        },
      },
      {
        endpoint: '/sell/marketing/v1/ad_campaign/C%2F1/bulk_delete_ads_by_inventory_reference',
        requestDocument: {
          requests: [
            {
              inventoryReferenceId: 'SKU-1',
              inventoryReferenceType: 'INVENTORY_ITEM',
            },
          ],
        },
      },
      {
        endpoint: '/sell/marketing/v1/ad_campaign/C%2F1/bulk_update_ads_bid_by_listing_id',
        requestDocument: {
          requests: [{ listingId: '1', bidPercentage: '6.0' }],
        },
      },
      {
        endpoint: '/sell/marketing/v1/ad_campaign/C%2F1/bulk_update_ads_bid_by_inventory_reference',
        requestDocument: {
          requests: [
            {
              inventoryReferenceId: 'SKU-1',
              inventoryReferenceType: 'INVENTORY_ITEM',
              bidPercentage: '6.0',
            },
          ],
        },
      },
      {
        endpoint: '/sell/marketing/v1/ad_campaign/C%2F1/bulk_update_ads_status',
        requestDocument: {
          requests: [{ adId: 'A1', adStatus: 'PAUSED' }],
        },
      },
      {
        endpoint: '/sell/marketing/v1/ad_campaign/C%2F1/bulk_update_ads_status_by_listing_id',
        requestDocument: {
          requests: [{ listingId: '1', adStatus: 'ACTIVE' }],
        },
      },
    ]);
  });
});
