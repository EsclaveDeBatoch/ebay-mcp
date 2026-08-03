import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/communication/sellNegotiationV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';

const eligibleListingsPageSizeSchema = z
  .string()
  .regex(/^(?:[1-9]|[1-9]\d|1\d{2}|200)$/, 'limit must be an integer from 1 through 200');

const eligibleListingsOffsetSchema = z
  .string()
  .regex(/^(?:0|[1-9]\d*)$/, 'offset must be a non-negative integer');

const discountPercentageSchema = z
  .string()
  .regex(/^\d+(?:\.\d+)?$/, 'discountPercentage must be a decimal number')
  .refine(
    (discountPercentage) => Number(discountPercentage) >= 5,
    'discountPercentage must be at least 5',
  );

const offerPriceSchema = z
  .object({
    currency: z.string().regex(/^[A-Z]{3}$/, 'currency must be an uppercase ISO 4217 code'),
    value: z
      .string()
      .regex(/^\d+(?:\.\d+)?$/, 'price value must be a decimal number')
      .refine((monetaryAmount) => Number(monetaryAmount) > 0, 'price value must be positive'),
  })
  .strict();

const offeredListingSchema = z
  .object({
    discountPercentage: discountPercentageSchema.optional(),
    listingId: z.string().min(1),
    price: offerPriceSchema.optional(),
    quantity: z.number().int().positive().optional(),
  })
  .strict()
  .superRefine((offeredListing, validation) => {
    if (offeredListing.discountPercentage === undefined && offeredListing.price === undefined) {
      validation.addIssue({
        code: 'custom',
        message: 'one discountPercentage or price is required',
        path: ['discountPercentage'],
      });
    }
    if (offeredListing.discountPercentage !== undefined && offeredListing.price !== undefined) {
      validation.addIssue({
        code: 'custom',
        message: 'discountPercentage and price are mutually exclusive',
        path: ['price'],
      });
    }
  });

/** Exact eBay header and query fields accepted by findEligibleItems. */
export const findEligibleItemsArgumentsSchema = z
  .object({
    limit: eligibleListingsPageSizeSchema.optional(),
    offset: eligibleListingsOffsetSchema.optional(),
    'X-EBAY-C-MARKETPLACE-ID': z.string().min(1),
  })
  .strict();

/** Validated eBay fields used to find listings eligible for seller offers. */
export type FindEligibleItemsArguments = z.infer<typeof findEligibleItemsArgumentsSchema>;

/** Exact eBay header and generated document fields accepted by sendOfferToInterestedBuyers. */
export const sendOfferToInterestedBuyersArgumentsSchema = z
  .object({
    'X-EBAY-C-MARKETPLACE-ID': z.string().min(1),
    allowCounterOffer: z.literal(false).optional(),
    message: z.string().max(2000).optional(),
    offerDuration: z
      .object({
        unit: z.literal('DAY'),
        value: z.literal(2),
      })
      .strict()
      .optional(),
    offeredItems: z.array(offeredListingSchema).length(1),
  })
  .strict();

/** Validated eBay fields used to send one seller offer. */
export type SellerOfferArguments = z.infer<typeof sendOfferToInterestedBuyersArgumentsSchema>;

/**
 * Eligible-listings document generated from the official Sell Negotiation specification.
 * `undefined` represents eBay's documented 204 response when no listing is eligible.
 *
 * @see https://developer.ebay.com/api-docs/sell/negotiation/types/api:PagedEligibleItemCollection
 */
export type EligibleListings = components['schemas']['PagedEligibleItemCollection'] | undefined;

/**
 * Sent seller offers generated from the official Sell Negotiation specification.
 *
 * @see https://developer.ebay.com/api-docs/sell/negotiation/types/api:SendOfferToInterestedBuyersCollectionResponse
 */
export type SentSellerOffers =
  components['schemas']['SendOfferToInterestedBuyersCollectionResponse'];

/**
 * Finds listings eligible for a seller-initiated offer in one marketplace.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param eligibleListingsArguments - Exact eBay marketplace header and pagination query.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 *
 * @example
 * ```ts
 * const completion = await findEligibleItems(sellerSession, {
 *   limit: '10',
 *   offset: '0',
 *   'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
 * });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/sell/negotiation/resources/offer/methods/findEligibleItems
 */
export const findEligibleItems = (
  sellerSession: EbaySellerSession,
  eligibleListingsArguments: FindEligibleItemsArguments,
): Promise<EbayRequestCompletion<EligibleListings>> =>
  sellerSession.get<EligibleListings>({
    endpoint: '/sell/negotiation/v1/find_eligible_items',
    requestHeaders: {
      'X-EBAY-C-MARKETPLACE-ID': eligibleListingsArguments['X-EBAY-C-MARKETPLACE-ID'],
    },
    searchParameters: {
      limit: eligibleListingsArguments.limit,
      offset: eligibleListingsArguments.offset,
    },
  });

/**
 * Sends one discounted offer to buyers interested in a listing.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param sellerOfferArguments - Exact eBay marketplace header and offer document fields.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 *
 * @example
 * ```ts
 * const completion = await sendOfferToInterestedBuyers(sellerSession, {
 *   'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
 *   offeredItems: [{ discountPercentage: '10', listingId: '110000000000' }],
 * });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/sell/negotiation/resources/offer/methods/sendOfferToInterestedBuyers
 */
export const sendOfferToInterestedBuyers = (
  sellerSession: EbaySellerSession,
  sellerOfferArguments: SellerOfferArguments,
): Promise<EbayRequestCompletion<SentSellerOffers>> => {
  const { 'X-EBAY-C-MARKETPLACE-ID': marketplaceId, ...offerDocument } = sellerOfferArguments;
  return sellerSession.post<SentSellerOffers>({
    endpoint: '/sell/negotiation/v1/send_offer_to_interested_buyers',
    requestDocument: offerDocument,
    requestHeaders: { 'X-EBAY-C-MARKETPLACE-ID': marketplaceId },
  });
};

/** MCP definition for Sell Negotiation findEligibleItems. */
export const findEligibleItemsTool = defineTool({
  name: 'ebay_sell_negotiation_find_eligible_items',
  namespace: 'sell.negotiation',
  description: 'Find listings eligible for seller-initiated eBay offers',
  argumentsSchema: findEligibleItemsArgumentsSchema,
  operationKind: 'read',
  operation: findEligibleItems,
});

/** MCP definition for Sell Negotiation sendOfferToInterestedBuyers. */
export const sendOfferToInterestedBuyersTool = defineTool({
  name: 'ebay_sell_negotiation_send_offer_to_interested_buyers',
  namespace: 'sell.negotiation',
  description: 'Send one discounted offer to buyers interested in an eBay listing',
  argumentsSchema: sendOfferToInterestedBuyersArgumentsSchema,
  operationKind: 'write',
  operation: sendOfferToInterestedBuyers,
});
