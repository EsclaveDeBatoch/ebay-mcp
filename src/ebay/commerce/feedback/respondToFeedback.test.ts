import { describe, expect, it } from 'vitest';

import {
  respondToFeedback,
  respondToFeedbackArgumentsSchema,
  type FeedbackReplyArguments,
  type FeedbackReplyConfirmation,
} from '@/ebay/commerce/feedback/respondToFeedback.js';
import { sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

const feedbackReplyArguments: FeedbackReplyArguments = {
  feedbackId: 'feedback-123',
  recipientUserId: 'buyer-123',
  responseText: 'Thank you for sharing your experience.',
  responseType: 'REPLY',
};

describe('Commerce Feedback respond-to-feedback arguments', () => {
  it('accepts the exact eBay reply document', () => {
    expect(respondToFeedbackArgumentsSchema.parse(feedbackReplyArguments)).toEqual(
      feedbackReplyArguments,
    );
  });

  it('accepts both documented reply types', () => {
    expect(
      respondToFeedbackArgumentsSchema.parse({
        ...feedbackReplyArguments,
        responseType: 'FOLLOW_UP',
      }),
    ).toMatchObject({ responseType: 'FOLLOW_UP' });
  });

  it('requires every field documented by eBay error codes', () => {
    expect(() =>
      respondToFeedbackArgumentsSchema.parse({
        feedbackId: 'feedback-123',
        responseText: 'Thank you.',
      }),
    ).toThrow();
  });

  it('rejects blank identifiers and reply text', () => {
    expect(() =>
      respondToFeedbackArgumentsSchema.parse({
        ...feedbackReplyArguments,
        feedbackId: '',
        recipientUserId: '',
        responseText: '',
      }),
    ).toThrow();
  });

  it('rejects unsupported reply types and text beyond 500 characters', () => {
    expect(() =>
      respondToFeedbackArgumentsSchema.parse({
        ...feedbackReplyArguments,
        responseText: 'x'.repeat(501),
        responseType: 'COMMENT',
      }),
    ).toThrow();
  });

  it('rejects fields not accepted by the eBay endpoint', () => {
    expect(() =>
      respondToFeedbackArgumentsSchema.parse({
        ...feedbackReplyArguments,
        responseId: 'reply-123',
      }),
    ).toThrow();
  });
});

describe('Commerce Feedback respond-to-feedback operation', () => {
  it('posts the unchanged reply document to the official endpoint', async () => {
    const feedbackReplyConfirmation: FeedbackReplyConfirmation = {};
    const { sellerSession, postCalls } = sellerSessionReturning<FeedbackReplyConfirmation>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: feedbackReplyConfirmation,
    });

    const completion = await respondToFeedback(sellerSession, feedbackReplyArguments);

    expect(postCalls).toEqual([
      {
        endpoint: '/commerce/feedback/v1/respond_to_feedback',
        requestDocument: feedbackReplyArguments,
      },
    ]);
    expect(completion).toEqual({
      kind: 'ebayRequestSucceeded',
      ebayDocument: feedbackReplyConfirmation,
    });
  });
});
