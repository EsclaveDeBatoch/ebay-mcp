import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  BulkConversationUpdateArguments,
  ConversationUpdateBatch,
} from '@/ebay/commerce/message/bulkUpdateConversation.js';
import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import { conversationUpdateBatchDocument } from '@tests/fixtures/conversationUpdateBatch.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';

const toolName = 'ebay_commerce_message_bulk_update_conversation';
const conversationUpdates: BulkConversationUpdateArguments = {
  conversations: [
    {
      conversationId: 'conversation-123',
      conversationStatus: 'ARCHIVE',
      conversationType: 'FROM_MEMBERS',
    },
    {
      conversationId: 'conversation-456',
      conversationStatus: 'READ',
      conversationType: 'FROM_EBAY',
    },
  ],
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Commerce Message bulk-update-conversation MCP exposure', () => {
  it('exposes the official hierarchical name without its flat predecessor', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<ConversationUpdateBatch>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: conversationUpdateBatchDocument,
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);

    expect(listedToolNames.filter((listedToolName) => listedToolName === toolName)).toEqual([
      toolName,
    ]);
    expect(listedToolNames).not.toContain('ebay_bulk_update_conversation');
    await mcpClient.close();
  });
});

describe('Commerce Message bulk-update-conversation MCP call', () => {
  it('submits and returns the generated eBay documents unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const successfulBatch: EbayRequestCompletion<ConversationUpdateBatch> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: conversationUpdateBatchDocument,
    };
    const { sellerSession, postCalls } = sellerSessionReturning(successfulBatch);

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      toolName,
      conversationUpdates,
    );

    expect(postCalls).toEqual([
      {
        endpoint: '/commerce/message/v1/bulk_update_conversation',
        requestDocument: conversationUpdates,
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(conversationUpdateBatchDocument, null, 2) }],
    });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });
});

describe('Commerce Message bulk-update-conversation MCP validation', () => {
  it('rejects incomplete updates before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, postCalls } = sellerSessionReturning<ConversationUpdateBatch>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: conversationUpdateBatchDocument,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(sellerSession, toolName, {
      conversations: [{ conversationId: 'conversation-123', conversationStatus: 'ARCHIVE' }],
    });

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(postCalls).toEqual([]);
    await mcpClient.close();
  });

  it('rejects an eleventh update before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, postCalls } = sellerSessionReturning<ConversationUpdateBatch>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: conversationUpdateBatchDocument,
    });
    const tooManyUpdates = Array.from({ length: 11 }, () => ({
      conversationId: 'conversation-123',
      conversationStatus: 'ARCHIVE',
      conversationType: 'FROM_MEMBERS',
    }));

    const { mcpClient, toolCompletion } = await callEbayTool(sellerSession, toolName, {
      conversations: tooManyUpdates,
    });

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(postCalls).toEqual([]);
    await mcpClient.close();
  });
});

describe('Commerce Message bulk-update-conversation MCP failures', () => {
  it.each(ebayFailures)('translates a $kind failure once', async (ebayFailure) => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<ConversationUpdateBatch>({
      kind: 'ebayRequestFailed',
      ebayFailure,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      toolName,
      conversationUpdates,
    );

    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify({ ebayFailure }, null, 2) }],
      isError: true,
    });
    await mcpClient.close();
  });
});
