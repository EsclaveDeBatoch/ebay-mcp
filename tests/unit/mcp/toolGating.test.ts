import { describe, expect, it, vi } from 'vitest';
import type { RegisteredTool } from '@modelcontextprotocol/sdk/server/mcp.js';
import { EBAY_TOOL_EXPOSURE_PATHS } from '@/config/toolExposure.js';
import {
  createToolGatingController,
  registerMetaTools,
  toolNamesInExposurePaths,
} from '@/mcp/toolGating.js';
import { toolCategories } from '@/tools/categories/index.js';
import { ebayToolCatalogue } from '@/mcp/ebayToolCatalogue.js';

/** Minimal RegisteredTool stand-in exposing just the enabled flag the controller toggles. */
function fakeHandle(enabled = false): RegisteredTool {
  const handle = {
    enabled,
    enable() {
      handle.enabled = true;
    },
    disable() {
      handle.enabled = false;
    },
    update: vi.fn(),
    remove: vi.fn(),
  };
  return handle as unknown as RegisteredTool;
}

/** Builds a handle map for every registered tool, as dynamic mode does (all disabled). */
function fakeToolHandles(): Map<string, RegisteredTool> {
  const handles = new Map<string, RegisteredTool>();
  for (const category of toolCategories) {
    for (const entry of category.entries) {
      handles.set(entry.definition.name, fakeHandle(false));
    }
  }
  for (const ebayTool of ebayToolCatalogue) {
    handles.set(ebayTool.name, fakeHandle(false));
  }
  return handles;
}

const sellInventoryToolNames = ebayToolCatalogue
  .filter((ebayTool) => ebayTool.namespace === 'sell.inventory')
  .map((ebayTool) => ebayTool.name);
const sampleTool = sellInventoryToolNames[0];

describe('toolNamesInExposurePaths', () => {
  it('returns exactly the tools of the named families', () => {
    const names = toolNamesInExposurePaths(['sell.inventory']);
    expect(names.size).toBe(sellInventoryToolNames.length);
    expect(names.has(sampleTool)).toBe(true);
  });

  it('returns ChatGPT connector search and fetch under the connector path', () => {
    const names = toolNamesInExposurePaths(['connector']);
    expect([...names].sort()).toEqual(['fetch', 'search']);
  });

  it('returns the complete migrated Sell Analytics namespace under its official path', () => {
    const names = toolNamesInExposurePaths(['sell.analytics']);
    expect([...names]).toEqual([
      'ebay_sell_analytics_get_traffic_report',
      'ebay_sell_analytics_find_seller_standards_profiles',
      'ebay_sell_analytics_get_seller_standards_profile',
      'ebay_sell_analytics_get_customer_service_metric',
    ]);
  });

  it('returns the complete migrated Sell eDelivery namespace under its official path', () => {
    const edeliveryToolNames = toolNamesInExposurePaths(['sell.edelivery']);
    expect([...edeliveryToolNames]).toEqual([
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
    ]);
  });

  it('returns the complete Sell Metadata namespace under its official path', () => {
    const metadataToolNames = toolNamesInExposurePaths(['sell.metadata']);
    expect([...metadataToolNames]).toEqual([
      'ebay_sell_metadata_get_automotive_parts_compatibility_policies',
      'ebay_sell_metadata_get_category_policies',
      'ebay_sell_metadata_get_classified_ad_policies',
      'ebay_sell_metadata_get_currencies',
      'ebay_sell_metadata_get_extended_producer_responsibility_policies',
      'ebay_sell_metadata_get_hazardous_materials_labels',
      'ebay_sell_metadata_get_item_condition_policies',
      'ebay_sell_metadata_get_listing_structure_policies',
      'ebay_sell_metadata_get_listing_type_policies',
      'ebay_sell_metadata_get_motors_listing_policies',
      'ebay_sell_metadata_get_negotiated_price_policies',
      'ebay_sell_metadata_get_product_safety_labels',
      'ebay_sell_metadata_get_regulatory_policies',
      'ebay_sell_metadata_get_return_policies',
      'ebay_sell_metadata_get_shipping_policies',
      'ebay_sell_metadata_get_site_visibility_policies',
      'ebay_sell_metadata_get_compatibilities_by_specification',
      'ebay_sell_metadata_get_compatibility_property_names',
      'ebay_sell_metadata_get_compatibility_property_values',
      'ebay_sell_metadata_get_multi_compatibility_property_values',
      'ebay_sell_metadata_get_product_compatibilities',
      'ebay_sell_metadata_get_sales_tax_jurisdictions',
    ]);
  });

  it('returns the complete Trading listing namespace under its official path', () => {
    const tradingToolNames = toolNamesInExposurePaths(['trading']);
    expect([...tradingToolNames]).toEqual([
      'ebay_trading_get_active_listings',
      'ebay_trading_get_listing',
      'ebay_trading_create_listing',
      'ebay_trading_revise_listing',
      'ebay_trading_end_listing',
      'ebay_trading_relist_listing',
    ]);
  });

  it('returns the complete Developer Analytics namespace under its official path', () => {
    const developerAnalyticsToolNames = toolNamesInExposurePaths(['developer.analytics']);
    expect([...developerAnalyticsToolNames]).toEqual([
      'ebay_developer_analytics_get_rate_limits',
      'ebay_developer_analytics_get_user_rate_limits',
    ]);
  });

  it('returns the complete Developer Key Management namespace under its official path', () => {
    const signingKeyToolNames = toolNamesInExposurePaths(['developer.key-management']);
    expect([...signingKeyToolNames]).toEqual([
      'ebay_developer_key_management_get_signing_keys',
      'ebay_developer_key_management_create_signing_key',
      'ebay_developer_key_management_get_signing_key',
    ]);
  });

  it('returns the public Developer Status resource under its explicit path', () => {
    const developerStatusToolNames = toolNamesInExposurePaths(['developer.status']);
    expect([...developerStatusToolNames]).toEqual(['ebay_developer_status_get_incidents']);
  });

  it('returns the complete migrated Commerce Translation namespace under its official path', () => {
    const names = toolNamesInExposurePaths(['commerce.translation']);
    expect([...names]).toEqual(['ebay_commerce_translation_translate']);
  });

  it('returns the complete migrated Commerce VeRO namespace under its official path', () => {
    const veroToolNames = toolNamesInExposurePaths(['commerce.vero']);
    expect([...veroToolNames]).toEqual([
      'ebay_commerce_vero_create_report',
      'ebay_commerce_vero_get_report',
      'ebay_commerce_vero_get_report_items',
      'ebay_commerce_vero_get_reason_code',
      'ebay_commerce_vero_get_reason_codes',
    ]);
  });

  it('returns the complete migrated Commerce Identity namespace under its official path', () => {
    const names = toolNamesInExposurePaths(['commerce.identity']);
    expect([...names]).toEqual(['ebay_commerce_identity_get_user']);
  });

  it('returns the complete migrated Commerce Taxonomy namespace under its official path', () => {
    const names = toolNamesInExposurePaths(['commerce.taxonomy']);
    expect([...names]).toEqual([
      'ebay_commerce_taxonomy_get_default_category_tree_id',
      'ebay_commerce_taxonomy_get_category_tree',
      'ebay_commerce_taxonomy_get_category_suggestions',
      'ebay_commerce_taxonomy_get_item_aspects_for_category',
    ]);
  });

  it('returns the migrated Commerce Message resources under their official path', () => {
    const names = toolNamesInExposurePaths(['commerce.message']);
    expect([...names]).toEqual([
      'ebay_commerce_message_bulk_update_conversation',
      'ebay_commerce_message_get_conversations',
      'ebay_commerce_message_get_conversation',
      'ebay_commerce_message_send_message',
      'ebay_commerce_message_update_conversation',
    ]);
  });

  it('returns the migrated Commerce Notification resources under their official path', () => {
    const names = toolNamesInExposurePaths(['commerce.notification']);
    expect([...names]).toEqual([
      'ebay_commerce_notification_get_config',
      'ebay_commerce_notification_update_config',
      'ebay_commerce_notification_get_destinations',
      'ebay_commerce_notification_create_destination',
      'ebay_commerce_notification_get_destination',
      'ebay_commerce_notification_update_destination',
      'ebay_commerce_notification_delete_destination',
      'ebay_commerce_notification_get_public_key',
      'ebay_commerce_notification_get_subscriptions',
      'ebay_commerce_notification_create_subscription',
      'ebay_commerce_notification_get_subscription',
      'ebay_commerce_notification_update_subscription',
      'ebay_commerce_notification_delete_subscription',
      'ebay_commerce_notification_disable_subscription',
      'ebay_commerce_notification_enable_subscription',
      'ebay_commerce_notification_test_subscription',
      'ebay_commerce_notification_create_subscription_filter',
      'ebay_commerce_notification_get_subscription_filter',
      'ebay_commerce_notification_delete_subscription_filter',
      'ebay_commerce_notification_get_topics',
      'ebay_commerce_notification_get_topic',
    ]);
  });

  it('returns the migrated Commerce Feedback resource under its official path', () => {
    const names = toolNamesInExposurePaths(['commerce.feedback']);
    expect([...names]).toEqual([
      'ebay_commerce_feedback_get_items_awaiting_feedback',
      'ebay_commerce_feedback_get_feedback',
      'ebay_commerce_feedback_leave_feedback',
      'ebay_commerce_feedback_get_feedback_rating_summary',
      'ebay_commerce_feedback_respond_to_feedback',
    ]);
  });

  it('returns the complete migrated Sell Recommendation namespace under its official path', () => {
    const names = toolNamesInExposurePaths(['sell.recommendation']);
    expect([...names]).toEqual(['ebay_sell_recommendation_find_listing_recommendations']);
  });

  it('returns the complete migrated Sell Negotiation namespace under its official path', () => {
    const names = toolNamesInExposurePaths(['sell.negotiation']);
    expect([...names]).toEqual([
      'ebay_sell_negotiation_find_eligible_items',
      'ebay_sell_negotiation_send_offer_to_interested_buyers',
    ]);
  });

  it('ignores unknown families', () => {
    expect(toolNamesInExposurePaths(['nope']).size).toBe(0);
  });
});

describe('ToolGatingController', () => {
  describe('list', () => {
    it('returns the family overview with no arguments', () => {
      const controller = createToolGatingController(fakeToolHandles());
      const result = controller.list({}) as {
        families: { key: string; count: number }[];
      };
      expect(result.families).toHaveLength(EBAY_TOOL_EXPOSURE_PATHS.length);
      const sellInventoryRow = result.families.find((row) => row.key === 'sell.inventory');
      expect(sellInventoryRow?.count).toBe(sellInventoryToolNames.length);
    });

    it('lists the tools of a family', () => {
      const controller = createToolGatingController(fakeToolHandles());
      const result = controller.list({ family: 'sell.inventory' }) as {
        tools: { name: string; family: string }[];
        total: number;
      };
      expect(result.total).toBe(sellInventoryToolNames.length);
      expect(result.tools.every((tool) => tool.family === 'sell.inventory')).toBe(true);
    });

    it('rejects an unknown family with the valid list', () => {
      const controller = createToolGatingController(fakeToolHandles());
      const result = controller.list({ family: 'nope' }) as {
        error: string;
        validFamilies: readonly string[];
      };
      expect(result.error).toContain('nope');
      expect(result.validFamilies).toContain('sell.inventory');
    });

    it('keyword-searches across all tools by name', () => {
      const controller = createToolGatingController(fakeToolHandles());
      const result = controller.list({ query: sampleTool.toLowerCase() }) as {
        tools: { name: string }[];
      };
      expect(result.tools.some((tool) => tool.name === sampleTool)).toBe(true);
    });

    it('paginates with an opaque cursor', () => {
      const controller = createToolGatingController(fakeToolHandles());
      const first = controller.list({ family: 'sell.inventory', limit: 2 }) as {
        tools: { name: string }[];
        nextCursor?: string;
      };
      expect(first.tools).toHaveLength(2);
      expect(first.nextCursor).toBeDefined();

      const second = controller.list({
        family: 'sell.inventory',
        limit: 2,
        cursor: first.nextCursor,
      }) as {
        tools: { name: string }[];
      };
      expect(second.tools[0].name).not.toBe(first.tools[0].name);
    });
  });

  describe('enable / disable', () => {
    it('enables a known tool and reports the active count', () => {
      const handles = fakeToolHandles();
      const controller = createToolGatingController(handles);
      const result = controller.enable([sampleTool]);
      expect(result.enabled).toEqual([sampleTool]);
      expect(result.unknown).toEqual([]);
      expect(result.activeCount).toBe(1);
      expect(handles.get(sampleTool)?.enabled).toBe(true);
    });

    it('soft-fails unknown names instead of throwing', () => {
      const controller = createToolGatingController(fakeToolHandles());
      const result = controller.enable([sampleTool, 'made-up-tool']);
      expect(result.enabled).toEqual([sampleTool]);
      expect(result.unknown).toEqual(['made-up-tool']);
    });

    it('disables a previously enabled tool', () => {
      const handles = fakeToolHandles();
      const controller = createToolGatingController(handles);
      controller.enable([sampleTool]);
      const result = controller.disable([sampleTool]);
      expect(result.disabled).toEqual([sampleTool]);
      expect(result.activeCount).toBe(0);
      expect(handles.get(sampleTool)?.enabled).toBe(false);
    });
  });
});

describe('registerMetaTools', () => {
  it('registers exactly the three discovery tools', () => {
    const registerTool = vi.fn<(name: string, config: unknown, handler: unknown) => void>();
    const server = { registerTool } as never;
    registerMetaTools(server, createToolGatingController(fakeToolHandles()));

    const names = registerTool.mock.calls.map((call) => call[0]);
    expect(names).toEqual(['list_ebay_tools', 'enable_ebay_tools', 'disable_ebay_tools']);
  });

  it('wires each meta-tool handler to the controller', () => {
    const registerTool = vi.fn<(name: string, config: unknown, handler: unknown) => void>();
    const server = { registerTool } as never;
    const handles = fakeToolHandles();
    registerMetaTools(server, createToolGatingController(handles));

    const enableCall = registerTool.mock.calls.find((call) => call[0] === 'enable_ebay_tools')!;
    const handler = enableCall[2] as (args: { names: string[] }) => { content: { text: string }[] };
    const result = handler({ names: [sampleTool] });
    expect(handles.get(sampleTool)?.enabled).toBe(true);
    expect(result.content[0].text).toContain(sampleTool);
  });
});
