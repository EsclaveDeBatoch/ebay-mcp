import type {
  FeedbackPage,
  FeedbackSubmissionConfirmation,
} from '@/ebay/commerce/feedback/feedback.js';

export const feedbackPageDocument: FeedbackPage = {
  feedbackEntries: [
    {
      automatedFeedback: false,
      commentType: 'POSITIVE',
      eligibleForRevision: true,
      feedbackComment: {
        commentPeriod: { unit: 'DAY', value: 30 },
        commentText: 'Excellent seller and careful packaging.',
        state: 'ENTERED',
      },
      feedbackEnteredDate: '2026-07-20T10:30:00.000Z',
      feedbackEnteredPeriod: { unit: 'DAY', value: 30 },
      feedbackId: 'feedback-123',
      feedbackRatings: [{ ratingType: 'DSR_COMMUNICATION', value: '5' }],
      feedbackScore: 842,
      feedbackState: 'ENTERED',
      hasImages: true,
      images: [{ url: 'https://i.ebayimg.com/images/g/example.jpg' }],
      orderLineItemSummary: {
        listingId: '110000000000',
        listingPrice: { currency: 'USD', value: 125 },
        listingTitle: 'Vintage camera',
        orderLineItemId: '110000000000-220000000000',
      },
      providerUserDetail: {
        feedbackScore: 215,
        feedbackStar: 'TURQUOISE_STAR',
        role: 'BUYER',
        userAttributes: [{ name: 'USER_VERIFIED', value: 'true' }],
        userId: 'buyer-456',
      },
      topics: [
        {
          coarseTopic: 'packaging',
          highlightedTexts: ['careful packaging'],
          sentiment: 'POSITIVE',
        },
      ],
    },
  ],
  pagination: {
    count: 1,
    limit: 25,
    offset: 0,
    total: 1,
  },
};

export const feedbackSubmissionConfirmation: FeedbackSubmissionConfirmation = {
  feedbackId: 'feedback-123',
};
