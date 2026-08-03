import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  FeedbackPage,
  FeedbackSearchArguments,
  FeedbackSubmissionConfirmation,
  LeaveFeedbackArguments,
} from '@/ebay/commerce/feedback/feedback.js';
import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { feedbackPageDocument, feedbackSubmissionConfirmation } from '@tests/fixtures/feedback.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';

const getFeedbackToolName = 'ebay_commerce_feedback_get_feedback';
const leaveFeedbackToolName = 'ebay_commerce_feedback_leave_feedback';
const feedbackSearchArguments: FeedbackSearchArguments = {
  feedback_type: 'FEEDBACK_RECEIVED',
  limit: '25',
  offset: '0',
  sort: 'TIME',
  user_id: 'seller-123',
};
const leaveFeedbackArguments: LeaveFeedbackArguments = {
  commentText: 'Fast payment and clear communication.',
  commentType: 'POSITIVE',
  listingId: '110000000000',
  orderLineItemId: '110000000000-220000000000',
  transactionId: '220000000000',
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Commerce Feedback feedback-resource MCP exposure', () => {
  it('exposes both official names once without flat compatibility names', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<FeedbackPage>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: feedbackPageDocument,
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);

    expect(
      listedToolNames.filter((listedToolName) => listedToolName === getFeedbackToolName),
    ).toEqual([getFeedbackToolName]);
    expect(
      listedToolNames.filter((listedToolName) => listedToolName === leaveFeedbackToolName),
    ).toEqual([leaveFeedbackToolName]);
    expect(listedToolNames).not.toContain('ebay_get_feedback');
    expect(listedToolNames).not.toContain('ebay_leave_feedback_for_buyer');
    await mcpClient.close();
  });

  it('hides submission but retains lookup in read-only mode', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'commerce.feedback');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    vi.stubEnv('EBAY_READ_ONLY', 'true');
    const { sellerSession } = sellerSessionReturning<FeedbackPage>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: feedbackPageDocument,
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    expect(listedTools.tools.map((ebayTool) => ebayTool.name)).toEqual([
      'ebay_commerce_feedback_get_items_awaiting_feedback',
      getFeedbackToolName,
      'ebay_commerce_feedback_get_feedback_rating_summary',
    ]);
    await mcpClient.close();
  });
});

describe('Commerce Feedback feedback-resource MCP calls', () => {
  it('returns the generated feedback page unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const successfulLookup: EbayRequestCompletion<FeedbackPage> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: feedbackPageDocument,
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulLookup);

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      getFeedbackToolName,
      feedbackSearchArguments,
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/commerce/feedback/v1/feedback',
        searchParameters: feedbackSearchArguments,
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(feedbackPageDocument, null, 2) }],
    });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });

  it('submits the exact feedback document and returns its confirmation unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const successfulSubmission: EbayRequestCompletion<FeedbackSubmissionConfirmation> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: feedbackSubmissionConfirmation,
    };
    const { sellerSession, postCalls } = sellerSessionReturning(successfulSubmission);

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      leaveFeedbackToolName,
      leaveFeedbackArguments,
    );

    expect(postCalls).toEqual([
      {
        endpoint: '/commerce/feedback/v1/feedback',
        requestDocument: leaveFeedbackArguments,
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(feedbackSubmissionConfirmation, null, 2) }],
    });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });
});

describe('Commerce Feedback feedback-resource MCP validation', () => {
  it('rejects renamed lookup fields before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls } = sellerSessionReturning<FeedbackPage>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: feedbackPageDocument,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(sellerSession, getFeedbackToolName, {
      feedbackType: 'FEEDBACK_RECEIVED',
      userId: 'seller-123',
    });

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(getCalls).toEqual([]);
    await mcpClient.close();
  });

  it('rejects incomplete feedback before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, postCalls } = sellerSessionReturning<FeedbackSubmissionConfirmation>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: feedbackSubmissionConfirmation,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(sellerSession, leaveFeedbackToolName, {
      commentType: 'POSITIVE',
      orderLineItemId: '110000000000-220000000000',
    });

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(postCalls).toEqual([]);
    await mcpClient.close();
  });
});

describe('Commerce Feedback feedback-resource MCP failures', () => {
  it.each(ebayFailures)('translates a $kind lookup failure once', async (ebayFailure) => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<FeedbackPage>({
      kind: 'ebayRequestFailed',
      ebayFailure,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      getFeedbackToolName,
      feedbackSearchArguments,
    );

    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify({ ebayFailure }, null, 2) }],
      isError: true,
    });
    await mcpClient.close();
  });

  it.each(ebayFailures)('translates a $kind submission failure once', async (ebayFailure) => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<FeedbackSubmissionConfirmation>({
      kind: 'ebayRequestFailed',
      ebayFailure,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      leaveFeedbackToolName,
      leaveFeedbackArguments,
    );

    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify({ ebayFailure }, null, 2) }],
      isError: true,
    });
    await mcpClient.close();
  });
});
