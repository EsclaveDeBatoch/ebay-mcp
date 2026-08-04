import { describe, expect, it } from 'vitest';

import {
  getReportMetadata,
  getReportMetadataArgumentsSchema,
  getReportMetadataForReportType,
  getReportMetadataForReportTypeArgumentsSchema,
} from '@/ebay/sell/marketing/adReportMetadata.js';
import { sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

describe('Sell Marketing ad report metadata schemas', () => {
  it('accepts exact query wire keys and report type path', () => {
    expect(
      getReportMetadataArgumentsSchema.parse({
        funding_model: 'COST_PER_CLICK',
        channel: 'ON_SITE',
      }),
    ).toEqual({
      funding_model: 'COST_PER_CLICK',
      channel: 'ON_SITE',
    });
    expect(
      getReportMetadataForReportTypeArgumentsSchema.parse({
        report_type: 'ACCOUNT_PERFORMANCE_REPORT',
        funding_model: 'COST_PER_SALE',
        channel: 'OFF_SITE',
      }),
    ).toEqual({
      report_type: 'ACCOUNT_PERFORMANCE_REPORT',
      funding_model: 'COST_PER_SALE',
      channel: 'OFF_SITE',
    });
  });

  it.each([
    { fundingModel: 'COST_PER_CLICK' },
    { funding_model: 'UNKNOWN' },
    { channel: 'SITE' },
    { reportType: 'ACCOUNT_PERFORMANCE_REPORT' },
    { report_type: '' },
  ])('rejects aliases and invalid metadata filters', (invalidArguments) => {
    expect(() => getReportMetadataArgumentsSchema.parse(invalidArguments)).toThrow();
    expect(() => getReportMetadataForReportTypeArgumentsSchema.parse(invalidArguments)).toThrow();
  });
});

describe('Sell Marketing ad report metadata operations', () => {
  it('uses exact query wire keys and encoded report type paths', async () => {
    const { sellerSession, getCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await getReportMetadata(sellerSession, {
      funding_model: 'COST_PER_CLICK',
      channel: 'ON_SITE',
    });
    await getReportMetadataForReportType(sellerSession, {
      report_type: 'ACCOUNT/PERFORMANCE',
      funding_model: 'COST_PER_SALE',
      channel: 'OFF_SITE',
    });

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/ad_report_metadata',
        searchParameters: {
          funding_model: 'COST_PER_CLICK',
          channel: 'ON_SITE',
        },
      },
      {
        endpoint: '/sell/marketing/v1/ad_report_metadata/ACCOUNT%2FPERFORMANCE',
        searchParameters: {
          funding_model: 'COST_PER_SALE',
          channel: 'OFF_SITE',
        },
      },
    ]);
  });
});
