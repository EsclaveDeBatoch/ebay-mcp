import { describe, expect, it } from 'vitest';

import type { TrafficReport } from '@/ebay/sell/analytics/trafficReport.js';

import { trafficReportChart } from './trafficReport.js';

describe('trafficReportChart', () => {
  it('shows applicable numeric metrics by their eBay labels', () => {
    const trafficReportDocument = {
      header: {
        metrics: [
          { key: 'LISTING_VIEWS_TOTAL', localizedName: 'Listing views' },
          { key: 'TRANSACTION', localizedName: 'Transactions' },
        ],
      },
      records: [
        {
          dimensionValues: [{ applicable: true, value: '2026-07-30' }],
          metricValues: [
            { applicable: true, value: '30' },
            { applicable: true, value: '2' },
          ],
        },
        {
          dimensionValues: [{ applicable: true, value: '2026-07-31' }],
          metricValues: [
            { applicable: true, value: '42' },
            { applicable: false, value: '3' },
          ],
        },
      ],
    } as unknown as TrafficReport;

    expect(trafficReportChart(trafficReportDocument)).toEqual({
      archetype: 'chart',
      title: 'Traffic report',
      kind: 'line',
      series: [
        {
          name: 'Listing views',
          points: [
            { x: '2026-07-30', y: 30 },
            { x: '2026-07-31', y: 42 },
          ],
        },
        {
          name: 'Transactions',
          points: [{ x: '2026-07-30', y: 2 }],
        },
      ],
    });
  });

  it('omits incomplete columns and cells without inventing fallback labels', () => {
    const trafficReportDocument = {
      header: {
        metrics: [
          { key: 'LISTING_VIEWS_TOTAL' },
          { localizedName: 'Missing key' },
          { key: 'TRANSACTION', localizedName: 'Transactions' },
        ],
      },
      records: [
        {
          dimensionValues: [{ applicable: true, value: '2026-07-31' }],
          metricValues: [
            { applicable: true, value: 'not-a-number' },
            { applicable: true, value: '7' },
          ],
        },
        {
          metricValues: [{ applicable: true, value: '42' }],
        },
      ],
    } as unknown as TrafficReport;

    expect(trafficReportChart(trafficReportDocument)).toEqual({
      archetype: 'chart',
      title: 'Traffic report',
      kind: 'line',
      series: [
        { name: 'LISTING_VIEWS_TOTAL', points: [] },
        { name: 'Transactions', points: [] },
      ],
    });
  });
});
