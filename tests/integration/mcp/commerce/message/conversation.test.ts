import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  ConversationLookupArguments,
  ConversationMessages,
  ConversationPage,
  ConversationSearchArguments,
} from '@/ebay/commerce/message/conversation.js';
import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import {
  conversationMessagesDocument,
  conversationPageDocument,
} from '@tests/fixtures/conversation.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';

const getConversationsToolName = 'ebay_commerce_message_get_conversations';
const getConversationToolName = 'ebay_commerce_message_get_conversation';
const conversationSearchArguments: ConversationSearchArguments = {
  conversation_status: 'ACTIVE',
  conversation_type: 'FROM_MEMBERS',
  limit: '25',
  offset: '0',
};
const conversationLookupArguments: ConversationLookupArguments = {
  conversation_id: 'conversation-123',
  conversation_type: 'FROM_MEMBERS',
  limit: '25',
  offset: '0',
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Commerce Message conversation MCP exposure', () => {
  it('exposes both official names once without flat compatibility names', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<ConversationPage>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: conversationPageDocument,
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);

    expect(
      listedToolNames.filter((listedToolName) => listedToolName === getConversationsToolName),
    ).toEqual([getConversationsToolName]);
    expect(
      listedToolNames.filter((listedToolName) => listedToolName === getConversationToolName),
    ).toEqual([getConversationToolName]);
    expect(listedToolNames).not.toContain('ebay_get_conversations');
    expect(listedToolNames).not.toContain('ebay_get_conversation');
    await mcpClient.close();
  });

  it('exposes only the migrated conversation resource through commerce.message', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'commerce.message');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<ConversationPage>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: conversationPageDocument,
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    expect(listedTools.tools.map((ebayTool) => ebayTool.name)).toEqual([
      getConversationsToolName,
      getConversationToolName,
    ]);
    await mcpClient.close();
  });

  it('retains both lookups in read-only mode', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'commerce.message');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    vi.stubEnv('EBAY_READ_ONLY', 'true');
    const { sellerSession } = sellerSessionReturning<ConversationPage>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: conversationPageDocument,
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    expect(listedTools.tools.map((ebayTool) => ebayTool.name)).toEqual([
      getConversationsToolName,
      getConversationToolName,
    ]);
    await mcpClient.close();
  });
});

describe('Commerce Message conversation MCP calls', () => {
  it('returns the generated conversation page unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const successfulSearch: EbayRequestCompletion<ConversationPage> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: conversationPageDocument,
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulSearch);

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      getConversationsToolName,
      conversationSearchArguments,
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/commerce/message/v1/conversation',
        searchParameters: conversationSearchArguments,
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(conversationPageDocument, null, 2) }],
    });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });

  it('returns the generated conversation messages unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const successfulLookup: EbayRequestCompletion<ConversationMessages> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: conversationMessagesDocument,
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulLookup);

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      getConversationToolName,
      conversationLookupArguments,
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/commerce/message/v1/conversation/conversation-123',
        searchParameters: {
          conversation_type: 'FROM_MEMBERS',
          limit: '25',
          offset: '0',
        },
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(conversationMessagesDocument, null, 2) }],
    });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });
});

describe('Commerce Message conversation MCP validation', () => {
  it('rejects renamed search fields and numeric pagination before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls } = sellerSessionReturning<ConversationPage>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: conversationPageDocument,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      getConversationsToolName,
      { conversationType: 'FROM_MEMBERS', limit: 25 },
    );

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(getCalls).toEqual([]);
    await mcpClient.close();
  });

  it('rejects renamed lookup fields before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls } = sellerSessionReturning<ConversationMessages>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: conversationMessagesDocument,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      getConversationToolName,
      { conversationId: 'conversation-123', conversationType: 'FROM_MEMBERS' },
    );

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(getCalls).toEqual([]);
    await mcpClient.close();
  });
});

describe('Commerce Message conversation MCP failures', () => {
  it.each(ebayFailures)('translates a $kind search failure once', async (ebayFailure) => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<ConversationPage>({
      kind: 'ebayRequestFailed',
      ebayFailure,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      getConversationsToolName,
      conversationSearchArguments,
    );

    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify({ ebayFailure }, null, 2) }],
      isError: true,
    });
    await mcpClient.close();
  });

  it.each(ebayFailures)('translates a $kind lookup failure once', async (ebayFailure) => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<ConversationMessages>({
      kind: 'ebayRequestFailed',
      ebayFailure,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      getConversationToolName,
      conversationLookupArguments,
    );

    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify({ ebayFailure }, null, 2) }],
      isError: true,
    });
    await mcpClient.close();
  });
});
