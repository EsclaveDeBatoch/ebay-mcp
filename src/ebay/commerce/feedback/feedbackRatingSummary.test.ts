import { describe, expect, it } from 'vitest';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { feedbackRatingSummaryDocument } from '@tests/fixtures/feedbackRatingSummary.js';

import {
  type FeedbackRatingSummary,
  getFeedbackRatingSummary,
  getFeedbackRatingSummaryArgumentsSchema,
} from './feedbackRatingSummary.js';

const feedbackRatingSummaryArguments = {
  filter: 'ratingType:OVERALL_EXPERIENCE,excludeRepeatFeedback:true,lookbackPeriodInDays:90',
  user_id: 'seller-123',
};

describe('Commerce Feedback rating-summary arguments', () => {
  it('accepts the exact eBay query fields and a documented rating type', () => {
    expect(getFeedbackRatingSummaryArgumentsSchema.parse(feedbackRatingSummaryArguments)).toEqual(
      feedbackRatingSummaryArguments,
    );
  });

  it.each([
    { filter: 'ratingType:ALL', user_id: 'seller-123' },
    { filter: 'lookbackPeriodInDays:90', user_id: 'seller-123' },
    { filter: 'ratingType:OVERALL_EXPERIENCE', user_id: '' },
    { filter: 'ratingType:OVERALL_EXPERIENCE', userId: 'seller-123' },
    { filter: 'ratingType:OVERALL_EXPERIENCE', user_id: 'seller-123', period: '90' },
  ])('rejects an invalid rating filter or renamed query field', (invalidArguments) => {
    expect(getFeedbackRatingSummaryArgumentsSchema.safeParse(invalidArguments).success).toBe(false);
  });
});

describe('Commerce Feedback rating-summary operation', () => {
  it('uses the exact official endpoint and unchanged wire query', async () => {
    const successfulLookup: EbayRequestCompletion<FeedbackRatingSummary> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: feedbackRatingSummaryDocument,
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulLookup);

    const lookupCompletion = await getFeedbackRatingSummary(
      sellerSession,
      feedbackRatingSummaryArguments,
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/commerce/feedback/v1/feedback_rating_summary',
        searchParameters: feedbackRatingSummaryArguments,
      },
    ]);
    expect(lookupCompletion).toBe(successfulLookup);
  });

  it.each(ebayFailures)('passes a $kind failure through unchanged', async (ebayFailure) => {
    const failedLookup: EbayRequestCompletion<FeedbackRatingSummary> = {
      kind: 'ebayRequestFailed',
      ebayFailure,
    };
    const { sellerSession } = sellerSessionReturning(failedLookup);

    await expect(
      getFeedbackRatingSummary(sellerSession, feedbackRatingSummaryArguments),
    ).resolves.toBe(failedLookup);
  });
});
