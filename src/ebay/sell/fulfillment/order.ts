import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/order-management/sellFulfillmentV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';
import { mapOrdersToTable, mapOrderToCard } from '@/tools/ui/maps.js';

const moneySchema = z
  .object({
    currency: z.string().length(3),
    value: z.string().min(1),
  })
  .strict();

const legacyReferenceSchema = z
  .object({
    legacyItemId: z.string().min(1),
    legacyTransactionId: z.string().min(1),
  })
  .strict();

const orderPageSizeSchema = z
  .string()
  .regex(/^(?:[1-9]|[1-9]\d|1\d{2}|200)$/, 'limit must be an integer from 1 through 200');

const orderPageOffsetSchema = z
  .string()
  .regex(/^(?:0|[1-9]\d*)$/, 'offset must be a non-negative integer');

const refundItemSchema = z
  .object({
    legacyReference: legacyReferenceSchema.optional(),
    lineItemId: z.string().min(1).optional(),
    refundAmount: moneySchema.optional(),
  })
  .strict()
  .superRefine((refundedLineItem, validation) => {
    const hasLineItemId = refundedLineItem.lineItemId !== undefined;
    const hasLegacyReference = refundedLineItem.legacyReference !== undefined;
    if (hasLineItemId === hasLegacyReference) {
      validation.addIssue({
        code: 'custom',
        message: 'provide exactly one line-item identifier',
      });
    }
  });

/** Exact eBay query fields accepted by getOrders. */
export const getOrdersArgumentsSchema = z
  .object({
    fieldGroups: z.literal('TAX_BREAKDOWN').optional(),
    filter: z.string().min(1).optional(),
    limit: orderPageSizeSchema.optional(),
    offset: orderPageOffsetSchema.optional(),
    orderIds: z.string().min(1).optional(),
  })
  .strict();

/** Exact eBay path and query fields accepted by getOrder. */
export const getOrderArgumentsSchema = z
  .object({
    fieldGroups: z.literal('TAX_BREAKDOWN').optional(),
    orderId: z.string().min(1),
  })
  .strict();

/** Exact eBay path and document fields accepted by issueRefund. */
export const issueRefundArgumentsSchema = z
  .object({
    comment: z.string().max(100).optional(),
    order_id: z.string().min(1),
    orderLevelRefundAmount: moneySchema.optional(),
    reasonForRefund: z.string().min(1),
    refundItems: z.array(refundItemSchema).min(1).optional(),
  })
  .strict()
  .superRefine((refundSubmission, validation) => {
    const hasOrderRefund = refundSubmission.orderLevelRefundAmount !== undefined;
    const hasLineItemRefunds = refundSubmission.refundItems !== undefined;
    if (hasOrderRefund === hasLineItemRefunds) {
      validation.addIssue({
        code: 'custom',
        message: 'provide exactly one order-level or line-item refund target',
      });
    }
  });

/** Validated eBay order search fields. */
export type GetOrdersArguments = z.infer<typeof getOrdersArgumentsSchema>;

/** Validated eBay order lookup fields. */
export type GetOrderArguments = z.infer<typeof getOrderArgumentsSchema>;

/** Validated eBay refund path and direct request document. */
export type IssueRefundArguments = z.infer<typeof issueRefundArgumentsSchema>;

/** @see https://developer.ebay.com/api-docs/sell/fulfillment/types/api:OrderSearchPagedCollection */
export type OrderSearch = components['schemas']['OrderSearchPagedCollection'];

/** @see https://developer.ebay.com/api-docs/sell/fulfillment/types/api:Order */
export type Order = components['schemas']['Order'];

/** @see https://developer.ebay.com/api-docs/sell/fulfillment/types/api:Refund */
export type Refund = components['schemas']['Refund'];

/**
 * Retrieves seller orders through the official Fulfillment API operation.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param orderSearch - Exact eBay filters and pagination fields.
 * @returns Explicit completion containing eBay's unchanged generated order collection.
 * @example `await getOrders(sellerSession, { limit: '50', offset: '0' })`
 * @see https://developer.ebay.com/api-docs/sell/fulfillment/resources/order/methods/getOrders
 */
export const getOrders = (
  sellerSession: EbaySellerSession,
  orderSearch: GetOrdersArguments,
): Promise<EbayRequestCompletion<OrderSearch>> =>
  sellerSession.get<OrderSearch>({
    endpoint: '/sell/fulfillment/v1/order',
    searchParameters: orderSearch,
  });

/**
 * Retrieves one seller order through the official Fulfillment API operation.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param orderLookup - Exact eBay order path and optional field group.
 * @returns Explicit completion containing eBay's unchanged generated order.
 * @example `await getOrder(sellerSession, { orderId: '01-12345-67890' })`
 * @see https://developer.ebay.com/api-docs/sell/fulfillment/resources/order/methods/getOrder
 */
export const getOrder = (
  sellerSession: EbaySellerSession,
  orderLookup: GetOrderArguments,
): Promise<EbayRequestCompletion<Order>> => {
  const { orderId, ...orderSearch } = orderLookup;
  return sellerSession.get<Order>({
    endpoint: `/sell/fulfillment/v1/order/${encodeURIComponent(orderId)}`,
    searchParameters: orderSearch,
  });
};

/**
 * Issues one order-level or line-item refund through the official Fulfillment API operation.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param refundSubmission - Exact eBay order path and direct refund document.
 * @returns Explicit completion containing eBay's unchanged generated refund document.
 * @example `await issueRefund(sellerSession, { order_id: '01-12345-67890', reasonForRefund: 'BUYER_CANCEL', orderLevelRefundAmount: { currency: 'USD', value: '10.00' } })`
 * @see https://developer.ebay.com/api-docs/sell/fulfillment/resources/order/methods/issueRefund
 */
export const issueRefund = (
  sellerSession: EbaySellerSession,
  refundSubmission: IssueRefundArguments,
): Promise<EbayRequestCompletion<Refund>> => {
  const { order_id: orderId, ...refundDocument } = refundSubmission;
  return sellerSession.post<Refund>({
    endpoint: `/sell/fulfillment/v1/order/${encodeURIComponent(orderId)}/issue_refund`,
    requestDocument: refundDocument,
  });
};

export const getOrdersTool = defineTool({
  name: 'ebay_sell_fulfillment_get_orders',
  namespace: 'sell.fulfillment',
  description: 'Retrieve seller orders using exact Fulfillment API filters and pagination',
  argumentsSchema: getOrdersArgumentsSchema,
  operationKind: 'read',
  operation: getOrders,
  presentation: { archetype: 'table', project: mapOrdersToTable },
});

export const getOrderTool = defineTool({
  name: 'ebay_sell_fulfillment_get_order',
  namespace: 'sell.fulfillment',
  description: 'Retrieve one seller order by its eBay order identifier',
  argumentsSchema: getOrderArgumentsSchema,
  operationKind: 'read',
  operation: getOrder,
  presentation: { archetype: 'card', project: mapOrderToCard },
});

export const issueRefundTool = defineTool({
  name: 'ebay_sell_fulfillment_issue_refund',
  namespace: 'sell.fulfillment',
  description: 'Issue one order-level or line-item refund with the direct eBay document',
  argumentsSchema: issueRefundArgumentsSchema,
  operationKind: 'write',
  operation: issueRefund,
});
