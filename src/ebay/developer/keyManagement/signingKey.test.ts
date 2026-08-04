import { describe, expect, it } from 'vitest';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import {
  retrievableSigningKeyDocument,
  signingKeyCollectionDocument,
  signingKeyDocument,
} from '@tests/fixtures/signingKeys.js';

import {
  createSigningKey,
  createSigningKeyArgumentsSchema,
  type DeveloperSigningKey,
  type DeveloperSigningKeyCollection,
  getSigningKey,
  getSigningKeyArgumentsSchema,
  getSigningKeys,
  getSigningKeysArgumentsSchema,
  type SigningKeyCreationArguments,
} from './signingKey.js';

const signingKeyCreation: SigningKeyCreationArguments = {
  signingKeyCipher: 'ED25519',
};

describe('Developer Key Management signing-key arguments', () => {
  it('accepts only an empty getSigningKeys document', () => {
    expect(getSigningKeysArgumentsSchema.parse({})).toEqual({});
    expect(getSigningKeysArgumentsSchema.safeParse({ includeExpired: true }).success).toBe(false);
  });

  it.each([{}, { signingKeyCipher: 'ED25519' }, { signingKeyCipher: 'RSA' }])(
    'accepts an exact supported signing-key creation document',
    (acceptedSigningKeyCreation) => {
      expect(createSigningKeyArgumentsSchema.parse(acceptedSigningKeyCreation)).toEqual(
        acceptedSigningKeyCreation,
      );
    },
  );

  it.each([
    { signingKeyCipher: 'DSA' },
    { signingKeyCipher: '' },
    { signingKeyCipher: 'RSA', storePrivateKey: true },
    { request: { signingKeyCipher: 'RSA' } },
  ])('rejects an unsupported, unknown, or wrapped creation field', (invalidSigningKeyCreation) => {
    expect(createSigningKeyArgumentsSchema.safeParse(invalidSigningKeyCreation).success).toBe(
      false,
    );
  });

  it('accepts the exact eBay signing-key path field', () => {
    const signingKeyLookup = { signing_key_id: 'signing-key-123' };

    expect(getSigningKeyArgumentsSchema.parse(signingKeyLookup)).toEqual(signingKeyLookup);
  });

  it.each([
    {},
    { signing_key_id: '' },
    { signingKeyId: 'signing-key-123' },
    { signing_key_id: 'signing-key-123', includePrivateKey: true },
  ])('rejects a missing, empty, renamed, or unknown lookup field', (invalidSigningKeyLookup) => {
    expect(getSigningKeyArgumentsSchema.safeParse(invalidSigningKeyLookup).success).toBe(false);
  });
});

describe('Developer Key Management signing-key operations', () => {
  it('retrieves the unchanged signing-key collection from the apiz host', async () => {
    const successfulLookup: EbayRequestCompletion<DeveloperSigningKeyCollection> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: signingKeyCollectionDocument,
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulLookup);

    const lookupCompletion = await getSigningKeys(sellerSession);

    expect(getCalls).toEqual([
      {
        apiHost: 'apiz',
        endpoint: '/developer/key_management/v1/signing_key',
      },
    ]);
    expect(lookupCompletion).toBe(successfulLookup);
  });

  it('posts the unchanged signing-key creation document to the apiz host', async () => {
    const successfulCreation: EbayRequestCompletion<DeveloperSigningKey> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: signingKeyDocument,
    };
    const { sellerSession, postCalls } = sellerSessionReturning(successfulCreation);

    const creationCompletion = await createSigningKey(sellerSession, signingKeyCreation);

    expect(postCalls).toEqual([
      {
        apiHost: 'apiz',
        endpoint: '/developer/key_management/v1/signing_key',
        requestDocument: signingKeyCreation,
      },
    ]);
    expect(creationCompletion).toBe(successfulCreation);
  });

  it('retrieves one unchanged key through an encoded exact path field', async () => {
    const successfulLookup: EbayRequestCompletion<DeveloperSigningKey> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: retrievableSigningKeyDocument,
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulLookup);

    const lookupCompletion = await getSigningKey(sellerSession, {
      signing_key_id: 'signing/key 123',
    });

    expect(getCalls).toEqual([
      {
        apiHost: 'apiz',
        endpoint: '/developer/key_management/v1/signing_key/signing%2Fkey%20123',
      },
    ]);
    expect(lookupCompletion).toBe(successfulLookup);
  });

  it.each(ebayFailures)('passes a $kind collection failure through', async (ebayFailure) => {
    const failedLookup: EbayRequestCompletion<DeveloperSigningKeyCollection> = {
      kind: 'ebayRequestFailed',
      ebayFailure,
    };
    const { sellerSession } = sellerSessionReturning(failedLookup);

    await expect(getSigningKeys(sellerSession)).resolves.toBe(failedLookup);
  });

  it.each(ebayFailures)('passes a $kind creation failure through', async (ebayFailure) => {
    const failedCreation: EbayRequestCompletion<DeveloperSigningKey> = {
      kind: 'ebayRequestFailed',
      ebayFailure,
    };
    const { sellerSession } = sellerSessionReturning(failedCreation);

    await expect(createSigningKey(sellerSession, signingKeyCreation)).resolves.toBe(failedCreation);
  });

  it.each(ebayFailures)('passes a $kind single-key failure through', async (ebayFailure) => {
    const failedLookup: EbayRequestCompletion<DeveloperSigningKey> = {
      kind: 'ebayRequestFailed',
      ebayFailure,
    };
    const { sellerSession } = sellerSessionReturning(failedLookup);

    await expect(getSigningKey(sellerSession, { signing_key_id: 'signing-key-123' })).resolves.toBe(
      failedLookup,
    );
  });
});
