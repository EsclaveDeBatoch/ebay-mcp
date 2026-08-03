import { describe, expect, it } from 'vitest';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { ebayUserDocument } from '@tests/fixtures/ebayUser.js';

import { type EbayUser, getUser, getUserArgumentsSchema } from './user.js';

describe('Commerce Identity get-user arguments', () => {
  it('accepts only the official empty argument object', () => {
    expect(getUserArgumentsSchema.parse({})).toEqual({});
    expect(getUserArgumentsSchema.safeParse({ userId: 'another-user' }).success).toBe(false);
  });
});

describe('Commerce Identity user operation', () => {
  it('gets the authenticated user from the official Identity API host and endpoint', async () => {
    const successfulIdentityLookup: EbayRequestCompletion<EbayUser> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: ebayUserDocument,
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulIdentityLookup);

    const identityLookupCompletion = await getUser(sellerSession);

    expect(getCalls).toEqual([
      {
        apiHost: 'identity',
        endpoint: '/commerce/identity/v1/user/',
      },
    ]);
    expect(identityLookupCompletion).toBe(successfulIdentityLookup);
  });

  it.each(ebayFailures)('passes the $kind completion through unchanged', async (ebayFailure) => {
    const failedIdentityLookup: EbayRequestCompletion<EbayUser> = {
      kind: 'ebayRequestFailed',
      ebayFailure,
    };
    const { sellerSession } = sellerSessionReturning(failedIdentityLookup);

    await expect(getUser(sellerSession)).resolves.toBe(failedIdentityLookup);
  });
});
