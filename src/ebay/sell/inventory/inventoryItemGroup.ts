import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/listing-management/sellInventoryV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';

const inventoryItemGroupKeySchema = z.string().min(1).max(50);

const variationSpecificationSchema = z
  .object({
    name: z.string().min(1),
    values: z.array(z.string().min(1)).min(1),
  })
  .strict();

const variesBySchema = z
  .object({
    aspectsImageVariesBy: z.array(z.string().min(1)).min(1).optional(),
    specifications: z.array(variationSpecificationSchema).min(1).optional(),
  })
  .strict();

const inventoryItemGroupDocumentSchema = z
  .object({
    aspects: z.record(z.string(), z.array(z.string().min(1)).min(1)).optional(),
    description: z.string().max(500_000).optional(),
    imageUrls: z.array(z.url()).optional(),
    subtitle: z.string().max(55).optional(),
    title: z.string().max(80).optional(),
    variantSKUs: z.array(z.string().min(1)).min(1),
    variesBy: variesBySchema.optional(),
    videoIds: z.array(z.string().min(1)).optional(),
  })
  .strict();

/** Exact eBay path fields for one inventory item group. */
export const inventoryItemGroupKeyArgumentsSchema = z
  .object({
    inventoryItemGroupKey: inventoryItemGroupKeySchema,
  })
  .strict();

/** Exact eBay path, header, and direct document fields for replacing an inventory item group. */
export const createOrReplaceInventoryItemGroupArgumentsSchema = inventoryItemGroupDocumentSchema
  .extend({
    inventoryItemGroupKey: inventoryItemGroupKeySchema,
    'Content-Language': z.string().min(1),
  })
  .strict();

/** Validated exact path for one inventory item group. */
export type InventoryItemGroupKeyArguments = z.infer<typeof inventoryItemGroupKeyArgumentsSchema>;

/** Validated direct replacement accepted by createOrReplaceInventoryItemGroup. */
export type CreateOrReplaceInventoryItemGroupArguments = z.infer<
  typeof createOrReplaceInventoryItemGroupArgumentsSchema
>;

/** @see https://developer.ebay.com/api-docs/sell/inventory/types/slr:InventoryItemGroup */
export type InventoryItemGroup = components['schemas']['InventoryItemGroup'];

/** @see https://developer.ebay.com/api-docs/sell/inventory/types/InventoryItemGroup */
export type InventoryItemGroupWriteCompletion = components['schemas']['BaseResponse'] | undefined;

/**
 * Retrieves one seller-defined inventory item group.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param inventoryItemGroupSelection - Exact seller-defined group path.
 * @returns Explicit completion containing eBay's unchanged generated item group.
 * @example `await getInventoryItemGroup(sellerSession, { inventoryItemGroupKey: 'GROUP-1' })`
 * @see https://developer.ebay.com/api-docs/sell/inventory/resources/inventory_item_group/methods/getInventoryItemGroup
 */
export const getInventoryItemGroup = (
  sellerSession: EbaySellerSession,
  inventoryItemGroupSelection: InventoryItemGroupKeyArguments,
): Promise<EbayRequestCompletion<InventoryItemGroup>> =>
  sellerSession.get<InventoryItemGroup>({
    endpoint: `/sell/inventory/v1/inventory_item_group/${encodeURIComponent(inventoryItemGroupSelection.inventoryItemGroupKey)}`,
  });

/**
 * Creates or fully replaces one seller-defined inventory item group.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param inventoryItemGroupReplacement - Exact path, language header, and direct eBay document.
 * @returns Explicit completion containing eBay's optional BaseResponse.
 * @example `await createOrReplaceInventoryItemGroup(sellerSession, { inventoryItemGroupKey: 'GROUP-1', 'Content-Language': 'en-US', variantSKUs: ['SKU-1'] })`
 * @see https://developer.ebay.com/api-docs/sell/inventory/resources/inventory_item_group/methods/createOrReplaceInventoryItemGroup
 */
export const createOrReplaceInventoryItemGroup = (
  sellerSession: EbaySellerSession,
  inventoryItemGroupReplacement: CreateOrReplaceInventoryItemGroupArguments,
): Promise<EbayRequestCompletion<InventoryItemGroupWriteCompletion>> => {
  const {
    inventoryItemGroupKey,
    'Content-Language': contentLanguage,
    ...inventoryItemGroupDocument
  } = inventoryItemGroupReplacement;

  return sellerSession.put<InventoryItemGroupWriteCompletion>({
    endpoint: `/sell/inventory/v1/inventory_item_group/${encodeURIComponent(inventoryItemGroupKey)}`,
    requestDocument: inventoryItemGroupDocument,
    requestHeaders: { 'Content-Language': contentLanguage },
  });
};

/**
 * Deletes one seller-defined inventory item group.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param inventoryItemGroupSelection - Exact seller-defined group path.
 * @returns Explicit completion after eBay deletes the group.
 * @example `await deleteInventoryItemGroup(sellerSession, { inventoryItemGroupKey: 'GROUP-1' })`
 * @see https://developer.ebay.com/api-docs/sell/inventory/resources/inventory_item_group/methods/deleteInventoryItemGroup
 */
export const deleteInventoryItemGroup = (
  sellerSession: EbaySellerSession,
  inventoryItemGroupSelection: InventoryItemGroupKeyArguments,
): Promise<EbayRequestCompletion<undefined>> =>
  sellerSession.delete<undefined>({
    endpoint: `/sell/inventory/v1/inventory_item_group/${encodeURIComponent(inventoryItemGroupSelection.inventoryItemGroupKey)}`,
  });

/** MCP definition for Inventory API getInventoryItemGroup. */
export const getInventoryItemGroupTool = defineTool({
  name: 'ebay_sell_inventory_get_inventory_item_group',
  namespace: 'sell.inventory',
  description: 'Retrieve one seller-defined eBay inventory item group',
  argumentsSchema: inventoryItemGroupKeyArgumentsSchema,
  operationKind: 'read',
  operation: getInventoryItemGroup,
});

/** MCP definition for Inventory API createOrReplaceInventoryItemGroup. */
export const createOrReplaceInventoryItemGroupTool = defineTool({
  name: 'ebay_sell_inventory_create_or_replace_inventory_item_group',
  namespace: 'sell.inventory',
  description: 'Create or fully replace one seller-defined eBay inventory item group',
  argumentsSchema: createOrReplaceInventoryItemGroupArgumentsSchema,
  operationKind: 'write',
  operation: createOrReplaceInventoryItemGroup,
});

/** MCP definition for Inventory API deleteInventoryItemGroup. */
export const deleteInventoryItemGroupTool = defineTool({
  name: 'ebay_sell_inventory_delete_inventory_item_group',
  namespace: 'sell.inventory',
  description: 'Delete one seller-defined eBay inventory item group',
  argumentsSchema: inventoryItemGroupKeyArgumentsSchema,
  operationKind: 'write',
  operation: deleteInventoryItemGroup,
});
