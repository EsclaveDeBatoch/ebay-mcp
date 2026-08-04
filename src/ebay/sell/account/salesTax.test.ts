import { describe, expect, it } from 'vitest';

import {
  bulkCreateOrReplaceSalesTax,
  bulkCreateOrReplaceSalesTaxArgumentsSchema,
  createOrReplaceSalesTax,
  createOrReplaceSalesTaxArgumentsSchema,
  deleteSalesTax,
  getSalesTax,
  getSalesTaxes,
  getSalesTaxesArgumentsSchema,
  salesTaxEntryArgumentsSchema,
} from '@/ebay/sell/account/salesTax.js';
import { sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

describe('Sell Account sales-tax schemas', () => {
  it.each(['US', 'CA'] as const)('accepts the supported %s country code', (countryCode) => {
    expect(
      salesTaxEntryArgumentsSchema.parse({ countryCode, jurisdictionId: 'JURISDICTION-1' }),
    ).toEqual({ countryCode, jurisdictionId: 'JURISDICTION-1' });
    expect(getSalesTaxesArgumentsSchema.parse({ country_code: countryCode })).toEqual({
      country_code: countryCode,
    });
  });

  it('accepts a direct single-entry replacement document', () => {
    const salesTaxReplacement = {
      countryCode: 'US',
      jurisdictionId: 'VI',
      salesTaxPercentage: '7.75',
      shippingAndHandlingTaxed: true,
    };

    expect(createOrReplaceSalesTaxArgumentsSchema.parse(salesTaxReplacement)).toEqual(
      salesTaxReplacement,
    );
  });

  it('accepts the exact eBay bulk document', () => {
    const bulkSalesTaxReplacement = {
      salesTaxInputList: [
        {
          countryCode: 'CA',
          salesTaxJurisdictionId: 'ON',
          salesTaxPercentage: '13.0',
          shippingAndHandlingTaxed: true,
        },
      ],
    };

    expect(bulkCreateOrReplaceSalesTaxArgumentsSchema.parse(bulkSalesTaxReplacement)).toEqual(
      bulkSalesTaxReplacement,
    );
  });

  it.each([
    { countryCode: 'GB', jurisdictionId: 'LND' },
    { country_code: 'US', jurisdictionId: 'VI' },
    { countryCode: 'US', jurisdictionId: '' },
    { countryCode: 'US', jurisdictionId: 'VI', extraField: true },
  ])('rejects unsupported sales-tax entry selections', (invalidSalesTaxSelection) => {
    expect(() => salesTaxEntryArgumentsSchema.parse(invalidSalesTaxSelection)).toThrow();
  });

  it.each([
    {
      countryCode: 'US',
      jurisdictionId: 'VI',
      salesTaxBase: { salesTaxPercentage: '7.75' },
    },
    { countryCode: 'US', jurisdictionId: 'VI', salesTaxPercentage: '7.75%' },
    { countryCode: 'US', jurisdictionId: 'VI', salesTaxPercentage: '-1' },
    { countryCode: 'US', jurisdictionId: 'VI', salesTaxPercentage: '101' },
  ])('rejects wrappers and invalid percentage values', (invalidSalesTaxReplacement) => {
    expect(() =>
      createOrReplaceSalesTaxArgumentsSchema.parse(invalidSalesTaxReplacement),
    ).toThrow();
  });

  it.each([
    { requests: [] },
    { salesTaxInputList: [] },
    {
      salesTaxInputList: [
        {
          countryCode: 'CA',
          jurisdictionId: 'ON',
          salesTaxBase: { salesTaxPercentage: '13' },
        },
      ],
    },
  ])('rejects legacy and empty bulk documents', (invalidBulkReplacement) => {
    expect(() =>
      bulkCreateOrReplaceSalesTaxArgumentsSchema.parse(invalidBulkReplacement),
    ).toThrow();
  });
});

describe('Sell Account sales-tax operations', () => {
  it('uses exact paths, query names, and direct eBay documents', async () => {
    const { sellerSession, deleteCalls, getCalls, postCalls, putCalls } =
      sellerSessionReturning<unknown>({
        kind: 'ebayRequestSucceeded',
        ebayDocument: {},
      });
    const salesTaxReplacement = {
      countryCode: 'US' as const,
      jurisdictionId: 'VI',
      salesTaxPercentage: '7.75',
      shippingAndHandlingTaxed: true,
    };
    const bulkSalesTaxReplacement = {
      salesTaxInputList: [
        {
          countryCode: 'CA' as const,
          salesTaxJurisdictionId: 'ON',
          salesTaxPercentage: '13',
        },
      ],
    };

    await createOrReplaceSalesTax(sellerSession, salesTaxReplacement);
    await bulkCreateOrReplaceSalesTax(sellerSession, bulkSalesTaxReplacement);
    await deleteSalesTax(sellerSession, { countryCode: 'US', jurisdictionId: 'VI' });
    await getSalesTax(sellerSession, { countryCode: 'CA', jurisdictionId: 'ON' });
    await getSalesTaxes(sellerSession, { country_code: 'CA' });

    expect(putCalls).toEqual([
      {
        endpoint: '/sell/account/v1/sales_tax/US/VI',
        requestDocument: {
          salesTaxPercentage: '7.75',
          shippingAndHandlingTaxed: true,
        },
      },
    ]);
    expect(postCalls).toEqual([
      {
        endpoint: '/sell/account/v1/bulk_create_or_replace_sales_tax',
        requestDocument: bulkSalesTaxReplacement,
      },
    ]);
    expect(deleteCalls).toEqual([{ endpoint: '/sell/account/v1/sales_tax/US/VI' }]);
    expect(getCalls).toEqual([
      { endpoint: '/sell/account/v1/sales_tax/CA/ON' },
      {
        endpoint: '/sell/account/v1/sales_tax',
        searchParameters: { country_code: 'CA' },
      },
    ]);
  });
});
