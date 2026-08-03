import { describe, expect, it } from 'vitest';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { notificationConfigurationDocument } from '@tests/fixtures/notificationConfiguration.js';

import {
  getConfig,
  getConfigArgumentsSchema,
  type NotificationConfiguration,
  type NotificationConfigurationUpdate,
  updateConfig,
  updateConfigArgumentsSchema,
} from './configuration.js';

const notificationConfiguration: NotificationConfigurationUpdate = {
  alertEmail: 'alerts@example.com',
};

describe('Commerce Notification configuration arguments', () => {
  it('accepts only an empty getConfig document', () => {
    expect(getConfigArgumentsSchema.parse({})).toEqual({});
    expect(() => getConfigArgumentsSchema.parse({ includeHistory: true })).toThrow();
  });

  it('accepts the exact eBay alert configuration', () => {
    expect(updateConfigArgumentsSchema.parse(notificationConfiguration)).toEqual(
      notificationConfiguration,
    );
  });

  it.each([
    {},
    { alertEmail: '' },
    { alertEmail: 'not-an-email' },
    { alertEmail: 'alerts@example.com', enabled: true },
  ])('rejects a missing, invalid, or unknown configuration field', (invalidConfiguration) => {
    expect(updateConfigArgumentsSchema.safeParse(invalidConfiguration).success).toBe(false);
  });
});

describe('Commerce Notification configuration operations', () => {
  it('retrieves the unchanged generated configuration', async () => {
    const successfulLookup: EbayRequestCompletion<NotificationConfiguration> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: notificationConfigurationDocument,
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulLookup);

    const lookupCompletion = await getConfig(sellerSession);

    expect(getCalls).toEqual([{ endpoint: '/commerce/notification/v1/config' }]);
    expect(lookupCompletion).toBe(successfulLookup);
  });

  it('puts the unchanged alert configuration at the official endpoint', async () => {
    const successfulUpdate: EbayRequestCompletion<void> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    };
    const { sellerSession, putCalls } = sellerSessionReturning(successfulUpdate);

    const updateCompletion = await updateConfig(sellerSession, notificationConfiguration);

    expect(putCalls).toEqual([
      {
        endpoint: '/commerce/notification/v1/config',
        requestDocument: notificationConfiguration,
      },
    ]);
    expect(updateCompletion).toBe(successfulUpdate);
  });

  it.each(ebayFailures)('passes a $kind lookup failure through', async (ebayFailure) => {
    const failedLookup: EbayRequestCompletion<NotificationConfiguration> = {
      kind: 'ebayRequestFailed',
      ebayFailure,
    };
    const { sellerSession } = sellerSessionReturning(failedLookup);

    await expect(getConfig(sellerSession)).resolves.toBe(failedLookup);
  });

  it.each(ebayFailures)('passes a $kind update failure through', async (ebayFailure) => {
    const failedUpdate: EbayRequestCompletion<void> = {
      kind: 'ebayRequestFailed',
      ebayFailure,
    };
    const { sellerSession } = sellerSessionReturning(failedUpdate);

    await expect(updateConfig(sellerSession, notificationConfiguration)).resolves.toBe(
      failedUpdate,
    );
  });
});
