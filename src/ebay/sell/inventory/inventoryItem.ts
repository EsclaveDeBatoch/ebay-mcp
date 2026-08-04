import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/listing-management/sellInventoryV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';
import { mapInventoryItemsToTable, mapInventoryItemToCard } from '@/tools/ui/maps.js';

const skuSchema = z.string().min(1).max(50);
const pageSizeSchema = z
  .string()
  .regex(/^[1-9]\d*$/, 'limit must be a positive integer string')
  .refine((pageSize) => Number(pageSize) <= 200, 'limit must be no greater than 200');
const pageOffsetSchema = z
  .string()
  .regex(/^(?:0|[1-9]\d*)$/, 'offset must be a non-negative integer string');
const contentLanguageSchema = z.string().min(1);
const nonNegativeQuantitySchema = z.number().int().nonnegative();
const positiveMeasurementSchema = z.number().positive();
const numericIdentifierSchema = z.string().regex(/^\d+$/, 'identifier must contain only digits');
const inventoryConditionSchema = z.enum([
  'NEW',
  'LIKE_NEW',
  'NEW_OTHER',
  'NEW_WITH_DEFECTS',
  'MANUFACTURER_REFURBISHED',
  'CERTIFIED_REFURBISHED',
  'EXCELLENT_REFURBISHED',
  'VERY_GOOD_REFURBISHED',
  'GOOD_REFURBISHED',
  'SELLER_REFURBISHED',
  'USED_EXCELLENT',
  'USED_VERY_GOOD',
  'USED_GOOD',
  'USED_ACCEPTABLE',
  'FOR_PARTS_OR_NOT_WORKING',
  'PRE_OWNED_EXCELLENT',
  'PRE_OWNED_FAIR',
]);
const newInventoryConditions = new Set(['NEW', 'LIKE_NEW', 'NEW_OTHER', 'NEW_WITH_DEFECTS']);

function containsDuplicateIdentifiers(identifiers: readonly string[]): boolean {
  return new Set(identifiers).size !== identifiers.length;
}

const timeDurationSchema = z
  .object({
    unit: z.enum([
      'YEAR',
      'MONTH',
      'DAY',
      'HOUR',
      'CALENDAR_DAY',
      'BUSINESS_DAY',
      'MINUTE',
      'SECOND',
      'MILLISECOND',
    ]),
    value: z.number().int().nonnegative(),
  })
  .strict();

const pickupAvailabilitySchema = z
  .object({
    availabilityType: z.enum(['IN_STOCK', 'OUT_OF_STOCK', 'SHIP_TO_STORE']),
    fulfillmentTime: timeDurationSchema,
    merchantLocationKey: z.string().min(1).max(36),
    quantity: nonNegativeQuantitySchema,
  })
  .strict()
  .superRefine((pickupAvailability, refinement) => {
    if (pickupAvailability.availabilityType === 'OUT_OF_STOCK') {
      if (pickupAvailability.quantity !== 0) {
        refinement.addIssue({
          code: 'custom',
          message: 'Out-of-stock pickup availability requires zero quantity',
          path: ['quantity'],
        });
      }
      return;
    }
    if (pickupAvailability.quantity === 0) {
      refinement.addIssue({
        code: 'custom',
        message: 'Available pickup inventory requires a positive quantity',
        path: ['quantity'],
      });
    }
  });

const availabilityDistributionSchema = z
  .object({
    fulfillmentTime: timeDurationSchema.optional(),
    merchantLocationKey: z.string().min(1).max(36),
    quantity: nonNegativeQuantitySchema,
  })
  .strict();

const shipAvailabilitySchema = z
  .object({
    availabilityDistributions: z.array(availabilityDistributionSchema).min(1).optional(),
    quantity: nonNegativeQuantitySchema.optional(),
  })
  .strict()
  .superRefine((shipAvailability, refinement) => {
    if (Object.keys(shipAvailability).length === 0) {
      refinement.addIssue({
        code: 'custom',
        message: 'Ship-to-location availability requires quantity or warehouse distributions',
      });
      return;
    }
    if (shipAvailability.availabilityDistributions === undefined) {
      return;
    }
    const merchantLocationKeys = shipAvailability.availabilityDistributions.map(
      (availabilityDistribution) => availabilityDistribution.merchantLocationKey,
    );
    if (containsDuplicateIdentifiers(merchantLocationKeys)) {
      refinement.addIssue({
        code: 'custom',
        message: 'Warehouse availability may contain each merchant location once',
        path: ['availabilityDistributions'],
      });
    }
  });

const availabilitySchema = z
  .object({
    pickupAtLocationAvailability: z.array(pickupAvailabilitySchema).min(1).optional(),
    shipToLocationAvailability: shipAvailabilitySchema.optional(),
  })
  .strict()
  .superRefine((inventoryAvailability, refinement) => {
    if (Object.keys(inventoryAvailability).length === 0) {
      refinement.addIssue({
        code: 'custom',
        message: 'Availability requires pickup or ship-to-location details',
      });
      return;
    }
    if (inventoryAvailability.pickupAtLocationAvailability === undefined) {
      return;
    }
    const merchantLocationKeys = inventoryAvailability.pickupAtLocationAvailability.map(
      (pickupAvailability) => pickupAvailability.merchantLocationKey,
    );
    if (containsDuplicateIdentifiers(merchantLocationKeys)) {
      refinement.addIssue({
        code: 'custom',
        message: 'Pickup availability may contain each merchant location once',
        path: ['pickupAtLocationAvailability'],
      });
    }
  });

const conditionDescriptorSchema = z
  .object({
    additionalInfo: z.string().max(30).optional(),
    name: numericIdentifierSchema,
    values: z.array(numericIdentifierSchema).min(1),
  })
  .strict();

const packageDimensionsSchema = z
  .object({
    height: positiveMeasurementSchema,
    length: positiveMeasurementSchema,
    unit: z.enum(['FEET', 'INCH', 'METER', 'CENTIMETER']),
    width: positiveMeasurementSchema,
  })
  .strict();

const packageWeightSchema = z
  .object({
    unit: z.enum(['POUND', 'OUNCE', 'KILOGRAM', 'GRAM']),
    value: positiveMeasurementSchema,
  })
  .strict();

const packageWeightAndSizeSchema = z
  .object({
    dimensions: packageDimensionsSchema.optional(),
    packageType: z.string().min(1).optional(),
    shippingIrregular: z.boolean().optional(),
    weight: packageWeightSchema.optional(),
  })
  .strict()
  .refine((shippingPackage) => Object.keys(shippingPackage).length > 0, {
    message: 'Package weight and size requires at least one package field',
  });

const productIdentifierCollectionSchema = z.array(z.string().min(1)).min(1);
const secureImageUrlSchema = z
  .url()
  .refine((imageUrl) => imageUrl.startsWith('https://'), 'image URLs must use HTTPS');
const productSchema = z
  .object({
    aspects: z.record(z.string().min(1), z.array(z.string().min(1)).min(1)).optional(),
    brand: z.string().max(65).optional(),
    description: z.string().max(4000).optional(),
    ean: productIdentifierCollectionSchema.optional(),
    epid: z.string().min(1).optional(),
    imageUrls: z.array(secureImageUrlSchema).min(1).max(24).optional(),
    isbn: productIdentifierCollectionSchema.optional(),
    mpn: z.string().max(65).optional(),
    subtitle: z.string().max(55).optional(),
    title: z.string().max(80).optional(),
    upc: productIdentifierCollectionSchema.optional(),
    videoIds: z.array(z.string().min(1)).min(1).max(1).optional(),
  })
  .strict()
  .refine((productDetails) => Object.keys(productDetails).length > 0, {
    message: 'Product details require at least one product field',
  });

const inventoryItemFields = {
  availability: availabilitySchema.optional(),
  condition: inventoryConditionSchema.optional(),
  conditionDescription: z.string().max(1000).optional(),
  conditionDescriptors: z.array(conditionDescriptorSchema).min(1).optional(),
  packageWeightAndSize: packageWeightAndSizeSchema.optional(),
  product: productSchema.optional(),
} as const;

type InventoryItemConditionFields = {
  readonly condition?: z.infer<typeof inventoryConditionSchema>;
  readonly conditionDescription?: string;
  readonly conditionDescriptors?: z.infer<typeof conditionDescriptorSchema>[];
};

function validatesInventoryItemCondition(
  inventoryConditionFields: InventoryItemConditionFields,
  refinement: z.RefinementCtx,
): void {
  if (
    inventoryConditionFields.conditionDescription !== undefined &&
    inventoryConditionFields.condition !== undefined &&
    newInventoryConditions.has(inventoryConditionFields.condition)
  ) {
    refinement.addIssue({
      code: 'custom',
      message: 'Condition descriptions apply only to used or refurbished inventory',
      path: ['conditionDescription'],
    });
  }
  if (inventoryConditionFields.conditionDescriptors === undefined) {
    return;
  }
  const descriptorNames = inventoryConditionFields.conditionDescriptors.map(
    (conditionDescriptor) => conditionDescriptor.name,
  );
  if (containsDuplicateIdentifiers(descriptorNames)) {
    refinement.addIssue({
      code: 'custom',
      message: 'Condition descriptors may contain each descriptor name once',
      path: ['conditionDescriptors'],
    });
  }
}

/** Exact eBay string pagination accepted by getInventoryItems. */
export const inventoryItemPageArgumentsSchema = z
  .object({
    limit: pageSizeSchema.optional(),
    offset: pageOffsetSchema.optional(),
  })
  .strict();

/** Exact seller-defined SKU path accepted by inventory-item operations. */
export const inventoryItemSkuArgumentsSchema = z.object({ sku: skuSchema }).strict();

/** Exact path, language header, and direct InventoryItem fields accepted by eBay. */
export const createOrReplaceInventoryItemArgumentsSchema = z
  .object({
    sku: skuSchema,
    'Content-Language': contentLanguageSchema,
    ...inventoryItemFields,
  })
  .strict()
  .superRefine(validatesInventoryItemCondition);

const bulkInventoryItemSchema = z
  .object({
    sku: skuSchema,
    locale: z.string().min(1).optional(),
    ...inventoryItemFields,
  })
  .strict()
  .superRefine(validatesInventoryItemCondition);

/** Exact language header and direct BulkInventoryItem document accepted by eBay. */
export const bulkCreateOrReplaceInventoryItemArgumentsSchema = z
  .object({
    'Content-Language': contentLanguageSchema,
    requests: z.array(bulkInventoryItemSchema).min(1).max(25),
  })
  .strict()
  .superRefine((inventoryItemBatch, refinement) => {
    const inventorySkus = inventoryItemBatch.requests.map(
      (inventoryItemRequest) => inventoryItemRequest.sku,
    );
    if (containsDuplicateIdentifiers(inventorySkus)) {
      refinement.addIssue({
        code: 'custom',
        message: 'A bulk replacement may contain each SKU once',
        path: ['requests'],
      });
    }
  });

const inventoryItemSelectionSchema = z.object({ sku: skuSchema }).strict();

/** Exact direct BulkGetInventoryItem document accepted by eBay. */
export const bulkGetInventoryItemArgumentsSchema = z
  .object({
    requests: z.array(inventoryItemSelectionSchema).min(1).max(25),
  })
  .strict()
  .superRefine((inventoryItemSelections, refinement) => {
    const inventorySkus = inventoryItemSelections.requests.map(
      (inventoryItemSelection) => inventoryItemSelection.sku,
    );
    if (containsDuplicateIdentifiers(inventorySkus)) {
      refinement.addIssue({
        code: 'custom',
        message: 'A bulk retrieval may contain each SKU once',
        path: ['requests'],
      });
    }
  });

const monetaryAmountSchema = z
  .object({
    currency: z.string().regex(/^[A-Z]{3}$/, 'currency must use a three-letter ISO code'),
    value: z
      .string()
      .regex(/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/, 'price must be a non-negative monetary string'),
  })
  .strict();

const offerPriceQuantitySchema = z
  .object({
    availableQuantity: nonNegativeQuantitySchema.optional(),
    offerId: z.string().min(1),
    price: monetaryAmountSchema.optional(),
  })
  .strict()
  .refine(
    (offerChange) => offerChange.availableQuantity !== undefined || offerChange.price !== undefined,
    { message: 'An offer change requires available quantity or price' },
  );

const priceQuantitySchema = z
  .object({
    offers: z.array(offerPriceQuantitySchema).min(1).max(25).optional(),
    shipToLocationAvailability: shipAvailabilitySchema.optional(),
    sku: skuSchema.optional(),
  })
  .strict()
  .superRefine((inventoryPriceQuantityChange, refinement) => {
    if (
      inventoryPriceQuantityChange.offers === undefined &&
      inventoryPriceQuantityChange.shipToLocationAvailability === undefined
    ) {
      refinement.addIssue({
        code: 'custom',
        message: 'A price or quantity change requires offers or inventory availability',
      });
    }
    if (
      inventoryPriceQuantityChange.shipToLocationAvailability !== undefined &&
      inventoryPriceQuantityChange.sku === undefined
    ) {
      refinement.addIssue({
        code: 'custom',
        message: 'Inventory availability changes require a SKU',
        path: ['sku'],
      });
    }
    if (
      inventoryPriceQuantityChange.sku !== undefined &&
      inventoryPriceQuantityChange.shipToLocationAvailability === undefined
    ) {
      refinement.addIssue({
        code: 'custom',
        message: 'SKU is accepted only with an inventory availability change',
        path: ['sku'],
      });
    }
    if (inventoryPriceQuantityChange.offers === undefined) {
      return;
    }
    const offerIdentifiers = inventoryPriceQuantityChange.offers.map(
      (offerChange) => offerChange.offerId,
    );
    if (containsDuplicateIdentifiers(offerIdentifiers)) {
      refinement.addIssue({
        code: 'custom',
        message: 'An inventory change may contain each offer once',
        path: ['offers'],
      });
    }
  });

/** Exact direct BulkPriceQuantity document accepted by eBay. */
export const bulkUpdatePriceQuantityArgumentsSchema = z
  .object({ requests: z.array(priceQuantitySchema).min(1).max(25) })
  .strict();

const listingMigrationSchema = z.object({ listingId: z.string().min(1) }).strict();

/** Exact direct BulkMigrateListing document accepted by eBay. */
export const bulkMigrateListingArgumentsSchema = z
  .object({ requests: z.array(listingMigrationSchema).min(1).max(5) })
  .strict()
  .superRefine((listingMigrations, refinement) => {
    const listingIdentifiers = listingMigrations.requests.map(
      (listingMigration) => listingMigration.listingId,
    );
    if (containsDuplicateIdentifiers(listingIdentifiers)) {
      refinement.addIssue({
        code: 'custom',
        message: 'A migration may contain each listing once',
        path: ['requests'],
      });
    }
  });

/** Validated exact eBay pagination for inventory items. */
export type InventoryItemPageArguments = z.infer<typeof inventoryItemPageArgumentsSchema>;

/** Validated exact seller-defined SKU path. */
export type InventoryItemSkuArguments = z.infer<typeof inventoryItemSkuArgumentsSchema>;

/** Validated direct replacement accepted by createOrReplaceInventoryItem. */
export type CreateOrReplaceInventoryItemArguments = z.infer<
  typeof createOrReplaceInventoryItemArgumentsSchema
>;

/** Validated direct batch accepted by bulkCreateOrReplaceInventoryItem. */
export type BulkCreateOrReplaceInventoryItemArguments = z.infer<
  typeof bulkCreateOrReplaceInventoryItemArgumentsSchema
>;

/** Validated direct selection accepted by bulkGetInventoryItem. */
export type BulkGetInventoryItemArguments = z.infer<typeof bulkGetInventoryItemArgumentsSchema>;

/** Validated direct changes accepted by bulkUpdatePriceQuantity. */
export type BulkUpdatePriceQuantityArguments = z.infer<
  typeof bulkUpdatePriceQuantityArgumentsSchema
>;

/** Validated direct listing selection accepted by bulkMigrateListing. */
export type BulkMigrateListingArguments = z.infer<typeof bulkMigrateListingArgumentsSchema>;

/** @see https://developer.ebay.com/api-docs/sell/inventory/types/api:InventoryItems */
export type InventoryItemCollection = components['schemas']['InventoryItems'];

/** @see https://developer.ebay.com/api-docs/sell/inventory/types/api:InventoryItemWithSkuLocaleGroupid */
export type InventoryItem = components['schemas']['InventoryItemWithSkuLocaleGroupid'];

/** @see https://developer.ebay.com/api-docs/sell/inventory/types/api:BaseResponse */
export type InventoryItemWriteCompletion = components['schemas']['BaseResponse'] | undefined;

/** @see https://developer.ebay.com/api-docs/sell/inventory/types/api:BulkInventoryItemResponse */
export type BulkInventoryItemCompletion = components['schemas']['BulkInventoryItemResponse'];

/** @see https://developer.ebay.com/api-docs/sell/inventory/types/api:BulkGetInventoryItemResponse */
export type BulkGetInventoryItemCompletion = components['schemas']['BulkGetInventoryItemResponse'];

/** @see https://developer.ebay.com/api-docs/sell/inventory/types/api:BulkPriceQuantityResponse */
export type BulkPriceQuantityCompletion = components['schemas']['BulkPriceQuantityResponse'];

/** @see https://developer.ebay.com/api-docs/sell/inventory/types/api:BulkMigrateListingResponse */
export type BulkMigrateListingCompletion = components['schemas']['BulkMigrateListingResponse'];

const inventoryItemEndpoint = (sku: string): string =>
  `/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`;

/**
 * Retrieves the seller's paginated inventory items.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param inventoryItemPage - Exact eBay string pagination.
 * @returns Explicit completion containing eBay's unchanged inventory-item collection.
 * @example `await getInventoryItems(sellerSession, { limit: '25', offset: '0' })`
 * @see https://developer.ebay.com/api-docs/sell/inventory/resources/inventory_item/methods/getInventoryItems
 */
export const getInventoryItems = (
  sellerSession: EbaySellerSession,
  inventoryItemPage: InventoryItemPageArguments = {},
): Promise<EbayRequestCompletion<InventoryItemCollection>> =>
  sellerSession.get<InventoryItemCollection>({
    endpoint: '/sell/inventory/v1/inventory_item',
    searchParameters: inventoryItemPage,
  });

/**
 * Retrieves one seller-defined inventory item.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param inventoryItemSelection - Exact seller-defined SKU path.
 * @returns Explicit completion containing eBay's unchanged inventory item.
 * @example `await getInventoryItem(sellerSession, { sku: 'CAMERA-1' })`
 * @see https://developer.ebay.com/api-docs/sell/inventory/resources/inventory_item/methods/getInventoryItem
 */
export const getInventoryItem = (
  sellerSession: EbaySellerSession,
  inventoryItemSelection: InventoryItemSkuArguments,
): Promise<EbayRequestCompletion<InventoryItem>> =>
  sellerSession.get<InventoryItem>({
    endpoint: inventoryItemEndpoint(inventoryItemSelection.sku),
  });

/**
 * Creates or fully replaces one seller-defined inventory item.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param inventoryItemReplacement - Exact path, language header, and direct InventoryItem fields.
 * @returns Explicit completion containing eBay's optional BaseResponse.
 * @example `await createOrReplaceInventoryItem(sellerSession, { sku: 'CAMERA-1', 'Content-Language': 'en-US', condition: 'NEW' })`
 * @see https://developer.ebay.com/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem
 */
export const createOrReplaceInventoryItem = (
  sellerSession: EbaySellerSession,
  inventoryItemReplacement: CreateOrReplaceInventoryItemArguments,
): Promise<EbayRequestCompletion<InventoryItemWriteCompletion>> => {
  const {
    sku,
    'Content-Language': contentLanguage,
    ...inventoryItemDocument
  } = inventoryItemReplacement;

  return sellerSession.put<InventoryItemWriteCompletion>({
    endpoint: inventoryItemEndpoint(sku),
    requestDocument: inventoryItemDocument,
    requestHeaders: { 'Content-Language': contentLanguage },
  });
};

/**
 * Deletes one seller-defined inventory item.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param inventoryItemSelection - Exact seller-defined SKU path.
 * @returns Explicit completion after eBay deletes the inventory item.
 * @example `await deleteInventoryItem(sellerSession, { sku: 'CAMERA-1' })`
 * @see https://developer.ebay.com/api-docs/sell/inventory/resources/inventory_item/methods/deleteInventoryItem
 */
export const deleteInventoryItem = (
  sellerSession: EbaySellerSession,
  inventoryItemSelection: InventoryItemSkuArguments,
): Promise<EbayRequestCompletion<undefined>> =>
  sellerSession.delete<undefined>({ endpoint: inventoryItemEndpoint(inventoryItemSelection.sku) });

/**
 * Creates or fully replaces up to 25 inventory items.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param inventoryItemBatch - Exact language header and direct BulkInventoryItem document.
 * @returns Explicit completion containing eBay's unchanged per-SKU statuses.
 * @example `await bulkCreateOrReplaceInventoryItem(sellerSession, { 'Content-Language': 'en-US', requests: [{ sku: 'CAMERA-1' }] })`
 * @see https://developer.ebay.com/api-docs/sell/inventory/resources/inventory_item/methods/bulkCreateOrReplaceInventoryItem
 */
export const bulkCreateOrReplaceInventoryItem = (
  sellerSession: EbaySellerSession,
  inventoryItemBatch: BulkCreateOrReplaceInventoryItemArguments,
): Promise<EbayRequestCompletion<BulkInventoryItemCompletion>> => {
  const { 'Content-Language': contentLanguage, ...bulkInventoryItemDocument } = inventoryItemBatch;

  return sellerSession.post<BulkInventoryItemCompletion>({
    endpoint: '/sell/inventory/v1/bulk_create_or_replace_inventory_item',
    requestDocument: bulkInventoryItemDocument,
    requestHeaders: { 'Content-Language': contentLanguage },
  });
};

/**
 * Retrieves up to 25 inventory items by seller-defined SKU.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param inventoryItemSelections - Exact direct BulkGetInventoryItem document.
 * @returns Explicit completion containing eBay's unchanged per-SKU responses.
 * @example `await bulkGetInventoryItem(sellerSession, { requests: [{ sku: 'CAMERA-1' }] })`
 * @see https://developer.ebay.com/api-docs/sell/inventory/resources/inventory_item/methods/bulkGetInventoryItem
 */
export const bulkGetInventoryItem = (
  sellerSession: EbaySellerSession,
  inventoryItemSelections: BulkGetInventoryItemArguments,
): Promise<EbayRequestCompletion<BulkGetInventoryItemCompletion>> =>
  sellerSession.post<BulkGetInventoryItemCompletion>({
    endpoint: '/sell/inventory/v1/bulk_get_inventory_item',
    requestDocument: inventoryItemSelections,
  });

/**
 * Changes published-offer price or quantity and inventory availability in batches.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param inventoryPriceQuantityChanges - Exact direct BulkPriceQuantity document.
 * @returns Explicit completion containing eBay's unchanged per-change responses.
 * @example `await bulkUpdatePriceQuantity(sellerSession, { requests: [{ sku: 'CAMERA-1', shipToLocationAvailability: { quantity: 8 } }] })`
 * @see https://developer.ebay.com/api-docs/sell/inventory/resources/inventory_item/methods/bulkUpdatePriceQuantity
 */
export const bulkUpdatePriceQuantity = (
  sellerSession: EbaySellerSession,
  inventoryPriceQuantityChanges: BulkUpdatePriceQuantityArguments,
): Promise<EbayRequestCompletion<BulkPriceQuantityCompletion>> =>
  sellerSession.post<BulkPriceQuantityCompletion>({
    endpoint: '/sell/inventory/v1/bulk_update_price_quantity',
    requestDocument: inventoryPriceQuantityChanges,
  });

/**
 * Migrates up to five existing listings into the Inventory API model.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param listingMigrations - Exact direct BulkMigrateListing document.
 * @returns Explicit completion containing eBay's unchanged per-listing responses.
 * @example `await bulkMigrateListing(sellerSession, { requests: [{ listingId: '123456789012' }] })`
 * @see https://developer.ebay.com/api-docs/sell/inventory/resources/inventory_item/methods/bulkMigrateListing
 */
export const bulkMigrateListing = (
  sellerSession: EbaySellerSession,
  listingMigrations: BulkMigrateListingArguments,
): Promise<EbayRequestCompletion<BulkMigrateListingCompletion>> =>
  sellerSession.post<BulkMigrateListingCompletion>({
    endpoint: '/sell/inventory/v1/bulk_migrate_listing',
    requestDocument: listingMigrations,
  });

/** MCP definition for Inventory API getInventoryItems. */
export const getInventoryItemsTool = defineTool({
  name: 'ebay_sell_inventory_get_inventory_items',
  namespace: 'sell.inventory',
  description: 'Retrieve seller inventory items with exact eBay pagination',
  argumentsSchema: inventoryItemPageArgumentsSchema,
  operationKind: 'read',
  operation: getInventoryItems,
  presentation: { archetype: 'table', project: mapInventoryItemsToTable },
});

/** MCP definition for Inventory API getInventoryItem. */
export const getInventoryItemTool = defineTool({
  name: 'ebay_sell_inventory_get_inventory_item',
  namespace: 'sell.inventory',
  description: 'Retrieve one seller-defined eBay inventory item',
  argumentsSchema: inventoryItemSkuArgumentsSchema,
  operationKind: 'read',
  operation: getInventoryItem,
  presentation: { archetype: 'card', project: mapInventoryItemToCard },
});

/** MCP definition for Inventory API createOrReplaceInventoryItem. */
export const createOrReplaceInventoryItemTool = defineTool({
  name: 'ebay_sell_inventory_create_or_replace_inventory_item',
  namespace: 'sell.inventory',
  description: 'Create or fully replace one seller-defined eBay inventory item',
  argumentsSchema: createOrReplaceInventoryItemArgumentsSchema,
  operationKind: 'write',
  operation: createOrReplaceInventoryItem,
});

/** MCP definition for Inventory API deleteInventoryItem. */
export const deleteInventoryItemTool = defineTool({
  name: 'ebay_sell_inventory_delete_inventory_item',
  namespace: 'sell.inventory',
  description: 'Delete one seller-defined eBay inventory item',
  argumentsSchema: inventoryItemSkuArgumentsSchema,
  operationKind: 'write',
  operation: deleteInventoryItem,
});

/** MCP definition for Inventory API bulkCreateOrReplaceInventoryItem. */
export const bulkCreateOrReplaceInventoryItemTool = defineTool({
  name: 'ebay_sell_inventory_bulk_create_or_replace_inventory_item',
  namespace: 'sell.inventory',
  description: 'Create or fully replace up to 25 eBay inventory items',
  argumentsSchema: bulkCreateOrReplaceInventoryItemArgumentsSchema,
  operationKind: 'write',
  operation: bulkCreateOrReplaceInventoryItem,
});

/** MCP definition for Inventory API bulkGetInventoryItem. */
export const bulkGetInventoryItemTool = defineTool({
  name: 'ebay_sell_inventory_bulk_get_inventory_item',
  namespace: 'sell.inventory',
  description: 'Retrieve up to 25 eBay inventory items by seller-defined SKU',
  argumentsSchema: bulkGetInventoryItemArgumentsSchema,
  operationKind: 'read',
  operation: bulkGetInventoryItem,
});

/** MCP definition for Inventory API bulkUpdatePriceQuantity. */
export const bulkUpdatePriceQuantityTool = defineTool({
  name: 'ebay_sell_inventory_bulk_update_price_quantity',
  namespace: 'sell.inventory',
  description: 'Update published-offer price or quantity and inventory availability',
  argumentsSchema: bulkUpdatePriceQuantityArgumentsSchema,
  operationKind: 'write',
  operation: bulkUpdatePriceQuantity,
});

/** MCP definition for Inventory API bulkMigrateListing. */
export const bulkMigrateListingTool = defineTool({
  name: 'ebay_sell_inventory_bulk_migrate_listing',
  namespace: 'sell.inventory',
  description: 'Migrate up to five existing eBay listings into the Inventory API model',
  argumentsSchema: bulkMigrateListingArgumentsSchema,
  operationKind: 'write',
  operation: bulkMigrateListing,
});
