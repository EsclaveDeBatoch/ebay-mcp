import type { EbayApiClient } from '@/api/client.js';
import { createInventoryItemsMethods } from './items.js';
import { createInventoryOffersMethods } from './offers.js';

type InventoryItemsMethods = ReturnType<typeof createInventoryItemsMethods>;
type InventoryOffersMethods = ReturnType<typeof createInventoryOffersMethods>;

export type { InventoryPaginationInput } from './shared.js';
export type {
  SkuInput,
  CreateOrReplaceInventoryItemInput,
  BulkInventoryItemInput,
  BulkGetInventoryItemInput,
  BulkUpdatePriceQuantityInput,
  BulkMigrateListingInput,
  BulkCreateOrReplaceInventoryItemRequest,
  BulkCreateOrReplaceInventoryItemResponse,
  BulkGetInventoryItemRequest,
  BulkGetInventoryItemResponse,
  BulkUpdatePriceQuantityRequest,
  BulkUpdatePriceQuantityResponse,
  GetInventoryItemResponse,
  InventoryItem,
  BaseResponse,
  DeleteInventoryItemResponse,
  GetInventoryItemsResponse,
  BulkMigrateListingRequest,
  BulkMigrateListingResponse,
} from './items.js';
export type {
  GetOffersInput,
  OfferIdInput,
  CreateOfferInput,
  UpdateOfferInput,
  BulkCreateOfferInput,
  BulkPublishOfferInput,
  GetListingFeesInput,
  PublishOfferByInventoryItemGroupInput,
  WithdrawOfferByInventoryItemGroupInput,
  BulkCreateOfferRequest,
  BulkCreateOfferResponse,
  BulkPublishOfferRequest,
  BulkPublishOfferResponse,
  GetOffersResponse,
  CreateOfferRequest,
  CreateOfferResponse,
  GetOfferResponse,
  UpdateOfferRequest,
  DeleteOfferResponse,
  GetListingFeesRequest,
  GetListingFeesResponse,
  PublishOfferResponse,
  PublishOfferByInventoryItemGroupRequest,
  WithdrawOfferResponse,
  WithdrawOfferByInventoryItemGroupRequest,
  WithdrawOfferByInventoryItemGroupResponse,
} from './offers.js';
/**
 * Inventory API surface for legacy items and offers.
 * Implementation is split by the two remaining legacy subdomains.
 */
export type InventoryApi = InventoryItemsMethods & InventoryOffersMethods;

/**
 * Creates the remaining legacy Inventory API method collection.
 *
 * @param ebayApiClient - Shared authenticated eBay API transport.
 * @returns Inventory-item and offer operations on one typed collection.
 */
export const createInventoryApi = (ebayApiClient: EbayApiClient): InventoryApi => ({
  ...createInventoryItemsMethods(ebayApiClient),
  ...createInventoryOffersMethods(ebayApiClient),
});
