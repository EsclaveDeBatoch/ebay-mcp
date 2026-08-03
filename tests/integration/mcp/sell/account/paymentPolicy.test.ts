import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  PaymentPolicy,
  PaymentPolicyCollection,
  SetPaymentPolicy,
} from '@/ebay/sell/account/paymentPolicy.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';

const paymentPolicyToolNames = [
  'ebay_sell_account_get_payment_policies',
  'ebay_sell_account_create_payment_policy',
  'ebay_sell_account_get_payment_policy',
  'ebay_sell_account_get_payment_policy_by_name',
  'ebay_sell_account_update_payment_policy',
  'ebay_sell_account_delete_payment_policy',
] as const;

const readOnlyPaymentPolicyToolNames = [
  'ebay_sell_account_get_payment_policies',
  'ebay_sell_account_get_payment_policy',
  'ebay_sell_account_get_payment_policy_by_name',
] as const;

const writePaymentPolicyToolNames = [
  'ebay_sell_account_create_payment_policy',
  'ebay_sell_account_update_payment_policy',
  'ebay_sell_account_delete_payment_policy',
] as const;

const legacyPaymentPolicyToolNames = [
  'ebay_get_payment_policies',
  'ebay_create_payment_policy',
  'ebay_get_payment_policy',
  'ebay_get_payment_policy_by_name',
  'ebay_update_payment_policy',
  'ebay_delete_payment_policy',
] as const;

const paymentPolicyCreation = {
  categoryTypes: [{ name: 'MOTORS_VEHICLES' as const }],
  deposit: {
    amount: { currency: 'USD', value: '400.00' },
    dueIn: { unit: 'HOUR' as const, value: 48 as const },
  },
  fullPaymentDueIn: { unit: 'DAY' as const, value: 7 as const },
  immediatePay: true,
  marketplaceId: 'EBAY_US',
  name: 'Vehicle payments',
  paymentMethods: [{ paymentMethodType: 'CASHIER_CHECK' as const }],
};

const paymentPolicyFailureCalls = [
  {
    ebayArguments: { marketplace_id: 'EBAY_US' },
    toolName: 'ebay_sell_account_get_payment_policies',
  },
  {
    ebayArguments: paymentPolicyCreation,
    toolName: 'ebay_sell_account_create_payment_policy',
  },
  {
    ebayArguments: { paymentPolicyId: 'PAYMENT-1' },
    toolName: 'ebay_sell_account_get_payment_policy',
  },
  {
    ebayArguments: { marketplace_id: 'EBAY_US', name: 'Vehicle payments' },
    toolName: 'ebay_sell_account_get_payment_policy_by_name',
  },
  {
    ebayArguments: {
      paymentPolicyId: 'PAYMENT-1',
      ...paymentPolicyCreation,
      name: 'Updated vehicle payments',
    },
    toolName: 'ebay_sell_account_update_payment_policy',
  },
  {
    ebayArguments: { paymentPolicyId: 'PAYMENT-1' },
    toolName: 'ebay_sell_account_delete_payment_policy',
  },
] as const;

const paymentPolicyFailureScenarios = paymentPolicyFailureCalls.flatMap((paymentPolicyCall) =>
  ebayFailures.map((ebayFailure) => ({ ebayFailure, ...paymentPolicyCall })),
);

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Sell Account payment-policy MCP exposure', () => {
  it('exposes six official operations once without compatibility names', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<PaymentPolicyCollection>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: { paymentPolicies: [] },
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);

    for (const paymentPolicyToolName of paymentPolicyToolNames) {
      expect(
        listedToolNames.filter((listedToolName) => listedToolName === paymentPolicyToolName),
      ).toEqual([paymentPolicyToolName]);
    }
    for (const legacyPaymentPolicyToolName of legacyPaymentPolicyToolNames) {
      expect(listedToolNames).not.toContain(legacyPaymentPolicyToolName);
    }
    await mcpClient.close();
  });

  it('gates the resource through sell.account', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'sell.account');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<PaymentPolicyCollection>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: { paymentPolicies: [] },
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);
    for (const paymentPolicyToolName of paymentPolicyToolNames) {
      expect(listedToolNames).toContain(paymentPolicyToolName);
    }
    await mcpClient.close();
  });

  it('keeps only official reads in read-only mode', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'sell.account');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    vi.stubEnv('EBAY_READ_ONLY', 'true');
    const { sellerSession } = sellerSessionReturning<PaymentPolicyCollection>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: { paymentPolicies: [] },
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);
    for (const readOnlyPaymentPolicyToolName of readOnlyPaymentPolicyToolNames) {
      expect(listedToolNames).toContain(readOnlyPaymentPolicyToolName);
    }
    for (const writePaymentPolicyToolName of writePaymentPolicyToolNames) {
      expect(listedToolNames).not.toContain(writePaymentPolicyToolName);
    }
    await mcpClient.close();
  });
});

describe('Sell Account payment-policy MCP calls', () => {
  it('passes marketplace_id and Content-Language and returns the collection unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const policyCollection: PaymentPolicyCollection = {
      paymentPolicies: [{ name: 'Vehicle payments', paymentPolicyId: 'PAYMENT-1' }],
      total: 1,
    };
    const { sellerSession, getCalls } = sellerSessionReturning<PaymentPolicyCollection>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: policyCollection,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_account_get_payment_policies',
      { 'Content-Language': 'fr-CA', marketplace_id: 'EBAY_CA' },
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/account/v1/payment_policy',
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
    const policyCreationDetail: SetPaymentPolicy = { paymentPolicyId: 'PAYMENT-1' };
    const { sellerSession, postCalls } = sellerSessionReturning<SetPaymentPolicy>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: policyCreationDetail,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_account_create_payment_policy',
      paymentPolicyCreation,
    );

    expect(postCalls).toEqual([
      {
        endpoint: '/sell/account/v1/payment_policy',
        requestDocument: paymentPolicyCreation,
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(policyCreationDetail, null, 2) }],
    });
    await mcpClient.close();
  });

  it('encodes the policy path and returns one eBay policy unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const paymentPolicy: PaymentPolicy = {
      marketplaceId: 'EBAY_US',
      name: 'Vehicle payments',
      paymentPolicyId: 'PAYMENT/1',
    };
    const { sellerSession, getCalls } = sellerSessionReturning<PaymentPolicy>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: paymentPolicy,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_account_get_payment_policy',
      { paymentPolicyId: 'PAYMENT/1' },
    );

    expect(getCalls).toEqual([{ endpoint: '/sell/account/v1/payment_policy/PAYMENT%2F1' }]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(paymentPolicy, null, 2) }],
    });
    await mcpClient.close();
  });

  it('passes exact policy-name lookup fields and returns one eBay policy unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const paymentPolicy: PaymentPolicy = {
      marketplaceId: 'EBAY_BE',
      name: 'Directe betaling',
      paymentPolicyId: 'PAYMENT-1',
    };
    const { sellerSession, getCalls } = sellerSessionReturning<PaymentPolicy>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: paymentPolicy,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_account_get_payment_policy_by_name',
      {
        'Content-Language': 'nl-BE',
        marketplace_id: 'EBAY_BE',
        name: 'Directe betaling',
      },
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/account/v1/payment_policy/get_by_policy_name',
        requestHeaders: { 'Content-Language': 'nl-BE' },
        searchParameters: { marketplace_id: 'EBAY_BE', name: 'Directe betaling' },
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(paymentPolicy, null, 2) }],
    });
    await mcpClient.close();
  });

  it('keeps the policy ID out of the direct replacement document', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const policyUpdateDetail: SetPaymentPolicy = { paymentPolicyId: 'PAYMENT-1' };
    const { sellerSession, putCalls } = sellerSessionReturning<SetPaymentPolicy>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: policyUpdateDetail,
    });
    const paymentPolicyReplacement = {
      paymentPolicyId: 'PAYMENT/1',
      ...paymentPolicyCreation,
      name: 'Updated vehicle payments',
    };

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_account_update_payment_policy',
      paymentPolicyReplacement,
    );

    expect(putCalls).toEqual([
      {
        endpoint: '/sell/account/v1/payment_policy/PAYMENT%2F1',
        requestDocument: {
          ...paymentPolicyCreation,
          name: 'Updated vehicle payments',
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
      'ebay_sell_account_delete_payment_policy',
      { paymentPolicyId: 'PAYMENT/1' },
    );

    expect(deleteCalls).toEqual([{ endpoint: '/sell/account/v1/payment_policy/PAYMENT%2F1' }]);
    expect(toolCompletion).toMatchObject({ content: [] });
    await mcpClient.close();
  });
});

describe('Sell Account payment-policy MCP validation', () => {
  it('rejects legacy wrappers and camel-case query fields before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, putCalls } = sellerSessionReturning<never>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined as never,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_account_update_payment_policy',
      {
        marketplaceId: 'EBAY_US',
        paymentPolicyId: 'PAYMENT-1',
        policy: paymentPolicyCreation,
      },
    );

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(putCalls).toEqual([]);
    await mcpClient.close();
  });
});

describe('Sell Account payment-policy MCP failures', () => {
  it.each(paymentPolicyFailureScenarios)(
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
