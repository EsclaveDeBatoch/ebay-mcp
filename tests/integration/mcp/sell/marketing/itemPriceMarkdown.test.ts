import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ItemPriceMarkdown } from '@/ebay/sell/marketing/itemPriceMarkdown.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';

const itemPriceMarkdownToolNames = [
  'ebay_sell_marketing_create_item_price_markdown_promotion',
  'ebay_sell_marketing_get_item_price_markdown_promotion',
  'ebay_sell_marketing_update_item_price_markdown_promotion',
  'ebay_sell_marketing_delete_item_price_markdown_promotion',
] as const;

const markdownCreation = {
  description: 'Save on designer shoes',
  marketplaceId: 'EBAY_US',
  name: 'Weekend markdown',
  promotionStatus: 'SCHEDULED',
  selectedInventoryDiscounts: [
    {
      discountBenefit: { percentageOffItem: '15' },
      inventoryCriterion: {
        inventoryCriterionType: 'INVENTORY_BY_VALUE',
        listingIds: ['110000000000'],
      },
    },
  ],
  startDate: '2026-08-10T00:00:00Z',
  endDate: '2026-08-20T00:00:00Z',
};

const markdownDocument: ItemPriceMarkdown = {
  ...markdownCreation,
  promotionImageUrl: 'https://i.ebayimg.com/images/g/markdown.jpg',
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Sell Marketing item-price-markdown MCP exposure', () => {
  it('exposes four official operations once without compatibility names', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<ItemPriceMarkdown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: markdownDocument,
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);

    for (const toolName of itemPriceMarkdownToolNames) {
      expect(listedToolNames.filter((listedToolName) => listedToolName === toolName)).toEqual([
        toolName,
      ]);
    }
    expect(listedToolNames).not.toContain('ebay_create_item_price_markdown_promotion');
    await mcpClient.close();
  });

  it('keeps only the read operation in read-only mode', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'sell.marketing');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    vi.stubEnv('EBAY_READ_ONLY', 'true');
    const { sellerSession } = sellerSessionReturning<ItemPriceMarkdown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: markdownDocument,
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);

    expect(listedToolNames).toContain('ebay_sell_marketing_get_item_price_markdown_promotion');
    expect(listedToolNames).not.toContain(
      'ebay_sell_marketing_create_item_price_markdown_promotion',
    );
    expect(listedToolNames).not.toContain(
      'ebay_sell_marketing_update_item_price_markdown_promotion',
    );
    expect(listedToolNames).not.toContain(
      'ebay_sell_marketing_delete_item_price_markdown_promotion',
    );
    await mcpClient.close();
  });
});

describe('Sell Marketing item-price-markdown MCP calls', () => {
  it('creates a markdown promotion and returns eBay empty document unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, postCalls } = sellerSessionReturning<Record<string, never>>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_create_item_price_markdown_promotion',
      markdownCreation,
    );

    expect(postCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/item_price_markdown',
        requestDocument: markdownCreation,
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify({}, null, 2) }],
    });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });

  it('gets one markdown promotion by promotion_id and returns every field unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls } = sellerSessionReturning<ItemPriceMarkdown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: markdownDocument,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_get_item_price_markdown_promotion',
      { promotion_id: 'PROMO-1' },
    );

    expect(getCalls).toEqual([{ endpoint: '/sell/marketing/v1/item_price_markdown/PROMO-1' }]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(markdownDocument, null, 2) }],
    });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });

  it('updates and deletes with the exact promotion_id path', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, putCalls, deleteCalls } = sellerSessionReturning<undefined>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    });

    const updateCall = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_update_item_price_markdown_promotion',
      { promotion_id: 'PROMO-1', ...markdownCreation, name: 'Updated markdown' },
    );
    const deleteCall = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_delete_item_price_markdown_promotion',
      { promotion_id: 'PROMO-1' },
    );

    expect(putCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/item_price_markdown/PROMO-1',
        requestDocument: { ...markdownCreation, name: 'Updated markdown' },
      },
    ]);
    expect(deleteCalls).toEqual([{ endpoint: '/sell/marketing/v1/item_price_markdown/PROMO-1' }]);
    expect(updateCall.toolCompletion).toEqual({ content: [] });
    expect(deleteCall.toolCompletion).toEqual({ content: [] });
    await updateCall.mcpClient.close();
    await deleteCall.mcpClient.close();
  });
});

describe('Sell Marketing item-price-markdown MCP validation and failures', () => {
  it('rejects renamed path fields before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls } = sellerSessionReturning<ItemPriceMarkdown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: markdownDocument,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_get_item_price_markdown_promotion',
      { promotionId: 'PROMO-1' },
    );

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(getCalls).toEqual([]);
    await mcpClient.close();
  });

  it.each(ebayFailures)('translates a $kind lookup failure once', async (ebayFailure) => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<ItemPriceMarkdown>({
      kind: 'ebayRequestFailed',
      ebayFailure,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_get_item_price_markdown_promotion',
      { promotion_id: 'PROMO-1' },
    );

    expect(toolCompletion).toMatchObject({ isError: true });
    await mcpClient.close();
  });
});
