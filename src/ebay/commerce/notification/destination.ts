import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type {
  components,
  operations,
} from '@/generated/ebay/sell-apps/communication/commerceNotificationV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';

const privateDestinationHostPatterns = [
  /(?:^|\.)localhost$/,
  /^127\./,
  /^10\./,
  /^172\.(?:1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^\[?::1\]?$/,
  /^\[?f[cd][0-9a-f]{2}:/,
  /^\[?fe[89ab][0-9a-f]:/,
] as const;

function destinationEndpointUsesPublicHost(endpointAddress: string): boolean {
  const endpointHost = new URL(endpointAddress).hostname.toLowerCase();
  return !privateDestinationHostPatterns.some((privateHostPattern) =>
    privateHostPattern.test(endpointHost),
  );
}

function destinationEndpointOmitsLocalhost(endpointAddress: string): boolean {
  return !endpointAddress.toLowerCase().includes('localhost');
}

const deliveryConfigurationSchema = z
  .object({
    endpoint: z
      .url()
      .refine(
        (endpointAddress) => endpointAddress.startsWith('https://'),
        'endpoint must use HTTPS',
      )
      .refine(destinationEndpointOmitsLocalhost, 'endpoint must not contain localhost')
      .refine(destinationEndpointUsesPublicHost, 'endpoint must use a public host'),
    verificationToken: z
      .string()
      .min(32)
      .max(80)
      .regex(/^[a-zA-Z0-9_-]+$/),
  })
  .strict();

const destinationSubmissionFields = {
  deliveryConfig: deliveryConfigurationSchema,
  name: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[^<>]+$/, 'name must not contain markup')
    .optional(),
  status: z.enum(['ENABLED', 'DISABLED']),
} as const;

const destinationIdSchema = z.string().min(1);

/** Exact eBay query fields accepted by getDestinations. */
export const getDestinationsArgumentsSchema = z
  .object({
    continuation_token: z.string().min(1).optional(),
    limit: z
      .string()
      .regex(/^(?:[1-9]\d|100)$/, 'limit must be an integer from 10 through 100')
      .optional(),
  })
  .strict();

/** Validated eBay query used to retrieve destinations. */
export type DestinationSearchArguments = z.infer<typeof getDestinationsArgumentsSchema>;

/** Exact eBay path field accepted by getDestination. */
export const getDestinationArgumentsSchema = z
  .object({
    destination_id: destinationIdSchema,
  })
  .strict();

/** Validated eBay path used to retrieve one destination. */
export type DestinationLookupArguments = z.infer<typeof getDestinationArgumentsSchema>;

/** Exact generated eBay document accepted by createDestination. */
export const createDestinationArgumentsSchema = z.object(destinationSubmissionFields).strict();

/** Validated eBay document used to create a destination. */
export type NotificationDestinationSubmission = z.infer<typeof createDestinationArgumentsSchema>;

/** Exact eBay path and generated document fields accepted by updateDestination. */
export const updateDestinationArgumentsSchema = z
  .object({
    destination_id: destinationIdSchema,
    ...destinationSubmissionFields,
  })
  .strict();

/** Validated eBay path and document used to update a destination. */
export type NotificationDestinationUpdate = z.infer<typeof updateDestinationArgumentsSchema>;

/** Exact eBay path field accepted by deleteDestination. */
export const deleteDestinationArgumentsSchema = z
  .object({
    destination_id: destinationIdSchema,
  })
  .strict();

/** Validated eBay path used to delete one destination. */
export type DestinationDeleteArguments = z.infer<typeof deleteDestinationArgumentsSchema>;

/**
 * Destination page generated from the official Commerce Notification specification.
 *
 * @see https://developer.ebay.com/api-docs/commerce/notification/types/api:DestinationSearchResponse
 */
export type DestinationPage = components['schemas']['DestinationSearchResponse'];

/**
 * Destination generated from the official Commerce Notification specification.
 *
 * @see https://developer.ebay.com/api-docs/commerce/notification/types/api:Destination
 */
export type NotificationDestination = components['schemas']['Destination'];

/** Empty generated confirmation returned after destination creation. */
export type DestinationCreationConfirmation =
  operations['createDestination']['responses'][201]['content']['application/json'];

/**
 * Retrieves configured notification destinations.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param destinationSearch - Exact eBay destination pagination fields.
 * @returns Explicit completion containing the unchanged generated eBay page or failure.
 *
 * @example
 * ```ts
 * const completion = await getDestinations(sellerSession, { limit: '20' });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/commerce/notification/resources/destination/methods/getDestinations
 */
export const getDestinations = (
  sellerSession: EbaySellerSession,
  destinationSearch: DestinationSearchArguments = {},
): Promise<EbayRequestCompletion<DestinationPage>> =>
  sellerSession.get<DestinationPage>({
    endpoint: '/commerce/notification/v1/destination',
    searchParameters: destinationSearch,
  });

/**
 * Retrieves one notification destination.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param destinationLookup - Exact eBay destination path field.
 * @returns Explicit completion containing the unchanged generated eBay destination or failure.
 *
 * @example
 * ```ts
 * const completion = await getDestination(sellerSession, {
 *   destination_id: 'destination-123',
 * });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/commerce/notification/resources/destination/methods/getDestination
 */
export const getDestination = (
  sellerSession: EbaySellerSession,
  destinationLookup: DestinationLookupArguments,
): Promise<EbayRequestCompletion<NotificationDestination>> =>
  sellerSession.get<NotificationDestination>({
    endpoint: `/commerce/notification/v1/destination/${encodeURIComponent(destinationLookup.destination_id)}`,
  });

/**
 * Creates a notification delivery destination.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param destinationSubmission - Exact eBay destination document.
 * @returns Explicit completion containing eBay's generated empty confirmation or failure.
 *
 * @example
 * ```ts
 * const completion = await createDestination(sellerSession, {
 *   deliveryConfig: {
 *     endpoint: 'https://notifications.example.com/ebay',
 *     verificationToken: 'notification_token_1234567890abcdef',
 *   },
 *   status: 'ENABLED',
 * });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/commerce/notification/resources/destination/methods/createDestination
 */
export const createDestination = (
  sellerSession: EbaySellerSession,
  destinationSubmission: NotificationDestinationSubmission,
): Promise<EbayRequestCompletion<DestinationCreationConfirmation>> =>
  sellerSession.post<DestinationCreationConfirmation>({
    endpoint: '/commerce/notification/v1/destination',
    requestDocument: destinationSubmission,
  });

/**
 * Replaces one notification delivery destination.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param destinationUpdate - Exact eBay destination path and document fields.
 * @returns Explicit completion containing eBay's empty 204 confirmation or failure.
 *
 * @example
 * ```ts
 * const completion = await updateDestination(sellerSession, {
 *   destination_id: 'destination-123',
 *   deliveryConfig: {
 *     endpoint: 'https://notifications.example.com/ebay',
 *     verificationToken: 'notification_token_1234567890abcdef',
 *   },
 *   status: 'DISABLED',
 * });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/commerce/notification/resources/destination/methods/updateDestination
 */
export const updateDestination = (
  sellerSession: EbaySellerSession,
  destinationUpdate: NotificationDestinationUpdate,
): Promise<EbayRequestCompletion<void>> => {
  const { destination_id: destinationId, ...destinationSubmission } = destinationUpdate;

  return sellerSession.put<void>({
    endpoint: `/commerce/notification/v1/destination/${encodeURIComponent(destinationId)}`,
    requestDocument: destinationSubmission,
  });
};

/**
 * Deletes one unused notification destination.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param destinationDeletion - Exact eBay destination path field.
 * @returns Explicit completion containing eBay's empty 204 confirmation or failure.
 *
 * @example
 * ```ts
 * const completion = await deleteDestination(sellerSession, {
 *   destination_id: 'destination-123',
 * });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/commerce/notification/resources/destination/methods/deleteDestination
 */
export const deleteDestination = (
  sellerSession: EbaySellerSession,
  destinationDeletion: DestinationDeleteArguments,
): Promise<EbayRequestCompletion<void>> =>
  sellerSession.delete<void>({
    endpoint: `/commerce/notification/v1/destination/${encodeURIComponent(destinationDeletion.destination_id)}`,
  });

/** MCP definition for Commerce Notification getDestinations. */
export const getDestinationsTool = defineTool({
  name: 'ebay_commerce_notification_get_destinations',
  namespace: 'commerce.notification',
  description: 'Retrieve configured notification delivery destinations',
  argumentsSchema: getDestinationsArgumentsSchema,
  operationKind: 'read',
  operation: getDestinations,
});

/** MCP definition for Commerce Notification createDestination. */
export const createDestinationTool = defineTool({
  name: 'ebay_commerce_notification_create_destination',
  namespace: 'commerce.notification',
  description: 'Create a notification delivery destination',
  argumentsSchema: createDestinationArgumentsSchema,
  operationKind: 'write',
  operation: createDestination,
});

/** MCP definition for Commerce Notification getDestination. */
export const getDestinationTool = defineTool({
  name: 'ebay_commerce_notification_get_destination',
  namespace: 'commerce.notification',
  description: 'Retrieve one notification delivery destination',
  argumentsSchema: getDestinationArgumentsSchema,
  operationKind: 'read',
  operation: getDestination,
});

/** MCP definition for Commerce Notification updateDestination. */
export const updateDestinationTool = defineTool({
  name: 'ebay_commerce_notification_update_destination',
  namespace: 'commerce.notification',
  description: 'Replace one notification delivery destination',
  argumentsSchema: updateDestinationArgumentsSchema,
  operationKind: 'write',
  operation: updateDestination,
});

/** MCP definition for Commerce Notification deleteDestination. */
export const deleteDestinationTool = defineTool({
  name: 'ebay_commerce_notification_delete_destination',
  namespace: 'commerce.notification',
  description: 'Delete one unused notification delivery destination',
  argumentsSchema: deleteDestinationArgumentsSchema,
  operationKind: 'write',
  operation: deleteDestination,
});
