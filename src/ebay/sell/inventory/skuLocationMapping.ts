import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/listing-management/sellInventoryV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';

const listingIdSchema = z.string().min(1);
const skuSchema = z.string().min(1).max(50);

const fulfillmentLocationSchema = z
  .object({
    merchantLocationKey: z.string().min(1),
  })
  .strict();

const locationMappingDocumentSchema = z
  .object({
    locations: z
      .array(fulfillmentLocationSchema)
      .min(1)
      .refine(
        (fulfillmentLocations) =>
          new Set(
            fulfillmentLocations.map(
              (fulfillmentLocation) => fulfillmentLocation.merchantLocationKey,
            ),
          ).size === fulfillmentLocations.length,
        { message: 'Each fulfillment location must be unique' },
      ),
  })
  .strict();

/** Exact eBay listing and SKU path for one location mapping. */
export const skuLocationMappingPathArgumentsSchema = z
  .object({
    listingId: listingIdSchema,
    sku: skuSchema,
  })
  .strict();

/** Exact eBay path and direct location-mapping fields for a complete replacement. */
export const createOrReplaceSkuLocationMappingArgumentsSchema = locationMappingDocumentSchema
  .extend({
    listingId: listingIdSchema,
    sku: skuSchema,
  })
  .strict();

/** Validated exact listing and SKU path for one location mapping. */
export type SkuLocationMappingPathArguments = z.infer<typeof skuLocationMappingPathArgumentsSchema>;

/** Validated direct replacement accepted by createOrReplaceSkuLocationMapping. */
export type CreateOrReplaceSkuLocationMappingArguments = z.infer<
  typeof createOrReplaceSkuLocationMappingArgumentsSchema
>;

/** @see https://developer.ebay.com/api-docs/sell/inventory/types/slr:LocationMapping */
export type SkuLocationMapping = components['schemas']['LocationMapping'];

const skuLocationMappingEndpoint = (listingId: string, sku: string): string =>
  `/sell/inventory/v1/listing/${encodeURIComponent(listingId)}/sku/${encodeURIComponent(sku)}/locations`;

/**
 * Retrieves fulfillment-center locations mapped to one SKU in one listing.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param skuLocationMappingSelection - Exact listing and SKU path.
 * @returns Explicit completion containing eBay's unchanged location mapping.
 * @example `await getSkuLocationMapping(sellerSession, { listingId: '1234567890', sku: 'SKU-1' })`
 * @see https://developer.ebay.com/api-docs/sell/inventory/resources/listing/methods/getSkuLocationMapping
 */
export const getSkuLocationMapping = (
  sellerSession: EbaySellerSession,
  skuLocationMappingSelection: SkuLocationMappingPathArguments,
): Promise<EbayRequestCompletion<SkuLocationMapping>> =>
  sellerSession.get<SkuLocationMapping>({
    endpoint: skuLocationMappingEndpoint(
      skuLocationMappingSelection.listingId,
      skuLocationMappingSelection.sku,
    ),
  });

/**
 * Creates or fully replaces the fulfillment-center locations mapped to one SKU.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param skuLocationMappingReplacement - Exact listing, SKU, and direct eBay document.
 * @returns Explicit completion after eBay replaces the mapping.
 * @example `await createOrReplaceSkuLocationMapping(sellerSession, { listingId: '1234567890', sku: 'SKU-1', locations: [{ merchantLocationKey: 'FULFILLMENT-1' }] })`
 * @see https://developer.ebay.com/api-docs/sell/inventory/resources/listing/methods/createOrReplaceSkuLocationMapping
 */
export const createOrReplaceSkuLocationMapping = (
  sellerSession: EbaySellerSession,
  skuLocationMappingReplacement: CreateOrReplaceSkuLocationMappingArguments,
): Promise<EbayRequestCompletion<undefined>> => {
  const { listingId, sku, ...skuLocationMappingDocument } = skuLocationMappingReplacement;

  return sellerSession.put<undefined>({
    endpoint: skuLocationMappingEndpoint(listingId, sku),
    requestDocument: skuLocationMappingDocument,
  });
};

/**
 * Deletes every fulfillment-center location mapped to one SKU in one listing.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param skuLocationMappingSelection - Exact listing and SKU path.
 * @returns Explicit completion after eBay deletes the mapping.
 * @example `await deleteSkuLocationMapping(sellerSession, { listingId: '1234567890', sku: 'SKU-1' })`
 * @see https://developer.ebay.com/api-docs/sell/inventory/resources/listing/methods/deleteSkuLocationMapping
 */
export const deleteSkuLocationMapping = (
  sellerSession: EbaySellerSession,
  skuLocationMappingSelection: SkuLocationMappingPathArguments,
): Promise<EbayRequestCompletion<undefined>> =>
  sellerSession.delete<undefined>({
    endpoint: skuLocationMappingEndpoint(
      skuLocationMappingSelection.listingId,
      skuLocationMappingSelection.sku,
    ),
  });

/** MCP definition for Inventory API getSkuLocationMapping. */
export const getSkuLocationMappingTool = defineTool({
  name: 'ebay_sell_inventory_get_sku_location_mapping',
  namespace: 'sell.inventory',
  description: 'Retrieve fulfillment-center locations mapped to one SKU in one eBay listing',
  argumentsSchema: skuLocationMappingPathArgumentsSchema,
  operationKind: 'read',
  operation: getSkuLocationMapping,
});

/** MCP definition for Inventory API createOrReplaceSkuLocationMapping. */
export const createOrReplaceSkuLocationMappingTool = defineTool({
  name: 'ebay_sell_inventory_create_or_replace_sku_location_mapping',
  namespace: 'sell.inventory',
  description: 'Create or fully replace fulfillment-center locations mapped to one SKU',
  argumentsSchema: createOrReplaceSkuLocationMappingArgumentsSchema,
  operationKind: 'write',
  operation: createOrReplaceSkuLocationMapping,
});

/** MCP definition for Inventory API deleteSkuLocationMapping. */
export const deleteSkuLocationMappingTool = defineTool({
  name: 'ebay_sell_inventory_delete_sku_location_mapping',
  namespace: 'sell.inventory',
  description: 'Delete every fulfillment-center location mapped to one SKU',
  argumentsSchema: skuLocationMappingPathArgumentsSchema,
  operationKind: 'write',
  operation: deleteSkuLocationMapping,
});
