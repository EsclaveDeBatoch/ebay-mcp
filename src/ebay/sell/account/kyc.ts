import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/account-management/sellAccountV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';

/** Exact empty argument contract accepted by getKYC. */
export const getKycArgumentsSchema = z.object({}).strict();

/** @see https://developer.ebay.com/api-docs/sell/account/types/api:KycResponse */
export type KycStatus = components['schemas']['KycResponse'];

/**
 * Retrieves the seller's Know Your Customer verification status.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @returns Explicit completion containing eBay's unchanged generated KYC document.
 * @example `await getKyc(sellerSession)`
 * @see https://developer.ebay.com/api-docs/sell/account/resources/kyc/methods/getKYC
 */
export const getKyc = (
  sellerSession: EbaySellerSession,
): Promise<EbayRequestCompletion<KycStatus>> =>
  sellerSession.get<KycStatus>({ endpoint: '/sell/account/v1/kyc' });

/** MCP definition for the Account API getKYC operation. */
export const getKycTool = defineTool({
  name: 'ebay_sell_account_get_kyc',
  namespace: 'sell.account',
  description: "Retrieve the seller's Know Your Customer verification status",
  argumentsSchema: getKycArgumentsSchema,
  operationKind: 'read',
  operation: getKyc,
});
