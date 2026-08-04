import { describe, expect, it } from 'vitest';

import {
  getOrder,
  getOrderArgumentsSchema,
  getOrders,
  getOrdersArgumentsSchema,
  issueRefund,
  issueRefundArgumentsSchema,
} from '@/ebay/sell/fulfillment/order.js';
import { sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

describe('Sell Fulfillment order schemas', () => {
  it('accepts exact order query fields', () => {
    const orderSearch = {
      fieldGroups: 'TAX_BREAKDOWN' as const,
      filter: 'orderfulfillmentstatus:{NOT_STARTED|IN_PROGRESS}',
      limit: '50',
      offset: '0',
      orderIds: 'ORDER-1,ORDER-2',
    };

    expect(getOrdersArgumentsSchema.parse(orderSearch)).toEqual(orderSearch);
    expect(
      getOrderArgumentsSchema.parse({ fieldGroups: 'TAX_BREAKDOWN', orderId: 'ORDER-1' }),
    ).toEqual({ fieldGroups: 'TAX_BREAKDOWN', orderId: 'ORDER-1' });
  });

  it.each([
    { maxResults: '50' },
    { limit: 50 },
    { limit: '0' },
    { limit: '201' },
    { fieldGroups: 'SUMMARY' },
  ])('rejects aliases and unsupported order query fields', (invalidOrderSearch) => {
    expect(() => getOrdersArgumentsSchema.parse(invalidOrderSearch)).toThrow();
  });

  it('requires one direct refund target', () => {
    expect(
      issueRefundArgumentsSchema.parse({
        order_id: 'ORDER-1',
        orderLevelRefundAmount: { currency: 'USD', value: '12.50' },
        reasonForRefund: 'BUYER_CANCEL',
      }),
    ).toEqual({
      order_id: 'ORDER-1',
      orderLevelRefundAmount: { currency: 'USD', value: '12.50' },
      reasonForRefund: 'BUYER_CANCEL',
    });

    expect(() =>
      issueRefundArgumentsSchema.parse({ order_id: 'ORDER-1', reasonForRefund: 'BUYER_CANCEL' }),
    ).toThrow();
    expect(() =>
      issueRefundArgumentsSchema.parse({
        order_id: 'ORDER-1',
        orderLevelRefundAmount: { currency: 'USD', value: '12.50' },
        reasonForRefund: 'BUYER_CANCEL',
        refundItems: [{ lineItemId: 'LINE-1' }],
      }),
    ).toThrow();
  });

  it('requires one identifier for each line-item refund', () => {
    expect(() =>
      issueRefundArgumentsSchema.parse({
        order_id: 'ORDER-1',
        reasonForRefund: 'ITEM_NOT_AS_DESCRIBED',
        refundItems: [{ refundAmount: { currency: 'USD', value: '5.00' } }],
      }),
    ).toThrow();
    expect(() =>
      issueRefundArgumentsSchema.parse({
        order_id: 'ORDER-1',
        reasonForRefund: 'ITEM_NOT_AS_DESCRIBED',
        refundItems: [
          {
            legacyReference: { legacyItemId: 'ITEM-1', legacyTransactionId: 'TX-1' },
            lineItemId: 'LINE-1',
          },
        ],
      }),
    ).toThrow();
  });
});

describe('Sell Fulfillment order operations', () => {
  it('sends the exact getOrders wire strings', async () => {
    const { sellerSession, getCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });
    const orderSearch = {
      fieldGroups: 'TAX_BREAKDOWN' as const,
      filter: 'orderfulfillmentstatus:{NOT_STARTED|IN_PROGRESS}',
      limit: '50',
      offset: '0',
      orderIds: 'ORDER-1,ORDER-2',
    };

    await getOrders(sellerSession, orderSearch);

    expect(getCalls).toEqual([
      { endpoint: '/sell/fulfillment/v1/order', searchParameters: orderSearch },
    ]);
  });

  it('encodes one order path and sends only its optional query', async () => {
    const { sellerSession, getCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await getOrder(sellerSession, { fieldGroups: 'TAX_BREAKDOWN', orderId: '01/ORDER' });

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/fulfillment/v1/order/01%2FORDER',
        searchParameters: { fieldGroups: 'TAX_BREAKDOWN' },
      },
    ]);
  });

  it('posts the direct refund document beneath order_id', async () => {
    const { sellerSession, postCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await issueRefund(sellerSession, {
      comment: 'Buyer requested cancellation',
      order_id: 'ORDER/1',
      orderLevelRefundAmount: { currency: 'USD', value: '12.50' },
      reasonForRefund: 'BUYER_CANCEL',
    });

    expect(postCalls).toEqual([
      {
        endpoint: '/sell/fulfillment/v1/order/ORDER%2F1/issue_refund',
        requestDocument: {
          comment: 'Buyer requested cancellation',
          orderLevelRefundAmount: { currency: 'USD', value: '12.50' },
          reasonForRefund: 'BUYER_CANCEL',
        },
      },
    ]);
  });
});
