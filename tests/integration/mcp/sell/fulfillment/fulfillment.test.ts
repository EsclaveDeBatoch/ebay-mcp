import { afterEach, describe, expect, it, vi } from 'vitest';

import type { OrderSearch } from '@/ebay/sell/fulfillment/order.js';
import type { PaymentDisputeSummaries } from '@/ebay/sell/fulfillment/paymentDispute.js';
import type { ShippingFulfillment } from '@/ebay/sell/fulfillment/shippingFulfillment.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';

const fulfillmentToolNames = [
  'ebay_sell_fulfillment_get_orders',
  'ebay_sell_fulfillment_get_order',
  'ebay_sell_fulfillment_issue_refund',
  'ebay_sell_fulfillment_get_shipping_fulfillments',
  'ebay_sell_fulfillment_create_shipping_fulfillment',
  'ebay_sell_fulfillment_get_shipping_fulfillment',
  'ebay_sell_fulfillment_get_payment_dispute',
  'ebay_sell_fulfillment_fetch_evidence_content',
  'ebay_sell_fulfillment_get_activities',
  'ebay_sell_fulfillment_get_payment_dispute_summaries',
  'ebay_sell_fulfillment_contest_payment_dispute',
  'ebay_sell_fulfillment_accept_payment_dispute',
  'ebay_sell_fulfillment_upload_evidence_file',
  'ebay_sell_fulfillment_add_evidence',
  'ebay_sell_fulfillment_update_evidence',
] as const;

const readOnlyFulfillmentToolNames = [
  'ebay_sell_fulfillment_get_orders',
  'ebay_sell_fulfillment_get_order',
  'ebay_sell_fulfillment_get_shipping_fulfillments',
  'ebay_sell_fulfillment_get_shipping_fulfillment',
  'ebay_sell_fulfillment_get_payment_dispute',
  'ebay_sell_fulfillment_fetch_evidence_content',
  'ebay_sell_fulfillment_get_activities',
  'ebay_sell_fulfillment_get_payment_dispute_summaries',
] as const;

const legacyFulfillmentToolNames = [
  'ebay_get_orders',
  'ebay_get_order',
  'ebay_issue_refund',
  'ebay_get_shipping_fulfillments',
  'ebay_create_shipping_fulfillment',
  'ebay_get_shipping_fulfillment',
  'ebay_get_cancellation_requests',
  'ebay_get_refunded_orders',
  'ebay_get_payment_dispute',
  'ebay_fetch_payment_dispute_evidence_content',
  'ebay_get_payment_dispute_activities',
  'ebay_get_payment_dispute_summaries',
  'ebay_contest_payment_dispute',
  'ebay_accept_payment_dispute',
  'ebay_upload_payment_dispute_evidence_file',
  'ebay_add_payment_dispute_evidence',
  'ebay_update_payment_dispute_evidence',
] as const;

const fulfillmentFailureCalls = [
  {
    ebayArguments: { limit: '25' },
    toolName: 'ebay_sell_fulfillment_get_orders',
  },
  {
    ebayArguments: { orderId: 'ORDER-1' },
    toolName: 'ebay_sell_fulfillment_get_order',
  },
  {
    ebayArguments: {
      order_id: 'ORDER-1',
      orderLevelRefundAmount: { currency: 'USD', value: '12.50' },
      reasonForRefund: 'BUYER_CANCEL',
    },
    toolName: 'ebay_sell_fulfillment_issue_refund',
  },
  {
    ebayArguments: { orderId: 'ORDER-1' },
    toolName: 'ebay_sell_fulfillment_get_shipping_fulfillments',
  },
  {
    ebayArguments: { lineItems: [{ lineItemId: 'LINE-1' }], orderId: 'ORDER-1' },
    toolName: 'ebay_sell_fulfillment_create_shipping_fulfillment',
  },
  {
    ebayArguments: { fulfillmentId: 'FULFILLMENT-1', orderId: 'ORDER-1' },
    toolName: 'ebay_sell_fulfillment_get_shipping_fulfillment',
  },
  {
    ebayArguments: { payment_dispute_id: 'DISPUTE-1' },
    toolName: 'ebay_sell_fulfillment_get_payment_dispute',
  },
  {
    ebayArguments: {
      evidence_id: 'EVIDENCE-1',
      file_id: 'FILE-1',
      payment_dispute_id: 'DISPUTE-1',
    },
    toolName: 'ebay_sell_fulfillment_fetch_evidence_content',
  },
  {
    ebayArguments: { payment_dispute_id: 'DISPUTE-1' },
    toolName: 'ebay_sell_fulfillment_get_activities',
  },
  {
    ebayArguments: { limit: '25' },
    toolName: 'ebay_sell_fulfillment_get_payment_dispute_summaries',
  },
  {
    ebayArguments: { payment_dispute_id: 'DISPUTE-1', revision: 2 },
    toolName: 'ebay_sell_fulfillment_contest_payment_dispute',
  },
  {
    ebayArguments: { payment_dispute_id: 'DISPUTE-1', revision: 2 },
    toolName: 'ebay_sell_fulfillment_accept_payment_dispute',
  },
  {
    ebayArguments: {
      fileContentBase64: Buffer.from('image').toString('base64'),
      fileName: 'delivery.jpg',
      payment_dispute_id: 'DISPUTE-1',
    },
    toolName: 'ebay_sell_fulfillment_upload_evidence_file',
  },
  {
    ebayArguments: {
      files: [{ fileId: 'FILE-1' }],
      payment_dispute_id: 'DISPUTE-1',
    },
    toolName: 'ebay_sell_fulfillment_add_evidence',
  },
  {
    ebayArguments: {
      evidenceId: 'EVIDENCE-1',
      files: [{ fileId: 'FILE-1' }],
      lineItems: [{ itemId: 'ITEM-1', lineItemId: 'LINE-1' }],
      payment_dispute_id: 'DISPUTE-1',
    },
    toolName: 'ebay_sell_fulfillment_update_evidence',
  },
] as const;

const fulfillmentFailureScenarios = fulfillmentFailureCalls.flatMap((fulfillmentCall) =>
  ebayFailures.map((ebayFailure) => ({ ebayFailure, ...fulfillmentCall })),
);

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Sell Fulfillment MCP exposure', () => {
  it('exposes the 15 official operations once without legacy helpers or aliases', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<OrderSearch>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: { orders: [] },
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);

    for (const fulfillmentToolName of fulfillmentToolNames) {
      expect(
        listedToolNames.filter((listedToolName) => listedToolName === fulfillmentToolName),
      ).toEqual([fulfillmentToolName]);
    }
    for (const legacyFulfillmentToolName of legacyFulfillmentToolNames) {
      expect(listedToolNames).not.toContain(legacyFulfillmentToolName);
    }
    await mcpClient.close();
  });

  it('gates the complete family through sell.fulfillment', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'sell.fulfillment');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<OrderSearch>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: { orders: [] },
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    expect(listedTools.tools.map((ebayTool) => ebayTool.name)).toEqual(fulfillmentToolNames);
    await mcpClient.close();
  });

  it('keeps only the eight official reads in read-only mode', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'sell.fulfillment');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    vi.stubEnv('EBAY_READ_ONLY', 'true');
    const { sellerSession } = sellerSessionReturning<OrderSearch>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: { orders: [] },
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    expect(listedTools.tools.map((ebayTool) => ebayTool.name)).toEqual(
      readOnlyFulfillmentToolNames,
    );
    await mcpClient.close();
  });
});

describe('Sell Fulfillment MCP calls', () => {
  it('passes exact order query fields and returns the eBay document unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const orderSearch: OrderSearch = { orders: [{ orderId: 'ORDER-1' }], total: 1 };
    const { sellerSession, getCalls } = sellerSessionReturning<OrderSearch>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: orderSearch,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_fulfillment_get_orders',
      { limit: '25', offset: '0' },
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/fulfillment/v1/order',
        searchParameters: { limit: '25', offset: '0' },
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(orderSearch, null, 2) }],
    });
    await mcpClient.close();
  });

  it('passes a direct shipping document and returns the eBay document unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const shippingFulfillment: ShippingFulfillment = {
      fulfillmentId: 'FULFILLMENT-1',
      lineItems: [{ lineItemId: 'LINE-1', quantity: 1 }],
    };
    const { sellerSession, postCalls } = sellerSessionReturning<ShippingFulfillment>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: shippingFulfillment,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_fulfillment_create_shipping_fulfillment',
      {
        lineItems: [{ lineItemId: 'LINE-1', quantity: 1 }],
        orderId: 'ORDER-1',
        shippingCarrierCode: 'FEDEX',
        trackingNumber: '1234567890',
      },
    );

    expect(postCalls).toEqual([
      {
        endpoint: '/sell/fulfillment/v1/order/ORDER-1/shipping_fulfillment',
        requestDocument: {
          lineItems: [{ lineItemId: 'LINE-1', quantity: 1 }],
          shippingCarrierCode: 'FEDEX',
          trackingNumber: '1234567890',
        },
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(shippingFulfillment, null, 2) }],
    });
    await mcpClient.close();
  });

  it('uses apiz and exact query names for dispute summaries', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const disputeSummaries: PaymentDisputeSummaries = {
      paymentDisputeSummaries: [{ paymentDisputeId: 'DISPUTE-1' }],
      total: 1,
    };
    const { sellerSession, getCalls } = sellerSessionReturning<PaymentDisputeSummaries>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: disputeSummaries,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_fulfillment_get_payment_dispute_summaries',
      { order_id: 'ORDER-1', payment_dispute_status: 'OPEN' },
    );

    expect(getCalls).toEqual([
      {
        apiHost: 'apiz',
        endpoint: '/sell/fulfillment/v1/payment_dispute_summary',
        searchParameters: { order_id: 'ORDER-1', payment_dispute_status: 'OPEN' },
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(disputeSummaries, null, 2) }],
    });
    await mcpClient.close();
  });
});

describe('Sell Fulfillment MCP validation', () => {
  it('rejects old wrappers and aliases before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, postCalls } = sellerSessionReturning<never>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined as never,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_fulfillment_issue_refund',
      {
        orderId: 'ORDER-1',
        refundDocument: {
          orderLevelRefundAmount: { currency: 'USD', value: '12.50' },
          reasonForRefund: 'BUYER_CANCEL',
        },
      },
    );

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(postCalls).toEqual([]);
    await mcpClient.close();
  });
});

describe('Sell Fulfillment MCP failures', () => {
  it.each(fulfillmentFailureScenarios)(
    'translates every $ebayFailure.kind failure once for $toolName',
    async ({ ebayArguments, ebayFailure, toolName }) => {
      vi.stubEnv('EBAY_MCP_UI', 'off');
      const { sellerSession } = sellerSessionReturning<never>({
        kind: 'ebayRequestFailed',
        ebayFailure,
      });

      const { mcpClient, toolCompletion } = await callEbayTool(
        sellerSession,
        toolName,
        ebayArguments,
      );

      expect(toolCompletion).toMatchObject({
        content: [{ type: 'text', text: JSON.stringify({ ebayFailure }, null, 2) }],
        isError: true,
      });
      await mcpClient.close();
    },
  );
});
