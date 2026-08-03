import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/account-management/sellAccountV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';

const advertisingProgramFilterSchema = z
  .string()
  .regex(
    /^(?:PROMOTED_LISTINGS_STANDARD|PROMOTED_LISTINGS_ADVANCED|OFFSITE_ADS)(?:,(?:PROMOTED_LISTINGS_STANDARD|PROMOTED_LISTINGS_ADVANCED|OFFSITE_ADS))*$/,
    'program_types must be a comma-delimited list of official advertising program types',
  );

/** Exact eBay marketplace header and optional query accepted by getAdvertisingEligibility. */
export const getAdvertisingEligibilityArgumentsSchema = z
  .object({
    'X-EBAY-C-MARKETPLACE-ID': z.string().min(1),
    program_types: advertisingProgramFilterSchema.optional(),
  })
  .strict();

/** Validated exact eBay marketplace header and advertising-program query. */
export type GetAdvertisingEligibilityArguments = z.infer<
  typeof getAdvertisingEligibilityArgumentsSchema
>;

/** @see https://developer.ebay.com/api-docs/sell/account/types/api:SellerEligibilityMultiProgramResponse */
export type AdvertisingEligibility = components['schemas']['SellerEligibilityMultiProgramResponse'];

/**
 * Retrieves the seller's eligibility for marketplace advertising programs.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param eligibilitySelection - Exact marketplace header and optional program_types query.
 * @returns Explicit completion containing eBay's unchanged advertising-eligibility document.
 * @example `await getAdvertisingEligibility(sellerSession, { 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US', program_types: 'OFFSITE_ADS' })`
 * @see https://developer.ebay.com/api-docs/sell/account/resources/advertising_eligibility/methods/getAdvertisingEligibility
 */
export const getAdvertisingEligibility = (
  sellerSession: EbaySellerSession,
  eligibilitySelection: GetAdvertisingEligibilityArguments,
): Promise<EbayRequestCompletion<AdvertisingEligibility>> => {
  const requestHeaders = {
    'X-EBAY-C-MARKETPLACE-ID': eligibilitySelection['X-EBAY-C-MARKETPLACE-ID'],
  };
  if (eligibilitySelection.program_types === undefined) {
    return sellerSession.get<AdvertisingEligibility>({
      endpoint: '/sell/account/v1/advertising_eligibility',
      requestHeaders,
    });
  }
  return sellerSession.get<AdvertisingEligibility>({
    endpoint: '/sell/account/v1/advertising_eligibility',
    requestHeaders,
    searchParameters: { program_types: eligibilitySelection.program_types },
  });
};

/** MCP definition for the Account API getAdvertisingEligibility operation. */
export const getAdvertisingEligibilityTool = defineTool({
  name: 'ebay_sell_account_get_advertising_eligibility',
  namespace: 'sell.account',
  description: 'Retrieve seller eligibility for marketplace advertising programs',
  argumentsSchema: getAdvertisingEligibilityArgumentsSchema,
  operationKind: 'read',
  operation: getAdvertisingEligibility,
});
