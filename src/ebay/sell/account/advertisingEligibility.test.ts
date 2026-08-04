import { describe, expect, it } from 'vitest';

import {
  getAdvertisingEligibility,
  getAdvertisingEligibilityArgumentsSchema,
} from '@/ebay/sell/account/advertisingEligibility.js';
import { sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

describe('Sell Account advertising eligibility', () => {
  it('accepts exact eBay header and program_types fields', () => {
    const eligibilitySelection = {
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
      program_types: 'PROMOTED_LISTINGS_STANDARD,OFFSITE_ADS',
    };

    expect(getAdvertisingEligibilityArgumentsSchema.parse(eligibilitySelection)).toEqual(
      eligibilitySelection,
    );
  });

  it.each([
    { marketplaceId: 'EBAY_US' },
    { 'X-EBAY-C-MARKETPLACE-ID': '' },
    { 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US', programTypes: 'OFFSITE_ADS' },
    { 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US', program_types: 'PLA' },
    { 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US', program_types: 'OFFSITE_ADS, OFFSITE_ADS' },
  ])('rejects aliases, missing headers, and unofficial program values', (invalidSelection) => {
    expect(() => getAdvertisingEligibilityArgumentsSchema.parse(invalidSelection)).toThrow();
  });

  it('sends the exact marketplace header and optional program query', async () => {
    const { sellerSession, getCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await getAdvertisingEligibility(sellerSession, {
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
      program_types: 'PROMOTED_LISTINGS_ADVANCED',
    });

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/account/v1/advertising_eligibility',
        requestHeaders: { 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US' },
        searchParameters: { program_types: 'PROMOTED_LISTINGS_ADVANCED' },
      },
    ]);
  });

  it('omits the program query when all programs are requested', async () => {
    const { sellerSession, getCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await getAdvertisingEligibility(sellerSession, {
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_DE',
    });

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/account/v1/advertising_eligibility',
        requestHeaders: { 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_DE' },
      },
    ]);
  });
});
