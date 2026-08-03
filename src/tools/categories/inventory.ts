import { Effect } from 'effect';
import { z } from '@/utils/effectSchema.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { defineTool } from '@/tools/defineTool.js';
import type { OutputArgs } from '@/tools/types.js';
import type { ToolEntry } from '@/tools/registry.js';
import {
  mapInventoryItemsToTable,
  mapInventoryItemToCard,
  mapOffersToTable,
  mapOfferToCard,
} from '@/tools/ui/maps.js';
import { MarketplaceId } from '@/types/ebayEnums.js';
import type {
  BulkCreateOfferRequest,
  BulkCreateOrReplaceInventoryItemRequest,
  BulkGetInventoryItemRequest,
  BulkMigrateListingRequest,
  BulkPublishOfferRequest,
  BulkUpdatePriceQuantityRequest,
  CreateOfferRequest,
  GetListingFeesRequest,
  InventoryItem,
  PublishOfferByInventoryItemGroupRequest,
  UpdateOfferRequest,
  WithdrawOfferByInventoryItemGroupRequest,
} from '@/api/listing-management/inventory.js';
import {
  bulkInventoryItemResponseSchema,
  bulkOfferResponseSchema,
  bulkPublishResponseSchema,
  createInventoryItemOutputSchema,
  createOfferOutputSchema,
  getInventoryItemOutputSchema,
  getInventoryItemsOutputSchema,
  getOffersOutputSchema,
  offerResponseSchema,
  publishOfferOutputSchema,
} from '@/schemas/inventory-management/inventory.js';

const emptyOutputSchema = {
  type: 'object',
  properties: {},
  description: 'No content returned on success',
} as OutputArgs;

const generatedBodySchema = <Body>(description: string) =>
  z
    .custom<Body>((value) => value !== null && typeof value === 'object' && !Array.isArray(value), {
      message: description,
    })
    .describe(description);

const skuInputSchema = z.object({
  sku: z.string().describe('The seller-defined SKU'),
});

const inventoryPaginationInputSchema = z.object({
  limit: z.number().optional().describe('Number of records to return'),
  offset: z.number().optional().describe('Number of records to skip'),
});

const createOrReplaceInventoryItemInputSchema = skuInputSchema.extend({
  body: generatedBodySchema<InventoryItem>('Generated InventoryItem request body'),
});

const bulkCreateOrReplaceInventoryItemInputSchema = z.object({
  body: generatedBodySchema<BulkCreateOrReplaceInventoryItemRequest>(
    'Generated BulkInventoryItem request body',
  ),
});

const bulkGetInventoryItemInputSchema = z.object({
  body: generatedBodySchema<BulkGetInventoryItemRequest>(
    'Generated BulkGetInventoryItem request body',
  ),
});

const bulkUpdatePriceQuantityInputSchema = z.object({
  body: generatedBodySchema<BulkUpdatePriceQuantityRequest>(
    'Generated BulkPriceQuantity request body',
  ),
});

const getOffersInputSchema = z.object({
  format: z.string().optional().describe('Filter by listing format'),
  limit: z.number().optional().describe('Number of offers to return'),
  marketplaceId: z.nativeEnum(MarketplaceId).optional().describe('Filter by marketplace ID'),
  offset: z.number().optional().describe('Number of offers to skip'),
  sku: z.string().optional().describe('Filter by SKU'),
});

const offerIdInputSchema = z.object({
  offerId: z.string().describe('The offer ID'),
});

const createOfferInputSchema = z.object({
  body: generatedBodySchema<CreateOfferRequest>('Generated EbayOfferDetailsWithKeys request body'),
});

const updateOfferInputSchema = offerIdInputSchema.extend({
  body: generatedBodySchema<UpdateOfferRequest>('Generated EbayOfferDetailsWithId request body'),
});

const bulkCreateOfferInputSchema = z.object({
  body: generatedBodySchema<BulkCreateOfferRequest>(
    'Generated BulkEbayOfferDetailsWithKeys request body',
  ),
});

const bulkPublishOfferInputSchema = z.object({
  body: generatedBodySchema<BulkPublishOfferRequest>('Generated BulkOffer request body'),
});

const getListingFeesInputSchema = z.object({
  body: generatedBodySchema<GetListingFeesRequest>('Generated OfferKeysWithId request body'),
});

const bulkMigrateListingInputSchema = z.object({
  body: generatedBodySchema<BulkMigrateListingRequest>('Generated BulkMigrateListing request body'),
});

const publishOfferByInventoryItemGroupInputSchema = z.object({
  body: generatedBodySchema<PublishOfferByInventoryItemGroupRequest>(
    'Generated PublishByInventoryItemGroup body',
  ),
});

const withdrawOfferByInventoryItemGroupInputSchema = z.object({
  body: generatedBodySchema<WithdrawOfferByInventoryItemGroupRequest>(
    'Generated WithdrawByInventoryItemGroup body',
  ),
});

const listingFeesOutputSchema = z
  .object({
    feeSummaries: z.array(z.object({}).passthrough()).optional(),
    warnings: z.array(z.object({}).passthrough()).optional(),
  })
  .passthrough();

/** Legacy Inventory API tools for seller inventory items, offers, and bulk operations. */
export const inventoryEntries: ToolEntry[] = [
  defineTool({
    name: 'ebay_get_inventory_items',
    description:
      'Retrieve all inventory items for the seller.\n\nRequired OAuth Scope: sell.inventory.readonly or sell.inventory\nMinimum Scope: https://api.ebay.com/oauth/api_scope/sell.inventory.readonly',
    inputSchema: inventoryPaginationInputSchema.shape,
    outputSchema: zodToJsonSchema(getInventoryItemsOutputSchema, {
      name: 'GetInventoryItemsResponse',
      $refStrategy: 'none',
    }) as OutputArgs,
    handler: (api, args) => Effect.runPromise(api.inventory.getInventoryItems(args)),
    ui: { archetype: 'table', map: mapInventoryItemsToTable },
  }),
  defineTool({
    name: 'ebay_get_inventory_item',
    description:
      'Get a specific inventory item by SKU.\n\nRequired OAuth Scope: sell.inventory.readonly or sell.inventory\nMinimum Scope: https://api.ebay.com/oauth/api_scope/sell.inventory.readonly',
    inputSchema: skuInputSchema.shape,
    outputSchema: zodToJsonSchema(getInventoryItemOutputSchema, {
      name: 'GetInventoryItemResponse',
      $refStrategy: 'none',
    }) as OutputArgs,
    handler: (api, args) => Effect.runPromise(api.inventory.getInventoryItem(args)),
    ui: { archetype: 'card', map: mapInventoryItemToCard },
  }),
  defineTool({
    name: 'ebay_create_or_replace_inventory_item',
    description:
      'Create or replace an inventory item.\n\nRequired OAuth Scope: sell.inventory\nMinimum Scope: https://api.ebay.com/oauth/api_scope/sell.inventory',
    inputSchema: createOrReplaceInventoryItemInputSchema.shape,
    outputSchema: zodToJsonSchema(createInventoryItemOutputSchema, {
      name: 'CreateOrReplaceInventoryItemResponse',
      $refStrategy: 'none',
    }) as OutputArgs,
    handler: (api, args) => Effect.runPromise(api.inventory.createOrReplaceInventoryItem(args)),
  }),
  defineTool({
    name: 'ebay_delete_inventory_item',
    description:
      'Delete an inventory item by SKU.\n\nRequired OAuth Scope: sell.inventory\nMinimum Scope: https://api.ebay.com/oauth/api_scope/sell.inventory',
    inputSchema: skuInputSchema.shape,
    outputSchema: emptyOutputSchema,
    handler: (api, args) => Effect.runPromise(api.inventory.deleteInventoryItem(args)),
  }),
  defineTool({
    name: 'ebay_bulk_create_or_replace_inventory_item',
    description: 'Bulk create or replace multiple inventory items',
    inputSchema: bulkCreateOrReplaceInventoryItemInputSchema.shape,
    outputSchema: zodToJsonSchema(bulkInventoryItemResponseSchema, {
      name: 'BulkInventoryItemResponse',
      $refStrategy: 'none',
    }) as OutputArgs,
    handler: (api, args) => Effect.runPromise(api.inventory.bulkCreateOrReplaceInventoryItem(args)),
  }),
  defineTool({
    name: 'ebay_bulk_get_inventory_item',
    description: 'Bulk get multiple inventory items',
    inputSchema: bulkGetInventoryItemInputSchema.shape,
    outputSchema: zodToJsonSchema(bulkInventoryItemResponseSchema, {
      name: 'BulkGetInventoryItemResponse',
      $refStrategy: 'none',
    }) as OutputArgs,
    handler: (api, args) => Effect.runPromise(api.inventory.bulkGetInventoryItem(args)),
  }),
  defineTool({
    name: 'ebay_bulk_update_price_quantity',
    description: 'Bulk update price and quantity for multiple offers',
    inputSchema: bulkUpdatePriceQuantityInputSchema.shape,
    outputSchema: zodToJsonSchema(bulkOfferResponseSchema, {
      name: 'BulkUpdatePriceQuantityResponse',
      $refStrategy: 'none',
    }) as OutputArgs,
    handler: (api, args) => Effect.runPromise(api.inventory.bulkUpdatePriceQuantity(args)),
  }),
  defineTool({
    name: 'ebay_get_offers',
    description: 'Get all offers for the seller',
    inputSchema: getOffersInputSchema.shape,
    outputSchema: zodToJsonSchema(getOffersOutputSchema, {
      name: 'GetOffersResponse',
      $refStrategy: 'none',
    }) as OutputArgs,
    handler: (api, args) => Effect.runPromise(api.inventory.getOffers(args)),
    ui: { archetype: 'table', map: mapOffersToTable },
  }),
  defineTool({
    name: 'ebay_get_offer',
    description: 'Get a specific offer by ID',
    inputSchema: offerIdInputSchema.shape,
    outputSchema: zodToJsonSchema(offerResponseSchema, {
      name: 'GetOfferResponse',
      $refStrategy: 'none',
    }) as OutputArgs,
    handler: (api, args) => Effect.runPromise(api.inventory.getOffer(args)),
    ui: { archetype: 'card', map: mapOfferToCard },
  }),
  defineTool({
    name: 'ebay_create_offer',
    description: 'Create a new offer for an inventory item',
    inputSchema: createOfferInputSchema.shape,
    outputSchema: zodToJsonSchema(createOfferOutputSchema, {
      name: 'CreateOfferResponse',
      $refStrategy: 'none',
    }) as OutputArgs,
    handler: (api, args) => Effect.runPromise(api.inventory.createOffer(args)),
  }),
  defineTool({
    name: 'ebay_update_offer',
    description: 'Update an existing offer',
    inputSchema: updateOfferInputSchema.shape,
    outputSchema: zodToJsonSchema(offerResponseSchema, {
      name: 'UpdateOfferResponse',
      $refStrategy: 'none',
    }) as OutputArgs,
    handler: (api, args) => Effect.runPromise(api.inventory.updateOffer(args)),
  }),
  defineTool({
    name: 'ebay_delete_offer',
    description: 'Delete an offer',
    inputSchema: offerIdInputSchema.shape,
    outputSchema: emptyOutputSchema,
    handler: (api, args) => Effect.runPromise(api.inventory.deleteOffer(args)),
  }),
  defineTool({
    name: 'ebay_publish_offer',
    description: 'Publish an offer to create a listing',
    inputSchema: offerIdInputSchema.shape,
    outputSchema: zodToJsonSchema(publishOfferOutputSchema, {
      name: 'PublishOfferResponse',
      $refStrategy: 'none',
    }) as OutputArgs,
    handler: (api, args) => Effect.runPromise(api.inventory.publishOffer(args)),
  }),
  defineTool({
    name: 'ebay_withdraw_offer',
    description: 'Withdraw a published offer',
    inputSchema: offerIdInputSchema.shape,
    outputSchema: zodToJsonSchema(publishOfferOutputSchema, {
      name: 'WithdrawOfferResponse',
      $refStrategy: 'none',
    }) as OutputArgs,
    handler: (api, args) => Effect.runPromise(api.inventory.withdrawOffer(args)),
  }),
  defineTool({
    name: 'ebay_bulk_create_offer',
    description: 'Bulk create multiple offers',
    inputSchema: bulkCreateOfferInputSchema.shape,
    outputSchema: zodToJsonSchema(bulkOfferResponseSchema, {
      name: 'BulkCreateOfferResponse',
      $refStrategy: 'none',
    }) as OutputArgs,
    handler: (api, args) => Effect.runPromise(api.inventory.bulkCreateOffer(args)),
  }),
  defineTool({
    name: 'ebay_bulk_publish_offer',
    description: 'Bulk publish multiple offers',
    inputSchema: bulkPublishOfferInputSchema.shape,
    outputSchema: zodToJsonSchema(bulkPublishResponseSchema, {
      name: 'BulkPublishOfferResponse',
      $refStrategy: 'none',
    }) as OutputArgs,
    handler: (api, args) => Effect.runPromise(api.inventory.bulkPublishOffer(args)),
  }),
  defineTool({
    name: 'ebay_get_listing_fees',
    description: 'Get listing fees for offers before publishing',
    inputSchema: getListingFeesInputSchema.shape,
    outputSchema: zodToJsonSchema(listingFeesOutputSchema, {
      name: 'GetListingFeesResponse',
      $refStrategy: 'none',
    }) as OutputArgs,
    handler: (api, args) => Effect.runPromise(api.inventory.getListingFees(args)),
  }),
  defineTool({
    name: 'ebay_bulk_migrate_listing',
    description: 'Bulk migrate listings to the inventory model',
    inputSchema: bulkMigrateListingInputSchema.shape,
    outputSchema: zodToJsonSchema(bulkOfferResponseSchema, {
      name: 'BulkMigrateListingResponse',
      $refStrategy: 'none',
    }) as OutputArgs,
    handler: (api, args) => Effect.runPromise(api.inventory.bulkMigrateListing(args)),
  }),
  defineTool({
    name: 'ebay_publish_offer_by_inventory_item_group',
    description:
      'Publish an offer for an inventory item group (variation listing).\n\nRequired OAuth Scope: sell.inventory\nMinimum Scope: https://api.ebay.com/oauth/api_scope/sell.inventory',
    inputSchema: publishOfferByInventoryItemGroupInputSchema.shape,
    outputSchema: zodToJsonSchema(publishOfferOutputSchema, {
      name: 'PublishOfferByInventoryItemGroupResponse',
      $refStrategy: 'none',
    }) as OutputArgs,
    handler: (api, args) => Effect.runPromise(api.inventory.publishOfferByInventoryItemGroup(args)),
  }),
  defineTool({
    name: 'ebay_withdraw_offer_by_inventory_item_group',
    description:
      'Withdraw an offer for an inventory item group (variation listing).\n\nRequired OAuth Scope: sell.inventory\nMinimum Scope: https://api.ebay.com/oauth/api_scope/sell.inventory',
    inputSchema: withdrawOfferByInventoryItemGroupInputSchema.shape,
    outputSchema: emptyOutputSchema,
    handler: (api, args) =>
      Effect.runPromise(api.inventory.withdrawOfferByInventoryItemGroup(args)),
  }),
];
