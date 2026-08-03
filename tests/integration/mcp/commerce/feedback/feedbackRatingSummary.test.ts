import { afterEach, describe, expect, it, vi } from 'vitest';

import type { FeedbackRatingSummary } from '@/ebay/commerce/feedback/feedbackRatingSummary.js';
import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { feedbackRatingSummaryDocument } from '@tests/fixtures/feedbackRatingSummary.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';

const toolName = 'ebay_commerce_feedback_get_feedback_rating_summary';
const feedbackRatingSummaryArguments = {
  filter: 'ratingType:OVERALL_EXPERIENCE,excludeRepeatFeedback:true,lookbackPeriodInDays:90',
  user_id: 'seller-123',
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Commerce Feedback rating-summary MCP exposure', () => {
  it('does not retain the old flat compatibility name', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<FeedbackRatingSummary>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: feedbackRatingSummaryDocument,
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const ratingSummaryTools = listedTools.tools
      .map((ebayTool) => ebayTool.name)
      .filter((listedToolName) => listedToolName.includes('feedback_rating_summary'));

    expect(ratingSummaryTools).toEqual([toolName]);
    await mcpClient.close();
  });

  it('shares its official namespace gate with the awaiting-feedback resource', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'commerce.feedback');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<FeedbackRatingSummary>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: feedbackRatingSummaryDocument,
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    expect(listedTools.tools.map((ebayTool) => ebayTool.name)).toEqual([
      'ebay_commerce_feedback_get_items_awaiting_feedback',
      toolName,
    ]);
    await mcpClient.close();
  });

  it('remains exposed when read-only mode is enabled', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'commerce.feedback');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    vi.stubEnv('EBAY_READ_ONLY', 'true');
    const { sellerSession } = sellerSessionReturning<FeedbackRatingSummary>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: feedbackRatingSummaryDocument,
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    expect(listedTools.tools.map((ebayTool) => ebayTool.name)).toEqual([
      'ebay_commerce_feedback_get_items_awaiting_feedback',
      toolName,
    ]);
    await mcpClient.close();
  });
});

describe('Commerce Feedback rating-summary MCP call', () => {
  it('returns every generated eBay field unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const successfulLookup: EbayRequestCompletion<FeedbackRatingSummary> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: feedbackRatingSummaryDocument,
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulLookup);

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      toolName,
      feedbackRatingSummaryArguments,
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/commerce/feedback/v1/feedback_rating_summary',
        searchParameters: feedbackRatingSummaryArguments,
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(feedbackRatingSummaryDocument, null, 2) }],
    });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });
});

describe('Commerce Feedback rating-summary MCP validation', () => {
  it('rejects an unsupported rating type and renamed user field before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls } = sellerSessionReturning<FeedbackRatingSummary>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: feedbackRatingSummaryDocument,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(sellerSession, toolName, {
      filter: 'ratingType:ALL',
      userId: 'seller-123',
    });

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(getCalls).toEqual([]);
    await mcpClient.close();
  });
});

describe('Commerce Feedback rating-summary MCP failures', () => {
  it.each(ebayFailures)('translates a $kind failure once', async (ebayFailure) => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<FeedbackRatingSummary>({
      kind: 'ebayRequestFailed',
      ebayFailure,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      toolName,
      feedbackRatingSummaryArguments,
    );

    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify({ ebayFailure }, null, 2) }],
      isError: true,
    });
    await mcpClient.close();
  });
});
