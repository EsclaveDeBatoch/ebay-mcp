import type {
  CustomerServiceMetric,
  CustomerServiceMetricArguments,
} from '@/ebay/sell/analytics/customerServiceMetric.js';

export const customerServiceMetricArguments: CustomerServiceMetricArguments = {
  customer_service_metric_type: 'ITEM_NOT_AS_DESCRIBED',
  evaluation_type: 'CURRENT',
  evaluation_marketplace_id: 'EBAY_US',
};

export const customerServiceMetricDocument: CustomerServiceMetric = {
  dimensionMetrics: [
    {
      dimension: {
        dimensionKey: 'LISTING_CATEGORY',
        name: 'Collectibles',
        value: '20081',
      },
      metrics: [
        { metricKey: 'RATE', value: '0.012' },
        { metricKey: 'COUNT', value: '3' },
      ],
    },
  ],
  evaluationCycle: {
    evaluationType: 'CURRENT',
    evaluationDate: '2026-07-20T00:00:00.000Z',
  },
  marketplaceId: 'EBAY_US',
};
