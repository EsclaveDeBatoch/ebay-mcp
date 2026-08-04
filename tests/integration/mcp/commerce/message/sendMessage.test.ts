import { afterEach, describe, expect, it, vi } from 'vitest';

import type { SendMessageArguments, SentMessage } from '@/ebay/commerce/message/sendMessage.js';
import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';
import { sentMessageDocument } from '@tests/fixtures/sentMessage.js';

const toolName = 'ebay_commerce_message_send_message';
const messageSubmission: SendMessageArguments = {
  messageMedia: [
    {
      mediaName: 'camera-case.jpg',
      mediaType: 'IMAGE',
      mediaUrl: 'https://media.example.com/camera-case.jpg',
    },
  ],
  messageText: 'The camera includes its original case.',
  otherPartyUsername: 'buyer-123',
  reference: {
    referenceId: '110000000000',
    referenceType: 'LISTING',
  },
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Commerce Message send-message MCP exposure', () => {
  it('exposes the official hierarchical name without its flat predecessor', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<SentMessage>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: sentMessageDocument,
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);

    expect(listedToolNames.filter((listedToolName) => listedToolName === toolName)).toEqual([
      toolName,
    ]);
    expect(listedToolNames).not.toContain('ebay_send_message');
    await mcpClient.close();
  });

  it('is hidden when read-only mode is enabled', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'commerce.message');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    vi.stubEnv('EBAY_READ_ONLY', 'true');
    const { sellerSession } = sellerSessionReturning<SentMessage>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: sentMessageDocument,
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    expect(listedTools.tools.map((ebayTool) => ebayTool.name)).toEqual([
      'ebay_commerce_message_get_conversations',
      'ebay_commerce_message_get_conversation',
    ]);
    await mcpClient.close();
  });
});

describe('Commerce Message send-message MCP call', () => {
  it('submits and returns the generated eBay documents unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const successfulMessage: EbayRequestCompletion<SentMessage> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: sentMessageDocument,
    };
    const { sellerSession, postCalls } = sellerSessionReturning(successfulMessage);

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      toolName,
      messageSubmission,
    );

    expect(postCalls).toEqual([
      {
        endpoint: '/commerce/message/v1/send_message',
        requestDocument: messageSubmission,
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(sentMessageDocument, null, 2) }],
    });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });
});

describe('Commerce Message send-message MCP validation', () => {
  it('rejects ambiguous destinations before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, postCalls } = sellerSessionReturning<SentMessage>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: sentMessageDocument,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(sellerSession, toolName, {
      conversationId: 'conversation-123',
      messageText: 'This has two destinations.',
      otherPartyUsername: 'buyer-123',
    });

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(postCalls).toEqual([]);
    await mcpClient.close();
  });

  it('rejects incomplete attachment fields before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, postCalls } = sellerSessionReturning<SentMessage>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: sentMessageDocument,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(sellerSession, toolName, {
      messageMedia: [{ mediaType: 'IMAGE', mediaUrl: 'http://media.example.com/camera.jpg' }],
      otherPartyUsername: 'buyer-123',
    });

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(postCalls).toEqual([]);
    await mcpClient.close();
  });
});

describe('Commerce Message send-message MCP failures', () => {
  it.each(ebayFailures)('translates a $kind failure once', async (ebayFailure) => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<SentMessage>({
      kind: 'ebayRequestFailed',
      ebayFailure,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      toolName,
      messageSubmission,
    );

    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify({ ebayFailure }, null, 2) }],
      isError: true,
    });
    await mcpClient.close();
  });
});
