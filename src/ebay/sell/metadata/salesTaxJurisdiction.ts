import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/listing-metadata/sellMetadataV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';

/** Exact eBay country path field accepted by getSalesTaxJurisdictions. */
export const salesTaxJurisdictionsArgumentsSchema = z
  .object({
    countryCode: z.enum(['CA', 'US']),
  })
  .strict();

/** Validated eBay sales-tax country selection. */
export type SalesTaxJurisdictionsArguments = z.infer<typeof salesTaxJurisdictionsArgumentsSchema>;

/** @see https://developer.ebay.com/api-docs/sell/metadata/types/api:SalesTaxJurisdictions */
export type SalesTaxJurisdictions = components['schemas']['SalesTaxJurisdictions'] | undefined;

/**
 * Retrieves the configurable sales-tax jurisdictions for Canada or the United States.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param taxJurisdictionLookup - Exact eBay country path field.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 * @example `await getSalesTaxJurisdictions(sellerSession, { countryCode: 'US' })`
 * @see https://developer.ebay.com/api-docs/sell/metadata/resources/country/methods/getSalesTaxJurisdictions
 */
export const getSalesTaxJurisdictions = (
  sellerSession: EbaySellerSession,
  taxJurisdictionLookup: SalesTaxJurisdictionsArguments,
): Promise<EbayRequestCompletion<SalesTaxJurisdictions>> =>
  sellerSession.get<SalesTaxJurisdictions>({
    endpoint: `/sell/metadata/v1/country/${encodeURIComponent(taxJurisdictionLookup.countryCode)}/sales_tax_jurisdiction`,
  });

export const getSalesTaxJurisdictionsTool = defineTool({
  name: 'ebay_sell_metadata_get_sales_tax_jurisdictions',
  namespace: 'sell.metadata',
  description: 'Retrieve configurable sales-tax jurisdictions for Canada or the United States',
  argumentsSchema: salesTaxJurisdictionsArgumentsSchema,
  operationKind: 'read',
  operation: getSalesTaxJurisdictions,
});
