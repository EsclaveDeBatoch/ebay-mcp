import type { EbayApiClient } from '@/api/client.js';
import { createInventoryOffersMethods } from './offers.js';

type InventoryOffersMethods = ReturnType<typeof createInventoryOffersMethods>;

export type { InventoryPaginationInput } from './shared.js';
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
 * Remaining legacy Inventory API surface for offers.
 */
export type InventoryApi = InventoryOffersMethods;

/**
 * Creates the remaining legacy Inventory API method collection.
 *
 * @param ebayApiClient - Shared authenticated eBay API transport.
 * @returns Offer operations on one typed collection.
 */
export const createInventoryApi = (ebayApiClient: EbayApiClient): InventoryApi =>
  createInventoryOffersMethods(ebayApiClient);
