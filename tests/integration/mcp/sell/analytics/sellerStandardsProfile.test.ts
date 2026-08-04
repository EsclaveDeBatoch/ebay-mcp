import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  SellerStandardsProfile,
  SellerStandardsProfiles,
} from '@/ebay/sell/analytics/sellerStandardsProfile.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';
import {
  sellerStandardsProfileDocument,
  sellerStandardsProfilePath,
  sellerStandardsProfilesDocument,
} from '@tests/fixtures/sellerStandardsProfile.js';

const findToolName = 'ebay_sell_analytics_find_seller_standards_profiles';
const getToolName = 'ebay_sell_analytics_get_seller_standards_profile';

describe('Sell Analytics seller standards profiles through MCP', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('exposes the complete official namespace once under hierarchical names', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'sell.analytics');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<SellerStandardsProfiles>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: sellerStandardsProfilesDocument,
    });

    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    expect(listedTools.tools.map((ebayTool) => ebayTool.name)).toEqual([
      'ebay_sell_analytics_get_traffic_report',
      findToolName,
      getToolName,
      'ebay_sell_analytics_get_customer_service_metric',
    ]);
    await mcpClient.close();
  });

  it('finds profiles through the exact eBay collection contract', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls } = sellerSessionReturning<SellerStandardsProfiles>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: sellerStandardsProfilesDocument,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(sellerSession, findToolName, {});

    expect(getCalls).toEqual([{ endpoint: '/sell/analytics/v1/seller_standards_profile' }]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(sellerStandardsProfilesDocument, null, 2) }],
    });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });

  it('rejects unknown profile-discovery arguments before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls } = sellerSessionReturning<SellerStandardsProfiles>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: sellerStandardsProfilesDocument,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(sellerSession, findToolName, {
      program: 'PROGRAM_US',
    });

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(getCalls).toEqual([]);
    await mcpClient.close();
  });

  it.each(ebayFailures)(
    'translates $kind once when profile discovery fails',
    async (ebayFailure) => {
      vi.stubEnv('EBAY_MCP_UI', 'off');
      const { sellerSession } = sellerSessionReturning<SellerStandardsProfiles>({
        kind: 'ebayRequestFailed',
        ebayFailure,
      });

      const { mcpClient, toolCompletion } = await callEbayTool(sellerSession, findToolName, {});

      expect(toolCompletion).toMatchObject({
        content: [{ type: 'text', text: JSON.stringify({ ebayFailure }, null, 2) }],
        isError: true,
      });
      await mcpClient.close();
    },
  );

  it('gets one profile through the exact eBay path and returns its document unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls } = sellerSessionReturning<SellerStandardsProfile>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: sellerStandardsProfileDocument,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      getToolName,
      sellerStandardsProfilePath,
    );

    expect(getCalls).toEqual([
      { endpoint: '/sell/analytics/v1/seller_standards_profile/PROGRAM_US/CURRENT' },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(sellerStandardsProfileDocument, null, 2) }],
    });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });

  it.each([
    { program: 'PROGRAM_CA', cycle: 'CURRENT' },
    { program: 'PROGRAM_US', cycle: 'PAST' },
    { ...sellerStandardsProfilePath, marketplace_id: 'EBAY_US' },
  ])(
    'rejects invalid or unknown profile fields before the seller session',
    async (invalidProfilePath) => {
      vi.stubEnv('EBAY_MCP_UI', 'off');
      const { sellerSession, getCalls } = sellerSessionReturning<SellerStandardsProfile>({
        kind: 'ebayRequestSucceeded',
        ebayDocument: sellerStandardsProfileDocument,
      });

      const { mcpClient, toolCompletion } = await callEbayTool(
        sellerSession,
        getToolName,
        invalidProfilePath,
      );

      expect(toolCompletion).toMatchObject({ isError: true });
      expect(getCalls).toEqual([]);
      await mcpClient.close();
    },
  );

  it.each(ebayFailures)(
    'translates $kind once when profile retrieval fails',
    async (ebayFailure) => {
      vi.stubEnv('EBAY_MCP_UI', 'off');
      const { sellerSession } = sellerSessionReturning<SellerStandardsProfile>({
        kind: 'ebayRequestFailed',
        ebayFailure,
      });

      const { mcpClient, toolCompletion } = await callEbayTool(
        sellerSession,
        getToolName,
        sellerStandardsProfilePath,
      );

      expect(toolCompletion).toMatchObject({
        content: [{ type: 'text', text: JSON.stringify({ ebayFailure }, null, 2) }],
        isError: true,
      });
      await mcpClient.close();
    },
  );
});
