import { describe, expect, it } from 'vitest';

import { getReport, getReportArgumentsSchema } from '@/ebay/sell/marketing/adReport.js';
import { sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

describe('Sell Marketing ad report schemas', () => {
  it('accepts the exact report path field', () => {
    expect(getReportArgumentsSchema.parse({ report_id: 'REPORT-1' })).toEqual({
      report_id: 'REPORT-1',
    });
  });

  it.each([
    { reportId: 'REPORT-1' },
    { report_id: '' },
    {},
    { report_id: 'REPORT-1', extra: true },
  ])('rejects aliases and invalid report paths', (invalidArguments) => {
    expect(() => getReportArgumentsSchema.parse(invalidArguments)).toThrow();
  });
});

describe('Sell Marketing ad report operations', () => {
  it('downloads report text from an encoded path', async () => {
    const { sellerSession, getCalls } = sellerSessionReturning<string>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: 'date\tclicks\n2026-07-01\t10\n',
    });

    const reportCompletion = await getReport(sellerSession, { report_id: 'REPORT/1' });

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/ad_report/REPORT%2F1',
        responseType: 'text',
      },
    ]);
    expect(reportCompletion).toEqual({
      kind: 'ebayRequestSucceeded',
      ebayDocument: 'date\tclicks\n2026-07-01\t10\n',
    });
  });
});
