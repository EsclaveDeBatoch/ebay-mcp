import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/account-management/sellAccountV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';

/** Exact optional eBay query accepted by getRateTables. */
export const getRateTablesArgumentsSchema = z
  .object({
    country_code: z
      .string()
      .regex(/^[A-Z]{2}$/)
      .optional(),
  })
  .strict();

/** Validated eBay country selection for shipping rate tables. */
export type GetRateTablesArguments = z.infer<typeof getRateTablesArgumentsSchema>;

/** @see https://developer.ebay.com/api-docs/sell/account/types/api:RateTableResponse */
export type RateTableCollection = components['schemas']['RateTableResponse'];

/**
 * Retrieves the seller's shipping rate tables, optionally for one country.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param countrySelection - Exact optional eBay country_code query.
 * @returns Explicit completion containing eBay's unchanged rate-table collection.
 * @example `await getRateTables(sellerSession, { country_code: 'US' })`
 * @see https://developer.ebay.com/api-docs/sell/account/resources/rate_table/methods/getRateTables
 */
export const getRateTables = (
  sellerSession: EbaySellerSession,
  countrySelection: GetRateTablesArguments,
): Promise<EbayRequestCompletion<RateTableCollection>> => {
  if (countrySelection.country_code === undefined) {
    return sellerSession.get<RateTableCollection>({ endpoint: '/sell/account/v1/rate_table' });
  }
  return sellerSession.get<RateTableCollection>({
    endpoint: '/sell/account/v1/rate_table',
    searchParameters: { country_code: countrySelection.country_code },
  });
};

/** MCP definition for the Account API getRateTables operation. */
export const getRateTablesTool = defineTool({
  name: 'ebay_sell_account_get_rate_tables',
  namespace: 'sell.account',
  description: 'Retrieve seller shipping rate tables, optionally for one country',
  argumentsSchema: getRateTablesArgumentsSchema,
  operationKind: 'read',
  operation: getRateTables,
});
