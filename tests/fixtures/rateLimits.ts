import type { DeveloperRateLimits } from '@/ebay/developer/analytics/rateLimit.js';

export const applicationRateLimitsDocument: DeveloperRateLimits = {
  rateLimits: [
    {
      apiContext: 'sell',
      apiName: 'inventory',
      apiVersion: 'v1',
      resources: [
        {
          name: 'getInventoryItems',
          rates: [
            {
              count: 18,
              limit: 5000,
              remaining: 4982,
              reset: '2026-08-04T00:00:00.000Z',
              timeWindow: 86_400,
            },
          ],
        },
      ],
    },
  ],
};

export const userRateLimitsDocument: DeveloperRateLimits = {
  rateLimits: [
    {
      apiContext: 'sell',
      apiName: 'fulfillment',
      apiVersion: 'v1',
      resources: [
        {
          name: 'getOrders',
          rates: [
            {
              count: 25,
              limit: 1000,
              remaining: 975,
              reset: '2026-08-04T00:00:00.000Z',
              timeWindow: 86_400,
            },
          ],
        },
      ],
    },
  ],
};
