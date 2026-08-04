import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Offer, OfferCollection } from '@/ebay/sell/inventory/offer.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';

const offerToolNames = [
  'ebay_sell_inventory_get_offers',
  'ebay_sell_inventory_get_offer',
  'ebay_sell_inventory_create_offer',
  'ebay_sell_inventory_update_offer',
  'ebay_sell_inventory_delete_offer',
  'ebay_sell_inventory_publish_offer',
  'ebay_sell_inventory_withdraw_offer',
  'ebay_sell_inventory_bulk_create_offer',
  'ebay_sell_inventory_bulk_publish_offer',
  'ebay_sell_inventory_get_listing_fees',
  'ebay_sell_inventory_publish_offer_by_inventory_item_group',
  'ebay_sell_inventory_withdraw_offer_by_inventory_item_group',
] as const;

const legacyOfferToolNames = [
  'ebay_get_offers',
  'ebay_get_offer',
  'ebay_create_offer',
  'ebay_update_offer',
  'ebay_delete_offer',
  'ebay_publish_offer',
  'ebay_withdraw_offer',
  'ebay_bulk_create_offer',
  'ebay_bulk_publish_offer',
  'ebay_get_listing_fees',
  'ebay_publish_offer_by_inventory_item_group',
  'ebay_withdraw_offer_by_inventory_item_group',
] as const;

const offerFailureCalls = [
  { ebayArguments: {}, toolName: 'ebay_sell_inventory_get_offers' },
  { ebayArguments: { offerId: 'OFFER-1' }, toolName: 'ebay_sell_inventory_get_offer' },
  {
    ebayArguments: {
      'Content-Language': 'en-US',
      sku: 'CAMERA-1',
      marketplaceId: 'EBAY_US',
      format: 'FIXED_PRICE',
    },
    toolName: 'ebay_sell_inventory_create_offer',
  },
  {
    ebayArguments: {
      offerId: 'OFFER-1',
      'Content-Language': 'en-US',
      availableQuantity: 4,
    },
    toolName: 'ebay_sell_inventory_update_offer',
  },
  { ebayArguments: { offerId: 'OFFER-1' }, toolName: 'ebay_sell_inventory_delete_offer' },
  { ebayArguments: { offerId: 'OFFER-1' }, toolName: 'ebay_sell_inventory_publish_offer' },
  { ebayArguments: { offerId: 'OFFER-1' }, toolName: 'ebay_sell_inventory_withdraw_offer' },
  {
    ebayArguments: {
      'Content-Language': 'en-US',
      requests: [{ sku: 'CAMERA-1', marketplaceId: 'EBAY_US', format: 'FIXED_PRICE' }],
    },
    toolName: 'ebay_sell_inventory_bulk_create_offer',
  },
  {
    ebayArguments: { requests: [{ offerId: 'OFFER-1' }] },
    toolName: 'ebay_sell_inventory_bulk_publish_offer',
  },
  {
    ebayArguments: { offers: [{ offerId: 'OFFER-1' }] },
    toolName: 'ebay_sell_inventory_get_listing_fees',
  },
  {
    ebayArguments: { inventoryItemGroupKey: 'GROUP-1', marketplaceId: 'EBAY_US' },
    toolName: 'ebay_sell_inventory_publish_offer_by_inventory_item_group',
  },
  {
    ebayArguments: { inventoryItemGroupKey: 'GROUP-1', marketplaceId: 'EBAY_US' },
    toolName: 'ebay_sell_inventory_withdraw_offer_by_inventory_item_group',
  },
] as const;

const offerFailureScenarios = offerFailureCalls.flatMap((offerCall) =>
  ebayFailures.map((ebayFailure) => ({ ebayFailure, ...offerCall })),
);

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Sell Inventory offer MCP exposure', () => {
  it('exposes all twelve operations once without compatibility names', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);

    for (const offerToolName of offerToolNames) {
      expect(listedToolNames.filter((listedToolName) => listedToolName === offerToolName)).toEqual([
        offerToolName,
      ]);
    }
    for (const legacyOfferToolName of legacyOfferToolNames) {
      expect(listedToolNames).not.toContain(legacyOfferToolName);
    }
    await mcpClient.close();
  });

  it('keeps only the three resource reads in read-only mode', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'sell.inventory');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    vi.stubEnv('EBAY_READ_ONLY', 'true');
    const { sellerSession } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    expect(
      listedTools.tools
        .map((ebayTool) => ebayTool.name)
        .filter((listedToolName) =>
          offerToolNames.some((offerToolName) => offerToolName === listedToolName),
        ),
    ).toEqual([
      'ebay_sell_inventory_get_offers',
      'ebay_sell_inventory_get_offer',
      'ebay_sell_inventory_get_listing_fees',
    ]);
    await mcpClient.close();
  });
});

describe('Sell Inventory offer MCP calls', () => {
  it('returns the unchanged paginated offer collection', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const offerCollection: OfferCollection = {
      total: 1,
      offers: [
        {
          offerId: 'OFFER-1',
          sku: 'CAMERA-1',
          marketplaceId: 'EBAY_US',
          format: 'FIXED_PRICE',
          availableQuantity: 4,
        },
      ],
    };
    const { sellerSession, getCalls } = sellerSessionReturning<OfferCollection>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: offerCollection,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_inventory_get_offers',
      {
        sku: 'CAMERA-1',
        marketplace_id: 'EBAY_US',
        limit: '25',
        offset: '0',
      },
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/inventory/v1/offer',
        searchParameters: {
          sku: 'CAMERA-1',
          marketplace_id: 'EBAY_US',
          limit: '25',
          offset: '0',
        },
      },
    ]);
    expect(toolCompletion).toEqual({
      content: [{ type: 'text', text: JSON.stringify(offerCollection, null, 2) }],
    });
    await mcpClient.close();
  });

  it('returns one unchanged offer from an encoded path', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const offer: Offer = {
      offerId: 'OFFER/1',
      sku: 'CAMERA-1',
      marketplaceId: 'EBAY_US',
      format: 'FIXED_PRICE',
      status: 'UNPUBLISHED',
    };
    const { sellerSession, getCalls } = sellerSessionReturning<Offer>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: offer,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_inventory_get_offer',
      { offerId: 'OFFER/1' },
    );

    expect(getCalls).toEqual([{ endpoint: '/sell/inventory/v1/offer/OFFER%2F1' }]);
    expect(toolCompletion).toEqual({
      content: [{ type: 'text', text: JSON.stringify(offer, null, 2) }],
    });
    await mcpClient.close();
  });

  it('posts a direct create document and preserves the offer identifier response', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const offerWriteCompletion = { offerId: 'OFFER-1' };
    const { sellerSession, postCalls } = sellerSessionReturning<typeof offerWriteCompletion>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: offerWriteCompletion,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_inventory_create_offer',
      {
        'Content-Language': 'en-US',
        sku: 'CAMERA-1',
        marketplaceId: 'EBAY_US',
        format: 'FIXED_PRICE',
        availableQuantity: 4,
      },
    );

    expect(postCalls).toEqual([
      {
        endpoint: '/sell/inventory/v1/offer',
        requestDocument: {
          sku: 'CAMERA-1',
          marketplaceId: 'EBAY_US',
          format: 'FIXED_PRICE',
          availableQuantity: 4,
        },
        requestHeaders: { 'Content-Language': 'en-US' },
      },
    ]);
    expect(toolCompletion).toEqual({
      content: [{ type: 'text', text: JSON.stringify(offerWriteCompletion, null, 2) }],
    });
    await mcpClient.close();
  });
});

describe('Sell Inventory offer MCP failures', () => {
  it.each(offerFailureScenarios)(
    'translates every $ebayFailure.kind failure once for $toolName',
    async ({ ebayArguments, ebayFailure, toolName }) => {
      vi.stubEnv('EBAY_MCP_UI', 'off');
      const { sellerSession } = sellerSessionReturning<unknown>({
        kind: 'ebayRequestFailed',
        ebayFailure,
      });

      const { mcpClient, toolCompletion } = await callEbayTool(
        sellerSession,
        toolName,
        ebayArguments,
      );

      expect(toolCompletion).toMatchObject({
        content: [{ type: 'text', text: JSON.stringify({ ebayFailure }, null, 2) }],
        isError: true,
      });
      await mcpClient.close();
    },
  );
});
