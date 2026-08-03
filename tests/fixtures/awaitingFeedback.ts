import type { ItemsAwaitingFeedback } from '@/ebay/commerce/feedback/awaitingFeedback.js';

export const itemsAwaitingFeedbackDocument: ItemsAwaitingFeedback = {
  itemsAwaitingFeedbackCount: { asBuyer: 1, asSeller: 0 },
  lineItems: [
    {
      listingId: '110000000000',
      listingPrice: { currency: 'USD', value: 125 },
      listingTitle: 'Mirrorless camera',
      orderLineItemId: '110000000000-220000000000',
      ratingTemplates: [
        {
          acceptableValues: [{ enabled: true, value: 'POSITIVE', valueLabel: 'Positive' }],
          enabled: true,
          ratingKey: 'OVERALL_EXPERIENCE',
          ratingLabel: 'Rate this transaction',
          ratingValueType: 'PREDEFINED',
          required: true,
        },
      ],
      transactionId: '220000000000',
    },
  ],
  pagination: {
    count: 1,
    limit: 25,
    offset: 0,
    total: 1,
  },
};
