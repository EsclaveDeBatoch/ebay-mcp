import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/application-settings/developerKeyManagementV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';

/** Exact empty document accepted by getSigningKeys. */
export const getSigningKeysArgumentsSchema = z.object({}).strict();

/** Exact generated eBay document accepted by createSigningKey. */
export const createSigningKeyArgumentsSchema = z
  .object({
    signingKeyCipher: z.enum(['ED25519', 'RSA']).optional(),
  })
  .strict();

/** Validated eBay document used to create one signing keypair. */
export type SigningKeyCreationArguments = z.infer<typeof createSigningKeyArgumentsSchema>;

/** Exact eBay path field accepted by getSigningKey. */
export const getSigningKeyArgumentsSchema = z
  .object({
    signing_key_id: z.string().min(1),
  })
  .strict();

/** Validated eBay path used to retrieve one signing keypair. */
export type SigningKeyLookupArguments = z.infer<typeof getSigningKeyArgumentsSchema>;

/**
 * Signing keypair generated from the official Developer Key Management specification.
 *
 * @see https://developer.ebay.com/api-docs/developer/key-management/types/api:SigningKey
 */
export type DeveloperSigningKey = components['schemas']['SigningKey'];

/**
 * Signing keypair collection generated from the official Developer Key Management specification.
 *
 * @see https://developer.ebay.com/api-docs/developer/key-management/types/api:QuerySigningKeysResponse
 */
export type DeveloperSigningKeyCollection = components['schemas']['QuerySigningKeysResponse'];

/**
 * Retrieves all signing keypairs associated with the calling application.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @returns Explicit completion containing the unchanged generated signing-key collection or failure.
 *
 * @example
 * ```ts
 * const completion = await getSigningKeys(sellerSession);
 * ```
 *
 * @see https://developer.ebay.com/api-docs/developer/key-management/resources/signing_key/methods/getSigningKeys
 */
export const getSigningKeys = (
  sellerSession: EbaySellerSession,
): Promise<EbayRequestCompletion<DeveloperSigningKeyCollection>> =>
  sellerSession.get<DeveloperSigningKeyCollection>({
    apiHost: 'apiz',
    endpoint: '/developer/key_management/v1/signing_key',
  });

/**
 * Creates one signing keypair for eBay API digital signatures.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param signingKeyCreation - Exact optional eBay cipher document.
 * @returns Explicit completion containing the unchanged generated keypair or failure.
 *
 * @example
 * ```ts
 * const completion = await createSigningKey(sellerSession, {
 *   signingKeyCipher: 'ED25519',
 * });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/developer/key-management/resources/signing_key/methods/createSigningKey
 */
export const createSigningKey = (
  sellerSession: EbaySellerSession,
  signingKeyCreation: SigningKeyCreationArguments = {},
): Promise<EbayRequestCompletion<DeveloperSigningKey>> =>
  sellerSession.post<DeveloperSigningKey>({
    apiHost: 'apiz',
    endpoint: '/developer/key_management/v1/signing_key',
    requestDocument: signingKeyCreation,
  });

/**
 * Retrieves one application signing keypair by its eBay identifier.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param signingKeyLookup - Exact eBay signing-key path field.
 * @returns Explicit completion containing the unchanged generated keypair or failure.
 *
 * @example
 * ```ts
 * const completion = await getSigningKey(sellerSession, {
 *   signing_key_id: 'signing-key-123',
 * });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/developer/key-management/resources/signing_key/methods/getSigningKey
 */
export const getSigningKey = (
  sellerSession: EbaySellerSession,
  signingKeyLookup: SigningKeyLookupArguments,
): Promise<EbayRequestCompletion<DeveloperSigningKey>> =>
  sellerSession.get<DeveloperSigningKey>({
    apiHost: 'apiz',
    endpoint: `/developer/key_management/v1/signing_key/${encodeURIComponent(signingKeyLookup.signing_key_id)}`,
  });

/** MCP definition for Developer Key Management getSigningKeys. */
export const getSigningKeysTool = defineTool({
  name: 'ebay_developer_key_management_get_signing_keys',
  namespace: 'developer.key-management',
  description: 'Retrieve all application signing keys and their public metadata',
  argumentsSchema: getSigningKeysArgumentsSchema,
  operationKind: 'read',
  operation: getSigningKeys,
});

/** MCP definition for Developer Key Management createSigningKey. */
export const createSigningKeyTool = defineTool({
  name: 'ebay_developer_key_management_create_signing_key',
  namespace: 'developer.key-management',
  description:
    'Create an application signing keypair; save the returned private key because eBay does not store it',
  argumentsSchema: createSigningKeyArgumentsSchema,
  operationKind: 'write',
  operation: createSigningKey,
});

/** MCP definition for Developer Key Management getSigningKey. */
export const getSigningKeyTool = defineTool({
  name: 'ebay_developer_key_management_get_signing_key',
  namespace: 'developer.key-management',
  description: 'Retrieve one application signing key and its public metadata',
  argumentsSchema: getSigningKeyArgumentsSchema,
  operationKind: 'read',
  operation: getSigningKey,
});
