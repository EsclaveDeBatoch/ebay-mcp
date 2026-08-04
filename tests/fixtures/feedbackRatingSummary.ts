import type { FeedbackRatingSummary } from '@/ebay/commerce/feedback/feedbackRatingSummary.js';

export const feedbackRatingSummaryDocument: FeedbackRatingSummary = {
  feedbackRatingSummary: [
    {
      ratingType: 'OVERALL_EXPERIENCE',
      ratingSummaryByRatingType: [
        {
          feedbackMetrics: [
            { metricName: 'COUNT', metricValue: 125 },
            { metricName: 'POSITIVE_PERCENTAGE', metricValue: 98.4 },
          ],
          feedbackRatingValueDistribution: [
            { count: 123, value: 'POSITIVE' },
            { count: 2, value: 'NEUTRAL' },
          ],
          period: { unit: 'DAY', value: 90 },
          userRoleType: 'SELLER',
        },
      ],
    },
  ],
};
