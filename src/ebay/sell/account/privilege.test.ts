import { describe, expect, it } from 'vitest';

import { getPrivileges, getPrivilegesArgumentsSchema } from '@/ebay/sell/account/privilege.js';
import { sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

describe('Sell Account privileges', () => {
  it('accepts only the exact empty argument contract', () => {
    expect(getPrivilegesArgumentsSchema.parse({})).toEqual({});
    expect(() => getPrivilegesArgumentsSchema.parse({ country_code: 'US' })).toThrow();
  });

  it('retrieves the unchanged selling-privileges document', async () => {
    const { sellerSession, getCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await getPrivileges(sellerSession);

    expect(getCalls).toEqual([{ endpoint: '/sell/account/v1/privilege' }]);
  });
});
