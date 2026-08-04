import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Ad, AdPagedCollection } from '@/ebay/sell/marketing/ad.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';

const adToolNames = [
  'ebay_sell_marketing_bulk_create_ads_by_inventory_reference',
  'ebay_sell_marketing_bulk_create_ads_by_listing_id',
  'ebay_sell_marketing_bulk_delete_ads_by_inventory_reference',
  'ebay_sell_marketing_bulk_delete_ads_by_listing_id',
  'ebay_sell_marketing_bulk_update_ads_bid_by_inventory_reference',
  'ebay_sell_marketing_bulk_update_ads_bid_by_listing_id',
  'ebay_sell_marketing_bulk_update_ads_status',
  'ebay_sell_marketing_bulk_update_ads_status_by_listing_id',
  'ebay_sell_marketing_get_ads',
  'ebay_sell_marketing_create_ad_by_listing_id',
  'ebay_sell_marketing_create_ads_by_inventory_reference',
  'ebay_sell_marketing_get_ad',
  'ebay_sell_marketing_delete_ad',
  'ebay_sell_marketing_delete_ads_by_inventory_reference',
  'ebay_sell_marketing_get_ads_by_inventory_reference',
  'ebay_sell_marketing_update_bid',
] as const;

const legacyAdToolNames = [
  'ebay_get_ads',
  'ebay_get_ad',
  'ebay_create_ad_by_listing_id',
  'ebay_create_ads_by_inventory_reference',
  'ebay_delete_ad',
  'ebay_delete_ads_by_inventory_reference',
  'ebay_get_ads_by_inventory_reference',
  'ebay_update_bid',
  'ebay_bulk_create_ads_by_listing_id',
  'ebay_bulk_create_ads_by_inventory_reference',
  'ebay_bulk_delete_ads_by_listing_id',
  'ebay_bulk_delete_ads_by_inventory_reference',
  'ebay_bulk_update_ads_bid_by_listing_id',
  'ebay_bulk_update_ads_bid_by_inventory_reference',
  'ebay_bulk_update_ads_status',
  'ebay_bulk_update_ads_status_by_listing_id',
] as const;

const adFailureCalls = [
  {
    ebayArguments: {
      campaign_id: 'C1',
      requests: [
        {
          inventoryReferenceId: 'SKU-1',
          inventoryReferenceType: 'INVENTORY_ITEM',
          bidPercentage: '5.0',
        },
      ],
    },
    toolName: 'ebay_sell_marketing_bulk_create_ads_by_inventory_reference',
  },
  {
    ebayArguments: {
      campaign_id: 'C1',
      requests: [{ listingId: '1', bidPercentage: '5.0' }],
    },
    toolName: 'ebay_sell_marketing_bulk_create_ads_by_listing_id',
  },
  {
    ebayArguments: {
      campaign_id: 'C1',
      requests: [
        {
          inventoryReferenceId: 'SKU-1',
          inventoryReferenceType: 'INVENTORY_ITEM',
        },
      ],
    },
    toolName: 'ebay_sell_marketing_bulk_delete_ads_by_inventory_reference',
  },
  {
    ebayArguments: {
      campaign_id: 'C1',
      requests: [{ listingId: '1' }],
    },
    toolName: 'ebay_sell_marketing_bulk_delete_ads_by_listing_id',
  },
  {
    ebayArguments: {
      campaign_id: 'C1',
      requests: [
        {
          inventoryReferenceId: 'SKU-1',
          inventoryReferenceType: 'INVENTORY_ITEM',
          bidPercentage: '6.0',
        },
      ],
    },
    toolName: 'ebay_sell_marketing_bulk_update_ads_bid_by_inventory_reference',
  },
  {
    ebayArguments: {
      campaign_id: 'C1',
      requests: [{ listingId: '1', bidPercentage: '6.0' }],
    },
    toolName: 'ebay_sell_marketing_bulk_update_ads_bid_by_listing_id',
  },
  {
    ebayArguments: {
      campaign_id: 'C1',
      requests: [{ adId: 'A1', adStatus: 'PAUSED' }],
    },
    toolName: 'ebay_sell_marketing_bulk_update_ads_status',
  },
  {
    ebayArguments: {
      campaign_id: 'C1',
      requests: [{ listingId: '1', adStatus: 'ACTIVE' }],
    },
    toolName: 'ebay_sell_marketing_bulk_update_ads_status_by_listing_id',
  },
  { ebayArguments: { campaign_id: 'C1' }, toolName: 'ebay_sell_marketing_get_ads' },
  {
    ebayArguments: {
      campaign_id: 'C1',
      listingId: '1',
      bidPercentage: '5.0',
    },
    toolName: 'ebay_sell_marketing_create_ad_by_listing_id',
  },
  {
    ebayArguments: {
      campaign_id: 'C1',
      inventoryReferenceId: 'SKU-1',
      inventoryReferenceType: 'INVENTORY_ITEM',
      bidPercentage: '5.0',
    },
    toolName: 'ebay_sell_marketing_create_ads_by_inventory_reference',
  },
  {
    ebayArguments: { campaign_id: 'C1', ad_id: 'A1' },
    toolName: 'ebay_sell_marketing_get_ad',
  },
  {
    ebayArguments: { campaign_id: 'C1', ad_id: 'A1' },
    toolName: 'ebay_sell_marketing_delete_ad',
  },
  {
    ebayArguments: {
      campaign_id: 'C1',
      inventoryReferenceId: 'SKU-1',
      inventoryReferenceType: 'INVENTORY_ITEM',
    },
    toolName: 'ebay_sell_marketing_delete_ads_by_inventory_reference',
  },
  {
    ebayArguments: {
      campaign_id: 'C1',
      inventory_reference_id: 'SKU-1',
      inventory_reference_type: 'INVENTORY_ITEM',
    },
    toolName: 'ebay_sell_marketing_get_ads_by_inventory_reference',
  },
  {
    ebayArguments: {
      campaign_id: 'C1',
      ad_id: 'A1',
      bidPercentage: '7.5',
    },
    toolName: 'ebay_sell_marketing_update_bid',
  },
] as const;

const adFailureScenarios = adFailureCalls.flatMap((adCall) =>
  ebayFailures.map((ebayFailure) => ({ ebayFailure, ...adCall })),
);

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Sell Marketing ad MCP exposure', () => {
  it('exposes all sixteen operations once without compatibility names', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);

    for (const adToolName of adToolNames) {
      expect(listedToolNames.filter((listedToolName) => listedToolName === adToolName)).toEqual([
        adToolName,
      ]);
    }
    for (const legacyAdToolName of legacyAdToolNames) {
      expect(listedToolNames).not.toContain(legacyAdToolName);
    }
    await mcpClient.close();
  });

  it('keeps only the three resource reads in read-only mode', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'sell.marketing');
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
          adToolNames.some((adToolName) => adToolName === listedToolName),
        ),
    ).toEqual([
      'ebay_sell_marketing_get_ads',
      'ebay_sell_marketing_get_ad',
      'ebay_sell_marketing_get_ads_by_inventory_reference',
    ]);
    await mcpClient.close();
  });
});

describe('Sell Marketing ad MCP calls', () => {
  it('returns the unchanged paginated ad collection', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const adCollection: AdPagedCollection = {
      total: 1,
      ads: [
        {
          adId: 'A1',
          listingId: '1',
          adStatus: 'ACTIVE',
          bidPercentage: '5.0',
        },
      ],
    };
    const { sellerSession, getCalls } = sellerSessionReturning<AdPagedCollection>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: adCollection,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_get_ads',
      {
        campaign_id: 'C1',
        ad_status: 'ACTIVE',
        limit: '25',
        offset: '0',
      },
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/ad_campaign/C1/ad',
        searchParameters: {
          ad_status: 'ACTIVE',
          limit: '25',
          offset: '0',
        },
      },
    ]);
    expect(toolCompletion).toEqual({
      content: [{ type: 'text', text: JSON.stringify(adCollection, null, 2) }],
    });
    await mcpClient.close();
  });

  it('returns one unchanged ad from an encoded path', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const ad: Ad = {
      adId: 'A/1',
      listingId: '1',
      adStatus: 'ACTIVE',
      bidPercentage: '5.0',
    };
    const { sellerSession, getCalls } = sellerSessionReturning<Ad>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: ad,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_get_ad',
      { campaign_id: 'C/1', ad_id: 'A/1' },
    );

    expect(getCalls).toEqual([{ endpoint: '/sell/marketing/v1/ad_campaign/C%2F1/ad/A%2F1' }]);
    expect(toolCompletion).toEqual({
      content: [{ type: 'text', text: JSON.stringify(ad, null, 2) }],
    });
    await mcpClient.close();
  });

  it('posts a direct create document without request wrappers', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, postCalls } = sellerSessionReturning<undefined>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_create_ad_by_listing_id',
      {
        campaign_id: 'C1',
        listingId: '1',
        bidPercentage: '5.0',
      },
    );

    expect(postCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/ad_campaign/C1/ad',
        requestDocument: {
          listingId: '1',
          bidPercentage: '5.0',
        },
      },
    ]);
    expect(toolCompletion).toEqual({
      content: [],
    });
    await mcpClient.close();
  });
});

describe('Sell Marketing ad MCP failures', () => {
  it.each(adFailureScenarios)(
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
