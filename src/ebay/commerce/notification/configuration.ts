import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/communication/commerceNotificationV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';

/** Exact empty document accepted by getConfig. */
export const getConfigArgumentsSchema = z.object({}).strict();

/** Exact generated eBay document accepted by updateConfig. */
export const updateConfigArgumentsSchema = z
  .object({
    alertEmail: z.email(),
  })
  .strict();

/** Validated alert configuration used by updateConfig. */
export type NotificationConfigurationUpdate = z.infer<typeof updateConfigArgumentsSchema>;

/**
 * Alert configuration generated from the official Commerce Notification specification.
 *
 * @see https://developer.ebay.com/api-docs/commerce/notification/types/api:Config
 */
export type NotificationConfiguration = components['schemas']['Config'];

/**
 * Retrieves the application-level Notification API alert configuration.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 *
 * @example
 * ```ts
 * const completion = await getConfig(sellerSession);
 * ```
 *
 * @see https://developer.ebay.com/api-docs/commerce/notification/resources/config/methods/getConfig
 */
export const getConfig = (
  sellerSession: EbaySellerSession,
): Promise<EbayRequestCompletion<NotificationConfiguration>> =>
  sellerSession.get<NotificationConfiguration>({
    endpoint: '/commerce/notification/v1/config',
  });

/**
 * Creates or replaces the application-level Notification API alert configuration.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param notificationConfiguration - Exact eBay alert configuration document.
 * @returns Explicit completion containing eBay's empty 204 confirmation or failure.
 *
 * @example
 * ```ts
 * const completion = await updateConfig(sellerSession, {
 *   alertEmail: 'alerts@example.com',
 * });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/commerce/notification/resources/config/methods/updateConfig
 */
export const updateConfig = (
  sellerSession: EbaySellerSession,
  notificationConfiguration: NotificationConfigurationUpdate,
): Promise<EbayRequestCompletion<void>> =>
  sellerSession.put<void>({
    endpoint: '/commerce/notification/v1/config',
    requestDocument: notificationConfiguration,
  });

/** MCP definition for Commerce Notification getConfig. */
export const getConfigTool = defineTool({
  name: 'ebay_commerce_notification_get_config',
  namespace: 'commerce.notification',
  description: 'Retrieve the application-level notification alert configuration',
  argumentsSchema: getConfigArgumentsSchema,
  operationKind: 'read',
  operation: getConfig,
});

/** MCP definition for Commerce Notification updateConfig. */
export const updateConfigTool = defineTool({
  name: 'ebay_commerce_notification_update_config',
  namespace: 'commerce.notification',
  description: 'Create or replace the notification alert email configuration',
  argumentsSchema: updateConfigArgumentsSchema,
  operationKind: 'write',
  operation: updateConfig,
});
