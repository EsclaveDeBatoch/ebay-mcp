import { describe, expect, it } from 'vitest';

import { getKyc, getKycArgumentsSchema } from '@/ebay/sell/account/kyc.js';
import { sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

describe('Sell Account KYC', () => {
  it('accepts only the exact empty argument contract', () => {
    expect(getKycArgumentsSchema.parse({})).toEqual({});
    expect(() => getKycArgumentsSchema.parse({ marketplaceId: 'EBAY_US' })).toThrow();
  });

  it('retrieves the unchanged KYC document', async () => {
    const { sellerSession, getCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await getKyc(sellerSession);

    expect(getCalls).toEqual([{ endpoint: '/sell/account/v1/kyc' }]);
  });
});
