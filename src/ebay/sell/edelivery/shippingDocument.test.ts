import { describe, expect, it } from 'vitest';

import { sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

import {
  getHandoverSheet,
  getHandoverSheetArgumentsSchema,
  getLabels,
  getLabelsArgumentsSchema,
} from './shippingDocument.js';

describe('Sell eDelivery shipping-document arguments', () => {
  it('accepts exact label and handover-sheet wire fields', () => {
    const labelSearch = {
      page_size: 'A4' as const,
      print_preference: 'nameZh,skuNo,quantity',
      tracking_numbers: 'T1,T2',
    };
    const handoverSearch = { tracking_numbers: 'T1,T2' };

    expect(getLabelsArgumentsSchema.parse(labelSearch)).toEqual(labelSearch);
    expect(getHandoverSheetArgumentsSchema.parse(handoverSearch)).toEqual(handoverSearch);
  });

  it.each([
    { trackingNumbers: 'T1' },
    { page_size: 'LETTER', tracking_numbers: 'T1' },
    { print_preference: 'unknown', tracking_numbers: 'T1' },
    { tracking_numbers: '' },
  ])('rejects renamed or undocumented fields', (invalidDocumentSearch) => {
    expect(getLabelsArgumentsSchema.safeParse(invalidDocumentSearch).success).toBe(false);
  });
});

describe('Sell eDelivery shipping-document operations', () => {
  it('forwards the exact label and handover-sheet queries', async () => {
    const labelSearch = { page_size: 'THERMAL_PAPER' as const, tracking_numbers: 'T1' };
    const handoverSearch = { tracking_numbers: 'T1,T2' };
    const { sellerSession, getCalls } = sellerSessionReturning({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await getLabels(sellerSession, labelSearch);
    await getHandoverSheet(sellerSession, handoverSearch);

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/edelivery_international_shipping/v1/labels',
        searchParameters: labelSearch,
      },
      {
        endpoint: '/sell/edelivery_international_shipping/v1/handover_sheet',
        searchParameters: handoverSearch,
      },
    ]);
  });
});
