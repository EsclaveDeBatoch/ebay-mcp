import { describe, expect, it } from 'vitest';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import {
  applicationRateLimitsDocument,
  userRateLimitsDocument,
} from '@tests/fixtures/rateLimits.js';

import {
  type DeveloperRateLimits,
  getRateLimits,
  getRateLimitsArgumentsSchema,
  getUserRateLimits,
  type RateLimitSearchArguments,
} from './rateLimit.js';

const rateLimitSearch: RateLimitSearchArguments = {
  api_context: 'sell',
  api_name: 'inventory',
};

describe('Developer Analytics rate-limit arguments', () => {
  it.each([{}, { api_context: 'sell' }, { api_name: 'inventory' }, rateLimitSearch])(
    'accepts exact optional eBay query fields',
    (acceptedRateLimitSearch) => {
      expect(getRateLimitsArgumentsSchema.parse(acceptedRateLimitSearch)).toEqual(
        acceptedRateLimitSearch,
      );
    },
  );

  it.each([
    { apiContext: 'sell' },
    { apiName: 'inventory' },
    { api_context: '' },
    { api_name: '' },
    { api_context: 'sell', cache: true },
  ])('rejects renamed, empty, or unknown fields', (invalidRateLimitSearch) => {
    expect(getRateLimitsArgumentsSchema.safeParse(invalidRateLimitSearch).success).toBe(false);
  });
});

describe('Developer Analytics rate-limit operations', () => {
  it('passes exact filters and preserves application limits', async () => {
    const successfulLookup: EbayRequestCompletion<DeveloperRateLimits> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: applicationRateLimitsDocument,
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulLookup);

    const lookupCompletion = await getRateLimits(sellerSession, rateLimitSearch);

    expect(getCalls).toEqual([
      {
        endpoint: '/developer/analytics/v1_beta/rate_limit/',
        searchParameters: rateLimitSearch,
      },
    ]);
    expect(lookupCompletion).toBe(successfulLookup);
  });

  it('passes an empty search document when application filters are omitted', async () => {
    const successfulLookup: EbayRequestCompletion<DeveloperRateLimits> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: applicationRateLimitsDocument,
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulLookup);

    await getRateLimits(sellerSession);

    expect(getCalls).toEqual([
      {
        endpoint: '/developer/analytics/v1_beta/rate_limit/',
        searchParameters: {},
      },
    ]);
  });

  it('passes exact filters and preserves user limits', async () => {
    const successfulLookup: EbayRequestCompletion<DeveloperRateLimits> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: userRateLimitsDocument,
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulLookup);

    const lookupCompletion = await getUserRateLimits(sellerSession, rateLimitSearch);

    expect(getCalls).toEqual([
      {
        endpoint: '/developer/analytics/v1_beta/user_rate_limit/',
        searchParameters: rateLimitSearch,
      },
    ]);
    expect(lookupCompletion).toBe(successfulLookup);
  });

  it.each(ebayFailures)('passes a $kind application-limit failure through', async (ebayFailure) => {
    const failedLookup: EbayRequestCompletion<DeveloperRateLimits> = {
      kind: 'ebayRequestFailed',
      ebayFailure,
    };
    const { sellerSession } = sellerSessionReturning(failedLookup);

    await expect(getRateLimits(sellerSession, rateLimitSearch)).resolves.toBe(failedLookup);
  });

  it.each(ebayFailures)('passes a $kind user-limit failure through', async (ebayFailure) => {
    const failedLookup: EbayRequestCompletion<DeveloperRateLimits> = {
      kind: 'ebayRequestFailed',
      ebayFailure,
    };
    const { sellerSession } = sellerSessionReturning(failedLookup);

    await expect(getUserRateLimits(sellerSession, rateLimitSearch)).resolves.toBe(failedLookup);
  });
});
