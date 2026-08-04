import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { TradingDocument } from '@/ebay/trading/tradingTransport.js';
import { defineTool } from '@/mcp/defineTool.js';

const openTradingItemSchema = z
  .object({})
  .catchall(z.unknown())
  .refine((tradingItem) => Object.keys(tradingItem).length > 0, 'Item cannot be empty');

const identifiedTradingItemSchema = z.object({ ItemID: z.string().min(1) }).catchall(z.unknown());

const activeListSchema = z
  .object({
    Pagination: z
      .object({
        EntriesPerPage: z.number().int().min(1).max(200).default(50),
        PageNumber: z.number().int().positive().default(1),
      })
      .strict()
      .default({ EntriesPerPage: 50, PageNumber: 1 }),
    Sort: z.string().min(1).default('TimeLeft'),
  })
  .strict()
  .default({
    Pagination: { EntriesPerPage: 50, PageNumber: 1 },
    Sort: 'TimeLeft',
  });

/** Exact GetMyeBaySelling ActiveList document. */
export const getActiveListingsArgumentsSchema = z.object({ ActiveList: activeListSchema }).strict();

/** Exact GetItem document with the full detail level applied once during decoding. */
export const getListingArgumentsSchema = z
  .object({
    DetailLevel: z.literal('ReturnAll').default('ReturnAll'),
    ItemID: z.string().min(1),
  })
  .strict();

/** Exact AddFixedPriceItem document. */
export const createListingArgumentsSchema = z.object({ Item: openTradingItemSchema }).strict();

/** Exact ReviseFixedPriceItem document. */
export const reviseListingArgumentsSchema = z
  .object({ Item: identifiedTradingItemSchema })
  .strict();

/** Exact EndFixedPriceItem document. */
export const endListingArgumentsSchema = z
  .object({
    EndingReason: z
      .enum(['NotAvailable', 'Incorrect', 'LostOrBroken', 'OtherListingError', 'SellToHighBidder'])
      .default('NotAvailable'),
    ItemID: z.string().min(1).optional(),
    SKU: z.string().min(1).max(50).optional(),
  })
  .strict()
  .superRefine((listingClosure, validation) => {
    if (listingClosure.ItemID !== undefined) {
      return;
    }
    if (listingClosure.SKU !== undefined) {
      return;
    }
    validation.addIssue({
      code: 'custom',
      message: 'ItemID or SKU is required',
      path: ['ItemID'],
    });
  });

/** Exact RelistFixedPriceItem document. */
export const relistListingArgumentsSchema = z
  .object({ Item: identifiedTradingItemSchema })
  .strict();

export type ActiveListingsSearch = z.infer<typeof getActiveListingsArgumentsSchema>;
export type ListingLookup = z.infer<typeof getListingArgumentsSchema>;
export type ListingSubmission = z.infer<typeof createListingArgumentsSchema>;
export type ListingRevision = z.infer<typeof reviseListingArgumentsSchema>;
export type ListingClosure = z.infer<typeof endListingArgumentsSchema>;
export type ListingRelisting = z.infer<typeof relistListingArgumentsSchema>;

/**
 * Retrieves the seller's active fixed-price listings.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param activeListingsSearch - Exact GetMyeBaySelling ActiveList document.
 * @returns Explicit completion containing the unchanged Trading API response or failure.
 * @example `await getActiveListings(sellerSession, { ActiveList: { Sort: 'TimeLeft' } })`
 * @see https://developer.ebay.com/devzone/xml/docs/reference/ebay/GetMyeBaySelling.html
 */
export const getActiveListings = (
  sellerSession: EbaySellerSession,
  activeListingsSearch: ActiveListingsSearch,
): Promise<EbayRequestCompletion<TradingDocument>> =>
  sellerSession.trading({
    callName: 'GetMyeBaySelling',
    requestDocument: activeListingsSearch,
  });

/**
 * Retrieves one fixed-price listing with full Trading detail.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param listingLookup - Exact GetItem document.
 * @returns Explicit completion containing the unchanged Trading API response or failure.
 * @example `await getListing(sellerSession, { ItemID: '12345', DetailLevel: 'ReturnAll' })`
 * @see https://developer.ebay.com/devzone/xml/docs/reference/ebay/GetItem.html
 */
export const getListing = (
  sellerSession: EbaySellerSession,
  listingLookup: ListingLookup,
): Promise<EbayRequestCompletion<TradingDocument>> =>
  sellerSession.trading({ callName: 'GetItem', requestDocument: listingLookup });

/**
 * Creates one fixed-price listing.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param listingSubmission - Exact AddFixedPriceItem document.
 * @returns Explicit completion containing the unchanged Trading API response or failure.
 * @example `await createListing(sellerSession, { Item: { Title: 'New listing' } })`
 * @see https://developer.ebay.com/devzone/xml/docs/reference/ebay/AddFixedPriceItem.html
 */
export const createListing = (
  sellerSession: EbaySellerSession,
  listingSubmission: ListingSubmission,
): Promise<EbayRequestCompletion<TradingDocument>> =>
  sellerSession.trading({
    callName: 'AddFixedPriceItem',
    requestDocument: listingSubmission,
  });

/**
 * Revises one active fixed-price listing.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param listingRevision - Exact ReviseFixedPriceItem document.
 * @returns Explicit completion containing the unchanged Trading API response or failure.
 * @example `await reviseListing(sellerSession, { Item: { ItemID: '12345', Quantity: 10 } })`
 * @see https://developer.ebay.com/devzone/xml/docs/reference/ebay/ReviseFixedPriceItem.html
 */
export const reviseListing = (
  sellerSession: EbaySellerSession,
  listingRevision: ListingRevision,
): Promise<EbayRequestCompletion<TradingDocument>> =>
  sellerSession.trading({
    callName: 'ReviseFixedPriceItem',
    requestDocument: listingRevision,
  });

/**
 * Ends one active fixed-price listing by item ID or SKU.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param listingClosure - Exact EndFixedPriceItem document.
 * @returns Explicit completion containing the unchanged Trading API response or failure.
 * @example `await endListing(sellerSession, { ItemID: '12345', EndingReason: 'NotAvailable' })`
 * @see https://developer.ebay.com/devzone/xml/docs/reference/ebay/EndFixedPriceItem.html
 */
export const endListing = (
  sellerSession: EbaySellerSession,
  listingClosure: ListingClosure,
): Promise<EbayRequestCompletion<TradingDocument>> =>
  sellerSession.trading({
    callName: 'EndFixedPriceItem',
    requestDocument: listingClosure,
  });

/**
 * Relists one ended fixed-price listing.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param listingRelisting - Exact RelistFixedPriceItem document.
 * @returns Explicit completion containing the unchanged Trading API response or failure.
 * @example `await relistListing(sellerSession, { Item: { ItemID: '12345' } })`
 * @see https://developer.ebay.com/devzone/xml/docs/reference/ebay/RelistFixedPriceItem.html
 */
export const relistListing = (
  sellerSession: EbaySellerSession,
  listingRelisting: ListingRelisting,
): Promise<EbayRequestCompletion<TradingDocument>> =>
  sellerSession.trading({
    callName: 'RelistFixedPriceItem',
    requestDocument: listingRelisting,
  });

export const getActiveListingsTool = defineTool({
  name: 'ebay_trading_get_active_listings',
  namespace: 'trading',
  description: 'Retrieve active fixed-price listings from My eBay Selling',
  argumentsSchema: getActiveListingsArgumentsSchema,
  operationKind: 'read',
  operation: getActiveListings,
});

export const getListingTool = defineTool({
  name: 'ebay_trading_get_listing',
  namespace: 'trading',
  description: 'Retrieve the complete Trading API document for one listing',
  argumentsSchema: getListingArgumentsSchema,
  operationKind: 'read',
  operation: getListing,
});

export const createListingTool = defineTool({
  name: 'ebay_trading_create_listing',
  namespace: 'trading',
  description: 'Create one fixed-price listing from an AddFixedPriceItem document',
  argumentsSchema: createListingArgumentsSchema,
  operationKind: 'write',
  operation: createListing,
});

export const reviseListingTool = defineTool({
  name: 'ebay_trading_revise_listing',
  namespace: 'trading',
  description: 'Revise one active fixed-price listing',
  argumentsSchema: reviseListingArgumentsSchema,
  operationKind: 'write',
  operation: reviseListing,
});

export const endListingTool = defineTool({
  name: 'ebay_trading_end_listing',
  namespace: 'trading',
  description: 'End one active fixed-price listing by item ID or SKU',
  argumentsSchema: endListingArgumentsSchema,
  operationKind: 'write',
  operation: endListing,
});

export const relistListingTool = defineTool({
  name: 'ebay_trading_relist_listing',
  namespace: 'trading',
  description: 'Relist one ended fixed-price listing',
  argumentsSchema: relistListingArgumentsSchema,
  operationKind: 'write',
  operation: relistListing,
});
