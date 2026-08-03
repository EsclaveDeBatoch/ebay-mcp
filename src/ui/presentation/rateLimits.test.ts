import { describe, expect, it } from 'vitest';
import { applicationRateLimitsStat, userRateLimitsStat } from './rateLimits.js';

describe('Developer Analytics rate-limit presentation', () => {
  it('presents application limits as one tile per resource with headroom tone', () => {
    const applicationLimits = applicationRateLimitsStat({
      rateLimits: [
        {
          apiContext: 'sell',
          apiName: 'inventory',
          resources: [
            {
              name: 'getInventoryItems',
              rates: [{ limit: 5000, remaining: 4982, reset: '2026-07-04T00:00:00.000Z' }],
            },
            { name: 'createOrReplaceInventoryItem', rates: [{ limit: 5000, remaining: 300 }] },
          ],
        },
      ],
    });

    expect(applicationLimits.archetype).toBe('stat');
    expect(applicationLimits.title).toBe('Application rate limits');
    expect(applicationLimits.tiles).toHaveLength(2);
    expect(applicationLimits.tiles[0]).toEqual({
      label: 'sell · inventory · getInventoryItems',
      value: '4,982',
      sub: 'of 5,000',
      tone: 'success',
    });
    expect(applicationLimits.tiles[1].tone).toBe('danger');
  });

  it('skips resources without rate entries and titles user limits', () => {
    const userLimits = userRateLimitsStat({
      rateLimits: [
        {
          apiContext: 'sell',
          apiName: 'fulfillment',
          resources: [
            { name: 'noRates' },
            { name: 'getOrders', rates: [{ limit: 1000, remaining: 200 }] },
          ],
        },
      ],
    });

    expect(userLimits.title).toBe('User rate limits');
    expect(userLimits.tiles).toHaveLength(1);
    expect(userLimits.tiles[0].label).toBe('sell · fulfillment · getOrders');
    expect(userLimits.tiles[0].tone).toBe('warning');
  });

  it('uses an empty label and neutral tone for sparse eBay fields', () => {
    const sparseLimits = applicationRateLimitsStat({
      rateLimits: [{ resources: [{ rates: [{}] }] }],
    });

    expect(sparseLimits.tiles[0]).toEqual({
      label: '',
      value: '0',
      sub: 'of 0',
      tone: 'neutral',
    });
  });
});
