import { describe, expect, it } from 'vitest';

import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

import { getTracking, getTrackingArgumentsSchema } from './tracking.js';

describe('Sell eDelivery tracking', () => {
  it('accepts and forwards only the exact tracking_number wire field', async () => {
    const trackingSearch = { tracking_number: 'ES000000001' };
    const { sellerSession, getCalls } = sellerSessionReturning({
      kind: 'ebayRequestSucceeded',
      ebayDocument: { trackingEvents: [] },
    });

    expect(getTrackingArgumentsSchema.parse(trackingSearch)).toEqual(trackingSearch);
    expect(getTrackingArgumentsSchema.safeParse({ trackingNumber: 'ES000000001' }).success).toBe(
      false,
    );
    await getTracking(sellerSession, trackingSearch);
    expect(getCalls).toEqual([
      {
        endpoint: '/sell/edelivery_international_shipping/v1/tracking',
        searchParameters: trackingSearch,
      },
    ]);
  });

  it.each(ebayFailures)('returns $kind without translation', async (ebayFailure) => {
    const { sellerSession } = sellerSessionReturning({
      kind: 'ebayRequestFailed',
      ebayFailure,
    });

    await expect(getTracking(sellerSession, { tracking_number: 'T1' })).resolves.toEqual({
      kind: 'ebayRequestFailed',
      ebayFailure,
    });
  });
});
