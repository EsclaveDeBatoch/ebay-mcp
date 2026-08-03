import { describe, expect, it } from 'vitest';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import { itemsAwaitingFeedbackDocument } from '@tests/fixtures/awaitingFeedback.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

import {
  type ItemsAwaitingFeedback,
  getItemsAwaitingFeedback,
  getItemsAwaitingFeedbackArgumentsSchema,
} from './awaitingFeedback.js';

const awaitingFeedbackArguments = {
  filter: 'listingId:110000000000,userRole:SELLER',
  limit: '25',
  offset: '0',
  sort: 'END_TIME_DESC' as const,
};

describe('Commerce Feedback awaiting-feedback arguments', () => {
  it('accepts exact eBay string pagination and sort fields', () => {
    expect(getItemsAwaitingFeedbackArgumentsSchema.parse(awaitingFeedbackArguments)).toEqual(
      awaitingFeedbackArguments,
    );
  });

  it.each([
    { limit: '24' },
    { limit: '201' },
    { limit: 25 },
    { offset: '-1' },
    { sort: 'RELEVANCE' },
    { userRole: 'SELLER' },
  ])('rejects invalid values or renamed filter fields', (invalidArguments) => {
    expect(getItemsAwaitingFeedbackArgumentsSchema.safeParse(invalidArguments).success).toBe(false);
  });
});

describe('Commerce Feedback awaiting-feedback operation', () => {
  it('uses the exact official endpoint and unchanged wire query', async () => {
    const successfulLookup: EbayRequestCompletion<ItemsAwaitingFeedback> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: itemsAwaitingFeedbackDocument,
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulLookup);

    const lookupCompletion = await getItemsAwaitingFeedback(
      sellerSession,
      awaitingFeedbackArguments,
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/commerce/feedback/v1/awaiting_feedback',
        searchParameters: awaitingFeedbackArguments,
      },
    ]);
    expect(lookupCompletion).toBe(successfulLookup);
  });

  it.each(ebayFailures)('passes a $kind failure through unchanged', async (ebayFailure) => {
    const failedLookup: EbayRequestCompletion<ItemsAwaitingFeedback> = {
      kind: 'ebayRequestFailed',
      ebayFailure,
    };
    const { sellerSession } = sellerSessionReturning(failedLookup);

    await expect(getItemsAwaitingFeedback(sellerSession, awaitingFeedbackArguments)).resolves.toBe(
      failedLookup,
    );
  });
});
