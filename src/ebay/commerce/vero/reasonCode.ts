import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbayRequestHeaders, EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/other-apis/commerceVeroV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';

/** Exact eBay path field accepted by getVeroReasonCode. */
export const getVeroReasonCodeArgumentsSchema = z
  .object({
    vero_reason_code_id: z.string().min(1),
  })
  .strict();

/** Validated eBay path used to retrieve one VeRO reason code. */
export type VeroReasonCodeLookup = z.infer<typeof getVeroReasonCodeArgumentsSchema>;

/** Exact optional eBay header accepted by getVeroReasonCodes. */
export const getVeroReasonCodesArgumentsSchema = z
  .object({
    'X-EBAY-C-MARKETPLACE-ID': z.string().min(1).optional(),
  })
  .strict();

/** Validated eBay marketplace selection used to retrieve VeRO reason codes. */
export type VeroMarketplaceSelection = z.infer<typeof getVeroReasonCodesArgumentsSchema>;

/**
 * VeRO reason-code detail returned by the official Commerce VeRO specification.
 *
 * @see https://developer.ebay.com/api-docs/commerce/vero/types/VeroReasonCodeResponse
 */
export type VeroReasonCode = components['schemas']['VeroReasonCodeResponse'];

/**
 * Marketplace-grouped VeRO reason codes from the official Commerce VeRO specification.
 *
 * @see https://developer.ebay.com/api-docs/commerce/vero/types/VeroReasonCodeDetailResponse
 */
export type VeroReasonCodeCatalogue = components['schemas']['VeroReasonCodeDetailResponse'];

function marketplaceHeadersFor(
  marketplaceSelection: VeroMarketplaceSelection,
): EbayRequestHeaders | undefined {
  const marketplaceId = marketplaceSelection['X-EBAY-C-MARKETPLACE-ID'];
  if (marketplaceId === undefined) {
    return;
  }
  return { 'X-EBAY-C-MARKETPLACE-ID': marketplaceId };
}

/**
 * Retrieves one VeRO infringement reason code.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param reasonCodeLookup - Exact eBay reason-code identifier field.
 * @returns Explicit completion containing unchanged eBay reason-code detail or failure.
 *
 * @example
 * ```ts
 * const completion = await getVeroReasonCode(sellerSession, {
 *   vero_reason_code_id: '1001',
 * });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/commerce/vero/resources/vero_reason_code/methods/getVeroReasonCode
 */
export const getVeroReasonCode = (
  sellerSession: EbaySellerSession,
  reasonCodeLookup: VeroReasonCodeLookup,
): Promise<EbayRequestCompletion<VeroReasonCode>> =>
  sellerSession.get<VeroReasonCode>({
    endpoint: `/commerce/vero/v1/vero_reason_code/${encodeURIComponent(reasonCodeLookup.vero_reason_code_id)}`,
  });

/**
 * Retrieves VeRO infringement reason codes, optionally for one marketplace.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param marketplaceSelection - Exact optional eBay marketplace header.
 * @returns Explicit completion containing unchanged eBay reason-code catalogue or failure.
 *
 * @example
 * ```ts
 * const completion = await getVeroReasonCodes(sellerSession, {
 *   'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
 * });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/commerce/vero/resources/vero_reason_code/methods/getVeroReasonCodes
 */
export const getVeroReasonCodes = (
  sellerSession: EbaySellerSession,
  marketplaceSelection: VeroMarketplaceSelection = {},
): Promise<EbayRequestCompletion<VeroReasonCodeCatalogue>> => {
  const requestHeaders = marketplaceHeadersFor(marketplaceSelection);
  if (requestHeaders === undefined) {
    return sellerSession.get<VeroReasonCodeCatalogue>({
      endpoint: '/commerce/vero/v1/vero_reason_code',
    });
  }
  return sellerSession.get<VeroReasonCodeCatalogue>({
    endpoint: '/commerce/vero/v1/vero_reason_code',
    requestHeaders,
  });
};

/** MCP definition for Commerce VeRO getVeroReasonCode. */
export const getVeroReasonCodeTool = defineTool({
  name: 'ebay_commerce_vero_get_reason_code',
  namespace: 'commerce.vero',
  description: 'Retrieve one VeRO infringement reason code',
  argumentsSchema: getVeroReasonCodeArgumentsSchema,
  operationKind: 'read',
  operation: getVeroReasonCode,
});

/** MCP definition for Commerce VeRO getVeroReasonCodes. */
export const getVeroReasonCodesTool = defineTool({
  name: 'ebay_commerce_vero_get_reason_codes',
  namespace: 'commerce.vero',
  description: 'Retrieve VeRO infringement reason codes by marketplace',
  argumentsSchema: getVeroReasonCodesArgumentsSchema,
  operationKind: 'read',
  operation: getVeroReasonCodes,
});
