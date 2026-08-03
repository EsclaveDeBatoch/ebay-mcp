import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ConversationUpdateArguments } from '@/ebay/commerce/message/updateConversation.js';
import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';

const toolName = 'ebay_commerce_message_update_conversation';
const conversationUpdate: ConversationUpdateArguments = {
  conversationId: 'conversation-123',
  conversationStatus: 'ARCHIVE',
  conversationType: 'FROM_MEMBERS',
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Commerce Message update-conversation MCP exposure', () => {
  it('exposes the official hierarchical name without its flat predecessor', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<void>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);

    expect(listedToolNames.filter((listedToolName) => listedToolName === toolName)).toEqual([
      toolName,
    ]);
    expect(listedToolNames).not.toContain('ebay_update_conversation');
    await mcpClient.close();
  });
});

describe('Commerce Message update-conversation MCP call', () => {
  it('submits the exact update and returns the empty 204 completion', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const successfulUpdate: EbayRequestCompletion<void> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    };
    const { sellerSession, postCalls } = sellerSessionReturning(successfulUpdate);

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      toolName,
      conversationUpdate,
    );

    expect(postCalls).toEqual([
      {
        endpoint: '/commerce/message/v1/update_conversation',
        requestDocument: conversationUpdate,
      },
    ]);
    expect(toolCompletion).toMatchObject({ content: [] });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });
});

describe('Commerce Message update-conversation MCP validation', () => {
  it('rejects ambiguous mutations before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, postCalls } = sellerSessionReturning<void>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(sellerSession, toolName, {
      ...conversationUpdate,
      read: true,
    });

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(postCalls).toEqual([]);
    await mcpClient.close();
  });

  it('accepts false as a deliberate unread update', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const unreadUpdate: ConversationUpdateArguments = {
      conversationId: 'conversation-123',
      conversationType: 'FROM_MEMBERS',
      read: false,
    };
    const { sellerSession, postCalls } = sellerSessionReturning<void>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(sellerSession, toolName, unreadUpdate);

    expect(toolCompletion.isError).not.toBe(true);
    expect(postCalls).toEqual([
      {
        endpoint: '/commerce/message/v1/update_conversation',
        requestDocument: unreadUpdate,
      },
    ]);
    await mcpClient.close();
  });
});

describe('Commerce Message update-conversation MCP failures', () => {
  it.each(ebayFailures)('translates a $kind failure once', async (ebayFailure) => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<void>({
      kind: 'ebayRequestFailed',
      ebayFailure,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      toolName,
      conversationUpdate,
    );

    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify({ ebayFailure }, null, 2) }],
      isError: true,
    });
    await mcpClient.close();
  });
});
