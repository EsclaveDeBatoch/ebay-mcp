import { describe, expect, it } from 'vitest';

import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

import {
  createVeroReport,
  createVeroReportArgumentsSchema,
  getVeroReport,
  getVeroReportArgumentsSchema,
  getVeroReportItems,
  getVeroReportItemsArgumentsSchema,
  type VeroReportSubmission,
} from './report.js';

const trademarkReport: VeroReportSubmission = {
  reportItems: [
    {
      brand: 'Acme',
      itemId: '110000000000',
      messageToSeller: 'This listing uses our registered trademark.',
      veroReasonCodeId: '1001',
    },
  ],
};

describe('Commerce VeRO report arguments', () => {
  it('accepts the exact eBay report document without a wrapper', () => {
    expect(createVeroReportArgumentsSchema.parse(trademarkReport)).toEqual(trademarkReport);
  });

  it.each([
    { reportData: trademarkReport },
    { ...trademarkReport, unknownField: true },
    { reportItems: [] },
    { reportItems: [{ veroReasonCodeId: '1001' }] },
    { reportItems: [{ itemId: '1', veroReasonCodeId: '9037' }] },
    { reportItems: [{ itemId: '1', veroReasonCodeId: '9048' }] },
    { reportItems: [{ itemId: '1', veroReasonCodeId: '9052' }] },
  ])('rejects wrapped, incomplete, or conditionally invalid reports', (invalidReport) => {
    expect(createVeroReportArgumentsSchema.safeParse(invalidReport).success).toBe(false);
  });

  it.each([
    {
      reportItems: [{ countries: ['US'], itemId: '1', veroReasonCodeId: '9037' }],
    },
    {
      reportItems: [{ itemId: '1', patent: 'US123456', veroReasonCodeId: '9048' }],
    },
    {
      reportItems: [
        {
          detailedMessage: 'Additional infringement details',
          itemId: '1',
          veroReasonCodeId: '7052',
        },
      ],
    },
  ])('accepts the fields required by conditional VeRO reason codes', (validReport) => {
    expect(createVeroReportArgumentsSchema.parse(validReport)).toEqual(validReport);
  });

  it('accepts every documented report lookup field and rejects renamed fields', () => {
    const reportLookup = { vero_report_id: 'REPORT123', includeItemDetails: 'true' };

    expect(getVeroReportArgumentsSchema.parse(reportLookup)).toEqual(reportLookup);
    expect(getVeroReportArgumentsSchema.safeParse({ veroReportId: 'REPORT123' }).success).toBe(
      false,
    );
  });

  it('accepts every documented reported-item search field', () => {
    const reportedItemSearch = {
      filter: 'reportSubmittedDate:[2026-01-01T00:00:00Z..2026-02-01T00:00:00Z]',
      itemId: '110000000000',
      limit: '25',
      offset: '0',
    };

    expect(getVeroReportItemsArgumentsSchema.parse(reportedItemSearch)).toEqual(reportedItemSearch);
    expect(
      getVeroReportItemsArgumentsSchema.safeParse({ ...reportedItemSearch, page: '2' }).success,
    ).toBe(false);
  });
});

describe('Commerce VeRO report operations', () => {
  it('posts the exact report document and returns eBay completion unchanged', async () => {
    const reportCreation = { veroReportId: 'REPORT123', veroReportStatus: 'PENDING' };
    const { sellerSession, postCalls } = sellerSessionReturning({
      kind: 'ebayRequestSucceeded',
      ebayDocument: reportCreation,
    });

    await expect(createVeroReport(sellerSession, trademarkReport)).resolves.toEqual({
      kind: 'ebayRequestSucceeded',
      ebayDocument: reportCreation,
    });
    expect(postCalls).toEqual([
      {
        endpoint: '/commerce/vero/v1/vero_report',
        requestDocument: trademarkReport,
      },
    ]);
  });

  it('encodes the report ID and forwards includeItemDetails under its wire name', async () => {
    const { sellerSession, getCalls } = sellerSessionReturning({
      kind: 'ebayRequestSucceeded',
      ebayDocument: { veroReportId: 'REPORT/123' },
    });

    await getVeroReport(sellerSession, {
      vero_report_id: 'REPORT/123',
      includeItemDetails: 'true',
    });

    expect(getCalls).toEqual([
      {
        endpoint: '/commerce/vero/v1/vero_report/REPORT%2F123',
        searchParameters: { includeItemDetails: 'true' },
      },
    ]);
  });

  it('forwards the complete reported-item query without reshaping', async () => {
    const { sellerSession, getCalls } = sellerSessionReturning({
      kind: 'ebayRequestSucceeded',
      ebayDocument: { reportedItemDetails: [] },
    });
    const reportedItemSearch = {
      filter: 'reportSubmittedDate:[2026-01-01T00:00:00Z..2026-02-01T00:00:00Z]',
      itemId: '110000000000',
      limit: '25',
      offset: '0',
    };

    await getVeroReportItems(sellerSession, reportedItemSearch);

    expect(getCalls).toEqual([
      {
        endpoint: '/commerce/vero/v1/vero_report_items',
        searchParameters: reportedItemSearch,
      },
    ]);
  });

  it.each(ebayFailures)('returns $kind without translation', async (ebayFailure) => {
    const { sellerSession } = sellerSessionReturning({
      kind: 'ebayRequestFailed',
      ebayFailure,
    });

    await expect(getVeroReportItems(sellerSession)).resolves.toEqual({
      kind: 'ebayRequestFailed',
      ebayFailure,
    });
  });
});
