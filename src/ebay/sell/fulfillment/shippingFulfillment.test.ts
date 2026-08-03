import { describe, expect, it } from 'vitest';

import {
  createShippingFulfillment,
  createShippingFulfillmentArgumentsSchema,
  getShippingFulfillment,
  getShippingFulfillmentArgumentsSchema,
  getShippingFulfillments,
} from '@/ebay/sell/fulfillment/shippingFulfillment.js';
import { sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

describe('Sell Fulfillment shipping schemas', () => {
  it('accepts a direct fulfillment document with paired tracking fields', () => {
    const shippingFulfillment = {
      lineItems: [{ lineItemId: 'LINE-1', quantity: 1 }],
      orderId: 'ORDER-1',
      shippedDate: '2026-08-03T12:00:00.000Z',
      shippingCarrierCode: 'FEDEX',
      trackingNumber: '1234567890',
    };

    expect(createShippingFulfillmentArgumentsSchema.parse(shippingFulfillment)).toEqual(
      shippingFulfillment,
    );
  });

  it.each([
    { lineItems: [], orderId: 'ORDER-1' },
    { lineItems: [{ lineItemId: 'LINE-1' }], orderId: 'ORDER-1', trackingNumber: '123' },
    {
      fulfillmentDocument: { lineItems: [{ lineItemId: 'LINE-1' }] },
      orderId: 'ORDER-1',
    },
  ])('rejects incomplete or nested fulfillment fields', (invalidShippingFulfillment) => {
    expect(() =>
      createShippingFulfillmentArgumentsSchema.parse(invalidShippingFulfillment),
    ).toThrow();
  });

  it('requires both identifiers for one fulfillment', () => {
    expect(() => getShippingFulfillmentArgumentsSchema.parse({ orderId: 'ORDER-1' })).toThrow();
  });
});

describe('Sell Fulfillment shipping operations', () => {
  it('posts the direct fulfillment document beneath the order path', async () => {
    const { sellerSession, postCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await createShippingFulfillment(sellerSession, {
      lineItems: [{ lineItemId: 'LINE-1', quantity: 1 }],
      orderId: 'ORDER/1',
      shippingCarrierCode: 'FEDEX',
      trackingNumber: '1234567890',
    });

    expect(postCalls).toEqual([
      {
        endpoint: '/sell/fulfillment/v1/order/ORDER%2F1/shipping_fulfillment',
        requestDocument: {
          lineItems: [{ lineItemId: 'LINE-1', quantity: 1 }],
          shippingCarrierCode: 'FEDEX',
          trackingNumber: '1234567890',
        },
      },
    ]);
  });

  it('retrieves all fulfillments for one encoded order', async () => {
    const { sellerSession, getCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await getShippingFulfillments(sellerSession, { orderId: 'ORDER/1' });

    expect(getCalls).toEqual([
      { endpoint: '/sell/fulfillment/v1/order/ORDER%2F1/shipping_fulfillment' },
    ]);
  });

  it('retrieves one fulfillment beneath its encoded order', async () => {
    const { sellerSession, getCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await getShippingFulfillment(sellerSession, {
      fulfillmentId: 'TRACK/1',
      orderId: 'ORDER/1',
    });

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/fulfillment/v1/order/ORDER%2F1/shipping_fulfillment/TRACK%2F1',
      },
    ]);
  });
});
