import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Effect } from 'effect';
import { DeveloperApi } from '@/api/developer/developer.js';
import { invalidInput } from '@tests/helpers/invalidInput.js';
import type { EbayApiClient } from '@/api/client.js';

describe('DeveloperApi', () => {
  let client: EbayApiClient;
  let api: DeveloperApi;

  beforeEach(() => {
    client = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    } as unknown as EbayApiClient;
    api = new DeveloperApi(client);
  });

  describe('getSigningKeys', () => {
    it('get all signing keys', async () => {
      const mockResponse = {
        signingKeys: [
          {
            signingKeyId: 'key_001',
            creationTime: '2024-01-01T00:00:00.000Z',
            expirationTime: '2025-01-01T00:00:00.000Z',
            jwe: 'eyJhbGciOiJSU0EtT0FFUCIsImVuYyI6IkEyNTZHQ00ifQ...',
            publicKey: '-----BEGIN PUBLIC KEY-----\nMIIB...',
          },
          {
            signingKeyId: 'key_002',
            creationTime: '2024-06-01T00:00:00.000Z',
            expirationTime: '2025-06-01T00:00:00.000Z',
            jwe: 'eyJhbGciOiJSU0EtT0FFUCIsImVuYyI6IkEyNTZHQ00ifQ...',
            publicKey: '-----BEGIN PUBLIC KEY-----\nMIIC...',
          },
        ],
      };

      vi.mocked(client.get).mockResolvedValue(mockResponse);

      const result = await Effect.runPromise(api.getSigningKeys({}));

      expect(client.get).toHaveBeenCalledWith('/developer/key_management/v1/signing_key');
      expect(result).toEqual(mockResponse);
      expect(result.signingKeys).toHaveLength(2);
    });

    it('return empty array when no signing keys exist', async () => {
      const mockResponse = { signingKeys: [] };
      vi.mocked(client.get).mockResolvedValue(mockResponse);

      const result = await Effect.runPromise(api.getSigningKeys({}));

      expect(client.get).toHaveBeenCalledWith('/developer/key_management/v1/signing_key');
      expect(result.signingKeys).toHaveLength(0);
    });
  });

  describe('createSigningKey', () => {
    it('create a signing key without request body', async () => {
      const mockResponse = {
        signingKeyId: 'new_key_123',
        creationTime: '2024-01-15T12:00:00.000Z',
        expirationTime: '2025-01-15T12:00:00.000Z',
        jwe: 'eyJhbGciOiJSU0EtT0FFUCIsImVuYyI6IkEyNTZHQ00ifQ...',
        publicKey: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...',
        privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAAOCAQ8A...',
      };

      vi.mocked(client.post).mockResolvedValue(mockResponse);

      const result = await Effect.runPromise(api.createSigningKey({}));

      expect(client.post).toHaveBeenCalledWith('/developer/key_management/v1/signing_key', {});
      expect(result).toEqual(mockResponse);
      expect(result.signingKeyId).toBe('new_key_123');
    });

    it('create a signing key with request body', async () => {
      const input = {
        request: {
          signingKeyCipher: 'RSA',
        },
      };

      const mockResponse = {
        signingKeyId: 'rsa_key_456',
        creationTime: '2024-01-15T12:00:00.000Z',
        expirationTime: '2025-01-15T12:00:00.000Z',
        jwe: 'eyJhbGciOiJSU0EtT0FFUCIsImVuYyI6IkEyNTZHQ00ifQ...',
        publicKey: '-----BEGIN PUBLIC KEY-----\nMIIBIjAN...',
      };

      vi.mocked(client.post).mockResolvedValue(mockResponse);

      const result = await Effect.runPromise(api.createSigningKey(input));

      expect(client.post).toHaveBeenCalledWith(
        '/developer/key_management/v1/signing_key',
        input.request,
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getSigningKey', () => {
    it('get a specific signing key by ID', async () => {
      const mockResponse = {
        signingKeyId: 'key_001',
        creationTime: '2024-01-01T00:00:00.000Z',
        expirationTime: '2025-01-01T00:00:00.000Z',
        jwe: 'eyJhbGciOiJSU0EtT0FFUCIsImVuYyI6IkEyNTZHQ00ifQ...',
        publicKey: '-----BEGIN PUBLIC KEY-----\nMIIBIjAN...',
      };

      vi.mocked(client.get).mockResolvedValue(mockResponse);

      const result = await Effect.runPromise(api.getSigningKey({ signingKeyId: 'key_001' }));

      expect(client.get).toHaveBeenCalledWith('/developer/key_management/v1/signing_key/key_001');
      expect(result).toEqual(mockResponse);
      expect(result.signingKeyId).toBe('key_001');
    });

    it('returns typed input error when signingKeyId is empty', async () => {
      const error = await Effect.runPromise(Effect.flip(api.getSigningKey({ signingKeyId: '' })));

      expect(error).toMatchObject({ _tag: 'EndpointInputError', parameter: 'signingKeyId' });
    });

    it('returns typed input error when signingKeyId is null', async () => {
      const error = await Effect.runPromise(
        Effect.flip(api.getSigningKey(invalidInput({ signingKeyId: null }))),
      );

      expect(error).toMatchObject({ _tag: 'EndpointInputError', parameter: 'signingKeyId' });
    });

    it('returns typed input error when input is undefined', async () => {
      const error = await Effect.runPromise(
        Effect.flip(api.getSigningKey(invalidInput(undefined))),
      );

      expect(error).toMatchObject({ _tag: 'EndpointInputError', parameter: 'input' });
    });

    it('returns typed input error when signingKeyId is not a string', async () => {
      const error = await Effect.runPromise(
        Effect.flip(api.getSigningKey(invalidInput({ signingKeyId: 123 }))),
      );

      expect(error).toMatchObject({ _tag: 'EndpointInputError', parameter: 'signingKeyId' });
    });

    it('handle API errors when getting signing key', async () => {
      vi.mocked(client.get).mockRejectedValue(new Error('Key not found'));

      const error = await Effect.runPromise(
        Effect.flip(api.getSigningKey({ signingKeyId: 'nonexistent_key' })),
      );

      expect(error._tag).toBe('EbayApiError');
    });
  });

  describe('error handling', () => {
    it('propagate errors from getSigningKeys', async () => {
      vi.mocked(client.get).mockRejectedValue(new Error('Key management API unavailable'));

      const error = await Effect.runPromise(Effect.flip(api.getSigningKeys({})));

      expect(error._tag).toBe('EbayApiError');
    });

    it('propagate errors from createSigningKey', async () => {
      vi.mocked(client.post).mockRejectedValue(new Error('Key creation failed'));

      const error = await Effect.runPromise(Effect.flip(api.createSigningKey({})));

      expect(error._tag).toBe('EbayApiError');
    });
  });
});
