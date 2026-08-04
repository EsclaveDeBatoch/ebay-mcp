import { describe, expect, it } from 'vitest';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import {
  findAllActiveListingRecommendationsArguments,
  findListingRecommendationsArguments,
  listingRecommendationsDocument,
} from '@tests/fixtures/listingRecommendation.js';

import {
  findListingRecommendations,
  findListingRecommendationsArgumentsSchema,
  type ListingRecommendations,
} from './listingRecommendation.js';

describe('Sell Recommendation listing recommendation arguments', () => {
  it('accepts the exact eBay query, header, and document fields', () => {
    expect(
      findListingRecommendationsArgumentsSchema.parse(findListingRecommendationsArguments),
    ).toEqual(findListingRecommendationsArguments);
  });

  it.each([
    { ...findListingRecommendationsArguments, filter: 'recommendationTypes:{SEO}' },
    { ...findListingRecommendationsArguments, limit: '0' },
    { ...findListingRecommendationsArguments, limit: '501' },
    { ...findListingRecommendationsArguments, limit: 25 },
    { ...findListingRecommendationsArguments, offset: '-1' },
    { ...findListingRecommendationsArguments, offset: 0 },
    { ...findListingRecommendationsArguments, 'X-EBAY-C-MARKETPLACE-ID': '' },
    { ...findListingRecommendationsArguments, listingIds: [] },
    {
      ...findListingRecommendationsArguments,
      listingIds: Array.from({ length: 501 }, (_, listingIndex) => String(listingIndex)),
    },
    { ...findListingRecommendationsArguments, marketplaceId: 'EBAY_US' },
  ])('rejects an invalid or unknown eBay field', (invalidRecommendationArguments) => {
    expect(
      findListingRecommendationsArgumentsSchema.safeParse(invalidRecommendationArguments).success,
    ).toBe(false);
  });
});

describe('Sell Recommendation listing recommendation operation', () => {
  it('calls the exact eBay endpoint, query, header, and request document', async () => {
    const successfulRequest: EbayRequestCompletion<ListingRecommendations> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: listingRecommendationsDocument,
    };
    const { sellerSession, postCalls } = sellerSessionReturning(successfulRequest);

    const requestCompletion = await findListingRecommendations(
      sellerSession,
      findListingRecommendationsArguments,
    );

    expect(postCalls).toEqual([
      {
        endpoint: '/sell/recommendation/v1/find',
        searchParameters: {
          filter: 'recommendationTypes:{AD}',
          limit: '25',
          offset: '0',
        },
        requestHeaders: { 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US' },
        requestDocument: { listingIds: ['110000000000'] },
      },
    ]);
    expect(requestCompletion).toBe(successfulRequest);
  });

  it('requests recommendations for all active listings with an empty document', async () => {
    const successfulRequest: EbayRequestCompletion<ListingRecommendations> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: listingRecommendationsDocument,
    };
    const { sellerSession, postCalls } = sellerSessionReturning(successfulRequest);

    await findListingRecommendations(sellerSession, findAllActiveListingRecommendationsArguments);

    expect(postCalls).toEqual([
      {
        endpoint: '/sell/recommendation/v1/find',
        searchParameters: { filter: undefined, limit: undefined, offset: undefined },
        requestHeaders: { 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US' },
        requestDocument: {},
      },
    ]);
  });

  it.each(ebayFailures)('passes the $kind completion through unchanged', async (ebayFailure) => {
    const failedRequest: EbayRequestCompletion<ListingRecommendations> = {
      kind: 'ebayRequestFailed',
      ebayFailure,
    };
    const { sellerSession } = sellerSessionReturning(failedRequest);

    await expect(
      findListingRecommendations(sellerSession, findListingRecommendationsArguments),
    ).resolves.toBe(failedRequest);
  });
});
