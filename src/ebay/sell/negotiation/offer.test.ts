import { describe, expect, it } from 'vitest';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import {
  eligibleListingsDocument,
  sellerOfferArguments,
  sentSellerOffersDocument,
} from '@tests/fixtures/negotiation.js';

import {
  type EligibleListings,
  findEligibleItems,
  findEligibleItemsArgumentsSchema,
  type SentSellerOffers,
  sendOfferToInterestedBuyers,
  sendOfferToInterestedBuyersArgumentsSchema,
} from './offer.js';

const eligibleListingsArguments = {
  limit: '10',
  offset: '0',
  'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
};

describe('Sell Negotiation find-eligible-items arguments', () => {
  it('accepts the exact eBay header and string query fields', () => {
    expect(findEligibleItemsArgumentsSchema.parse(eligibleListingsArguments)).toEqual(
      eligibleListingsArguments,
    );
  });

  it.each([
    { limit: '0', 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US' },
    { limit: '201', 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US' },
    { limit: 10, 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US' },
    { offset: '-1', 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US' },
    { marketplaceId: 'EBAY_US' },
    { limit: '10' },
  ])('rejects invalid, renamed, unknown, or incomplete arguments', (invalidArguments) => {
    expect(findEligibleItemsArgumentsSchema.safeParse(invalidArguments).success).toBe(false);
  });
});

describe('Sell Negotiation seller-offer arguments', () => {
  it('accepts one complete offer using an eBay percentage discount', () => {
    expect(sendOfferToInterestedBuyersArgumentsSchema.parse(sellerOfferArguments)).toEqual(
      sellerOfferArguments,
    );
  });

  it('accepts one complete offer using an exact eBay price', () => {
    const pricedOffer = {
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_GB',
      offeredItems: [
        {
          listingId: '220000000000',
          price: { currency: 'GBP', value: '25.50' },
        },
      ],
    };

    expect(sendOfferToInterestedBuyersArgumentsSchema.parse(pricedOffer)).toEqual(pricedOffer);
  });

  it.each([
    {
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
      offeredItems: [{ listingId: '110000000000' }],
    },
    {
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
      offeredItems: [
        {
          discountPercentage: '10',
          listingId: '110000000000',
          price: { currency: 'USD', value: '90.00' },
        },
      ],
    },
    {
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
      offeredItems: [
        { discountPercentage: '10', listingId: '110000000000' },
        { discountPercentage: '15', listingId: '220000000000' },
      ],
    },
    {
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
      offerDuration: { unit: 'HOUR', value: 48 },
      offeredItems: [{ discountPercentage: '10', listingId: '110000000000' }],
    },
    {
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
      allowCounterOffer: true,
      offeredItems: [{ discountPercentage: '10', listingId: '110000000000' }],
    },
    {
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
      offeredItems: [{ discountPercentage: '4.99', listingId: '110000000000' }],
    },
    {
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
      offeredItems: [{ discountPercentage: '10', listingId: '110000000000' }],
      marketplaceId: 'EBAY_US',
    },
  ])('rejects an offer that violates the current eBay business contract', (invalidArguments) => {
    expect(sendOfferToInterestedBuyersArgumentsSchema.safeParse(invalidArguments).success).toBe(
      false,
    );
  });
});

describe('Sell Negotiation operations', () => {
  it('finds eligible listings with the exact endpoint, query, and required header', async () => {
    const successfulLookup: EbayRequestCompletion<EligibleListings> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: eligibleListingsDocument,
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulLookup);

    const lookupCompletion = await findEligibleItems(sellerSession, eligibleListingsArguments);

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/negotiation/v1/find_eligible_items',
        requestHeaders: { 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US' },
        searchParameters: { limit: '10', offset: '0' },
      },
    ]);
    expect(lookupCompletion).toBe(successfulLookup);
  });

  it('sends the exact generated offer document and marketplace header', async () => {
    const successfulOffer: EbayRequestCompletion<SentSellerOffers> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: sentSellerOffersDocument,
    };
    const { sellerSession, postCalls } = sellerSessionReturning(successfulOffer);

    const offerCompletion = await sendOfferToInterestedBuyers(sellerSession, sellerOfferArguments);

    expect(postCalls).toEqual([
      {
        endpoint: '/sell/negotiation/v1/send_offer_to_interested_buyers',
        requestDocument: {
          allowCounterOffer: false,
          message: 'A private offer for this camera',
          offerDuration: { unit: 'DAY', value: 2 },
          offeredItems: [
            {
              discountPercentage: '10',
              listingId: '110000000000',
              quantity: 1,
            },
          ],
        },
        requestHeaders: { 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US' },
      },
    ]);
    expect(offerCompletion).toBe(successfulOffer);
  });

  it.each(ebayFailures)('passes a $kind lookup failure through unchanged', async (ebayFailure) => {
    const failedLookup: EbayRequestCompletion<EligibleListings> = {
      kind: 'ebayRequestFailed',
      ebayFailure,
    };
    const { sellerSession } = sellerSessionReturning(failedLookup);

    await expect(findEligibleItems(sellerSession, eligibleListingsArguments)).resolves.toBe(
      failedLookup,
    );
  });

  it.each(ebayFailures)('passes a $kind offer failure through unchanged', async (ebayFailure) => {
    const failedOffer: EbayRequestCompletion<SentSellerOffers> = {
      kind: 'ebayRequestFailed',
      ebayFailure,
    };
    const { sellerSession } = sellerSessionReturning(failedOffer);

    await expect(sendOfferToInterestedBuyers(sellerSession, sellerOfferArguments)).resolves.toBe(
      failedOffer,
    );
  });
});
