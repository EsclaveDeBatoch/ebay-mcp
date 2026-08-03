import { describe, expect, it } from 'vitest';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import {
  notificationSubscriptionDocument,
  notificationSubscriptionPageDocument,
} from '@tests/fixtures/notificationSubscription.js';

import {
  createSubscription,
  createSubscriptionArgumentsSchema,
  deleteSubscription,
  disableSubscription,
  enableSubscription,
  getSubscription,
  getSubscriptions,
  getSubscriptionsArgumentsSchema,
  type NotificationSubscription,
  type NotificationSubscriptionSubmission,
  type NotificationSubscriptionUpdate,
  type SubscriptionCreationConfirmation,
  type SubscriptionLookupArguments,
  type SubscriptionPage,
  type SubscriptionSearchArguments,
  subscriptionIdArgumentsSchema,
  testSubscription,
  updateSubscription,
  updateSubscriptionArgumentsSchema,
} from './subscription.js';

const subscriptionSearch: SubscriptionSearchArguments = {
  continuation_token: 'next-page',
  limit: '20',
};
const subscriptionLookup: SubscriptionLookupArguments = {
  subscription_id: 'subscription-123',
};
const subscriptionSubmission: NotificationSubscriptionSubmission = {
  destinationId: 'destination-123',
  payload: {
    deliveryProtocol: 'HTTPS',
    format: 'JSON',
    schemaVersion: '1.0',
  },
  status: 'ENABLED',
  topicId: 'MARKETPLACE_ACCOUNT_DELETION',
};
const subscriptionUpdate: NotificationSubscriptionUpdate = {
  subscription_id: 'subscription-123',
  destinationId: 'destination-456',
  payload: subscriptionSubmission.payload,
  status: 'DISABLED',
};

describe('Commerce Notification subscription arguments', () => {
  it('accepts exact subscription pagination fields', () => {
    expect(getSubscriptionsArgumentsSchema.parse(subscriptionSearch)).toEqual(subscriptionSearch);
    expect(getSubscriptionsArgumentsSchema.parse({ limit: '10' })).toEqual({ limit: '10' });
    expect(getSubscriptionsArgumentsSchema.parse({ limit: '100' })).toEqual({ limit: '100' });
  });

  it.each([
    { continuationToken: 'next-page' },
    { continuation_token: '' },
    { limit: 20 },
    { limit: '9' },
    { limit: '101' },
  ])('rejects renamed or invalid subscription pagination', (invalidSearch) => {
    expect(getSubscriptionsArgumentsSchema.safeParse(invalidSearch).success).toBe(false);
  });

  it('accepts the exact subscription path field', () => {
    expect(subscriptionIdArgumentsSchema.parse(subscriptionLookup)).toEqual(subscriptionLookup);
  });

  it.each([
    {},
    { subscription_id: '' },
    { subscriptionId: 'subscription-123' },
    { subscription_id: 'subscription-123', force: true },
  ])('rejects a missing, renamed, or unknown subscription path field', (invalidLookup) => {
    expect(subscriptionIdArgumentsSchema.safeParse(invalidLookup).success).toBe(false);
  });

  it('accepts complete create and update documents', () => {
    expect(createSubscriptionArgumentsSchema.parse(subscriptionSubmission)).toEqual(
      subscriptionSubmission,
    );
    expect(updateSubscriptionArgumentsSchema.parse(subscriptionUpdate)).toEqual(subscriptionUpdate);
  });

  it.each([
    {},
    { ...subscriptionSubmission, destinationId: '' },
    { ...subscriptionSubmission, topicId: '' },
    { ...subscriptionSubmission, status: 'PENDING' },
    {
      ...subscriptionSubmission,
      payload: { ...subscriptionSubmission.payload, deliveryProtocol: 'HTTP' },
    },
    {
      ...subscriptionSubmission,
      payload: { ...subscriptionSubmission.payload, format: 'XML' },
    },
    {
      ...subscriptionSubmission,
      payload: { ...subscriptionSubmission.payload, schemaVersion: '' },
    },
  ])('rejects an incomplete or unsupported subscription document', (invalidSubscription) => {
    expect(createSubscriptionArgumentsSchema.safeParse(invalidSubscription).success).toBe(false);
  });

  it('keeps topicId out of update documents', () => {
    expect(
      updateSubscriptionArgumentsSchema.safeParse({
        ...subscriptionUpdate,
        topicId: subscriptionSubmission.topicId,
      }).success,
    ).toBe(false);
  });
});

describe('Commerce Notification subscription operations', () => {
  it('retrieves the unchanged subscription page with exact pagination', async () => {
    const successfulSearch: EbayRequestCompletion<SubscriptionPage> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: notificationSubscriptionPageDocument,
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulSearch);

    const searchCompletion = await getSubscriptions(sellerSession, subscriptionSearch);

    expect(getCalls).toEqual([
      {
        endpoint: '/commerce/notification/v1/subscription',
        searchParameters: subscriptionSearch,
      },
    ]);
    expect(searchCompletion).toBe(successfulSearch);
  });

  it('posts the unchanged subscription document', async () => {
    const creationConfirmation: SubscriptionCreationConfirmation = {};
    const successfulCreation: EbayRequestCompletion<SubscriptionCreationConfirmation> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: creationConfirmation,
    };
    const { sellerSession, postCalls } = sellerSessionReturning(successfulCreation);

    const creationCompletion = await createSubscription(sellerSession, subscriptionSubmission);

    expect(postCalls).toEqual([
      {
        endpoint: '/commerce/notification/v1/subscription',
        requestDocument: subscriptionSubmission,
      },
    ]);
    expect(creationCompletion).toBe(successfulCreation);
  });

  it('encodes the subscription ID before lookup', async () => {
    const successfulLookup: EbayRequestCompletion<NotificationSubscription> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: notificationSubscriptionDocument,
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulLookup);

    const lookupCompletion = await getSubscription(sellerSession, {
      subscription_id: 'subscription/123',
    });

    expect(getCalls).toEqual([
      { endpoint: '/commerce/notification/v1/subscription/subscription%2F123' },
    ]);
    expect(lookupCompletion).toBe(successfulLookup);
  });

  it('keeps the subscription ID out of the PUT document', async () => {
    const successfulUpdate: EbayRequestCompletion<void> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    };
    const { sellerSession, putCalls } = sellerSessionReturning(successfulUpdate);

    const updateCompletion = await updateSubscription(sellerSession, subscriptionUpdate);

    expect(putCalls).toEqual([
      {
        endpoint: '/commerce/notification/v1/subscription/subscription-123',
        requestDocument: {
          destinationId: subscriptionUpdate.destinationId,
          payload: subscriptionUpdate.payload,
          status: subscriptionUpdate.status,
        },
      },
    ]);
    expect(updateCompletion).toBe(successfulUpdate);
  });

  it('encodes the subscription ID before deletion', async () => {
    const successfulDeletion: EbayRequestCompletion<void> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    };
    const { sellerSession, deleteCalls } = sellerSessionReturning(successfulDeletion);

    const deletionCompletion = await deleteSubscription(sellerSession, {
      subscription_id: 'subscription/123',
    });

    expect(deleteCalls).toEqual([
      { endpoint: '/commerce/notification/v1/subscription/subscription%2F123' },
    ]);
    expect(deletionCompletion).toBe(successfulDeletion);
  });

  it('posts each lifecycle action without a request document', async () => {
    const successfulAction: EbayRequestCompletion<void> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    };
    const { sellerSession, postCalls } = sellerSessionReturning(successfulAction);

    const disableCompletion = await disableSubscription(sellerSession, subscriptionLookup);
    const enableCompletion = await enableSubscription(sellerSession, subscriptionLookup);
    const testCompletion = await testSubscription(sellerSession, subscriptionLookup);

    expect(postCalls).toEqual([
      { endpoint: '/commerce/notification/v1/subscription/subscription-123/disable' },
      { endpoint: '/commerce/notification/v1/subscription/subscription-123/enable' },
      { endpoint: '/commerce/notification/v1/subscription/subscription-123/test' },
    ]);
    expect(disableCompletion).toBe(successfulAction);
    expect(enableCompletion).toBe(successfulAction);
    expect(testCompletion).toBe(successfulAction);
  });

  it.each(ebayFailures)('passes a $kind list failure through', async (ebayFailure) => {
    const failedSearch: EbayRequestCompletion<SubscriptionPage> = {
      kind: 'ebayRequestFailed',
      ebayFailure,
    };
    const { sellerSession } = sellerSessionReturning(failedSearch);

    await expect(getSubscriptions(sellerSession, subscriptionSearch)).resolves.toBe(failedSearch);
  });

  it.each(ebayFailures)('passes a $kind create failure through', async (ebayFailure) => {
    const failedCreation: EbayRequestCompletion<SubscriptionCreationConfirmation> = {
      kind: 'ebayRequestFailed',
      ebayFailure,
    };
    const { sellerSession } = sellerSessionReturning(failedCreation);

    await expect(createSubscription(sellerSession, subscriptionSubmission)).resolves.toBe(
      failedCreation,
    );
  });

  it.each(ebayFailures)('passes a $kind lookup failure through', async (ebayFailure) => {
    const failedLookup: EbayRequestCompletion<NotificationSubscription> = {
      kind: 'ebayRequestFailed',
      ebayFailure,
    };
    const { sellerSession } = sellerSessionReturning(failedLookup);

    await expect(getSubscription(sellerSession, subscriptionLookup)).resolves.toBe(failedLookup);
  });

  it.each(ebayFailures)('passes a $kind update failure through', async (ebayFailure) => {
    const failedUpdate: EbayRequestCompletion<void> = {
      kind: 'ebayRequestFailed',
      ebayFailure,
    };
    const { sellerSession } = sellerSessionReturning(failedUpdate);

    await expect(updateSubscription(sellerSession, subscriptionUpdate)).resolves.toBe(failedUpdate);
  });

  it.each(ebayFailures)('passes a $kind delete failure through', async (ebayFailure) => {
    const failedDeletion: EbayRequestCompletion<void> = {
      kind: 'ebayRequestFailed',
      ebayFailure,
    };
    const { sellerSession } = sellerSessionReturning(failedDeletion);

    await expect(deleteSubscription(sellerSession, subscriptionLookup)).resolves.toBe(
      failedDeletion,
    );
  });

  it.each(ebayFailures)('passes a $kind disable failure through', async (ebayFailure) => {
    const failedDisable: EbayRequestCompletion<void> = {
      kind: 'ebayRequestFailed',
      ebayFailure,
    };
    const { sellerSession } = sellerSessionReturning(failedDisable);

    await expect(disableSubscription(sellerSession, subscriptionLookup)).resolves.toBe(
      failedDisable,
    );
  });

  it.each(ebayFailures)('passes a $kind enable failure through', async (ebayFailure) => {
    const failedEnable: EbayRequestCompletion<void> = {
      kind: 'ebayRequestFailed',
      ebayFailure,
    };
    const { sellerSession } = sellerSessionReturning(failedEnable);

    await expect(enableSubscription(sellerSession, subscriptionLookup)).resolves.toBe(failedEnable);
  });

  it.each(ebayFailures)('passes a $kind test failure through', async (ebayFailure) => {
    const failedTest: EbayRequestCompletion<void> = {
      kind: 'ebayRequestFailed',
      ebayFailure,
    };
    const { sellerSession } = sellerSessionReturning(failedTest);

    await expect(testSubscription(sellerSession, subscriptionLookup)).resolves.toBe(failedTest);
  });
});
