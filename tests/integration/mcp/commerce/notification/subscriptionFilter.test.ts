import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  NotificationSubscriptionFilter,
  SubscriptionFilterCreationConfirmation,
  SubscriptionFilterSubmission,
} from '@/ebay/commerce/notification/subscriptionFilter.js';
import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';
import { notificationSubscriptionFilterDocument } from '@tests/fixtures/notificationSubscriptionFilter.js';

const createSubscriptionFilterToolName = 'ebay_commerce_notification_create_subscription_filter';
const getSubscriptionFilterToolName = 'ebay_commerce_notification_get_subscription_filter';
const deleteSubscriptionFilterToolName = 'ebay_commerce_notification_delete_subscription_filter';
const subscriptionFilterLookup = {
  filter_id: 'filter-123',
  subscription_id: 'subscription-123',
};
const subscriptionFilterSubmission: SubscriptionFilterSubmission = {
  subscription_id: 'subscription-123',
  filterSchema: {
    type: 'object',
    properties: {
      orderId: { type: 'string' },
    },
    required: ['orderId'],
  },
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Commerce Notification subscription-filter MCP exposure', () => {
  it('exposes three official names once without flat compatibility names', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<NotificationSubscriptionFilter>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: notificationSubscriptionFilterDocument,
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);
    const subscriptionFilterToolNames = [
      createSubscriptionFilterToolName,
      getSubscriptionFilterToolName,
      deleteSubscriptionFilterToolName,
    ];

    for (const subscriptionFilterToolName of subscriptionFilterToolNames) {
      expect(
        listedToolNames.filter((listedToolName) => listedToolName === subscriptionFilterToolName),
      ).toEqual([subscriptionFilterToolName]);
    }
    expect(listedToolNames).not.toContain('ebay_create_notification_subscription_filter');
    expect(listedToolNames).not.toContain('ebay_get_notification_subscription_filter');
    expect(listedToolNames).not.toContain('ebay_delete_notification_subscription_filter');
    await mcpClient.close();
  });
});

describe('Commerce Notification subscription-filter MCP calls', () => {
  it('submits the exact filter document without the path ID', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, postCalls } =
      sellerSessionReturning<SubscriptionFilterCreationConfirmation>({
        kind: 'ebayRequestSucceeded',
        ebayDocument: {},
      });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      createSubscriptionFilterToolName,
      subscriptionFilterSubmission,
    );

    expect(postCalls).toEqual([
      {
        endpoint: '/commerce/notification/v1/subscription/subscription-123/filter',
        requestDocument: { filterSchema: subscriptionFilterSubmission.filterSchema },
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify({}, null, 2) }],
    });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });

  it('returns the generated subscription filter unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls } = sellerSessionReturning<NotificationSubscriptionFilter>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: notificationSubscriptionFilterDocument,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      getSubscriptionFilterToolName,
      subscriptionFilterLookup,
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/commerce/notification/v1/subscription/subscription-123/filter/filter-123',
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [
        { type: 'text', text: JSON.stringify(notificationSubscriptionFilterDocument, null, 2) },
      ],
    });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });

  it('deletes the exact subscription-filter path', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, deleteCalls } = sellerSessionReturning<void>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      deleteSubscriptionFilterToolName,
      subscriptionFilterLookup,
    );

    expect(deleteCalls).toEqual([
      {
        endpoint: '/commerce/notification/v1/subscription/subscription-123/filter/filter-123',
      },
    ]);
    expect(toolCompletion).toMatchObject({ content: [] });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });
});

describe('Commerce Notification subscription-filter MCP validation', () => {
  it('rejects non-JSON filter documents before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, postCalls } =
      sellerSessionReturning<SubscriptionFilterCreationConfirmation>({
        kind: 'ebayRequestSucceeded',
        ebayDocument: {},
      });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      createSubscriptionFilterToolName,
      {
        subscription_id: 'subscription-123',
        filterSchema: [],
      },
    );

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(postCalls).toEqual([]);
    await mcpClient.close();
  });

  it('rejects renamed filter IDs before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls } = sellerSessionReturning<NotificationSubscriptionFilter>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: notificationSubscriptionFilterDocument,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      getSubscriptionFilterToolName,
      { subscriptionId: 'subscription-123', filterId: 'filter-123' },
    );

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(getCalls).toEqual([]);
    await mcpClient.close();
  });
});

describe('Commerce Notification subscription-filter MCP failures', () => {
  it.each(ebayFailures)('translates a $kind create failure once', async (ebayFailure) => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<SubscriptionFilterCreationConfirmation>({
      kind: 'ebayRequestFailed',
      ebayFailure,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      createSubscriptionFilterToolName,
      subscriptionFilterSubmission,
    );

    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify({ ebayFailure }, null, 2) }],
      isError: true,
    });
    await mcpClient.close();
  });

  it.each(ebayFailures)('translates a $kind lookup failure once', async (ebayFailure) => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<NotificationSubscriptionFilter>({
      kind: 'ebayRequestFailed',
      ebayFailure,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      getSubscriptionFilterToolName,
      subscriptionFilterLookup,
    );

    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify({ ebayFailure }, null, 2) }],
      isError: true,
    });
    await mcpClient.close();
  });

  it.each(ebayFailures)('translates a $kind delete failure once', async (ebayFailure) => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<void>({
      kind: 'ebayRequestFailed',
      ebayFailure,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      deleteSubscriptionFilterToolName,
      subscriptionFilterLookup,
    );

    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify({ ebayFailure }, null, 2) }],
      isError: true,
    });
    await mcpClient.close();
  });
});
