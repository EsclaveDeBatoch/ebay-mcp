import { describe, expect, it } from 'vitest';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { notificationPublicKeyDocument } from '@tests/fixtures/notificationPublicKey.js';

import {
  getPublicKey,
  getPublicKeyArgumentsSchema,
  type NotificationPublicKey,
  type PublicKeyLookupArguments,
} from './publicKey.js';

const publicKeyLookup: PublicKeyLookupArguments = {
  public_key_id: 'key-123',
};

describe('Commerce Notification public-key arguments', () => {
  it('accepts the exact eBay path field', () => {
    expect(getPublicKeyArgumentsSchema.parse(publicKeyLookup)).toEqual(publicKeyLookup);
  });

  it.each([
    {},
    { public_key_id: '' },
    { publicKeyId: 'key-123' },
    { public_key_id: 'key-123', cache: true },
  ])('rejects a missing, renamed, or unknown public-key field', (invalidLookup) => {
    expect(getPublicKeyArgumentsSchema.safeParse(invalidLookup).success).toBe(false);
  });
});

describe('Commerce Notification public-key operation', () => {
  it('encodes the key ID and returns the generated document unchanged', async () => {
    const successfulLookup: EbayRequestCompletion<NotificationPublicKey> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: notificationPublicKeyDocument,
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulLookup);

    const lookupCompletion = await getPublicKey(sellerSession, {
      public_key_id: 'key/123',
    });

    expect(getCalls).toEqual([{ endpoint: '/commerce/notification/v1/public_key/key%2F123' }]);
    expect(lookupCompletion).toBe(successfulLookup);
  });

  it.each(ebayFailures)('passes a $kind lookup failure through', async (ebayFailure) => {
    const failedLookup: EbayRequestCompletion<NotificationPublicKey> = {
      kind: 'ebayRequestFailed',
      ebayFailure,
    };
    const { sellerSession } = sellerSessionReturning(failedLookup);

    await expect(getPublicKey(sellerSession, publicKeyLookup)).resolves.toBe(failedLookup);
  });
});
