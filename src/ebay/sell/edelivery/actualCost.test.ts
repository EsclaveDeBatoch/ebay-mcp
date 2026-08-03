import { describe, expect, it } from 'vitest';

import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

import { getActualCosts, getActualCostsArgumentsSchema } from './actualCost.js';

describe('Sell eDelivery actual-cost arguments', () => {
  it('accepts either tracking numbers or a complete transaction window', () => {
    const trackingSearch = { tracking_numbers: 'T1,T2' };
    const transactionWindow = {
      trans_begin_time: '2026-07-01T00:00:00.000Z',
      trans_end_time: '2026-07-31T23:59:59.999Z',
    };

    expect(getActualCostsArgumentsSchema.parse(trackingSearch)).toEqual(trackingSearch);
    expect(getActualCostsArgumentsSchema.parse(transactionWindow)).toEqual(transactionWindow);
  });

  it.each([
    {},
    { trackingNumbers: 'T1' },
    { tracking_numbers: 'T1', trans_begin_time: '2026-07-01T00:00:00.000Z' },
    { trans_begin_time: '2026-07-01T00:00:00.000Z' },
    { trans_end_time: '2026-07-31T23:59:59.999Z' },
  ])('rejects incomplete, renamed, or competing selectors', (invalidCostSearch) => {
    expect(getActualCostsArgumentsSchema.safeParse(invalidCostSearch).success).toBe(false);
  });
});

describe('Sell eDelivery actual-cost operation', () => {
  it('forwards exact wire fields and returns the eBay completion unchanged', async () => {
    const trackingSearch = { tracking_numbers: 'T1,T2' };
    const costCollection = { actualCosts: [] };
    const { sellerSession, getCalls } = sellerSessionReturning({
      kind: 'ebayRequestSucceeded',
      ebayDocument: costCollection,
    });

    await expect(getActualCosts(sellerSession, trackingSearch)).resolves.toEqual({
      kind: 'ebayRequestSucceeded',
      ebayDocument: costCollection,
    });
    expect(getCalls).toEqual([
      {
        endpoint: '/sell/edelivery_international_shipping/v1/actual_costs',
        searchParameters: trackingSearch,
      },
    ]);
  });

  it.each(ebayFailures)('returns $kind without translation', async (ebayFailure) => {
    const { sellerSession } = sellerSessionReturning({
      kind: 'ebayRequestFailed',
      ebayFailure,
    });

    await expect(getActualCosts(sellerSession, { tracking_numbers: 'T1' })).resolves.toEqual({
      kind: 'ebayRequestFailed',
      ebayFailure,
    });
  });
});
