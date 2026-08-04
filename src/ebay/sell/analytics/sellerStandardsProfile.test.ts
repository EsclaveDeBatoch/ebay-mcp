import { describe, expect, it } from 'vitest';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import {
  sellerStandardsProfileDocument,
  sellerStandardsProfilePath,
  sellerStandardsProfilesDocument,
} from '@tests/fixtures/sellerStandardsProfile.js';

import {
  findSellerStandardsProfiles,
  findSellerStandardsProfilesArgumentsSchema,
  getSellerStandardsProfile,
  type SellerStandardsProfile,
  sellerStandardsProfilePathSchema,
  type SellerStandardsProfiles,
} from './sellerStandardsProfile.js';

describe('Sell Analytics seller standards profiles', () => {
  it('accepts only an empty argument object for collection discovery', () => {
    expect(findSellerStandardsProfilesArgumentsSchema.parse({})).toEqual({});
    expect(
      findSellerStandardsProfilesArgumentsSchema.safeParse({ program: 'PROGRAM_US' }).success,
    ).toBe(false);
  });

  it('accepts the exact eBay profile path fields', () => {
    expect(sellerStandardsProfilePathSchema.parse(sellerStandardsProfilePath)).toEqual(
      sellerStandardsProfilePath,
    );
  });

  it.each([
    { program: 'PROGRAM_CA', cycle: 'CURRENT' },
    { program: 'PROGRAM_US', cycle: 'PAST' },
    { program: 'PROGRAM_US', cycle: 'CURRENT', marketplace_id: 'EBAY_US' },
  ])('rejects an invalid or unknown profile path field', (invalidProfilePath) => {
    expect(sellerStandardsProfilePathSchema.safeParse(invalidProfilePath).success).toBe(false);
  });

  it('finds profiles at the exact eBay collection endpoint', async () => {
    const successfulRequest: EbayRequestCompletion<SellerStandardsProfiles> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: sellerStandardsProfilesDocument,
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulRequest);

    const requestCompletion = await findSellerStandardsProfiles(sellerSession);

    expect(getCalls).toEqual([{ endpoint: '/sell/analytics/v1/seller_standards_profile' }]);
    expect(requestCompletion).toBe(successfulRequest);
  });

  it('gets one profile from the exact eBay path', async () => {
    const successfulRequest: EbayRequestCompletion<SellerStandardsProfile> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: sellerStandardsProfileDocument,
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulRequest);

    const requestCompletion = await getSellerStandardsProfile(
      sellerSession,
      sellerStandardsProfilePath,
    );

    expect(getCalls).toEqual([
      { endpoint: '/sell/analytics/v1/seller_standards_profile/PROGRAM_US/CURRENT' },
    ]);
    expect(requestCompletion).toBe(successfulRequest);
  });

  it.each(ebayFailures)(
    'passes $kind through unchanged when profile discovery fails',
    async (ebayFailure) => {
      const failedRequest: EbayRequestCompletion<SellerStandardsProfiles> = {
        kind: 'ebayRequestFailed',
        ebayFailure,
      };
      const { sellerSession } = sellerSessionReturning(failedRequest);

      await expect(findSellerStandardsProfiles(sellerSession)).resolves.toBe(failedRequest);
    },
  );

  it.each(ebayFailures)(
    'passes $kind through unchanged when profile retrieval fails',
    async (ebayFailure) => {
      const failedRequest: EbayRequestCompletion<SellerStandardsProfile> = {
        kind: 'ebayRequestFailed',
        ebayFailure,
      };
      const { sellerSession } = sellerSessionReturning(failedRequest);

      await expect(
        getSellerStandardsProfile(sellerSession, sellerStandardsProfilePath),
      ).resolves.toBe(failedRequest);
    },
  );
});
