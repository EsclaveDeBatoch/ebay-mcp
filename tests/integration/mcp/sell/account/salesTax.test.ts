import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  SalesTax,
  SalesTaxCollection,
  UpdatedSalesTaxCollection,
} from '@/ebay/sell/account/salesTax.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';

const salesTaxToolNames = [
  'ebay_sell_account_create_or_replace_sales_tax',
  'ebay_sell_account_bulk_create_or_replace_sales_tax',
  'ebay_sell_account_delete_sales_tax',
  'ebay_sell_account_get_sales_tax',
  'ebay_sell_account_get_sales_taxes',
] as const;

const sellAccountToolNames = [
  'ebay_sell_account_get_custom_policies',
  'ebay_sell_account_create_custom_policy',
  'ebay_sell_account_get_custom_policy',
  'ebay_sell_account_update_custom_policy',
  'ebay_sell_account_get_fulfillment_policies',
  'ebay_sell_account_create_fulfillment_policy',
  'ebay_sell_account_get_fulfillment_policy',
  'ebay_sell_account_get_fulfillment_policy_by_name',
  'ebay_sell_account_update_fulfillment_policy',
  'ebay_sell_account_delete_fulfillment_policy',
  'ebay_sell_account_get_payment_policies',
  'ebay_sell_account_create_payment_policy',
  'ebay_sell_account_get_payment_policy',
  'ebay_sell_account_get_payment_policy_by_name',
  'ebay_sell_account_update_payment_policy',
  'ebay_sell_account_delete_payment_policy',
  'ebay_sell_account_get_return_policies',
  'ebay_sell_account_create_return_policy',
  'ebay_sell_account_get_return_policy',
  'ebay_sell_account_get_return_policy_by_name',
  'ebay_sell_account_update_return_policy',
  'ebay_sell_account_delete_return_policy',
  'ebay_sell_account_get_privileges',
  'ebay_sell_account_get_rate_tables',
  'ebay_sell_account_get_subscription',
  'ebay_sell_account_get_kyc',
  'ebay_sell_account_get_advertising_eligibility',
  'ebay_sell_account_get_opted_in_programs',
  'ebay_sell_account_opt_in_to_program',
  'ebay_sell_account_opt_out_of_program',
  ...salesTaxToolNames,
] as const;

const readOnlySellAccountToolNames = [
  'ebay_sell_account_get_custom_policies',
  'ebay_sell_account_get_custom_policy',
  'ebay_sell_account_get_fulfillment_policies',
  'ebay_sell_account_get_fulfillment_policy',
  'ebay_sell_account_get_fulfillment_policy_by_name',
  'ebay_sell_account_get_payment_policies',
  'ebay_sell_account_get_payment_policy',
  'ebay_sell_account_get_payment_policy_by_name',
  'ebay_sell_account_get_return_policies',
  'ebay_sell_account_get_return_policy',
  'ebay_sell_account_get_return_policy_by_name',
  'ebay_sell_account_get_privileges',
  'ebay_sell_account_get_rate_tables',
  'ebay_sell_account_get_subscription',
  'ebay_sell_account_get_kyc',
  'ebay_sell_account_get_advertising_eligibility',
  'ebay_sell_account_get_opted_in_programs',
  'ebay_sell_account_get_sales_tax',
  'ebay_sell_account_get_sales_taxes',
] as const;

const legacySalesTaxToolNames = [
  'ebay_create_or_replace_sales_tax',
  'ebay_bulk_create_or_replace_sales_tax',
  'ebay_delete_sales_tax',
  'ebay_get_sales_tax',
  'ebay_get_sales_taxes',
] as const;

const salesTaxFailureCalls = [
  {
    ebayArguments: {
      countryCode: 'US',
      jurisdictionId: 'VI',
      salesTaxPercentage: '7.75',
    },
    toolName: 'ebay_sell_account_create_or_replace_sales_tax',
  },
  {
    ebayArguments: {
      salesTaxInputList: [
        {
          countryCode: 'CA',
          salesTaxJurisdictionId: 'ON',
          salesTaxPercentage: '13',
        },
      ],
    },
    toolName: 'ebay_sell_account_bulk_create_or_replace_sales_tax',
  },
  {
    ebayArguments: { countryCode: 'US', jurisdictionId: 'VI' },
    toolName: 'ebay_sell_account_delete_sales_tax',
  },
  {
    ebayArguments: { countryCode: 'CA', jurisdictionId: 'ON' },
    toolName: 'ebay_sell_account_get_sales_tax',
  },
  {
    ebayArguments: { country_code: 'CA' },
    toolName: 'ebay_sell_account_get_sales_taxes',
  },
] as const;

const salesTaxFailureScenarios = salesTaxFailureCalls.flatMap((salesTaxCall) =>
  ebayFailures.map((ebayFailure) => ({ ebayFailure, ...salesTaxCall })),
);

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Sell Account sales-tax MCP exposure', () => {
  it('exposes five official operations once without compatibility names', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);

    for (const salesTaxToolName of salesTaxToolNames) {
      expect(
        listedToolNames.filter((listedToolName) => listedToolName === salesTaxToolName),
      ).toEqual([salesTaxToolName]);
    }
    for (const legacySalesTaxToolName of legacySalesTaxToolNames) {
      expect(listedToolNames).not.toContain(legacySalesTaxToolName);
    }
    await mcpClient.close();
  });

  it('owns the exact sell.account resource order', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'sell.account');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    expect(listedTools.tools.map((ebayTool) => ebayTool.name)).toEqual(sellAccountToolNames);
    await mcpClient.close();
  });

  it('keeps only sales-tax reads in read-only mode', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'sell.account');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    vi.stubEnv('EBAY_READ_ONLY', 'true');
    const { sellerSession } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    expect(listedTools.tools.map((ebayTool) => ebayTool.name)).toEqual(
      readOnlySellAccountToolNames,
    );
    await mcpClient.close();
  });
});

describe('Sell Account sales-tax MCP writes', () => {
  it('sends the single-entry replacement and returns empty 204 completion', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, putCalls } = sellerSessionReturning<undefined>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    });
    const salesTaxReplacement = {
      countryCode: 'US',
      jurisdictionId: 'VI',
      salesTaxPercentage: '7.75',
      shippingAndHandlingTaxed: true,
    };

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_account_create_or_replace_sales_tax',
      salesTaxReplacement,
    );

    expect(putCalls).toEqual([
      {
        endpoint: '/sell/account/v1/sales_tax/US/VI',
        requestDocument: {
          salesTaxPercentage: '7.75',
          shippingAndHandlingTaxed: true,
        },
      },
    ]);
    expect(toolCompletion).toEqual({ content: [] });
    await mcpClient.close();
  });

  it('sends and returns the unchanged bulk eBay documents', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const updatedSalesTaxes: UpdatedSalesTaxCollection = {
      updatedSalesTaxEntries: [{ countryCode: 'CA', jurisdictionId: 'ON', statusCode: 200 }],
    };
    const { sellerSession, postCalls } = sellerSessionReturning<UpdatedSalesTaxCollection>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: updatedSalesTaxes,
    });
    const bulkSalesTaxReplacement = {
      salesTaxInputList: [
        {
          countryCode: 'CA',
          salesTaxJurisdictionId: 'ON',
          salesTaxPercentage: '13',
        },
      ],
    };

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_account_bulk_create_or_replace_sales_tax',
      bulkSalesTaxReplacement,
    );

    expect(postCalls).toEqual([
      {
        endpoint: '/sell/account/v1/bulk_create_or_replace_sales_tax',
        requestDocument: bulkSalesTaxReplacement,
      },
    ]);
    expect(toolCompletion).toEqual({
      content: [{ type: 'text', text: JSON.stringify(updatedSalesTaxes, null, 2) }],
    });
    await mcpClient.close();
  });

  it('deletes one exact country and jurisdiction path', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, deleteCalls } = sellerSessionReturning<undefined>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_account_delete_sales_tax',
      { countryCode: 'US', jurisdictionId: 'VI' },
    );

    expect(deleteCalls).toEqual([{ endpoint: '/sell/account/v1/sales_tax/US/VI' }]);
    expect(toolCompletion).toEqual({ content: [] });
    await mcpClient.close();
  });
});

describe('Sell Account sales-tax MCP reads', () => {
  it('returns one unchanged eBay tax entry', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const salesTax: SalesTax = {
      countryCode: 'CA',
      salesTaxJurisdictionId: 'ON',
      salesTaxPercentage: '13',
      shippingAndHandlingTaxed: true,
    };
    const { sellerSession, getCalls } = sellerSessionReturning<SalesTax>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: salesTax,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_account_get_sales_tax',
      { countryCode: 'CA', jurisdictionId: 'ON' },
    );

    expect(getCalls).toEqual([{ endpoint: '/sell/account/v1/sales_tax/CA/ON' }]);
    expect(toolCompletion).toEqual({
      content: [{ type: 'text', text: JSON.stringify(salesTax, null, 2) }],
    });
    await mcpClient.close();
  });

  it('uses country_code and returns the unchanged collection', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const salesTaxCollection: SalesTaxCollection = {
      salesTaxes: [{ countryCode: 'US', salesTaxJurisdictionId: 'VI' }],
    };
    const { sellerSession, getCalls } = sellerSessionReturning<SalesTaxCollection>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: salesTaxCollection,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_account_get_sales_taxes',
      { country_code: 'US' },
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/account/v1/sales_tax',
        searchParameters: { country_code: 'US' },
      },
    ]);
    expect(toolCompletion).toEqual({
      content: [{ type: 'text', text: JSON.stringify(salesTaxCollection, null, 2) }],
    });
    await mcpClient.close();
  });
});

describe('Sell Account sales-tax MCP validation', () => {
  it('rejects the legacy nested single-entry shape before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, putCalls } = sellerSessionReturning<never>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined as never,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_account_create_or_replace_sales_tax',
      {
        countryCode: 'US',
        jurisdictionId: 'VI',
        salesTaxBase: { salesTaxPercentage: '7.75' },
      },
    );

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(putCalls).toEqual([]);
    await mcpClient.close();
  });
});

describe('Sell Account sales-tax MCP failures', () => {
  it.each(salesTaxFailureScenarios)(
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
