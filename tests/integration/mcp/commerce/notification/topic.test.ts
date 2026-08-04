import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  NotificationTopic,
  NotificationTopicPage,
  TopicSearchArguments,
} from '@/ebay/commerce/notification/topic.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';
import {
  notificationTopicDocument,
  notificationTopicPageDocument,
} from '@tests/fixtures/notificationTopic.js';

const getTopicToolName = 'ebay_commerce_notification_get_topic';
const getTopicsToolName = 'ebay_commerce_notification_get_topics';
const topicLookup = { topic_id: 'MARKETPLACE_ACCOUNT_DELETION' };
const topicSearch: TopicSearchArguments = {
  continuation_token: 'next-topic-page',
  limit: '20',
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Commerce Notification topic MCP exposure', () => {
  it('exposes both official names once without flat compatibility names', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<NotificationTopic>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: notificationTopicDocument,
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);

    expect(listedToolNames.filter((listedToolName) => listedToolName === getTopicToolName)).toEqual(
      [getTopicToolName],
    );
    expect(
      listedToolNames.filter((listedToolName) => listedToolName === getTopicsToolName),
    ).toEqual([getTopicsToolName]);
    expect(listedToolNames).not.toContain('ebay_get_notification_topic');
    expect(listedToolNames).not.toContain('ebay_get_notification_topics');
    await mcpClient.close();
  });
});

describe('Commerce Notification topic MCP calls', () => {
  it('returns every generated topic field unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls } = sellerSessionReturning<NotificationTopic>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: notificationTopicDocument,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      getTopicToolName,
      topicLookup,
    );

    expect(getCalls).toEqual([
      { endpoint: '/commerce/notification/v1/topic/MARKETPLACE_ACCOUNT_DELETION' },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(notificationTopicDocument, null, 2) }],
    });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });

  it('passes exact eBay pagination and returns the generated topic page unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls } = sellerSessionReturning<NotificationTopicPage>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: notificationTopicPageDocument,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      getTopicsToolName,
      topicSearch,
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/commerce/notification/v1/topic',
        searchParameters: topicSearch,
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(notificationTopicPageDocument, null, 2) }],
    });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });
});

describe('Commerce Notification topic MCP validation', () => {
  it('rejects the renamed topic ID before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls } = sellerSessionReturning<NotificationTopic>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: notificationTopicDocument,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(sellerSession, getTopicToolName, {
      topicId: 'MARKETPLACE_ACCOUNT_DELETION',
    });

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(getCalls).toEqual([]);
    await mcpClient.close();
  });

  it('rejects a numeric limit before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls } = sellerSessionReturning<NotificationTopicPage>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: notificationTopicPageDocument,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(sellerSession, getTopicsToolName, {
      limit: 20,
    });

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(getCalls).toEqual([]);
    await mcpClient.close();
  });
});

describe('Commerce Notification topic MCP failures', () => {
  it.each(ebayFailures)('translates a $kind topic lookup failure once', async (ebayFailure) => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<NotificationTopic>({
      kind: 'ebayRequestFailed',
      ebayFailure,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      getTopicToolName,
      topicLookup,
    );

    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify({ ebayFailure }, null, 2) }],
      isError: true,
    });
    await mcpClient.close();
  });

  it.each(ebayFailures)('translates a $kind topic search failure once', async (ebayFailure) => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<NotificationTopicPage>({
      kind: 'ebayRequestFailed',
      ebayFailure,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      getTopicsToolName,
      topicSearch,
    );

    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify({ ebayFailure }, null, 2) }],
      isError: true,
    });
    await mcpClient.close();
  });
});
