import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  FulfillmentPolicy,
  FulfillmentPolicyCollection,
  SetFulfillmentPolicy,
} from '@/ebay/sell/account/fulfillmentPolicy.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';

const fulfillmentPolicyToolNames = [
  'ebay_sell_account_get_fulfillment_policies',
  'ebay_sell_account_create_fulfillment_policy',
  'ebay_sell_account_get_fulfillment_policy',
  'ebay_sell_account_get_fulfillment_policy_by_name',
  'ebay_sell_account_update_fulfillment_policy',
  'ebay_sell_account_delete_fulfillment_policy',
] as const;

const readOnlyFulfillmentPolicyToolNames = [
  'ebay_sell_account_get_fulfillment_policies',
  'ebay_sell_account_get_fulfillment_policy',
  'ebay_sell_account_get_fulfillment_policy_by_name',
] as const;

const writeFulfillmentPolicyToolNames = [
  'ebay_sell_account_create_fulfillment_policy',
  'ebay_sell_account_update_fulfillment_policy',
  'ebay_sell_account_delete_fulfillment_policy',
] as const;

const legacyFulfillmentPolicyToolNames = [
  'ebay_get_fulfillment_policies',
  'ebay_create_fulfillment_policy',
  'ebay_get_fulfillment_policy',
  'ebay_get_fulfillment_policy_by_name',
  'ebay_update_fulfillment_policy',
  'ebay_delete_fulfillment_policy',
] as const;

const fulfillmentPolicyCreation = {
  description: 'Standard domestic delivery',
  handlingTime: { unit: 'DAY' as const, value: 1 },
  marketplaceId: 'EBAY_US',
  name: 'Standard shipping',
  shippingOptions: [
    {
      costType: 'FLAT_RATE' as const,
      optionType: 'DOMESTIC' as const,
      shippingServices: [
        {
          shippingCost: { currency: 'USD', value: '5.00' },
          shippingServiceCode: 'USPSPriority',
        },
      ],
    },
  ],
};

const fulfillmentPolicyFailureCalls = [
  {
    ebayArguments: { marketplace_id: 'EBAY_US' },
    toolName: 'ebay_sell_account_get_fulfillment_policies',
  },
  {
    ebayArguments: fulfillmentPolicyCreation,
    toolName: 'ebay_sell_account_create_fulfillment_policy',
  },
  {
    ebayArguments: { fulfillmentPolicyId: 'FULFILLMENT-1' },
    toolName: 'ebay_sell_account_get_fulfillment_policy',
  },
  {
    ebayArguments: { marketplace_id: 'EBAY_US', name: 'Standard shipping' },
    toolName: 'ebay_sell_account_get_fulfillment_policy_by_name',
  },
  {
    ebayArguments: {
      fulfillmentPolicyId: 'FULFILLMENT-1',
      ...fulfillmentPolicyCreation,
      name: 'Updated standard shipping',
    },
    toolName: 'ebay_sell_account_update_fulfillment_policy',
  },
  {
    ebayArguments: { fulfillmentPolicyId: 'FULFILLMENT-1' },
    toolName: 'ebay_sell_account_delete_fulfillment_policy',
  },
] as const;

const fulfillmentPolicyFailureScenarios = fulfillmentPolicyFailureCalls.flatMap(
  (fulfillmentPolicyCall) =>
    ebayFailures.map((ebayFailure) => ({ ebayFailure, ...fulfillmentPolicyCall })),
);

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Sell Account fulfillment-policy MCP exposure', () => {
  it('exposes six official operations once without compatibility names', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<FulfillmentPolicyCollection>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: { fulfillmentPolicies: [] },
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);

    for (const fulfillmentPolicyToolName of fulfillmentPolicyToolNames) {
      expect(
        listedToolNames.filter((listedToolName) => listedToolName === fulfillmentPolicyToolName),
      ).toEqual([fulfillmentPolicyToolName]);
    }
    for (const legacyFulfillmentPolicyToolName of legacyFulfillmentPolicyToolNames) {
      expect(listedToolNames).not.toContain(legacyFulfillmentPolicyToolName);
    }
    await mcpClient.close();
  });

  it('gates the resource through sell.account', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'sell.account');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<FulfillmentPolicyCollection>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: { fulfillmentPolicies: [] },
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);
    for (const fulfillmentPolicyToolName of fulfillmentPolicyToolNames) {
      expect(listedToolNames).toContain(fulfillmentPolicyToolName);
    }
    await mcpClient.close();
  });

  it('keeps only official reads in read-only mode', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'sell.account');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    vi.stubEnv('EBAY_READ_ONLY', 'true');
    const { sellerSession } = sellerSessionReturning<FulfillmentPolicyCollection>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: { fulfillmentPolicies: [] },
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);
    for (const readOnlyFulfillmentPolicyToolName of readOnlyFulfillmentPolicyToolNames) {
      expect(listedToolNames).toContain(readOnlyFulfillmentPolicyToolName);
    }
    for (const writeFulfillmentPolicyToolName of writeFulfillmentPolicyToolNames) {
      expect(listedToolNames).not.toContain(writeFulfillmentPolicyToolName);
    }
    await mcpClient.close();
  });
});

describe('Sell Account fulfillment-policy MCP calls', () => {
  it('passes marketplace_id and Content-Language and returns the collection unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const policyCollection: FulfillmentPolicyCollection = {
      fulfillmentPolicies: [{ fulfillmentPolicyId: 'FULFILLMENT-1', name: 'Standard shipping' }],
      total: 1,
    };
    const { sellerSession, getCalls } = sellerSessionReturning<FulfillmentPolicyCollection>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: policyCollection,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_account_get_fulfillment_policies',
      { 'Content-Language': 'fr-CA', marketplace_id: 'EBAY_CA' },
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/account/v1/fulfillment_policy',
        requestHeaders: { 'Content-Language': 'fr-CA' },
        searchParameters: { marketplace_id: 'EBAY_CA' },
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(policyCollection, null, 2) }],
    });
    await mcpClient.close();
  });

  it('sends the direct create document and returns eBay creation detail unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const policyCreationDetail: SetFulfillmentPolicy = {
      fulfillmentPolicyId: 'FULFILLMENT-1',
    };
    const { sellerSession, postCalls } = sellerSessionReturning<SetFulfillmentPolicy>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: policyCreationDetail,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_account_create_fulfillment_policy',
      fulfillmentPolicyCreation,
    );

    expect(postCalls).toEqual([
      {
        endpoint: '/sell/account/v1/fulfillment_policy/',
        requestDocument: fulfillmentPolicyCreation,
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(policyCreationDetail, null, 2) }],
    });
    await mcpClient.close();
  });

  it('encodes the policy path and returns one eBay policy unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const fulfillmentPolicy: FulfillmentPolicy = {
      fulfillmentPolicyId: 'FULFILLMENT/1',
      marketplaceId: 'EBAY_US',
      name: 'Standard shipping',
    };
    const { sellerSession, getCalls } = sellerSessionReturning<FulfillmentPolicy>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: fulfillmentPolicy,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_account_get_fulfillment_policy',
      { fulfillmentPolicyId: 'FULFILLMENT/1' },
    );

    expect(getCalls).toEqual([{ endpoint: '/sell/account/v1/fulfillment_policy/FULFILLMENT%2F1' }]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(fulfillmentPolicy, null, 2) }],
    });
    await mcpClient.close();
  });

  it('passes exact policy-name lookup fields and returns one eBay policy unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const fulfillmentPolicy: FulfillmentPolicy = {
      fulfillmentPolicyId: 'FULFILLMENT-1',
      marketplaceId: 'EBAY_BE',
      name: 'Standaardverzending',
    };
    const { sellerSession, getCalls } = sellerSessionReturning<FulfillmentPolicy>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: fulfillmentPolicy,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_account_get_fulfillment_policy_by_name',
      {
        'Content-Language': 'nl-BE',
        marketplace_id: 'EBAY_BE',
        name: 'Standaardverzending',
      },
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/account/v1/fulfillment_policy/get_by_policy_name',
        requestHeaders: { 'Content-Language': 'nl-BE' },
        searchParameters: { marketplace_id: 'EBAY_BE', name: 'Standaardverzending' },
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(fulfillmentPolicy, null, 2) }],
    });
    await mcpClient.close();
  });

  it('keeps the policy ID out of the direct replacement document', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const policyUpdateDetail: SetFulfillmentPolicy = {
      fulfillmentPolicyId: 'FULFILLMENT-1',
    };
    const { sellerSession, putCalls } = sellerSessionReturning<SetFulfillmentPolicy>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: policyUpdateDetail,
    });
    const fulfillmentPolicyReplacement = {
      fulfillmentPolicyId: 'FULFILLMENT/1',
      ...fulfillmentPolicyCreation,
      name: 'Updated standard shipping',
    };

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_account_update_fulfillment_policy',
      fulfillmentPolicyReplacement,
    );

    expect(putCalls).toEqual([
      {
        endpoint: '/sell/account/v1/fulfillment_policy/FULFILLMENT%2F1',
        requestDocument: {
          ...fulfillmentPolicyCreation,
          name: 'Updated standard shipping',
        },
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(policyUpdateDetail, null, 2) }],
    });
    await mcpClient.close();
  });

  it('deletes one encoded policy path and returns the empty completion', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, deleteCalls } = sellerSessionReturning<void>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_account_delete_fulfillment_policy',
      { fulfillmentPolicyId: 'FULFILLMENT/1' },
    );

    expect(deleteCalls).toEqual([
      { endpoint: '/sell/account/v1/fulfillment_policy/FULFILLMENT%2F1' },
    ]);
    expect(toolCompletion).toMatchObject({ content: [] });
    await mcpClient.close();
  });
});

describe('Sell Account fulfillment-policy MCP validation', () => {
  it('rejects legacy wrappers and camel-case query fields before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, putCalls } = sellerSessionReturning<never>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined as never,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_account_update_fulfillment_policy',
      {
        fulfillmentPolicyId: 'FULFILLMENT-1',
        marketplaceId: 'EBAY_US',
        policy: fulfillmentPolicyCreation,
      },
    );

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(putCalls).toEqual([]);
    await mcpClient.close();
  });
});

describe('Sell Account fulfillment-policy MCP failures', () => {
  it.each(fulfillmentPolicyFailureScenarios)(
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
