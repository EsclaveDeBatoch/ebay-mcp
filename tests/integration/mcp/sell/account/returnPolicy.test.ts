import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  ReturnPolicy,
  ReturnPolicyCollection,
  SetReturnPolicy,
} from '@/ebay/sell/account/returnPolicy.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';

const returnPolicyToolNames = [
  'ebay_sell_account_get_return_policies',
  'ebay_sell_account_create_return_policy',
  'ebay_sell_account_get_return_policy',
  'ebay_sell_account_get_return_policy_by_name',
  'ebay_sell_account_update_return_policy',
  'ebay_sell_account_delete_return_policy',
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
  ...returnPolicyToolNames,
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
] as const;

const legacyReturnPolicyToolNames = [
  'ebay_get_return_policies',
  'ebay_create_return_policy',
  'ebay_get_return_policy',
  'ebay_get_return_policy_by_name',
  'ebay_update_return_policy',
  'ebay_delete_return_policy',
] as const;

const returnPolicyCreation = {
  categoryTypes: [{ name: 'ALL_EXCLUDING_MOTORS_VEHICLES' as const }],
  internationalOverride: {
    returnPeriod: { unit: 'DAY' as const, value: 60 },
    returnsAccepted: true,
    returnShippingCostPayer: 'BUYER' as const,
  },
  marketplaceId: 'EBAY_US',
  name: 'Flexible returns',
  refundMethod: 'MONEY_BACK' as const,
  returnMethod: 'REPLACEMENT' as const,
  returnPeriod: { unit: 'DAY' as const, value: 30 },
  returnsAccepted: true,
  returnShippingCostPayer: 'SELLER' as const,
};

const returnPolicyFailureCalls = [
  {
    ebayArguments: { marketplace_id: 'EBAY_US' },
    toolName: 'ebay_sell_account_get_return_policies',
  },
  {
    ebayArguments: returnPolicyCreation,
    toolName: 'ebay_sell_account_create_return_policy',
  },
  {
    ebayArguments: { returnPolicyId: 'RETURN-1' },
    toolName: 'ebay_sell_account_get_return_policy',
  },
  {
    ebayArguments: { marketplace_id: 'EBAY_US', name: 'Flexible returns' },
    toolName: 'ebay_sell_account_get_return_policy_by_name',
  },
  {
    ebayArguments: {
      returnPolicyId: 'RETURN-1',
      ...returnPolicyCreation,
      name: 'Updated flexible returns',
    },
    toolName: 'ebay_sell_account_update_return_policy',
  },
  {
    ebayArguments: { returnPolicyId: 'RETURN-1' },
    toolName: 'ebay_sell_account_delete_return_policy',
  },
] as const;

const returnPolicyFailureScenarios = returnPolicyFailureCalls.flatMap((returnPolicyCall) =>
  ebayFailures.map((ebayFailure) => ({ ebayFailure, ...returnPolicyCall })),
);

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Sell Account return-policy MCP exposure', () => {
  it('exposes six official operations once without compatibility names', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<ReturnPolicyCollection>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: { returnPolicies: [] },
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);

    for (const returnPolicyToolName of returnPolicyToolNames) {
      expect(
        listedToolNames.filter((listedToolName) => listedToolName === returnPolicyToolName),
      ).toEqual([returnPolicyToolName]);
    }
    for (const legacyReturnPolicyToolName of legacyReturnPolicyToolNames) {
      expect(listedToolNames).not.toContain(legacyReturnPolicyToolName);
    }
    await mcpClient.close();
  });

  it('gates every migrated Account resource through sell.account', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'sell.account');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<ReturnPolicyCollection>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: { returnPolicies: [] },
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    expect(listedTools.tools.map((ebayTool) => ebayTool.name)).toEqual(sellAccountToolNames);
    await mcpClient.close();
  });

  it('keeps only official reads in read-only mode', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'sell.account');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    vi.stubEnv('EBAY_READ_ONLY', 'true');
    const { sellerSession } = sellerSessionReturning<ReturnPolicyCollection>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: { returnPolicies: [] },
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    expect(listedTools.tools.map((ebayTool) => ebayTool.name)).toEqual(
      readOnlySellAccountToolNames,
    );
    await mcpClient.close();
  });
});

describe('Sell Account return-policy MCP calls', () => {
  it('passes marketplace and localization fields and returns the collection unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const policyCollection: ReturnPolicyCollection = {
      returnPolicies: [{ name: 'Flexible returns', returnPolicyId: 'RETURN-1' }],
      total: 1,
    };
    const { sellerSession, getCalls } = sellerSessionReturning<ReturnPolicyCollection>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: policyCollection,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_account_get_return_policies',
      { 'Content-Language': 'fr-CA', marketplace_id: 'EBAY_CA' },
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/account/v1/return_policy',
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
    const policyCreationDetail: SetReturnPolicy = { returnPolicyId: 'RETURN-1' };
    const { sellerSession, postCalls } = sellerSessionReturning<SetReturnPolicy>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: policyCreationDetail,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_account_create_return_policy',
      returnPolicyCreation,
    );

    expect(postCalls).toEqual([
      {
        endpoint: '/sell/account/v1/return_policy',
        requestDocument: returnPolicyCreation,
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(policyCreationDetail, null, 2) }],
    });
    await mcpClient.close();
  });

  it('encodes the policy path and returns one eBay policy unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const returnPolicy: ReturnPolicy = {
      marketplaceId: 'EBAY_US',
      name: 'Flexible returns',
      returnPolicyId: 'RETURN/1',
    };
    const { sellerSession, getCalls } = sellerSessionReturning<ReturnPolicy>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: returnPolicy,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_account_get_return_policy',
      { returnPolicyId: 'RETURN/1' },
    );

    expect(getCalls).toEqual([{ endpoint: '/sell/account/v1/return_policy/RETURN%2F1' }]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(returnPolicy, null, 2) }],
    });
    await mcpClient.close();
  });

  it('passes exact policy-name fields and returns one eBay policy unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const returnPolicy: ReturnPolicy = {
      marketplaceId: 'EBAY_BE',
      name: 'Flexibele retouren',
      returnPolicyId: 'RETURN-1',
    };
    const { sellerSession, getCalls } = sellerSessionReturning<ReturnPolicy>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: returnPolicy,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_account_get_return_policy_by_name',
      {
        'Content-Language': 'nl-BE',
        marketplace_id: 'EBAY_BE',
        name: 'Flexibele retouren',
      },
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/account/v1/return_policy/get_by_policy_name',
        requestHeaders: { 'Content-Language': 'nl-BE' },
        searchParameters: { marketplace_id: 'EBAY_BE', name: 'Flexibele retouren' },
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(returnPolicy, null, 2) }],
    });
    await mcpClient.close();
  });

  it('keeps the path ID out of the complete replacement document', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const updateDetail: SetReturnPolicy = { returnPolicyId: 'RETURN-1' };
    const { sellerSession, putCalls } = sellerSessionReturning<SetReturnPolicy>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: updateDetail,
    });
    const policyReplacement = {
      returnPolicyId: 'RETURN/1',
      ...returnPolicyCreation,
      name: 'Updated flexible returns',
    };

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_account_update_return_policy',
      policyReplacement,
    );

    const { returnPolicyId: replacedPolicyId, ...replacementDocument } = policyReplacement;
    expect(replacedPolicyId).toBe('RETURN/1');
    expect(putCalls).toEqual([
      {
        endpoint: '/sell/account/v1/return_policy/RETURN%2F1',
        requestDocument: replacementDocument,
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(updateDetail, null, 2) }],
    });
    await mcpClient.close();
  });

  it('deletes the encoded policy path', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, deleteCalls } = sellerSessionReturning<undefined>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_account_delete_return_policy',
      { returnPolicyId: 'RETURN/1' },
    );

    expect(deleteCalls).toEqual([{ endpoint: '/sell/account/v1/return_policy/RETURN%2F1' }]);
    expect(toolCompletion).toMatchObject({ content: [] });
    await mcpClient.close();
  });
});

describe('Sell Account return-policy MCP validation', () => {
  it('rejects deprecated wrappers before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, putCalls } = sellerSessionReturning<never>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined as never,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_account_update_return_policy',
      { returnPolicyId: 'RETURN-1', policy: returnPolicyCreation },
    );

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(putCalls).toEqual([]);
    await mcpClient.close();
  });
});

describe('Sell Account return-policy MCP failures', () => {
  it.each(returnPolicyFailureScenarios)(
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
