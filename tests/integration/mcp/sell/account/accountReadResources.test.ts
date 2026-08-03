import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AdvertisingEligibility } from '@/ebay/sell/account/advertisingEligibility.js';
import type { KycStatus } from '@/ebay/sell/account/kyc.js';
import type { SellingPrivileges } from '@/ebay/sell/account/privilege.js';
import type { RateTableCollection } from '@/ebay/sell/account/rateTable.js';
import type { SubscriptionCollection } from '@/ebay/sell/account/subscription.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';

const accountReadToolNames = [
  'ebay_sell_account_get_privileges',
  'ebay_sell_account_get_rate_tables',
  'ebay_sell_account_get_subscription',
  'ebay_sell_account_get_kyc',
  'ebay_sell_account_get_advertising_eligibility',
] as const;

const legacyAccountReadToolNames = [
  'ebay_get_privileges',
  'ebay_get_rate_tables',
  'ebay_get_subscription',
  'ebay_get_kyc',
  'ebay_get_advertising_eligibility',
] as const;

const accountReadFailureCalls = [
  { ebayArguments: {}, toolName: 'ebay_sell_account_get_privileges' },
  { ebayArguments: { country_code: 'US' }, toolName: 'ebay_sell_account_get_rate_tables' },
  { ebayArguments: { limit: '20' }, toolName: 'ebay_sell_account_get_subscription' },
  { ebayArguments: {}, toolName: 'ebay_sell_account_get_kyc' },
  {
    ebayArguments: { 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US' },
    toolName: 'ebay_sell_account_get_advertising_eligibility',
  },
] as const;

const accountReadFailureScenarios = accountReadFailureCalls.flatMap((accountReadCall) =>
  ebayFailures.map((ebayFailure) => ({ ebayFailure, ...accountReadCall })),
);

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Sell Account read-resource MCP exposure', () => {
  it('exposes five official reads once without compatibility names', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<KycStatus>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);

    for (const accountReadToolName of accountReadToolNames) {
      expect(
        listedToolNames.filter((listedToolName) => listedToolName === accountReadToolName),
      ).toEqual([accountReadToolName]);
    }
    for (const legacyAccountReadToolName of legacyAccountReadToolNames) {
      expect(listedToolNames).not.toContain(legacyAccountReadToolName);
    }
    await mcpClient.close();
  });

  it('gates every read resource through sell.account', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'sell.account');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<KycStatus>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);
    for (const accountReadToolName of accountReadToolNames) {
      expect(listedToolNames).toContain(accountReadToolName);
    }
    await mcpClient.close();
  });

  it('keeps all five resources in read-only mode', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'sell.account');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    vi.stubEnv('EBAY_READ_ONLY', 'true');
    const { sellerSession } = sellerSessionReturning<KycStatus>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);
    for (const accountReadToolName of accountReadToolNames) {
      expect(listedToolNames).toContain(accountReadToolName);
    }
    await mcpClient.close();
  });
});

describe('Sell Account seller-status MCP calls', () => {
  it('returns eBay KYC status unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const kycStatus: KycStatus = {
      kycChecks: [{ alert: 'Upload a bank document' }],
    };
    const { sellerSession, getCalls } = sellerSessionReturning<KycStatus>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: kycStatus,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_account_get_kyc',
      {},
    );

    expect(getCalls).toEqual([{ endpoint: '/sell/account/v1/kyc' }]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(kycStatus, null, 2) }],
    });
    await mcpClient.close();
  });

  it('returns eBay selling privileges unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const sellingPrivileges: SellingPrivileges = { sellerRegistrationCompleted: true };
    const { sellerSession, getCalls } = sellerSessionReturning<SellingPrivileges>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: sellingPrivileges,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_account_get_privileges',
      {},
    );

    expect(getCalls).toEqual([{ endpoint: '/sell/account/v1/privilege' }]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(sellingPrivileges, null, 2) }],
    });
    await mcpClient.close();
  });
});

describe('Sell Account collection MCP calls', () => {
  it('sends the missing country_code query and returns rate tables unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const rateTableCollection: RateTableCollection = {
      rateTables: [{ countryCode: 'US', rateTableId: 'RATE-1' }],
    };
    const { sellerSession, getCalls } = sellerSessionReturning<RateTableCollection>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: rateTableCollection,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_account_get_rate_tables',
      { country_code: 'US' },
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/account/v1/rate_table',
        searchParameters: { country_code: 'US' },
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(rateTableCollection, null, 2) }],
    });
    await mcpClient.close();
  });

  it('passes exact subscription pagination and returns subscriptions unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const subscriptionCollection: SubscriptionCollection = {
      subscriptions: [{ marketplaceId: 'EBAY_US', subscriptionId: 'STORE-1' }],
      total: 1,
    };
    const { sellerSession, getCalls } = sellerSessionReturning<SubscriptionCollection>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: subscriptionCollection,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_account_get_subscription',
      { continuation_token: 'NEXT-1', limit: '20' },
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/account/v1/subscription',
        searchParameters: { continuation_token: 'NEXT-1', limit: '20' },
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(subscriptionCollection, null, 2) }],
    });
    await mcpClient.close();
  });
});

describe('Sell Account advertising-eligibility MCP calls', () => {
  it('passes exact eligibility header/query and returns eligibility unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const advertisingEligibility: AdvertisingEligibility = {
      advertisingEligibility: [{ programType: 'OFFSITE_ADS', status: 'ELIGIBLE' }],
    };
    const { sellerSession, getCalls } = sellerSessionReturning<AdvertisingEligibility>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: advertisingEligibility,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_account_get_advertising_eligibility',
      { 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US', program_types: 'OFFSITE_ADS' },
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/account/v1/advertising_eligibility',
        requestHeaders: { 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US' },
        searchParameters: { program_types: 'OFFSITE_ADS' },
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(advertisingEligibility, null, 2) }],
    });
    await mcpClient.close();
  });
});

describe('Sell Account read-resource MCP failures', () => {
  it.each(accountReadFailureScenarios)(
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
