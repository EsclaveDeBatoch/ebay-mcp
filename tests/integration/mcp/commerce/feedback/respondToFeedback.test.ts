import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  FeedbackReplyArguments,
  FeedbackReplyConfirmation,
} from '@/ebay/commerce/feedback/respondToFeedback.js';
import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';

const toolName = 'ebay_commerce_feedback_respond_to_feedback';
const feedbackReplyArguments: FeedbackReplyArguments = {
  feedbackId: 'feedback-123',
  recipientUserId: 'buyer-123',
  responseText: 'Thank you for sharing your experience.',
  responseType: 'REPLY',
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Commerce Feedback respond-to-feedback MCP exposure', () => {
  it('exposes the official hierarchical name without its flat predecessor', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<FeedbackReplyConfirmation>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);

    expect(listedToolNames.filter((listedToolName) => listedToolName === toolName)).toEqual([
      toolName,
    ]);
    expect(listedToolNames).not.toContain('ebay_respond_to_feedback');
    await mcpClient.close();
  });

  it('shares the official Commerce Feedback namespace gate', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'commerce.feedback');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<FeedbackReplyConfirmation>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    expect(listedTools.tools.map((ebayTool) => ebayTool.name)).toEqual([
      'ebay_commerce_feedback_get_items_awaiting_feedback',
      'ebay_commerce_feedback_get_feedback',
      'ebay_commerce_feedback_leave_feedback',
      'ebay_commerce_feedback_get_feedback_rating_summary',
      toolName,
    ]);
    await mcpClient.close();
  });

  it('is hidden when read-only mode is enabled', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'commerce.feedback');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    vi.stubEnv('EBAY_READ_ONLY', 'true');
    const { sellerSession } = sellerSessionReturning<FeedbackReplyConfirmation>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    expect(listedTools.tools.map((ebayTool) => ebayTool.name)).toEqual([
      'ebay_commerce_feedback_get_items_awaiting_feedback',
      'ebay_commerce_feedback_get_feedback',
      'ebay_commerce_feedback_get_feedback_rating_summary',
    ]);
    await mcpClient.close();
  });
});

describe('Commerce Feedback respond-to-feedback MCP call', () => {
  it('submits the exact reply document and returns the empty confirmation unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const successfulReply: EbayRequestCompletion<FeedbackReplyConfirmation> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    };
    const { sellerSession, postCalls } = sellerSessionReturning(successfulReply);

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      toolName,
      feedbackReplyArguments,
    );

    expect(postCalls).toEqual([
      {
        endpoint: '/commerce/feedback/v1/respond_to_feedback',
        requestDocument: feedbackReplyArguments,
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify({}, null, 2) }],
    });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });
});

describe('Commerce Feedback respond-to-feedback MCP validation', () => {
  it('rejects incomplete feedback replies before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, postCalls } = sellerSessionReturning<FeedbackReplyConfirmation>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    const { mcpClient, toolCompletion } = await callEbayTool(sellerSession, toolName, {
      feedbackId: 'feedback-123',
      responseText: 'Thank you.',
    });

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(postCalls).toEqual([]);
    await mcpClient.close();
  });
});

describe('Commerce Feedback respond-to-feedback MCP failures', () => {
  it.each(ebayFailures)('translates a $kind failure once', async (ebayFailure) => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<FeedbackReplyConfirmation>({
      kind: 'ebayRequestFailed',
      ebayFailure,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      toolName,
      feedbackReplyArguments,
    );

    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify({ ebayFailure }, null, 2) }],
      isError: true,
    });
    await mcpClient.close();
  });
});
