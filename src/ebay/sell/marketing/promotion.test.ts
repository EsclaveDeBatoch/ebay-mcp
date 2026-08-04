import { describe, expect, it } from 'vitest';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

import {
  getListingSet,
  getListingSetArgumentsSchema,
  getPromotions,
  getPromotionsArgumentsSchema,
  type ListingSet,
  pausePromotion,
  type PromotionsPage,
  promotionIdArgumentsSchema,
  resumePromotion,
} from './promotion.js';

const listingSetArguments = {
  limit: '25',
  offset: '0',
  promotion_id: 'PROMO-1',
  q: 'camera',
  sort: 'TITLE',
  status: 'ACTIVE',
};

const promotionsPageArguments = {
  limit: '25',
  marketplace_id: 'EBAY_US',
  offset: '0',
  promotion_status: 'RUNNING',
  promotion_type: 'MARKDOWN_SALE',
  q: 'weekend',
  sort: 'END_DATE',
};

describe('Sell Marketing promotion schemas', () => {
  it('accepts exact string query filters and the promotion_id path', () => {
    expect(getListingSetArgumentsSchema.parse(listingSetArguments)).toEqual(listingSetArguments);
    expect(getPromotionsArgumentsSchema.parse(promotionsPageArguments)).toEqual(
      promotionsPageArguments,
    );
    expect(promotionIdArgumentsSchema.parse({ promotion_id: 'PROMO-1@EBAY_US' })).toEqual({
      promotion_id: 'PROMO-1@EBAY_US',
    });
  });

  it.each([
    { limit: 25, marketplace_id: 'EBAY_US' },
    { limit: '0', marketplace_id: 'EBAY_US' },
    { marketplaceId: 'EBAY_US' },
    { marketplace_id: 'EBAY_US', promotionStatus: 'RUNNING' },
    { promotionId: 'PROMO-1' },
    { promotion_id: '' },
  ])('rejects renamed, numeric, or incomplete fields', (invalidArguments) => {
    expect(getListingSetArgumentsSchema.safeParse(invalidArguments).success).toBe(false);
    expect(getPromotionsArgumentsSchema.safeParse(invalidArguments).success).toBe(false);
    expect(promotionIdArgumentsSchema.safeParse(invalidArguments).success).toBe(false);
  });
});

describe('Sell Marketing promotion operations', () => {
  it('gets the listing set with encoded path and exact string query fields', async () => {
    const successfulLookup: EbayRequestCompletion<ListingSet> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: { listings: [], total: 0 },
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulLookup);

    const listingSetCompletion = await getListingSet(sellerSession, {
      ...listingSetArguments,
      promotion_id: 'PROMO/1',
    });

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/promotion/PROMO%2F1/get_listing_set',
        searchParameters: {
          limit: '25',
          offset: '0',
          q: 'camera',
          sort: 'TITLE',
          status: 'ACTIVE',
        },
      },
    ]);
    expect(listingSetCompletion).toBe(successfulLookup);
  });

  it('gets promotions with exact underscore query keys', async () => {
    const successfulLookup: EbayRequestCompletion<PromotionsPage> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: { promotions: [], total: 0 },
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulLookup);

    const promotionsCompletion = await getPromotions(sellerSession, promotionsPageArguments);

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/promotion',
        searchParameters: promotionsPageArguments,
      },
    ]);
    expect(promotionsCompletion).toBe(successfulLookup);
  });

  it('pauses and resumes with the encoded promotion_id path', async () => {
    const successfulAction: EbayRequestCompletion<undefined> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    };
    const { sellerSession, postCalls } = sellerSessionReturning(successfulAction);

    await pausePromotion(sellerSession, { promotion_id: 'PROMO/1@EBAY_US' });
    await resumePromotion(sellerSession, { promotion_id: 'PROMO/1@EBAY_US' });

    expect(postCalls).toEqual([
      { endpoint: '/sell/marketing/v1/promotion/PROMO%2F1%40EBAY_US/pause' },
      { endpoint: '/sell/marketing/v1/promotion/PROMO%2F1%40EBAY_US/resume' },
    ]);
  });

  it.each(ebayFailures)('passes a $kind failure through unchanged', async (ebayFailure) => {
    const failedLookup: EbayRequestCompletion<PromotionsPage> = {
      kind: 'ebayRequestFailed',
      ebayFailure,
    };
    const { sellerSession } = sellerSessionReturning(failedLookup);

    await expect(getPromotions(sellerSession, { marketplace_id: 'EBAY_US' })).resolves.toBe(
      failedLookup,
    );
  });
});
