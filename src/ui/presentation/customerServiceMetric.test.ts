import { describe, expect, it } from 'vitest';

import type { CustomerServiceMetric } from '@/ebay/sell/analytics/customerServiceMetric.js';
import { customerServiceMetricDocument } from '@tests/fixtures/customerServiceMetric.js';

import { customerServiceMetricChart } from './customerServiceMetric.js';

describe('customerServiceMetricChart', () => {
  it('groups numeric measurements by metric and prefers eBay dimension values', () => {
    expect(customerServiceMetricChart(customerServiceMetricDocument)).toEqual({
      archetype: 'chart',
      title: 'Customer service metrics',
      kind: 'bar',
      series: [
        { name: 'RATE', points: [{ x: '20081', y: 0.012 }] },
        { name: 'COUNT', points: [{ x: '20081', y: 3 }] },
      ],
    });
  });

  it('uses the official dimension name only when its value is absent and omits invalid metrics', () => {
    const incompleteMetric: CustomerServiceMetric = {
      dimensionMetrics: [
        {
          dimension: { name: 'Domestic' },
          metrics: [
            { metricKey: 'RATE', value: 'not-a-number' },
            { value: '4' },
            { metricKey: 'COUNT', value: '4' },
          ],
        },
        {
          metrics: [{ metricKey: 'COUNT', value: '9' }],
        },
      ],
    };

    expect(customerServiceMetricChart(incompleteMetric)).toEqual({
      archetype: 'chart',
      title: 'Customer service metrics',
      kind: 'bar',
      series: [{ name: 'COUNT', points: [{ x: 'Domestic', y: 4 }] }],
    });
  });
});
