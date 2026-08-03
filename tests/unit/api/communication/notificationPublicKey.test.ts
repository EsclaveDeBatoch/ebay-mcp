import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { EbayApiClient } from '@/api/client.js';
import { NotificationApi } from '@/api/communication/notification.js';
import { Effect } from 'effect';

const authenticatedClient = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
} as unknown as EbayApiClient;

const notificationApi = new NotificationApi(authenticatedClient);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getPublicKey', () => {
  it('gets a public key by ID', async () => {
    vi.mocked(authenticatedClient.get).mockResolvedValue({ publicKey: 'key123' });

    await Effect.runPromise(notificationApi.getPublicKey({ publicKeyId: 'key123' }));

    expect(authenticatedClient.get).toHaveBeenCalledWith(
      '/commerce/notification/v1/public_key/key123',
    );
  });

  it('rejects a missing public key ID', async () => {
    const endpointFailure = await Effect.runPromise(
      Effect.flip(notificationApi.getPublicKey({ publicKeyId: '' })),
    );

    expect(endpointFailure._tag).toBe('EndpointInputError');
    expect(endpointFailure.message).toContain('publicKeyId is required');
  });
});
