import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbayGetCall, EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { TrafficReport, TrafficReportQuery } from '@/ebay/sell/analytics/trafficReport.js';

export const trafficReportDocument = {
  header: {
    dimensionKeys: [{ key: 'DAY', localizedName: 'Day' }],
    metrics: [{ key: 'LISTING_VIEWS_TOTAL', localizedName: 'Listing views' }],
  },
  records: [
    {
      dimensionValues: [{ applicable: true, value: '2026-07-31' }],
      metricValues: [{ applicable: true, value: '42' }],
    },
  ],
} as unknown as TrafficReport;

export const trafficReportQuery: TrafficReportQuery = {
  dimension: 'DAY',
  filter: 'marketplace_ids:{EBAY_US},date_range:[20260701..20260731]',
  metric: 'LISTING_VIEWS_TOTAL',
};

export const sellerSessionReturning = (
  ebayRequestCompletion: EbayRequestCompletion<TrafficReport>,
): {
  readonly sellerSession: EbaySellerSession;
  readonly getCalls: EbayGetCall[];
} => {
  const getCalls: EbayGetCall[] = [];
  const get = <EbayDocument>(
    ebayGetCall: EbayGetCall,
  ): Promise<EbayRequestCompletion<EbayDocument>> => {
    getCalls.push(ebayGetCall);
    return Promise.resolve(ebayRequestCompletion as EbayRequestCompletion<EbayDocument>);
  };
  const sellerSession: EbaySellerSession = { get };

  return { sellerSession, getCalls };
};
