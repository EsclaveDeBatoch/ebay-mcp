import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  ItemPromotionResponse,
  ItemPromotionWriteCompletion,
} from '@/ebay/sell/marketing/itemPromotion.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';

const itemPromotionToolNames = [
  'ebay_sell_marketing_create_item_promotion',
  'ebay_sell_marketing_get_item_promotion',
  'ebay_sell_marketing_update_item_promotion',
  'ebay_sell_marketing_delete_item_promotion',
] as const;

const promotionCreation = {
  description: 'Buy more, save more',
  discountRules: [
    {
      discountBenefit: { percentageOffOrder: '10' },
      discountSpecification: { minQuantity: 2 },
      ruleOrder: 1,
    },
  ],
  marketplaceId: 'EBAY_US',
  name: 'Order discount',
  promotionStatus: 'SCHEDULED',
  promotionType: 'ORDER_DISCOUNT',
  startDate: '2026-08-10T00:00:00Z',
  endDate: '2026-08-20T00:00:00Z',
};

const promotionDocument: ItemPromotionResponse = {
  ...promotionCreation,
  promotionId: 'PROMO-1',
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Sell Marketing item-promotion MCP exposure', () => {
  it('exposes four official operations once without compatibility names', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<ItemPromotionResponse>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: promotionDocument,
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);

    for (const toolName of itemPromotionToolNames) {
      expect(listedToolNames.filter((listedToolName) => listedToolName === toolName)).toEqual([
        toolName,
      ]);
    }
    expect(listedToolNames).not.toContain('ebay_create_item_promotion');
    await mcpClient.close();
  });

  it('keeps only the read operation in read-only mode', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'sell.marketing');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    vi.stubEnv('EBAY_READ_ONLY', 'true');
    const { sellerSession } = sellerSessionReturning<ItemPromotionResponse>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: promotionDocument,
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);

    expect(listedToolNames).toContain('ebay_sell_marketing_get_item_promotion');
    expect(listedToolNames).not.toContain('ebay_sell_marketing_create_item_promotion');
    expect(listedToolNames).not.toContain('ebay_sell_marketing_update_item_promotion');
    expect(listedToolNames).not.toContain('ebay_sell_marketing_delete_item_promotion');
    await mcpClient.close();
  });
});

describe('Sell Marketing item-promotion MCP calls', () => {
  it('creates an item promotion and returns the BaseResponse unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const writeCompletion: ItemPromotionWriteCompletion = { warnings: [] };
    const { sellerSession, postCalls } = sellerSessionReturning<ItemPromotionWriteCompletion>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: writeCompletion,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_create_item_promotion',
      promotionCreation,
    );

    expect(postCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/item_promotion',
        requestDocument: promotionCreation,
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(writeCompletion, null, 2) }],
    });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });

  it('gets one item promotion by promotion_id and returns every field unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls } = sellerSessionReturning<ItemPromotionResponse>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: promotionDocument,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_get_item_promotion',
      { promotion_id: 'PROMO-1' },
    );

    expect(getCalls).toEqual([{ endpoint: '/sell/marketing/v1/item_promotion/PROMO-1' }]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(promotionDocument, null, 2) }],
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
      'ebay_sell_marketing_update_item_promotion',
      { promotion_id: 'PROMO-1', ...promotionCreation, name: 'Updated order discount' },
    );
    const deleteCall = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_delete_item_promotion',
      { promotion_id: 'PROMO-1' },
    );

    expect(putCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/item_promotion/PROMO-1',
        requestDocument: { ...promotionCreation, name: 'Updated order discount' },
      },
    ]);
    expect(deleteCalls).toEqual([{ endpoint: '/sell/marketing/v1/item_promotion/PROMO-1' }]);
    expect(updateCall.toolCompletion).toEqual({ content: [] });
    expect(deleteCall.toolCompletion).toEqual({ content: [] });
    await updateCall.mcpClient.close();
    await deleteCall.mcpClient.close();
  });
});

describe('Sell Marketing item-promotion MCP validation and failures', () => {
  it('rejects renamed path fields before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls } = sellerSessionReturning<ItemPromotionResponse>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: promotionDocument,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_get_item_promotion',
      { promotionId: 'PROMO-1' },
    );

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(getCalls).toEqual([]);
    await mcpClient.close();
  });

  it.each(ebayFailures)('translates a $kind lookup failure once', async (ebayFailure) => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<ItemPromotionResponse>({
      kind: 'ebayRequestFailed',
      ebayFailure,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_get_item_promotion',
      { promotion_id: 'PROMO-1' },
    );

    expect(toolCompletion).toMatchObject({ isError: true });
    await mcpClient.close();
  });
});
