import { describe, expect, it } from 'vitest';

import {
  getSalesTaxJurisdictions,
  salesTaxJurisdictionsArgumentsSchema,
} from '@/ebay/sell/metadata/salesTaxJurisdiction.js';
import { sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

describe('Sell Metadata sales-tax jurisdiction', () => {
  it.each(['CA', 'US'] as const)('accepts supported country code %s', (countryCode) => {
    expect(salesTaxJurisdictionsArgumentsSchema.parse({ countryCode })).toEqual({ countryCode });
  });

  it.each([{ country_code: 'US' }, { countryCode: 'GB' }, { countryCode: '' }])(
    'rejects renamed or unsupported country fields',
    (invalidTaxJurisdictionLookup) => {
      expect(() =>
        salesTaxJurisdictionsArgumentsSchema.parse(invalidTaxJurisdictionLookup),
      ).toThrow();
    },
  );

  it('calls the exact country resource path', async () => {
    const { sellerSession, getCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await getSalesTaxJurisdictions(sellerSession, { countryCode: 'US' });

    expect(getCalls).toEqual([{ endpoint: '/sell/metadata/v1/country/US/sales_tax_jurisdiction' }]);
  });
});
