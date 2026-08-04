import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/other-apis/commerceIdentityV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';

/** Exact empty argument contract accepted by Commerce Identity getUser. */
export const getUserArgumentsSchema = z.object({}).strict();

/**
 * Authenticated eBay user generated from the official Commerce Identity specification.
 *
 * @see https://developer.ebay.com/api-docs/commerce/identity/types/api:UserResponse
 */
export type EbayUser = components['schemas']['UserResponse'];

/**
 * Retrieves account profile information for the authenticated eBay user.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 *
 * @example
 * ```ts
 * const completion = await getUser(sellerSession);
 * ```
 *
 * @see https://developer.ebay.com/api-docs/commerce/identity/resources/user/methods/getUser
 */
export const getUser = async (
  sellerSession: EbaySellerSession,
): Promise<EbayRequestCompletion<EbayUser>> =>
  sellerSession.get<EbayUser>({
    apiHost: 'apiz',
    endpoint: '/commerce/identity/v1/user/',
  });

/** MCP definition for the Commerce Identity getUser operation. */
export const getUserTool = defineTool({
  name: 'ebay_commerce_identity_get_user',
  namespace: 'commerce.identity',
  description: 'Retrieve profile information for the authenticated eBay user',
  argumentsSchema: getUserArgumentsSchema,
  operationKind: 'read',
  operation: getUser,
});
