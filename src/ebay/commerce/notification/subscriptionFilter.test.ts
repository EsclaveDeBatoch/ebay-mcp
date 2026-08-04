import { describe, expect, it } from 'vitest';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { notificationSubscriptionFilterDocument } from '@tests/fixtures/notificationSubscriptionFilter.js';

import {
  createSubscriptionFilter,
  createSubscriptionFilterArgumentsSchema,
  deleteSubscriptionFilter,
  getSubscriptionFilter,
  type NotificationSubscriptionFilter,
  type SubscriptionFilterCreationConfirmation,
  type SubscriptionFilterLookupArguments,
  type SubscriptionFilterSubmission,
  subscriptionFilterIdsArgumentsSchema,
} from './subscriptionFilter.js';

const subscriptionFilterLookup: SubscriptionFilterLookupArguments = {
  filter_id: 'filter-123',
  subscription_id: 'subscription-123',
};
const subscriptionFilterSubmission: SubscriptionFilterSubmission = {
  subscription_id: 'subscription-123',
  filterSchema: {
    type: 'object',
    properties: {
      orderId: { type: 'string' },
    },
    required: ['orderId'],
  },
};

describe('Commerce Notification subscription-filter arguments', () => {
  it('accepts an exact JSON Schema document and snake_case subscription ID', () => {
    expect(createSubscriptionFilterArgumentsSchema.parse(subscriptionFilterSubmission)).toEqual(
      subscriptionFilterSubmission,
    );
  });

  it.each([
    {},
    { subscription_id: 'subscription-123' },
    { ...subscriptionFilterSubmission, subscription_id: '' },
    { ...subscriptionFilterSubmission, subscriptionId: 'subscription-123' },
    { ...subscriptionFilterSubmission, filterSchema: [] },
    { ...subscriptionFilterSubmission, filterSchema: { property: undefined } },
  ])('rejects missing, renamed, or non-JSON filter documents', (invalidFilterSubmission) => {
    expect(createSubscriptionFilterArgumentsSchema.safeParse(invalidFilterSubmission).success).toBe(
      false,
    );
  });

  it('accepts exact snake_case subscription and filter IDs', () => {
    expect(subscriptionFilterIdsArgumentsSchema.parse(subscriptionFilterLookup)).toEqual(
      subscriptionFilterLookup,
    );
  });

  it.each([
    {},
    { subscription_id: 'subscription-123', filter_id: '' },
    { subscription_id: '', filter_id: 'filter-123' },
    { subscriptionId: 'subscription-123', filterId: 'filter-123' },
  ])('rejects missing, empty, or renamed filter path fields', (invalidFilterLookup) => {
    expect(subscriptionFilterIdsArgumentsSchema.safeParse(invalidFilterLookup).success).toBe(false);
  });
});

describe('Commerce Notification subscription-filter operations', () => {
  it('keeps the subscription ID out of the POST document', async () => {
    const creationConfirmation: SubscriptionFilterCreationConfirmation = {};
    const successfulCreation: EbayRequestCompletion<SubscriptionFilterCreationConfirmation> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: creationConfirmation,
    };
    const { sellerSession, postCalls } = sellerSessionReturning(successfulCreation);

    const creationCompletion = await createSubscriptionFilter(
      sellerSession,
      subscriptionFilterSubmission,
    );

    expect(postCalls).toEqual([
      {
        endpoint: '/commerce/notification/v1/subscription/subscription-123/filter',
        requestDocument: { filterSchema: subscriptionFilterSubmission.filterSchema },
      },
    ]);
    expect(creationCompletion).toBe(successfulCreation);
  });

  it('encodes both IDs and returns the generated filter unchanged', async () => {
    const successfulLookup: EbayRequestCompletion<NotificationSubscriptionFilter> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: notificationSubscriptionFilterDocument,
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulLookup);

    const lookupCompletion = await getSubscriptionFilter(sellerSession, {
      filter_id: 'filter/123',
      subscription_id: 'subscription/123',
    });

    expect(getCalls).toEqual([
      {
        endpoint: '/commerce/notification/v1/subscription/subscription%2F123/filter/filter%2F123',
      },
    ]);
    expect(lookupCompletion).toBe(successfulLookup);
  });

  it('encodes both IDs before deletion', async () => {
    const successfulDeletion: EbayRequestCompletion<void> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    };
    const { sellerSession, deleteCalls } = sellerSessionReturning(successfulDeletion);

    const deletionCompletion = await deleteSubscriptionFilter(sellerSession, {
      filter_id: 'filter/123',
      subscription_id: 'subscription/123',
    });

    expect(deleteCalls).toEqual([
      {
        endpoint: '/commerce/notification/v1/subscription/subscription%2F123/filter/filter%2F123',
      },
    ]);
    expect(deletionCompletion).toBe(successfulDeletion);
  });

  it.each(ebayFailures)('passes a $kind create failure through', async (ebayFailure) => {
    const failedCreation: EbayRequestCompletion<SubscriptionFilterCreationConfirmation> = {
      kind: 'ebayRequestFailed',
      ebayFailure,
    };
    const { sellerSession } = sellerSessionReturning(failedCreation);

    await expect(
      createSubscriptionFilter(sellerSession, subscriptionFilterSubmission),
    ).resolves.toBe(failedCreation);
  });

  it.each(ebayFailures)('passes a $kind lookup failure through', async (ebayFailure) => {
    const failedLookup: EbayRequestCompletion<NotificationSubscriptionFilter> = {
      kind: 'ebayRequestFailed',
      ebayFailure,
    };
    const { sellerSession } = sellerSessionReturning(failedLookup);

    await expect(getSubscriptionFilter(sellerSession, subscriptionFilterLookup)).resolves.toBe(
      failedLookup,
    );
  });

  it.each(ebayFailures)('passes a $kind delete failure through', async (ebayFailure) => {
    const failedDeletion: EbayRequestCompletion<void> = {
      kind: 'ebayRequestFailed',
      ebayFailure,
    };
    const { sellerSession } = sellerSessionReturning(failedDeletion);

    await expect(deleteSubscriptionFilter(sellerSession, subscriptionFilterLookup)).resolves.toBe(
      failedDeletion,
    );
  });
});
