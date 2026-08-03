import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/account-management/sellAccountV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';

/** Exact empty argument contract accepted by getPrivileges. */
export const getPrivilegesArgumentsSchema = z.object({}).strict();

/** @see https://developer.ebay.com/api-docs/sell/account/types/api:SellingPrivileges */
export type SellingPrivileges = components['schemas']['SellingPrivileges'];

/**
 * Retrieves the seller's registration status and monthly selling limits.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @returns Explicit completion containing eBay's unchanged selling-privileges document.
 * @example `await getPrivileges(sellerSession)`
 * @see https://developer.ebay.com/api-docs/sell/account/resources/privilege/methods/getPrivileges
 */
export const getPrivileges = (
  sellerSession: EbaySellerSession,
): Promise<EbayRequestCompletion<SellingPrivileges>> =>
  sellerSession.get<SellingPrivileges>({ endpoint: '/sell/account/v1/privilege' });

/** MCP definition for the Account API getPrivileges operation. */
export const getPrivilegesTool = defineTool({
  name: 'ebay_sell_account_get_privileges',
  namespace: 'sell.account',
  description: 'Retrieve seller registration status and monthly selling limits',
  argumentsSchema: getPrivilegesArgumentsSchema,
  operationKind: 'read',
  operation: getPrivileges,
});
