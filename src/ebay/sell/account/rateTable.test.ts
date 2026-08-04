import { describe, expect, it } from 'vitest';

import { getRateTables, getRateTablesArgumentsSchema } from '@/ebay/sell/account/rateTable.js';
import { sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

describe('Sell Account rate tables', () => {
  it('accepts only the exact optional country_code query', () => {
    expect(getRateTablesArgumentsSchema.parse({})).toEqual({});
    expect(getRateTablesArgumentsSchema.parse({ country_code: 'US' })).toEqual({
      country_code: 'US',
    });
    expect(() => getRateTablesArgumentsSchema.parse({ countryCode: 'US' })).toThrow();
    expect(() => getRateTablesArgumentsSchema.parse({ country_code: 'USA' })).toThrow();
  });

  it('sends country_code when one marketplace country is selected', async () => {
    const { sellerSession, getCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await getRateTables(sellerSession, { country_code: 'US' });

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/account/v1/rate_table',
        searchParameters: { country_code: 'US' },
      },
    ]);
  });

  it('omits the query when all rate tables are requested', async () => {
    const { sellerSession, getCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await getRateTables(sellerSession, {});

    expect(getCalls).toEqual([{ endpoint: '/sell/account/v1/rate_table' }]);
  });
});
