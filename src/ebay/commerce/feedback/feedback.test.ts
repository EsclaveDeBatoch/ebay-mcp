import { describe, expect, it } from 'vitest';

import {
  getFeedback,
  getFeedbackArgumentsSchema,
  leaveFeedback,
  leaveFeedbackArgumentsSchema,
  type FeedbackPage,
  type FeedbackSearchArguments,
  type FeedbackSubmissionConfirmation,
  type LeaveFeedbackArguments,
} from '@/ebay/commerce/feedback/feedback.js';
import { sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { feedbackPageDocument, feedbackSubmissionConfirmation } from '@tests/fixtures/feedback.js';

const feedbackSearchArguments: FeedbackSearchArguments = {
  feedback_type: 'FEEDBACK_RECEIVED',
  filter: 'commentType:POSITIVE,period:30',
  limit: '25',
  offset: '0',
  sort: 'TIME',
  user_id: 'seller-123',
};

const leaveFeedbackArguments: LeaveFeedbackArguments = {
  commentText: 'Fast payment and clear communication.',
  commentType: 'POSITIVE',
  images: [{ url: 'https://i.ebayimg.com/images/g/example.jpg' }],
  listingId: '110000000000',
  orderLineItemId: '110000000000-220000000000',
  sellerRatings: [{ key: 'COMMUNICATION', value: '5' }],
  transactionId: '220000000000',
};

describe('Commerce Feedback feedback resource arguments', () => {
  it('accepts exact eBay lookup fields', () => {
    expect(getFeedbackArgumentsSchema.parse(feedbackSearchArguments)).toEqual(
      feedbackSearchArguments,
    );
  });

  it('rejects renamed lookup fields and numeric wire pagination', () => {
    expect(() =>
      getFeedbackArgumentsSchema.parse({
        feedbackType: 'FEEDBACK_RECEIVED',
        limit: 25,
        userId: 'seller-123',
      }),
    ).toThrow();
  });

  it('rejects unsupported lookup enums and pagination ranges', () => {
    expect(() =>
      getFeedbackArgumentsSchema.parse({
        feedback_type: 'ALL',
        limit: '24',
        sort: 'OLDEST',
        user_id: 'seller-123',
      }),
    ).toThrow();
  });

  it('rejects competing filters for one feedback ID', () => {
    expect(() =>
      getFeedbackArgumentsSchema.parse({
        feedback_id: 'feedback-123',
        feedback_type: 'FEEDBACK_RECEIVED',
        listing_id: '110000000000',
        user_id: 'seller-123',
      }),
    ).toThrow('feedback_id cannot be combined with another feedback selector');
  });

  it('accepts the exact eBay submission document', () => {
    expect(leaveFeedbackArgumentsSchema.parse(leaveFeedbackArguments)).toEqual(
      leaveFeedbackArguments,
    );
  });

  it('rejects incomplete or unsupported submission fields', () => {
    expect(() =>
      leaveFeedbackArgumentsSchema.parse({
        commentText: '',
        commentType: 'MIXED',
        listingId: '110000000000',
        orderLineItemId: '110000000000-220000000000',
        transactionId: '220000000000',
      }),
    ).toThrow();
    expect(() =>
      leaveFeedbackArgumentsSchema.parse({
        ...leaveFeedbackArguments,
        sellerRatings: [{ key: 'PACKAGING', value: '6' }],
      }),
    ).toThrow();
  });

  it('rejects more than five feedback images', () => {
    expect(() =>
      leaveFeedbackArgumentsSchema.parse({
        ...leaveFeedbackArguments,
        images: Array.from({ length: 6 }, (_, imageIndex) => ({
          url: `https://i.ebayimg.com/images/g/example-${imageIndex}.jpg`,
        })),
      }),
    ).toThrow('images must contain at most 5 attachments');
  });
});

describe('Commerce Feedback feedback resource operations', () => {
  it('retrieves feedback from the official endpoint with unchanged wire fields', async () => {
    const { sellerSession, getCalls } = sellerSessionReturning<FeedbackPage>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: feedbackPageDocument,
    });

    const completion = await getFeedback(sellerSession, feedbackSearchArguments);

    expect(getCalls).toEqual([
      {
        endpoint: '/commerce/feedback/v1/feedback',
        searchParameters: feedbackSearchArguments,
      },
    ]);
    expect(completion).toEqual({
      kind: 'ebayRequestSucceeded',
      ebayDocument: feedbackPageDocument,
    });
  });

  it('submits feedback unchanged to the official endpoint', async () => {
    const { sellerSession, postCalls } = sellerSessionReturning<FeedbackSubmissionConfirmation>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: feedbackSubmissionConfirmation,
    });

    const completion = await leaveFeedback(sellerSession, leaveFeedbackArguments);

    expect(postCalls).toEqual([
      {
        endpoint: '/commerce/feedback/v1/feedback',
        requestDocument: leaveFeedbackArguments,
      },
    ]);
    expect(completion).toEqual({
      kind: 'ebayRequestSucceeded',
      ebayDocument: feedbackSubmissionConfirmation,
    });
  });
});
