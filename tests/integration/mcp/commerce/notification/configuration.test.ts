import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  NotificationConfiguration,
  NotificationConfigurationUpdate,
} from '@/ebay/commerce/notification/configuration.js';
import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';
import { notificationConfigurationDocument } from '@tests/fixtures/notificationConfiguration.js';

const getConfigToolName = 'ebay_commerce_notification_get_config';
const updateConfigToolName = 'ebay_commerce_notification_update_config';
const notificationConfiguration: NotificationConfigurationUpdate = {
  alertEmail: 'alerts@example.com',
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Commerce Notification configuration MCP exposure', () => {
  it('exposes both official names once without flat compatibility names', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<NotificationConfiguration>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: notificationConfigurationDocument,
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);

    expect(
      listedToolNames.filter((listedToolName) => listedToolName === getConfigToolName),
    ).toEqual([getConfigToolName]);
    expect(
      listedToolNames.filter((listedToolName) => listedToolName === updateConfigToolName),
    ).toEqual([updateConfigToolName]);
    expect(listedToolNames).not.toContain('ebay_get_notification_config');
    expect(listedToolNames).not.toContain('ebay_update_notification_config');
    await mcpClient.close();
  });

  it('exposes only migrated notification resources through commerce.notification', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'commerce.notification');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<NotificationConfiguration>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: notificationConfigurationDocument,
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    expect(listedTools.tools.map((ebayTool) => ebayTool.name)).toEqual([
      getConfigToolName,
      updateConfigToolName,
      'ebay_commerce_notification_get_destinations',
      'ebay_commerce_notification_create_destination',
      'ebay_commerce_notification_get_destination',
      'ebay_commerce_notification_update_destination',
      'ebay_commerce_notification_delete_destination',
      'ebay_commerce_notification_get_public_key',
      'ebay_commerce_notification_get_subscriptions',
      'ebay_commerce_notification_create_subscription',
      'ebay_commerce_notification_get_subscription',
      'ebay_commerce_notification_update_subscription',
      'ebay_commerce_notification_delete_subscription',
      'ebay_commerce_notification_disable_subscription',
      'ebay_commerce_notification_enable_subscription',
      'ebay_commerce_notification_test_subscription',
      'ebay_commerce_notification_create_subscription_filter',
      'ebay_commerce_notification_get_subscription_filter',
      'ebay_commerce_notification_delete_subscription_filter',
    ]);
    await mcpClient.close();
  });

  it('retains only notification lookups in read-only mode', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'commerce.notification');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    vi.stubEnv('EBAY_READ_ONLY', 'true');
    const { sellerSession } = sellerSessionReturning<NotificationConfiguration>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: notificationConfigurationDocument,
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    expect(listedTools.tools.map((ebayTool) => ebayTool.name)).toEqual([
      getConfigToolName,
      'ebay_commerce_notification_get_destinations',
      'ebay_commerce_notification_get_destination',
      'ebay_commerce_notification_get_public_key',
      'ebay_commerce_notification_get_subscriptions',
      'ebay_commerce_notification_get_subscription',
      'ebay_commerce_notification_get_subscription_filter',
    ]);
    await mcpClient.close();
  });
});

describe('Commerce Notification configuration MCP calls', () => {
  it('returns the generated configuration unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const successfulLookup: EbayRequestCompletion<NotificationConfiguration> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: notificationConfigurationDocument,
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulLookup);

    const { mcpClient, toolCompletion } = await callEbayTool(sellerSession, getConfigToolName, {});

    expect(getCalls).toEqual([{ endpoint: '/commerce/notification/v1/config' }]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(notificationConfigurationDocument, null, 2) }],
    });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });

  it('submits the exact configuration and returns the empty 204 completion', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const successfulUpdate: EbayRequestCompletion<void> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    };
    const { sellerSession, putCalls } = sellerSessionReturning(successfulUpdate);

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      updateConfigToolName,
      notificationConfiguration,
    );

    expect(putCalls).toEqual([
      {
        endpoint: '/commerce/notification/v1/config',
        requestDocument: notificationConfiguration,
      },
    ]);
    expect(toolCompletion).toMatchObject({ content: [] });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });
});

describe('Commerce Notification configuration MCP validation', () => {
  it('rejects invalid email before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, putCalls } = sellerSessionReturning<void>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(sellerSession, updateConfigToolName, {
      alertEmail: 'not-an-email',
    });

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(putCalls).toEqual([]);
    await mcpClient.close();
  });
});

describe('Commerce Notification configuration MCP failures', () => {
  it.each(ebayFailures)('translates a $kind lookup failure once', async (ebayFailure) => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<NotificationConfiguration>({
      kind: 'ebayRequestFailed',
      ebayFailure,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(sellerSession, getConfigToolName, {});

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
      updateConfigToolName,
      notificationConfiguration,
    );

    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify({ ebayFailure }, null, 2) }],
      isError: true,
    });
    await mcpClient.close();
  });
});
