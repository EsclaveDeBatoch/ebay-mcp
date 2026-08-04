import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  NotificationSubscription,
  NotificationSubscriptionSubmission,
  NotificationSubscriptionUpdate,
  SubscriptionCreationConfirmation,
  SubscriptionPage,
} from '@/ebay/commerce/notification/subscription.js';
import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';
import {
  notificationSubscriptionDocument,
  notificationSubscriptionPageDocument,
} from '@tests/fixtures/notificationSubscription.js';

const getSubscriptionsToolName = 'ebay_commerce_notification_get_subscriptions';
const createSubscriptionToolName = 'ebay_commerce_notification_create_subscription';
const getSubscriptionToolName = 'ebay_commerce_notification_get_subscription';
const updateSubscriptionToolName = 'ebay_commerce_notification_update_subscription';
const deleteSubscriptionToolName = 'ebay_commerce_notification_delete_subscription';
const disableSubscriptionToolName = 'ebay_commerce_notification_disable_subscription';
const enableSubscriptionToolName = 'ebay_commerce_notification_enable_subscription';
const testSubscriptionToolName = 'ebay_commerce_notification_test_subscription';
const subscriptionSearch = { continuation_token: 'next-page', limit: '20' };
const subscriptionLookup = { subscription_id: 'subscription-123' };
const subscriptionSubmission: NotificationSubscriptionSubmission = {
  destinationId: 'destination-123',
  payload: {
    deliveryProtocol: 'HTTPS',
    format: 'JSON',
    schemaVersion: '1.0',
  },
  status: 'ENABLED',
  topicId: 'MARKETPLACE_ACCOUNT_DELETION',
};
const subscriptionUpdate: NotificationSubscriptionUpdate = {
  subscription_id: 'subscription-123',
  destinationId: 'destination-456',
  payload: subscriptionSubmission.payload,
  status: 'DISABLED',
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Commerce Notification subscription MCP exposure', () => {
  it('exposes eight official names once without flat compatibility names', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<SubscriptionPage>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: notificationSubscriptionPageDocument,
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);
    const subscriptionToolNames = [
      getSubscriptionsToolName,
      createSubscriptionToolName,
      getSubscriptionToolName,
      updateSubscriptionToolName,
      deleteSubscriptionToolName,
      disableSubscriptionToolName,
      enableSubscriptionToolName,
      testSubscriptionToolName,
    ];

    for (const subscriptionToolName of subscriptionToolNames) {
      expect(
        listedToolNames.filter((listedToolName) => listedToolName === subscriptionToolName),
      ).toEqual([subscriptionToolName]);
    }
    expect(listedToolNames).not.toContain('ebay_get_notification_subscriptions');
    expect(listedToolNames).not.toContain('ebay_create_notification_subscription');
    expect(listedToolNames).not.toContain('ebay_get_notification_subscription');
    expect(listedToolNames).not.toContain('ebay_update_notification_subscription');
    expect(listedToolNames).not.toContain('ebay_delete_notification_subscription');
    expect(listedToolNames).not.toContain('ebay_disable_notification_subscription');
    expect(listedToolNames).not.toContain('ebay_enable_notification_subscription');
    expect(listedToolNames).not.toContain('ebay_test_notification_subscription');
    await mcpClient.close();
  });
});

describe('Commerce Notification subscription MCP calls', () => {
  it('returns the generated subscription page unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls } = sellerSessionReturning<SubscriptionPage>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: notificationSubscriptionPageDocument,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      getSubscriptionsToolName,
      subscriptionSearch,
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/commerce/notification/v1/subscription',
        searchParameters: subscriptionSearch,
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [
        { type: 'text', text: JSON.stringify(notificationSubscriptionPageDocument, null, 2) },
      ],
    });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });

  it('submits the exact create document', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, postCalls } = sellerSessionReturning<SubscriptionCreationConfirmation>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      createSubscriptionToolName,
      subscriptionSubmission,
    );

    expect(postCalls).toEqual([
      {
        endpoint: '/commerce/notification/v1/subscription',
        requestDocument: subscriptionSubmission,
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify({}, null, 2) }],
    });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });

  it('returns one generated subscription unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls } = sellerSessionReturning<NotificationSubscription>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: notificationSubscriptionDocument,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      getSubscriptionToolName,
      subscriptionLookup,
    );

    expect(getCalls).toEqual([
      { endpoint: '/commerce/notification/v1/subscription/subscription-123' },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(notificationSubscriptionDocument, null, 2) }],
    });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });

  it('keeps the path ID out of the update document', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, putCalls } = sellerSessionReturning<void>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      updateSubscriptionToolName,
      subscriptionUpdate,
    );

    expect(putCalls).toEqual([
      {
        endpoint: '/commerce/notification/v1/subscription/subscription-123',
        requestDocument: {
          destinationId: subscriptionUpdate.destinationId,
          payload: subscriptionUpdate.payload,
          status: subscriptionUpdate.status,
        },
      },
    ]);
    expect(toolCompletion).toMatchObject({ content: [] });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });

  it('deletes the exact subscription path', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, deleteCalls } = sellerSessionReturning<void>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      deleteSubscriptionToolName,
      subscriptionLookup,
    );

    expect(deleteCalls).toEqual([
      { endpoint: '/commerce/notification/v1/subscription/subscription-123' },
    ]);
    expect(toolCompletion).toMatchObject({ content: [] });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });

  it('posts bodyless disable, enable, and test actions', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, postCalls } = sellerSessionReturning<void>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    });

    const disableCall = await callEbayTool(
      sellerSession,
      disableSubscriptionToolName,
      subscriptionLookup,
    );
    const enableCall = await callEbayTool(
      sellerSession,
      enableSubscriptionToolName,
      subscriptionLookup,
    );
    const testCall = await callEbayTool(
      sellerSession,
      testSubscriptionToolName,
      subscriptionLookup,
    );

    expect(postCalls).toEqual([
      { endpoint: '/commerce/notification/v1/subscription/subscription-123/disable' },
      { endpoint: '/commerce/notification/v1/subscription/subscription-123/enable' },
      { endpoint: '/commerce/notification/v1/subscription/subscription-123/test' },
    ]);
    expect(disableCall.toolCompletion).toMatchObject({ content: [] });
    expect(enableCall.toolCompletion).toMatchObject({ content: [] });
    expect(testCall.toolCompletion).toMatchObject({ content: [] });
    await disableCall.mcpClient.close();
    await enableCall.mcpClient.close();
    await testCall.mcpClient.close();
  });
});

describe('Commerce Notification subscription MCP validation', () => {
  it('rejects incomplete create documents before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, postCalls } = sellerSessionReturning<SubscriptionCreationConfirmation>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      createSubscriptionToolName,
      {
        destinationId: subscriptionSubmission.destinationId,
        status: subscriptionSubmission.status,
        topicId: subscriptionSubmission.topicId,
      },
    );

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(postCalls).toEqual([]);
    await mcpClient.close();
  });

  it('rejects renamed subscription IDs before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls } = sellerSessionReturning<NotificationSubscription>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: notificationSubscriptionDocument,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      getSubscriptionToolName,
      { subscriptionId: 'subscription-123' },
    );

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(getCalls).toEqual([]);
    await mcpClient.close();
  });
});

describe('Commerce Notification subscription MCP failures', () => {
  it.each(ebayFailures)('translates a $kind list failure once', async (ebayFailure) => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<SubscriptionPage>({
      kind: 'ebayRequestFailed',
      ebayFailure,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      getSubscriptionsToolName,
      subscriptionSearch,
    );

    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify({ ebayFailure }, null, 2) }],
      isError: true,
    });
    await mcpClient.close();
  });

  it.each(ebayFailures)('translates a $kind create failure once', async (ebayFailure) => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<SubscriptionCreationConfirmation>({
      kind: 'ebayRequestFailed',
      ebayFailure,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      createSubscriptionToolName,
      subscriptionSubmission,
    );

    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify({ ebayFailure }, null, 2) }],
      isError: true,
    });
    await mcpClient.close();
  });

  it.each(ebayFailures)('translates a $kind lookup failure once', async (ebayFailure) => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<NotificationSubscription>({
      kind: 'ebayRequestFailed',
      ebayFailure,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      getSubscriptionToolName,
      subscriptionLookup,
    );

    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify({ ebayFailure }, null, 2) }],
      isError: true,
    });
    await mcpClient.close();
  });

  it.each(ebayFailures)('translates a $kind update failure once', async (ebayFailure) => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<void>({
      kind: 'ebayRequestFailed',
      ebayFailure,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      updateSubscriptionToolName,
      subscriptionUpdate,
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
      deleteSubscriptionToolName,
      subscriptionLookup,
    );

    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify({ ebayFailure }, null, 2) }],
      isError: true,
    });
    await mcpClient.close();
  });

  it.each(ebayFailures)('translates a $kind disable failure once', async (ebayFailure) => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<void>({
      kind: 'ebayRequestFailed',
      ebayFailure,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      disableSubscriptionToolName,
      subscriptionLookup,
    );

    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify({ ebayFailure }, null, 2) }],
      isError: true,
    });
    await mcpClient.close();
  });

  it.each(ebayFailures)('translates a $kind enable failure once', async (ebayFailure) => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<void>({
      kind: 'ebayRequestFailed',
      ebayFailure,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      enableSubscriptionToolName,
      subscriptionLookup,
    );

    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify({ ebayFailure }, null, 2) }],
      isError: true,
    });
    await mcpClient.close();
  });

  it.each(ebayFailures)('translates a $kind test failure once', async (ebayFailure) => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<void>({
      kind: 'ebayRequestFailed',
      ebayFailure,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      testSubscriptionToolName,
      subscriptionLookup,
    );

    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify({ ebayFailure }, null, 2) }],
      isError: true,
    });
    await mcpClient.close();
  });
});
