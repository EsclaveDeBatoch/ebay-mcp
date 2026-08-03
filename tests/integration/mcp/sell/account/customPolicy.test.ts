import { afterEach, describe, expect, it, vi } from 'vitest';

import type { CustomPolicy, CustomPolicyCollection } from '@/ebay/sell/account/customPolicy.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';

const customPolicyToolNames = [
  'ebay_sell_account_get_custom_policies',
  'ebay_sell_account_create_custom_policy',
  'ebay_sell_account_get_custom_policy',
  'ebay_sell_account_update_custom_policy',
] as const;

const readOnlyCustomPolicyToolNames = [
  'ebay_sell_account_get_custom_policies',
  'ebay_sell_account_get_custom_policy',
] as const;

const legacyCustomPolicyToolNames = [
  'ebay_get_custom_policies',
  'ebay_create_custom_policy',
  'ebay_get_custom_policy',
  'ebay_update_custom_policy',
] as const;

const customPolicyFailureCalls = [
  {
    ebayArguments: { policy_types: 'TAKE_BACK' },
    toolName: 'ebay_sell_account_get_custom_policies',
  },
  {
    ebayArguments: {
      description: 'Take-back terms',
      label: 'Take-back details',
      name: 'Take-back policy',
      policyType: 'TAKE_BACK',
    },
    toolName: 'ebay_sell_account_create_custom_policy',
  },
  {
    ebayArguments: { custom_policy_id: 'POLICY-1' },
    toolName: 'ebay_sell_account_get_custom_policy',
  },
  {
    ebayArguments: {
      custom_policy_id: 'POLICY-1',
      description: 'Updated terms',
      label: 'Updated details',
      name: 'Updated policy',
    },
    toolName: 'ebay_sell_account_update_custom_policy',
  },
] as const;

const customPolicyFailureScenarios = customPolicyFailureCalls.flatMap((customPolicyCall) =>
  ebayFailures.map((ebayFailure) => ({ ebayFailure, ...customPolicyCall })),
);

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Sell Account custom-policy MCP exposure', () => {
  it('exposes four official operations once without compatibility names', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<CustomPolicyCollection>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: { customPolicies: [] },
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);

    for (const customPolicyToolName of customPolicyToolNames) {
      expect(
        listedToolNames.filter((listedToolName) => listedToolName === customPolicyToolName),
      ).toEqual([customPolicyToolName]);
    }
    for (const legacyCustomPolicyToolName of legacyCustomPolicyToolNames) {
      expect(listedToolNames).not.toContain(legacyCustomPolicyToolName);
    }
    await mcpClient.close();
  });

  it('gates the resource through sell.account', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'sell.account');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<CustomPolicyCollection>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: { customPolicies: [] },
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    expect(listedTools.tools.map((ebayTool) => ebayTool.name)).toEqual(customPolicyToolNames);
    await mcpClient.close();
  });

  it('keeps only the two official reads in read-only mode', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'sell.account');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    vi.stubEnv('EBAY_READ_ONLY', 'true');
    const { sellerSession } = sellerSessionReturning<CustomPolicyCollection>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: { customPolicies: [] },
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    expect(listedTools.tools.map((ebayTool) => ebayTool.name)).toEqual(
      readOnlyCustomPolicyToolNames,
    );
    await mcpClient.close();
  });
});

describe('Sell Account custom-policy MCP calls', () => {
  it('passes policy_types and returns eBay collection unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const policyCollection: CustomPolicyCollection = {
      customPolicies: [{ customPolicyId: 'POLICY-1', name: 'Take-back policy' }],
      total: 1,
    };
    const { sellerSession, getCalls } = sellerSessionReturning<CustomPolicyCollection>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: policyCollection,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_account_get_custom_policies',
      { policy_types: 'TAKE_BACK' },
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/account/v1/custom_policy/',
        searchParameters: { policy_types: 'TAKE_BACK' },
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(policyCollection, null, 2) }],
    });
    await mcpClient.close();
  });

  it('sends the direct create document and preserves eBay empty document', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, postCalls } = sellerSessionReturning<Record<string, never>>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });
    const policyCreation = {
      description: 'Take-back terms',
      label: 'Take-back details',
      name: 'Take-back policy',
      policyType: 'TAKE_BACK',
    };

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_account_create_custom_policy',
      policyCreation,
    );

    expect(postCalls).toEqual([
      { endpoint: '/sell/account/v1/custom_policy/', requestDocument: policyCreation },
    ]);
    expect(toolCompletion).toEqual({ content: [{ type: 'text', text: '{}' }] });
    await mcpClient.close();
  });

  it('encodes the custom-policy path and returns the eBay policy unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const customPolicy: CustomPolicy = {
      customPolicyId: 'POLICY/1',
      description: 'Take-back terms',
      label: 'Take-back details',
      name: 'Take-back policy',
      policyType: 'TAKE_BACK',
    };
    const { sellerSession, getCalls } = sellerSessionReturning<CustomPolicy>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: customPolicy,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_account_get_custom_policy',
      { custom_policy_id: 'POLICY/1' },
    );

    expect(getCalls).toEqual([{ endpoint: '/sell/account/v1/custom_policy/POLICY%2F1' }]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(customPolicy, null, 2) }],
    });
    await mcpClient.close();
  });

  it('keeps the custom-policy path out of the complete replacement document', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, putCalls } = sellerSessionReturning<void>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    });
    const policyReplacement = {
      custom_policy_id: 'POLICY/1',
      description: 'Updated terms',
      label: 'Updated details',
      name: 'Updated policy',
    };

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_account_update_custom_policy',
      policyReplacement,
    );

    expect(putCalls).toEqual([
      {
        endpoint: '/sell/account/v1/custom_policy/POLICY%2F1',
        requestDocument: {
          description: policyReplacement.description,
          label: policyReplacement.label,
          name: policyReplacement.name,
        },
      },
    ]);
    expect(toolCompletion).toMatchObject({ content: [] });
    await mcpClient.close();
  });
});

describe('Sell Account custom-policy MCP validation', () => {
  it('rejects old wrappers and camel-case paths before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, putCalls } = sellerSessionReturning<never>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined as never,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_account_update_custom_policy',
      {
        customPolicyId: 'POLICY-1',
        policy: {
          description: 'Updated terms',
          label: 'Updated details',
          name: 'Updated policy',
        },
      },
    );

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(putCalls).toEqual([]);
    await mcpClient.close();
  });
});

describe('Sell Account custom-policy MCP failures', () => {
  it.each(customPolicyFailureScenarios)(
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
