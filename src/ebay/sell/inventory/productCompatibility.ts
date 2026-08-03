import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/listing-management/sellInventoryV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';

const skuSchema = z.string().min(1).max(50);

const compatibilityPropertySchema = z
  .object({
    name: z.string().min(1),
    value: z.string().min(1),
  })
  .strict();

const productIdentifierSchema = z
  .object({
    epid: z.string().min(1).optional(),
    gtin: z.string().min(1).optional(),
    ktype: z.string().min(1).optional(),
  })
  .strict()
  .refine((productIdentifier) => Object.values(productIdentifier).length > 0, {
    message: 'A product identifier requires epid, gtin, or ktype',
  });

const compatibilityPropertiesProductSchema = z
  .object({
    compatibilityProperties: z.array(compatibilityPropertySchema).min(1),
    notes: z.string().max(500).optional(),
    productIdentifier: productIdentifierSchema.optional(),
  })
  .strict();

const productIdentifierProductSchema = z
  .object({
    compatibilityProperties: z.array(compatibilityPropertySchema).min(1).optional(),
    notes: z.string().max(500).optional(),
    productIdentifier: productIdentifierSchema,
  })
  .strict();

const compatibleProductSchema = z.union([
  compatibilityPropertiesProductSchema,
  productIdentifierProductSchema,
]);

const productCompatibilityDocumentSchema = z
  .object({
    compatibleProducts: z.array(compatibleProductSchema).optional(),
  })
  .strict();

/** Exact eBay SKU path for product compatibility. */
export const productCompatibilitySkuArgumentsSchema = z
  .object({
    sku: skuSchema,
  })
  .strict();

/** Exact eBay path, language header, and direct product-compatibility fields. */
export const createOrReplaceProductCompatibilityArgumentsSchema = productCompatibilityDocumentSchema
  .extend({
    sku: skuSchema,
    'Content-Language': z.string().min(1),
  })
  .strict();

/** Validated exact SKU path for product compatibility. */
export type ProductCompatibilitySkuArguments = z.infer<
  typeof productCompatibilitySkuArgumentsSchema
>;

/** Validated direct replacement accepted by createOrReplaceProductCompatibility. */
export type CreateOrReplaceProductCompatibilityArguments = z.infer<
  typeof createOrReplaceProductCompatibilityArgumentsSchema
>;

/** @see https://developer.ebay.com/api-docs/sell/inventory/types/slr:Compatibility */
export type ProductCompatibility = components['schemas']['Compatibility'];

/** @see https://developer.ebay.com/api-docs/sell/inventory/resources/inventory_item/product_compatibility/methods/createOrReplaceProductCompatibility */
export type ProductCompatibilityWriteCompletion = components['schemas']['BaseResponse'] | undefined;

/**
 * Retrieves the compatible vehicle list for one inventory SKU.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param productCompatibilitySelection - Exact seller-defined SKU path.
 * @returns Explicit completion containing eBay's unchanged compatibility list.
 * @example `await getProductCompatibility(sellerSession, { sku: 'BRAKE-PAD-1' })`
 * @see https://developer.ebay.com/api-docs/sell/inventory/resources/inventory_item/product_compatibility/methods/getProductCompatibility
 */
export const getProductCompatibility = (
  sellerSession: EbaySellerSession,
  productCompatibilitySelection: ProductCompatibilitySkuArguments,
): Promise<EbayRequestCompletion<ProductCompatibility>> =>
  sellerSession.get<ProductCompatibility>({
    endpoint: `/sell/inventory/v1/inventory_item/${encodeURIComponent(productCompatibilitySelection.sku)}/product_compatibility`,
  });

/**
 * Creates or fully replaces the compatible vehicle list for one inventory SKU.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param productCompatibilityReplacement - Exact SKU, language header, and direct eBay document.
 * @returns Explicit completion containing eBay's optional BaseResponse.
 * @example `await createOrReplaceProductCompatibility(sellerSession, { sku: 'BRAKE-PAD-1', 'Content-Language': 'en-US', compatibleProducts: [{ productIdentifier: { epid: '123456789' } }] })`
 * @see https://developer.ebay.com/api-docs/sell/inventory/resources/inventory_item/product_compatibility/methods/createOrReplaceProductCompatibility
 */
export const createOrReplaceProductCompatibility = (
  sellerSession: EbaySellerSession,
  productCompatibilityReplacement: CreateOrReplaceProductCompatibilityArguments,
): Promise<EbayRequestCompletion<ProductCompatibilityWriteCompletion>> => {
  const {
    sku,
    'Content-Language': contentLanguage,
    ...productCompatibilityDocument
  } = productCompatibilityReplacement;

  return sellerSession.put<ProductCompatibilityWriteCompletion>({
    endpoint: `/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}/product_compatibility`,
    requestDocument: productCompatibilityDocument,
    requestHeaders: { 'Content-Language': contentLanguage },
  });
};

/**
 * Deletes the compatible vehicle list for one inventory SKU.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param productCompatibilitySelection - Exact seller-defined SKU path.
 * @returns Explicit completion after eBay deletes the compatibility list.
 * @example `await deleteProductCompatibility(sellerSession, { sku: 'BRAKE-PAD-1' })`
 * @see https://developer.ebay.com/api-docs/sell/inventory/resources/inventory_item/product_compatibility/methods/deleteProductCompatibility
 */
export const deleteProductCompatibility = (
  sellerSession: EbaySellerSession,
  productCompatibilitySelection: ProductCompatibilitySkuArguments,
): Promise<EbayRequestCompletion<undefined>> =>
  sellerSession.delete<undefined>({
    endpoint: `/sell/inventory/v1/inventory_item/${encodeURIComponent(productCompatibilitySelection.sku)}/product_compatibility`,
  });

/** MCP definition for Inventory API getProductCompatibility. */
export const getProductCompatibilityTool = defineTool({
  name: 'ebay_sell_inventory_get_product_compatibility',
  namespace: 'sell.inventory',
  description: 'Retrieve the compatible vehicle list for one eBay inventory SKU',
  argumentsSchema: productCompatibilitySkuArgumentsSchema,
  operationKind: 'read',
  operation: getProductCompatibility,
});

/** MCP definition for Inventory API createOrReplaceProductCompatibility. */
export const createOrReplaceProductCompatibilityTool = defineTool({
  name: 'ebay_sell_inventory_create_or_replace_product_compatibility',
  namespace: 'sell.inventory',
  description: 'Create or fully replace the compatible vehicle list for one eBay inventory SKU',
  argumentsSchema: createOrReplaceProductCompatibilityArgumentsSchema,
  operationKind: 'write',
  operation: createOrReplaceProductCompatibility,
});

/** MCP definition for Inventory API deleteProductCompatibility. */
export const deleteProductCompatibilityTool = defineTool({
  name: 'ebay_sell_inventory_delete_product_compatibility',
  namespace: 'sell.inventory',
  description: 'Delete the compatible vehicle list for one eBay inventory SKU',
  argumentsSchema: productCompatibilitySkuArgumentsSchema,
  operationKind: 'write',
  operation: deleteProductCompatibility,
});
