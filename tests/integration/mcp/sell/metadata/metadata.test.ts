import { afterEach, describe, expect, it, vi } from 'vitest';

import type { CategoryPolicies } from '@/ebay/sell/metadata/marketplace.js';
import type { CompatibilityPropertyValues } from '@/ebay/sell/metadata/compatibility.js';
import type { SalesTaxJurisdictions } from '@/ebay/sell/metadata/salesTaxJurisdiction.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';

const metadataToolNames = [
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
] as const;

const legacyMetadataToolNames = [
  'ebay_get_automotive_parts_compatibility_policies',
  'ebay_get_category_policies',
  'ebay_get_classified_ad_policies',
  'ebay_get_currencies',
  'ebay_get_extended_producer_responsibility_policies',
  'ebay_get_hazardous_materials_labels',
  'ebay_get_item_condition_policies',
  'ebay_get_listing_structure_policies',
  'ebay_get_listing_type_policies',
  'ebay_get_motors_listing_policies',
  'ebay_get_negotiated_price_policies',
  'ebay_get_product_safety_labels',
  'ebay_get_regulatory_policies',
  'ebay_get_return_policy_metadata',
  'ebay_get_shipping_policies',
  'ebay_get_site_visibility_policies',
  'ebay_get_compatibilities_by_specification',
  'ebay_get_compatibility_property_names',
  'ebay_get_compatibility_property_values',
  'ebay_get_multi_compatibility_property_values',
  'ebay_get_product_compatibilities',
  'ebay_get_sales_tax_jurisdictions',
] as const;

const metadataFailureCalls = [
  ...metadataToolNames.slice(0, 16).map((toolName) => ({
    ebayArguments: { marketplace_id: 'EBAY_US' },
    toolName,
  })),
  {
    ebayArguments: {
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
      categoryId: '6016',
      specifications: [{ propertyName: 'Year', propertyValue: '2024' }],
    },
    toolName: 'ebay_sell_metadata_get_compatibilities_by_specification',
  },
  {
    ebayArguments: { 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US', categoryId: '6016' },
    toolName: 'ebay_sell_metadata_get_compatibility_property_names',
  },
  {
    ebayArguments: {
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
      categoryId: '6016',
      propertyName: 'Make',
    },
    toolName: 'ebay_sell_metadata_get_compatibility_property_values',
  },
  {
    ebayArguments: {
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
      categoryId: '6016',
      propertyFilters: [{ propertyName: 'Year', propertyValue: '2024' }],
      propertyNames: ['Make'],
    },
    toolName: 'ebay_sell_metadata_get_multi_compatibility_property_values',
  },
  {
    ebayArguments: {
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
      productIdentifier: { epid: '12345' },
    },
    toolName: 'ebay_sell_metadata_get_product_compatibilities',
  },
  {
    ebayArguments: { countryCode: 'US' },
    toolName: 'ebay_sell_metadata_get_sales_tax_jurisdictions',
  },
] as const;

const metadataFailureScenarios = metadataFailureCalls.flatMap((metadataCall) =>
  ebayFailures.map((ebayFailure) => ({ ebayFailure, ...metadataCall })),
);

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Sell Metadata MCP exposure', () => {
  it('exposes the 22 official names once without flat compatibility names', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<CategoryPolicies>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: { categoryPolicies: [] },
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);

    for (const metadataToolName of metadataToolNames) {
      expect(
        listedToolNames.filter((listedToolName) => listedToolName === metadataToolName),
      ).toEqual([metadataToolName]);
    }
    for (const legacyMetadataToolName of legacyMetadataToolNames) {
      expect(listedToolNames).not.toContain(legacyMetadataToolName);
    }
    await mcpClient.close();
  });

  it('exposes only read-only Metadata tools through sell.metadata', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'sell.metadata');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<CategoryPolicies>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: { categoryPolicies: [] },
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    expect(listedTools.tools.map((ebayTool) => ebayTool.name)).toEqual(metadataToolNames);
    for (const metadataTool of listedTools.tools) {
      expect(metadataTool.annotations?.readOnlyHint).toBe(true);
    }
    await mcpClient.close();
  });
});

describe('Sell Metadata MCP calls', () => {
  it('passes exact marketplace path and filter fields and returns the eBay document unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const categoryPolicies: CategoryPolicies = {
      categoryPolicies: [{ categoryId: '9355', autoPayEnabled: true }],
    };
    const { sellerSession, getCalls } = sellerSessionReturning<CategoryPolicies>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: categoryPolicies,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_metadata_get_category_policies',
      { marketplace_id: 'EBAY_US', filter: 'categoryIds:{9355}' },
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/metadata/v1/marketplace/EBAY_US/get_category_policies',
        searchParameters: { filter: 'categoryIds:{9355}' },
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(categoryPolicies, null, 2) }],
    });
    await mcpClient.close();
  });

  it('sends direct compatibility fields beneath the exact marketplace header', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const compatibilityPropertyValues: CompatibilityPropertyValues = {
      metadataVersion: '2026.08',
      propertyName: 'Make',
      propertyValues: ['Honda'],
    };
    const { sellerSession, postCalls } = sellerSessionReturning<CompatibilityPropertyValues>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: compatibilityPropertyValues,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_metadata_get_compatibility_property_values',
      {
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
        categoryId: '6016',
        propertyName: 'Make',
        sortOrder: 'Ascending',
      },
    );

    expect(postCalls).toEqual([
      {
        endpoint: '/sell/metadata/v1/compatibilities/get_compatibility_property_values',
        requestDocument: {
          categoryId: '6016',
          propertyName: 'Make',
          sortOrder: 'Ascending',
        },
        requestHeaders: { 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US' },
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(compatibilityPropertyValues, null, 2) }],
    });
    await mcpClient.close();
  });

  it('uses the exact country path and returns tax jurisdictions unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const salesTaxJurisdictions: SalesTaxJurisdictions = {
      salesTaxJurisdictions: [{ salesTaxJurisdictionId: 'CA' }],
    };
    const { sellerSession, getCalls } = sellerSessionReturning<SalesTaxJurisdictions>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: salesTaxJurisdictions,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_metadata_get_sales_tax_jurisdictions',
      { countryCode: 'US' },
    );

    expect(getCalls).toEqual([{ endpoint: '/sell/metadata/v1/country/US/sales_tax_jurisdiction' }]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(salesTaxJurisdictions, null, 2) }],
    });
    await mcpClient.close();
  });
});

describe('Sell Metadata MCP validation', () => {
  it('rejects renamed marketplace fields before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls } = sellerSessionReturning<CategoryPolicies>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: { categoryPolicies: [] },
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_metadata_get_category_policies',
      { marketplaceId: 'EBAY_US' },
    );

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(getCalls).toEqual([]);
    await mcpClient.close();
  });

  it('rejects nested compatibility fields before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, postCalls } = sellerSessionReturning<CompatibilityPropertyValues>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: { propertyValues: [] },
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_metadata_get_compatibility_property_values',
      {
        compatibilityFields: { categoryId: '6016', propertyName: 'Make' },
        marketplaceId: 'EBAY_US',
      },
    );

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(postCalls).toEqual([]);
    await mcpClient.close();
  });
});

describe('Sell Metadata MCP failures', () => {
  it.each(metadataFailureScenarios)(
    'translates every $ebayFailure.kind failure once for $toolName',
    async ({ ebayArguments, ebayFailure, toolName }) => {
      vi.stubEnv('EBAY_MCP_UI', 'off');
      const { sellerSession } = sellerSessionReturning<never>({
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
