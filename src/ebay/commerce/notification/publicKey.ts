import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/communication/commerceNotificationV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';

/** Exact eBay path field accepted by getPublicKey. */
export const getPublicKeyArgumentsSchema = z
  .object({
    public_key_id: z.string().min(1),
  })
  .strict();

/** Validated eBay path used to retrieve a notification public key. */
export type PublicKeyLookupArguments = z.infer<typeof getPublicKeyArgumentsSchema>;

/**
 * Notification public key generated from the official Commerce Notification specification.
 *
 * @see https://developer.ebay.com/api-docs/commerce/notification/types/api:PublicKey
 */
export type NotificationPublicKey = components['schemas']['PublicKey'];

/**
 * Retrieves the public key used to validate an eBay notification signature.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param publicKeyLookup - Exact eBay public-key path field.
 * @returns Explicit completion containing the unchanged generated eBay public key or failure.
 *
 * @example
 * ```ts
 * const completion = await getPublicKey(sellerSession, {
 *   public_key_id: 'key-123',
 * });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/commerce/notification/resources/public_key/methods/getPublicKey
 */
export const getPublicKey = (
  sellerSession: EbaySellerSession,
  publicKeyLookup: PublicKeyLookupArguments,
): Promise<EbayRequestCompletion<NotificationPublicKey>> =>
  sellerSession.get<NotificationPublicKey>({
    endpoint: `/commerce/notification/v1/public_key/${encodeURIComponent(publicKeyLookup.public_key_id)}`,
  });

/** MCP definition for Commerce Notification getPublicKey. */
export const getPublicKeyTool = defineTool({
  name: 'ebay_commerce_notification_get_public_key',
  namespace: 'commerce.notification',
  description: 'Retrieve the public key used to validate an eBay notification signature',
  argumentsSchema: getPublicKeyArgumentsSchema,
  operationKind: 'read',
  operation: getPublicKey,
});
