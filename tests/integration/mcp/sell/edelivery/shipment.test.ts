import { afterEach, describe, expect, it, vi } from 'vitest';

import { sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';

const edeliveryToolNames = [
  'ebay_sell_edelivery_get_actual_costs',
  'ebay_sell_edelivery_get_address_preferences',
  'ebay_sell_edelivery_create_address_preference',
  'ebay_sell_edelivery_get_consign_preferences',
  'ebay_sell_edelivery_create_consign_preference',
  'ebay_sell_edelivery_get_agents',
  'ebay_sell_edelivery_get_battery_qualifications',
  'ebay_sell_edelivery_get_dropoff_sites',
  'ebay_sell_edelivery_get_services',
  'ebay_sell_edelivery_create_bundle',
  'ebay_sell_edelivery_get_bundle',
  'ebay_sell_edelivery_cancel_bundle',
  'ebay_sell_edelivery_get_bundle_label',
  'ebay_sell_edelivery_create_package',
  'ebay_sell_edelivery_get_package',
  'ebay_sell_edelivery_delete_package',
  'ebay_sell_edelivery_get_packages_by_line_item_id',
  'ebay_sell_edelivery_cancel_package',
  'ebay_sell_edelivery_clone_package',
  'ebay_sell_edelivery_confirm_package',
  'ebay_sell_edelivery_bulk_cancel_packages',
  'ebay_sell_edelivery_bulk_confirm_packages',
  'ebay_sell_edelivery_bulk_delete_packages',
  'ebay_sell_edelivery_get_labels',
  'ebay_sell_edelivery_get_handover_sheet',
  'ebay_sell_edelivery_get_tracking',
  'ebay_sell_edelivery_create_complaint',
] as const;

const readOnlyEdeliveryToolNames = [
  'ebay_sell_edelivery_get_actual_costs',
  'ebay_sell_edelivery_get_address_preferences',
  'ebay_sell_edelivery_get_consign_preferences',
  'ebay_sell_edelivery_get_agents',
  'ebay_sell_edelivery_get_battery_qualifications',
  'ebay_sell_edelivery_get_dropoff_sites',
  'ebay_sell_edelivery_get_services',
  'ebay_sell_edelivery_get_bundle',
  'ebay_sell_edelivery_get_bundle_label',
  'ebay_sell_edelivery_get_package',
  'ebay_sell_edelivery_get_packages_by_line_item_id',
  'ebay_sell_edelivery_get_labels',
  'ebay_sell_edelivery_get_handover_sheet',
  'ebay_sell_edelivery_get_tracking',
] as const;

const flatEdeliveryToolNames = [
  'ebay_get_actual_costs',
  'ebay_get_address_preferences',
  'ebay_create_address_preference',
  'ebay_get_consign_preferences',
  'ebay_create_consign_preference',
  'ebay_get_agents',
  'ebay_get_battery_qualifications',
  'ebay_get_dropoff_sites',
  'ebay_get_services',
  'ebay_create_bundle',
  'ebay_get_bundle',
  'ebay_cancel_bundle',
  'ebay_get_bundle_label',
  'ebay_create_package',
  'ebay_get_package',
  'ebay_delete_package',
  'ebay_get_packages_by_line_item_id',
  'ebay_cancel_package',
  'ebay_clone_package',
  'ebay_confirm_package',
  'ebay_bulk_cancel_packages',
  'ebay_bulk_confirm_packages',
  'ebay_bulk_delete_packages',
  'ebay_get_labels',
  'ebay_get_handover_sheet',
  'ebay_get_tracking',
  'ebay_create_complaint',
] as const;

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Sell eDelivery MCP exposure', () => {
  it('exposes hierarchical names once without flat compatibility names', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);

    for (const edeliveryToolName of edeliveryToolNames) {
      expect(
        listedToolNames.filter((listedToolName) => listedToolName === edeliveryToolName),
      ).toEqual([edeliveryToolName]);
    }
    for (const flatEdeliveryToolName of flatEdeliveryToolNames) {
      expect(listedToolNames).not.toContain(flatEdeliveryToolName);
    }

    await mcpClient.close();
  });

  it('exposes only eDelivery through sell.edelivery', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'sell.edelivery');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    expect(listedTools.tools.map((ebayTool) => ebayTool.name)).toEqual(edeliveryToolNames);
    await mcpClient.close();
  });

  it('keeps only retrieval operations in read-only mode', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'sell.edelivery');
    vi.stubEnv('EBAY_READ_ONLY', 'true');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    expect(listedTools.tools.map((ebayTool) => ebayTool.name)).toEqual(readOnlyEdeliveryToolNames);
    await mcpClient.close();
  });
});

describe('Sell eDelivery package MCP calls', () => {
  it('posts the direct generated package document', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const packageDocument = {
      packageInfo: {
        consignPreferenceId: 'CONSIGN123',
        items: [{ orderLineItem: 'ORDER-LINE-123', postedQuantity: 1 }],
        shippingServiceId: 'SERVICE123',
      },
    };
    const { sellerSession, postCalls } = sellerSessionReturning({
      kind: 'ebayRequestSucceeded',
      ebayDocument: { packageId: 'PACKAGE123' },
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_edelivery_create_package',
      packageDocument,
    );

    expect(toolCompletion.isError).not.toBe(true);
    expect(postCalls).toEqual([
      {
        endpoint: '/sell/edelivery_international_shipping/v1/package',
        requestDocument: packageDocument,
      },
    ]);
    await mcpClient.close();
  });

  it('rejects the removed body wrapper before calling eBay', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, postCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_edelivery_create_package',
      {
        body: {
          packageInfo: {
            consignPreferenceId: 'CONSIGN123',
            shippingServiceId: 'SERVICE123',
          },
        },
      },
    );

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(postCalls).toEqual([]);
    await mcpClient.close();
  });
});

describe('Sell eDelivery actual-cost MCP calls', () => {
  it('forwards exact actual-cost wire fields', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const costSearch = {
      trans_begin_time: '2026-07-01T00:00:00.000Z',
      trans_end_time: '2026-07-31T23:59:59.999Z',
    };
    const { sellerSession, getCalls } = sellerSessionReturning({
      kind: 'ebayRequestSucceeded',
      ebayDocument: { actualCosts: [] },
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_edelivery_get_actual_costs',
      costSearch,
    );

    expect(toolCompletion.isError).not.toBe(true);
    expect(getCalls).toEqual([
      {
        endpoint: '/sell/edelivery_international_shipping/v1/actual_costs',
        searchParameters: costSearch,
      },
    ]);
    await mcpClient.close();
  });
});
