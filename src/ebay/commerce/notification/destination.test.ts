import { describe, expect, it } from 'vitest';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import {
  destinationDocument,
  destinationPageDocument,
} from '@tests/fixtures/notificationDestination.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

import {
  createDestination,
  createDestinationArgumentsSchema,
  deleteDestination,
  deleteDestinationArgumentsSchema,
  getDestination,
  getDestinationArgumentsSchema,
  getDestinations,
  getDestinationsArgumentsSchema,
  type DestinationCreationConfirmation,
  type DestinationDeleteArguments,
  type DestinationLookupArguments,
  type DestinationPage,
  type DestinationSearchArguments,
  type NotificationDestination,
  type NotificationDestinationSubmission,
  type NotificationDestinationUpdate,
  updateDestination,
  updateDestinationArgumentsSchema,
} from './destination.js';

const verificationToken = 'notification_token_1234567890abcdef';
const destinationSubmission: NotificationDestinationSubmission = {
  deliveryConfig: {
    endpoint: 'https://notifications.example.com/ebay',
    verificationToken,
  },
  name: 'Order events',
  status: 'ENABLED',
};
const destinationUpdate: NotificationDestinationUpdate = {
  destination_id: 'destination-123',
  ...destinationSubmission,
  status: 'DISABLED',
};
const destinationLookup: DestinationLookupArguments = {
  destination_id: 'destination-123',
};
const destinationDeletion: DestinationDeleteArguments = {
  destination_id: 'destination-123',
};
const destinationSearch: DestinationSearchArguments = {
  continuation_token: 'next-destination-page',
  limit: '20',
};

describe('Commerce Notification destination arguments', () => {
  it('accepts exact destination pagination fields', () => {
    expect(getDestinationsArgumentsSchema.parse(destinationSearch)).toEqual(destinationSearch);
    expect(getDestinationsArgumentsSchema.parse({ limit: '10' })).toEqual({ limit: '10' });
    expect(getDestinationsArgumentsSchema.parse({ limit: '100' })).toEqual({ limit: '100' });
  });

  it.each([
    { continuationToken: 'next-destination-page' },
    { continuation_token: '' },
    { limit: 20 },
    { limit: '9' },
    { limit: '101' },
  ])('rejects renamed or invalid destination pagination', (invalidSearch) => {
    expect(getDestinationsArgumentsSchema.safeParse(invalidSearch).success).toBe(false);
  });

  it('accepts the exact destination path field for lookup and deletion', () => {
    expect(getDestinationArgumentsSchema.parse(destinationLookup)).toEqual(destinationLookup);
    expect(deleteDestinationArgumentsSchema.parse(destinationDeletion)).toEqual(
      destinationDeletion,
    );
  });

  it.each([
    {},
    { destination_id: '' },
    { destinationId: 'destination-123' },
    { destination_id: 'destination-123', force: true },
  ])('rejects a missing, renamed, or unknown destination path field', (invalidLookup) => {
    expect(getDestinationArgumentsSchema.safeParse(invalidLookup).success).toBe(false);
    expect(deleteDestinationArgumentsSchema.safeParse(invalidLookup).success).toBe(false);
  });

  it('accepts complete create and update documents', () => {
    expect(createDestinationArgumentsSchema.parse(destinationSubmission)).toEqual(
      destinationSubmission,
    );
    expect(updateDestinationArgumentsSchema.parse(destinationUpdate)).toEqual(destinationUpdate);
  });

  it('allows a destination name to be omitted', () => {
    const unnamedDestination: NotificationDestinationSubmission = {
      deliveryConfig: destinationSubmission.deliveryConfig,
      status: destinationSubmission.status,
    };

    expect(createDestinationArgumentsSchema.parse(unnamedDestination)).toEqual(unnamedDestination);
  });

  it.each([
    {},
    { status: 'ENABLED' },
    {
      deliveryConfig: { endpoint: 'https://notifications.example.com/ebay' },
      status: 'ENABLED',
    },
    {
      deliveryConfig: { verificationToken },
      status: 'ENABLED',
    },
  ])('rejects missing required destination delivery fields', (incompleteDestination) => {
    expect(createDestinationArgumentsSchema.safeParse(incompleteDestination).success).toBe(false);
  });

  it.each([
    'http://notifications.example.com/ebay',
    'https://localhost/ebay',
    'https://notifications.example.com/localhost',
    'https://127.0.0.1/ebay',
    'https://10.0.0.1/ebay',
    'https://172.16.0.1/ebay',
    'https://192.168.0.1/ebay',
  ])('rejects an unsafe delivery endpoint %s', (unsafeEndpoint) => {
    expect(
      createDestinationArgumentsSchema.safeParse({
        ...destinationSubmission,
        deliveryConfig: {
          ...destinationSubmission.deliveryConfig,
          endpoint: unsafeEndpoint,
        },
      }).success,
    ).toBe(false);
  });

  it.each(['short-token', 'x'.repeat(81), 'notification token 1234567890abcdef'])(
    'rejects an invalid verification token',
    (invalidVerificationToken) => {
      expect(
        createDestinationArgumentsSchema.safeParse({
          ...destinationSubmission,
          deliveryConfig: {
            ...destinationSubmission.deliveryConfig,
            verificationToken: invalidVerificationToken,
          },
        }).success,
      ).toBe(false);
    },
  );

  it.each([
    { ...destinationSubmission, status: 'MARKED_DOWN' },
    { ...destinationSubmission, name: '' },
    { ...destinationSubmission, name: 'x'.repeat(65) },
    { ...destinationSubmission, name: '<b>Webhook</b>' },
  ])('rejects unsupported status or name values', (invalidDestination) => {
    expect(createDestinationArgumentsSchema.safeParse(invalidDestination).success).toBe(false);
  });

  it('requires the destination path only on update', () => {
    expect(
      updateDestinationArgumentsSchema.safeParse({
        ...destinationSubmission,
        destinationId: 'destination-123',
      }).success,
    ).toBe(false);
    expect(
      createDestinationArgumentsSchema.safeParse({
        ...destinationSubmission,
        destination_id: 'destination-123',
      }).success,
    ).toBe(false);
  });
});

describe('Commerce Notification destination operations', () => {
  it('retrieves the unchanged destination page with exact pagination', async () => {
    const successfulSearch: EbayRequestCompletion<DestinationPage> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: destinationPageDocument,
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulSearch);

    const searchCompletion = await getDestinations(sellerSession, destinationSearch);

    expect(getCalls).toEqual([
      {
        endpoint: '/commerce/notification/v1/destination',
        searchParameters: destinationSearch,
      },
    ]);
    expect(searchCompletion).toBe(successfulSearch);
  });

  it('encodes a destination ID before lookup', async () => {
    const successfulLookup: EbayRequestCompletion<NotificationDestination> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: destinationDocument,
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulLookup);

    const lookupCompletion = await getDestination(sellerSession, {
      destination_id: 'destination/123',
    });

    expect(getCalls).toEqual([
      { endpoint: '/commerce/notification/v1/destination/destination%2F123' },
    ]);
    expect(lookupCompletion).toBe(successfulLookup);
  });

  it('posts the unchanged destination document', async () => {
    const destinationConfirmation: DestinationCreationConfirmation = {};
    const successfulCreation: EbayRequestCompletion<DestinationCreationConfirmation> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: destinationConfirmation,
    };
    const { sellerSession, postCalls } = sellerSessionReturning(successfulCreation);

    const creationCompletion = await createDestination(sellerSession, destinationSubmission);

    expect(postCalls).toEqual([
      {
        endpoint: '/commerce/notification/v1/destination',
        requestDocument: destinationSubmission,
      },
    ]);
    expect(creationCompletion).toBe(successfulCreation);
  });

  it('keeps the destination ID out of the PUT document', async () => {
    const successfulUpdate: EbayRequestCompletion<void> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    };
    const { sellerSession, putCalls } = sellerSessionReturning(successfulUpdate);

    const updateCompletion = await updateDestination(sellerSession, destinationUpdate);

    expect(putCalls).toEqual([
      {
        endpoint: '/commerce/notification/v1/destination/destination-123',
        requestDocument: {
          deliveryConfig: destinationSubmission.deliveryConfig,
          name: destinationSubmission.name,
          status: 'DISABLED',
        },
      },
    ]);
    expect(updateCompletion).toBe(successfulUpdate);
  });

  it('encodes a destination ID before deletion', async () => {
    const successfulDeletion: EbayRequestCompletion<void> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    };
    const { sellerSession, deleteCalls } = sellerSessionReturning(successfulDeletion);

    const deletionCompletion = await deleteDestination(sellerSession, {
      destination_id: 'destination/123',
    });

    expect(deleteCalls).toEqual([
      { endpoint: '/commerce/notification/v1/destination/destination%2F123' },
    ]);
    expect(deletionCompletion).toBe(successfulDeletion);
  });

  it.each(ebayFailures)('passes a $kind list failure through', async (ebayFailure) => {
    const failedSearch: EbayRequestCompletion<DestinationPage> = {
      kind: 'ebayRequestFailed',
      ebayFailure,
    };
    const { sellerSession } = sellerSessionReturning(failedSearch);

    await expect(getDestinations(sellerSession, destinationSearch)).resolves.toBe(failedSearch);
  });

  it.each(ebayFailures)('passes a $kind lookup failure through', async (ebayFailure) => {
    const failedLookup: EbayRequestCompletion<NotificationDestination> = {
      kind: 'ebayRequestFailed',
      ebayFailure,
    };
    const { sellerSession } = sellerSessionReturning(failedLookup);

    await expect(getDestination(sellerSession, destinationLookup)).resolves.toBe(failedLookup);
  });

  it.each(ebayFailures)('passes a $kind create failure through', async (ebayFailure) => {
    const failedCreation: EbayRequestCompletion<DestinationCreationConfirmation> = {
      kind: 'ebayRequestFailed',
      ebayFailure,
    };
    const { sellerSession } = sellerSessionReturning(failedCreation);

    await expect(createDestination(sellerSession, destinationSubmission)).resolves.toBe(
      failedCreation,
    );
  });

  it.each(ebayFailures)('passes a $kind update failure through', async (ebayFailure) => {
    const failedUpdate: EbayRequestCompletion<void> = {
      kind: 'ebayRequestFailed',
      ebayFailure,
    };
    const { sellerSession } = sellerSessionReturning(failedUpdate);

    await expect(updateDestination(sellerSession, destinationUpdate)).resolves.toBe(failedUpdate);
  });

  it.each(ebayFailures)('passes a $kind delete failure through', async (ebayFailure) => {
    const failedDeletion: EbayRequestCompletion<void> = {
      kind: 'ebayRequestFailed',
      ebayFailure,
    };
    const { sellerSession } = sellerSessionReturning(failedDeletion);

    await expect(deleteDestination(sellerSession, destinationDeletion)).resolves.toBe(
      failedDeletion,
    );
  });
});
