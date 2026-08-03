import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type {
  components,
  operations,
} from '@/generated/ebay/sell-apps/order-management/sellFulfillmentV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';
import { mapFulfillmentsToTable } from '@/tools/ui/maps.js';

const fulfilledLineItemSchema = z
  .object({
    lineItemId: z.string().min(1),
    quantity: z.number().int().positive().optional(),
  })
  .strict();

/** Exact eBay order path accepted by getShippingFulfillments. */
export const getShippingFulfillmentsArgumentsSchema = z
  .object({ orderId: z.string().min(1) })
  .strict();

/** Exact eBay order and fulfillment paths accepted by getShippingFulfillment. */
export const getShippingFulfillmentArgumentsSchema = z
  .object({
    fulfillmentId: z.string().min(1),
    orderId: z.string().min(1),
  })
  .strict();

/** Exact eBay order path and direct document accepted by createShippingFulfillment. */
export const createShippingFulfillmentArgumentsSchema = z
  .object({
    lineItems: z.array(fulfilledLineItemSchema).min(1),
    orderId: z.string().min(1),
    shippedDate: z.iso.datetime({ offset: true }).optional(),
    shippingCarrierCode: z.string().min(1).optional(),
    trackingNumber: z
      .string()
      .regex(/^[A-Za-z0-9]+$/)
      .optional(),
  })
  .strict()
  .superRefine((shipmentSubmission, validation) => {
    const hasCarrier = shipmentSubmission.shippingCarrierCode !== undefined;
    const hasTrackingNumber = shipmentSubmission.trackingNumber !== undefined;
    if (hasCarrier !== hasTrackingNumber) {
      validation.addIssue({
        code: 'custom',
        message: 'shippingCarrierCode and trackingNumber must be provided together',
      });
    }
  });

/** Validated eBay order path for fulfillment collection retrieval. */
export type GetShippingFulfillmentsArguments = z.infer<
  typeof getShippingFulfillmentsArgumentsSchema
>;

/** Validated eBay order and fulfillment paths. */
export type GetShippingFulfillmentArguments = z.infer<typeof getShippingFulfillmentArgumentsSchema>;

/** Validated eBay order path and direct shipping document. */
export type CreateShippingFulfillmentArguments = z.infer<
  typeof createShippingFulfillmentArgumentsSchema
>;

/** @see https://developer.ebay.com/api-docs/sell/fulfillment/types/api:ShippingFulfillmentPagedCollection */
export type ShippingFulfillments = components['schemas']['ShippingFulfillmentPagedCollection'];

/** @see https://developer.ebay.com/api-docs/sell/fulfillment/types/api:ShippingFulfillment */
export type ShippingFulfillment = components['schemas']['ShippingFulfillment'];

/** @see https://developer.ebay.com/api-docs/sell/fulfillment/resources/order/shipping_fulfillment/methods/createShippingFulfillment */
export type CreatedShippingFulfillment =
  operations['createShippingFulfillment']['responses'][201]['content']['application/json'];

/**
 * Retrieves every shipping fulfillment recorded for one order.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param orderLookup - Exact eBay order path.
 * @returns Explicit completion containing eBay's unchanged generated fulfillment collection.
 * @example `await getShippingFulfillments(sellerSession, { orderId: '01-12345-67890' })`
 * @see https://developer.ebay.com/api-docs/sell/fulfillment/resources/order/shipping_fulfillment/methods/getShippingFulfillments
 */
export const getShippingFulfillments = (
  sellerSession: EbaySellerSession,
  orderLookup: GetShippingFulfillmentsArguments,
): Promise<EbayRequestCompletion<ShippingFulfillments>> =>
  sellerSession.get<ShippingFulfillments>({
    endpoint: `/sell/fulfillment/v1/order/${encodeURIComponent(orderLookup.orderId)}/shipping_fulfillment`,
  });

/**
 * Creates one shipping fulfillment beneath an order.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param shipmentSubmission - Exact eBay order path and direct shipping document.
 * @returns Explicit completion containing eBay's unchanged creation document.
 * @example `await createShippingFulfillment(sellerSession, { orderId: '01-12345-67890', lineItems: [{ lineItemId: 'LINE-1' }] })`
 * @see https://developer.ebay.com/api-docs/sell/fulfillment/resources/order/shipping_fulfillment/methods/createShippingFulfillment
 */
export const createShippingFulfillment = (
  sellerSession: EbaySellerSession,
  shipmentSubmission: CreateShippingFulfillmentArguments,
): Promise<EbayRequestCompletion<CreatedShippingFulfillment>> => {
  const { orderId, ...shippingDocument } = shipmentSubmission;
  return sellerSession.post<CreatedShippingFulfillment>({
    endpoint: `/sell/fulfillment/v1/order/${encodeURIComponent(orderId)}/shipping_fulfillment`,
    requestDocument: shippingDocument,
  });
};

/**
 * Retrieves one shipping fulfillment beneath its order.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param fulfillmentLookup - Exact eBay order and fulfillment paths.
 * @returns Explicit completion containing eBay's unchanged generated fulfillment document.
 * @example `await getShippingFulfillment(sellerSession, { orderId: '01-12345-67890', fulfillmentId: '9405509699937003457459' })`
 * @see https://developer.ebay.com/api-docs/sell/fulfillment/resources/order/shipping_fulfillment/methods/getShippingFulfillment
 */
export const getShippingFulfillment = (
  sellerSession: EbaySellerSession,
  fulfillmentLookup: GetShippingFulfillmentArguments,
): Promise<EbayRequestCompletion<ShippingFulfillment>> =>
  sellerSession.get<ShippingFulfillment>({
    endpoint: `/sell/fulfillment/v1/order/${encodeURIComponent(fulfillmentLookup.orderId)}/shipping_fulfillment/${encodeURIComponent(fulfillmentLookup.fulfillmentId)}`,
  });

export const getShippingFulfillmentsTool = defineTool({
  name: 'ebay_sell_fulfillment_get_shipping_fulfillments',
  namespace: 'sell.fulfillment',
  description: 'Retrieve every shipping fulfillment recorded for one eBay order',
  argumentsSchema: getShippingFulfillmentsArgumentsSchema,
  operationKind: 'read',
  operation: getShippingFulfillments,
  presentation: { archetype: 'table', project: mapFulfillmentsToTable },
});

export const createShippingFulfillmentTool = defineTool({
  name: 'ebay_sell_fulfillment_create_shipping_fulfillment',
  namespace: 'sell.fulfillment',
  description: 'Create one shipping fulfillment using the direct eBay document',
  argumentsSchema: createShippingFulfillmentArgumentsSchema,
  operationKind: 'write',
  operation: createShippingFulfillment,
});

export const getShippingFulfillmentTool = defineTool({
  name: 'ebay_sell_fulfillment_get_shipping_fulfillment',
  namespace: 'sell.fulfillment',
  description: 'Retrieve one shipping fulfillment beneath its eBay order',
  argumentsSchema: getShippingFulfillmentArgumentsSchema,
  operationKind: 'read',
  operation: getShippingFulfillment,
});
