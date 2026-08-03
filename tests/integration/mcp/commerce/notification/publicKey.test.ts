import { afterEach, describe, expect, it, vi } from 'vitest';

import type { NotificationPublicKey } from '@/ebay/commerce/notification/publicKey.js';
import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';
import { notificationPublicKeyDocument } from '@tests/fixtures/notificationPublicKey.js';

const publicKeyToolName = 'ebay_commerce_notification_get_public_key';
const publicKeyLookup = { public_key_id: 'key-123' };

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Commerce Notification public-key MCP exposure', () => {
  it('exposes the official name once without the flat compatibility name', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<NotificationPublicKey>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: notificationPublicKeyDocument,
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);

    expect(
      listedToolNames.filter((listedToolName) => listedToolName === publicKeyToolName),
    ).toEqual([publicKeyToolName]);
    expect(listedToolNames).not.toContain('ebay_get_notification_public_key');
    await mcpClient.close();
  });
});

describe('Commerce Notification public-key MCP call', () => {
  it('returns every generated public-key field unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const successfulLookup: EbayRequestCompletion<NotificationPublicKey> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: notificationPublicKeyDocument,
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulLookup);

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      publicKeyToolName,
      publicKeyLookup,
    );

    expect(getCalls).toEqual([{ endpoint: '/commerce/notification/v1/public_key/key-123' }]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(notificationPublicKeyDocument, null, 2) }],
    });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });
});

describe('Commerce Notification public-key MCP validation', () => {
  it('rejects the renamed path field before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls } = sellerSessionReturning<NotificationPublicKey>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: notificationPublicKeyDocument,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(sellerSession, publicKeyToolName, {
      publicKeyId: 'key-123',
    });

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(getCalls).toEqual([]);
    await mcpClient.close();
  });
});

describe('Commerce Notification public-key MCP failures', () => {
  it.each(ebayFailures)('translates a $kind lookup failure once', async (ebayFailure) => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<NotificationPublicKey>({
      kind: 'ebayRequestFailed',
      ebayFailure,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      publicKeyToolName,
      publicKeyLookup,
    );

    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify({ ebayFailure }, null, 2) }],
      isError: true,
    });
    await mcpClient.close();
  });
});
