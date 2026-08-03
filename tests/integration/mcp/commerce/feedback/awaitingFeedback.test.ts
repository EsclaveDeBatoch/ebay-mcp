import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ItemsAwaitingFeedback } from '@/ebay/commerce/feedback/awaitingFeedback.js';
import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import { itemsAwaitingFeedbackDocument } from '@tests/fixtures/awaitingFeedback.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';

const toolName = 'ebay_commerce_feedback_get_items_awaiting_feedback';
const awaitingFeedbackArguments = {
  filter: 'listingId:110000000000,userRole:SELLER',
  limit: '25',
  offset: '0',
  sort: 'END_TIME_DESC',
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Commerce Feedback awaiting-feedback MCP exposure', () => {
  it('exposes the official name without the old flat compatibility name', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<ItemsAwaitingFeedback>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: itemsAwaitingFeedbackDocument,
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const awaitingFeedbackTools = listedTools.tools
      .map((ebayTool) => ebayTool.name)
      .filter((listedToolName) => listedToolName.includes('awaiting_feedback'));

    expect(awaitingFeedbackTools).toEqual([toolName]);
    await mcpClient.close();
  });

  it('remains exposed when read-only mode is enabled', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'commerce.feedback');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    vi.stubEnv('EBAY_READ_ONLY', 'true');
    const { sellerSession } = sellerSessionReturning<ItemsAwaitingFeedback>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: itemsAwaitingFeedbackDocument,
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    expect(listedTools.tools.map((ebayTool) => ebayTool.name)).toEqual([
      toolName,
      'ebay_commerce_feedback_get_feedback_rating_summary',
    ]);
    await mcpClient.close();
  });
});

describe('Commerce Feedback awaiting-feedback MCP call', () => {
  it('returns every generated eBay field unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const successfulLookup: EbayRequestCompletion<ItemsAwaitingFeedback> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: itemsAwaitingFeedbackDocument,
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulLookup);

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      toolName,
      awaitingFeedbackArguments,
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/commerce/feedback/v1/awaiting_feedback',
        searchParameters: awaitingFeedbackArguments,
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(itemsAwaitingFeedbackDocument, null, 2) }],
    });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });
});

describe('Commerce Feedback awaiting-feedback MCP validation', () => {
  it('rejects numeric pagination and renamed filters before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls } = sellerSessionReturning<ItemsAwaitingFeedback>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: itemsAwaitingFeedbackDocument,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(sellerSession, toolName, {
      limit: 25,
      userRole: 'SELLER',
    });

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(getCalls).toEqual([]);
    await mcpClient.close();
  });
});

describe('Commerce Feedback awaiting-feedback MCP failures', () => {
  it.each(ebayFailures)('translates a $kind failure once', async (ebayFailure) => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<ItemsAwaitingFeedback>({
      kind: 'ebayRequestFailed',
      ebayFailure,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      toolName,
      awaitingFeedbackArguments,
    );

    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify({ ebayFailure }, null, 2) }],
      isError: true,
    });
    await mcpClient.close();
  });
});
