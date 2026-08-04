import { describe, expect, it } from 'vitest';

import { sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import {
  createListing,
  createListingArgumentsSchema,
  endListing,
  endListingArgumentsSchema,
  getActiveListings,
  getActiveListingsArgumentsSchema,
  getListing,
  getListingArgumentsSchema,
  relistListing,
  reviseListing,
} from './fixedPriceListing.js';

describe('Trading listing argument contracts', () => {
  it('applies Trading wire defaults during the single Zod decode', () => {
    expect(getActiveListingsArgumentsSchema.parse({})).toEqual({
      ActiveList: {
        Pagination: { EntriesPerPage: 50, PageNumber: 1 },
        Sort: 'TimeLeft',
      },
    });
    expect(getListingArgumentsSchema.parse({ ItemID: '12345' })).toEqual({
      DetailLevel: 'ReturnAll',
      ItemID: '12345',
    });
    expect(endListingArgumentsSchema.parse({ ItemID: '12345' })).toEqual({
      EndingReason: 'NotAvailable',
      ItemID: '12345',
    });
  });

  it('accepts either supported EndFixedPriceItem identifier', () => {
    expect(endListingArgumentsSchema.safeParse({ SKU: 'SKU-123' }).success).toBe(true);
    expect(endListingArgumentsSchema.safeParse({ ItemID: '12345' }).success).toBe(true);
    expect(endListingArgumentsSchema.safeParse({}).success).toBe(false);
  });

  it('requires exact outer Trading documents', () => {
    expect(
      createListingArgumentsSchema.safeParse({ Item: { Title: 'Fixed price listing' } }).success,
    ).toBe(true);
    expect(
      createListingArgumentsSchema.safeParse({ item: { Title: 'Legacy wrapper' } }).success,
    ).toBe(false);
  });
});

describe('Trading listing operations', () => {
  it('passes every decoded document unchanged to its named Trading call', async () => {
    const { sellerSession, tradingCalls } = sellerSessionReturning<Record<string, unknown>>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: { Ack: 'Success' },
    });
    const activeListingsSearch = getActiveListingsArgumentsSchema.parse({});
    const listingLookup = getListingArgumentsSchema.parse({ ItemID: '12345' });
    const listingSubmission = { Item: { Title: 'Fixed price listing' } };
    const listingRevision = { Item: { ItemID: '12345', Quantity: 4 } };
    const listingClosure = endListingArgumentsSchema.parse({ SKU: 'SKU-123' });
    const listingRelisting = { Item: { ItemID: '12345', Quantity: 6 } };

    await getActiveListings(sellerSession, activeListingsSearch);
    await getListing(sellerSession, listingLookup);
    await createListing(sellerSession, listingSubmission);
    await reviseListing(sellerSession, listingRevision);
    await endListing(sellerSession, listingClosure);
    await relistListing(sellerSession, listingRelisting);

    expect(tradingCalls).toEqual([
      { callName: 'GetMyeBaySelling', requestDocument: activeListingsSearch },
      { callName: 'GetItem', requestDocument: listingLookup },
      { callName: 'AddFixedPriceItem', requestDocument: listingSubmission },
      { callName: 'ReviseFixedPriceItem', requestDocument: listingRevision },
      { callName: 'EndFixedPriceItem', requestDocument: listingClosure },
      { callName: 'RelistFixedPriceItem', requestDocument: listingRelisting },
    ]);
  });
});
