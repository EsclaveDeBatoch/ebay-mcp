import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  PaymentsProgramOnboarding,
  PaymentsProgramStatus,
} from '@/ebay/sell/account/paymentsProgram.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';

const paymentsProgramToolNames = [
  'ebay_sell_account_get_payments_program',
  'ebay_sell_account_get_payments_program_onboarding',
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
  'ebay_sell_account_create_or_replace_sales_tax',
  'ebay_sell_account_bulk_create_or_replace_sales_tax',
  'ebay_sell_account_delete_sales_tax',
  'ebay_sell_account_get_sales_tax',
  'ebay_sell_account_get_sales_taxes',
  ...paymentsProgramToolNames,
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
  ...paymentsProgramToolNames,
] as const;

const legacyPaymentsProgramToolNames = [
  'ebay_get_payments_program',
  'ebay_get_payments_program_onboarding',
] as const;

const paymentsProgramFailureCalls = paymentsProgramToolNames.map((toolName) => ({
  ebayArguments: {
    marketplace_id: 'EBAY_US',
    payments_program_type: 'EBAY_PAYMENTS',
  },
  toolName,
}));

const paymentsProgramFailureScenarios = paymentsProgramFailureCalls.flatMap((paymentsProgramCall) =>
  ebayFailures.map((ebayFailure) => ({ ebayFailure, ...paymentsProgramCall })),
);

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Sell Account deprecated payments-program MCP exposure', () => {
  it('exposes both reads once without compatibility names', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);

    for (const paymentsProgramToolName of paymentsProgramToolNames) {
      expect(
        listedToolNames.filter((listedToolName) => listedToolName === paymentsProgramToolName),
      ).toEqual([paymentsProgramToolName]);
    }
    for (const legacyPaymentsProgramToolName of legacyPaymentsProgramToolNames) {
      expect(listedToolNames).not.toContain(legacyPaymentsProgramToolName);
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

  it('keeps both payments-program reads in read-only mode', async () => {
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

describe('Sell Account deprecated payments-program MCP reads', () => {
  it('returns the unchanged program status', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const paymentsProgramStatus: PaymentsProgramStatus = {
      marketplaceId: 'EBAY_US',
      paymentsProgramType: 'EBAY_PAYMENTS',
      status: 'OPTED_IN',
    };
    const { sellerSession, getCalls } = sellerSessionReturning<PaymentsProgramStatus>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: paymentsProgramStatus,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_account_get_payments_program',
      { marketplace_id: 'EBAY_US', payments_program_type: 'EBAY_PAYMENTS' },
    );

    expect(getCalls).toEqual([
      { endpoint: '/sell/account/v1/payments_program/EBAY_US/EBAY_PAYMENTS' },
    ]);
    expect(toolCompletion).toEqual({
      content: [{ type: 'text', text: JSON.stringify(paymentsProgramStatus, null, 2) }],
    });
    await mcpClient.close();
  });

  it('returns the unchanged onboarding status', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const paymentsProgramOnboarding: PaymentsProgramOnboarding = {
      onboardingStatus: 'ONBOARDED',
      steps: [{ name: 'PAYOUT_METHOD', status: 'COMPLETED' }],
    };
    const { sellerSession, getCalls } = sellerSessionReturning<PaymentsProgramOnboarding>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: paymentsProgramOnboarding,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_account_get_payments_program_onboarding',
      { marketplace_id: 'EBAY_US', payments_program_type: 'EBAY_PAYMENTS' },
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/account/v1/payments_program/EBAY_US/EBAY_PAYMENTS/onboarding',
      },
    ]);
    expect(toolCompletion).toEqual({
      content: [{ type: 'text', text: JSON.stringify(paymentsProgramOnboarding, null, 2) }],
    });
    await mcpClient.close();
  });
});

describe('Sell Account deprecated payments-program MCP validation', () => {
  it('rejects the camel-case legacy shape before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls } = sellerSessionReturning<never>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined as never,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_account_get_payments_program',
      { marketplaceId: 'EBAY_US', paymentsProgramType: 'EBAY_PAYMENTS' },
    );

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(getCalls).toEqual([]);
    await mcpClient.close();
  });
});

describe('Sell Account deprecated payments-program MCP failures', () => {
  it.each(paymentsProgramFailureScenarios)(
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
