import { describe, expect, it } from 'vitest';

import type { EbayFailure, EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import {
  sellerSessionReturning,
  trafficReportDocument,
  trafficReportQuery,
} from '@tests/fixtures/trafficReport.js';

import { getTrafficReport, type TrafficReport, trafficReportQuerySchema } from './trafficReport.js';

const trafficReportQueryWithSort = {
  ...trafficReportQuery,
  sort: '-LISTING_VIEWS_TOTAL',
};

describe('Sell Analytics traffic report', () => {
  it('accepts the exact eBay query fields', () => {
    expect(trafficReportQuerySchema.parse(trafficReportQueryWithSort)).toEqual(
      trafficReportQueryWithSort,
    );
  });

  it.each([
    {
      dimension: 'MONTH',
      filter: trafficReportQuery.filter,
      metric: trafficReportQuery.metric,
    },
    {
      dimension: 'DAY',
      filter: '',
      metric: trafficReportQuery.metric,
    },
    {
      dimension: 'DAY',
      filter: trafficReportQuery.filter,
      metric: '',
    },
    {
      dimension: 'DAY',
      filter: trafficReportQuery.filter,
      metric: trafficReportQuery.metric,
      sort: '',
    },
    {
      dimension: 'DAY',
      filter: trafficReportQuery.filter,
      metric: trafficReportQuery.metric,
      marketplaceId: 'EBAY_US',
    },
  ])('rejects an invalid or unknown query field', (invalidTrafficReportQuery) => {
    expect(trafficReportQuerySchema.safeParse(invalidTrafficReportQuery).success).toBe(false);
  });

  it('calls the authenticated seller session with the exact endpoint and wire fields', async () => {
    const successfulRequest: EbayRequestCompletion<TrafficReport> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: trafficReportDocument,
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulRequest);

    const requestCompletion = await getTrafficReport(sellerSession, trafficReportQueryWithSort);

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/analytics/v1/traffic_report',
        searchParameters: trafficReportQueryWithSort,
      },
    ]);
    expect(requestCompletion).toBe(successfulRequest);
    expect(requestCompletion).toEqual({
      kind: 'ebayRequestSucceeded',
      ebayDocument: trafficReportDocument,
    });
  });

  it.each<EbayFailure>([
    { kind: 'ebayAuthenticationFailed', message: 'Seller authorization expired' },
    { kind: 'ebayRateLimited', message: 'Request quota exhausted' },
    { kind: 'ebayRequestRejected', message: 'Invalid date range', status: 400 },
    { kind: 'ebayUnavailable', message: 'Service unavailable' },
  ])('passes the $kind completion through unchanged', async (ebayFailure) => {
    const failedRequest: EbayRequestCompletion<TrafficReport> = {
      kind: 'ebayRequestFailed',
      ebayFailure,
    };
    const { sellerSession } = sellerSessionReturning(failedRequest);

    await expect(getTrafficReport(sellerSession, trafficReportQuery)).resolves.toBe(failedRequest);
  });
});
