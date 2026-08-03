import { afterEach, describe, expect, it, vi } from 'vitest';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { CustomerServiceMetric } from '@/ebay/sell/analytics/customerServiceMetric.js';
import {
  customerServiceMetricArguments,
  customerServiceMetricDocument,
} from '@tests/fixtures/customerServiceMetric.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool } from '@tests/fixtures/mcp.js';

const toolName = 'ebay_sell_analytics_get_customer_service_metric';

describe('Sell Analytics customer service metric through MCP', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses the exact eBay wire contract and returns the generated document unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const successfulRequest: EbayRequestCompletion<CustomerServiceMetric> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: customerServiceMetricDocument,
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulRequest);

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      toolName,
      customerServiceMetricArguments,
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/analytics/v1/customer_service_metric/ITEM_NOT_AS_DESCRIBED/CURRENT',
        searchParameters: { evaluation_marketplace_id: 'EBAY_US' },
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(customerServiceMetricDocument, null, 2) }],
    });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });

  it.each([
    { ...customerServiceMetricArguments, customer_service_metric_type: 'LATE_SHIPMENT' },
    { ...customerServiceMetricArguments, evaluation_type: 'PAST' },
    { ...customerServiceMetricArguments, evaluation_marketplace_id: '' },
    { ...customerServiceMetricArguments, marketplace_id: 'EBAY_US' },
  ])(
    'rejects invalid or unknown fields before the seller session',
    async (invalidMetricArguments) => {
      vi.stubEnv('EBAY_MCP_UI', 'off');
      const { sellerSession, getCalls } = sellerSessionReturning<CustomerServiceMetric>({
        kind: 'ebayRequestSucceeded',
        ebayDocument: customerServiceMetricDocument,
      });

      const { mcpClient, toolCompletion } = await callEbayTool(
        sellerSession,
        toolName,
        invalidMetricArguments,
      );

      expect(toolCompletion).toMatchObject({ isError: true });
      expect(getCalls).toEqual([]);
      await mcpClient.close();
    },
  );

  it.each(ebayFailures)(
    'translates $kind exactly once at the MCP boundary',
    async (ebayFailure) => {
      vi.stubEnv('EBAY_MCP_UI', 'off');
      const { sellerSession } = sellerSessionReturning<CustomerServiceMetric>({
        kind: 'ebayRequestFailed',
        ebayFailure,
      });

      const { mcpClient, toolCompletion } = await callEbayTool(
        sellerSession,
        toolName,
        customerServiceMetricArguments,
      );

      expect(toolCompletion).toMatchObject({
        content: [{ type: 'text', text: JSON.stringify({ ebayFailure }, null, 2) }],
        isError: true,
      });
      await mcpClient.close();
    },
  );
});
