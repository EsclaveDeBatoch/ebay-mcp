import { describe, expect, it } from 'vitest';

import {
  getSubscription,
  getSubscriptionArgumentsSchema,
} from '@/ebay/sell/account/subscription.js';
import { sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

describe('Sell Account subscriptions', () => {
  it('accepts only exact eBay pagination query fields', () => {
    const subscriptionSelection = { continuation_token: 'NEXT-1', limit: '20' };

    expect(getSubscriptionArgumentsSchema.parse(subscriptionSelection)).toEqual(
      subscriptionSelection,
    );
    expect(() => getSubscriptionArgumentsSchema.parse({ continuationToken: 'NEXT-1' })).toThrow();
    expect(() => getSubscriptionArgumentsSchema.parse({ limit: '' })).toThrow();
  });

  it('sends both pagination fields without renaming them', async () => {
    const { sellerSession, getCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await getSubscription(sellerSession, { continuation_token: 'NEXT-1', limit: '20' });

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/account/v1/subscription',
        searchParameters: { continuation_token: 'NEXT-1', limit: '20' },
      },
    ]);
  });

  it('omits pagination fields that were not requested', async () => {
    const { sellerSession, getCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await getSubscription(sellerSession, {});
    await getSubscription(sellerSession, { limit: '10' });
    await getSubscription(sellerSession, { continuation_token: 'NEXT-2' });

    expect(getCalls).toEqual([
      { endpoint: '/sell/account/v1/subscription' },
      {
        endpoint: '/sell/account/v1/subscription',
        searchParameters: { limit: '10' },
      },
      {
        endpoint: '/sell/account/v1/subscription',
        searchParameters: { continuation_token: 'NEXT-2' },
      },
    ]);
  });
});
