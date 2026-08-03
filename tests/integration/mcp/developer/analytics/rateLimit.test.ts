import { afterEach, describe, expect, it, vi } from 'vitest';

import type { DeveloperRateLimits } from '@/ebay/developer/analytics/rateLimit.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';
import {
  applicationRateLimitsDocument,
  userRateLimitsDocument,
} from '@tests/fixtures/rateLimits.js';

const applicationRateLimitsToolName = 'ebay_developer_analytics_get_rate_limits';
const userRateLimitsToolName = 'ebay_developer_analytics_get_user_rate_limits';
const rateLimitSearch = { api_context: 'sell', api_name: 'inventory' };
const rateLimitCallScenarios = [
  {
    endpoint: '/developer/analytics/v1_beta/rate_limit/',
    rateLimitsDocument: applicationRateLimitsDocument,
    toolName: applicationRateLimitsToolName,
  },
  {
    endpoint: '/developer/analytics/v1_beta/user_rate_limit/',
    rateLimitsDocument: userRateLimitsDocument,
    toolName: userRateLimitsToolName,
  },
];
const rateLimitFailureScenarios = [
  {
    ebayArguments: rateLimitSearch,
    toolName: applicationRateLimitsToolName,
  },
  {
    ebayArguments: rateLimitSearch,
    toolName: userRateLimitsToolName,
  },
].flatMap((rateLimitOperation) =>
  ebayFailures.map((ebayFailure) => ({ ebayFailure, ...rateLimitOperation })),
);

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Developer Analytics rate-limit MCP exposure', () => {
  it('exposes both official names once without flat compatibility names', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<DeveloperRateLimits>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: applicationRateLimitsDocument,
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);

    expect(
      listedToolNames.filter((listedToolName) => listedToolName === applicationRateLimitsToolName),
    ).toEqual([applicationRateLimitsToolName]);
    expect(
      listedToolNames.filter((listedToolName) => listedToolName === userRateLimitsToolName),
    ).toEqual([userRateLimitsToolName]);
    expect(listedToolNames).not.toContain('ebay_get_rate_limits');
    expect(listedToolNames).not.toContain('ebay_get_user_rate_limits');
    await mcpClient.close();
  });

  it('exposes only both rate-limit tools through developer.analytics', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'developer.analytics');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<DeveloperRateLimits>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: applicationRateLimitsDocument,
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    expect(listedTools.tools.map((ebayTool) => ebayTool.name)).toEqual([
      applicationRateLimitsToolName,
      userRateLimitsToolName,
    ]);
    await mcpClient.close();
  });
});

describe('Developer Analytics rate-limit MCP calls', () => {
  it.each(rateLimitCallScenarios)(
    'passes exact filters and preserves generated limits',
    async ({ endpoint, rateLimitsDocument, toolName }) => {
      vi.stubEnv('EBAY_MCP_UI', 'off');
      const { sellerSession, getCalls } = sellerSessionReturning<DeveloperRateLimits>({
        kind: 'ebayRequestSucceeded',
        ebayDocument: rateLimitsDocument,
      });

      const { mcpClient, toolCompletion } = await callEbayTool(
        sellerSession,
        toolName,
        rateLimitSearch,
      );

      expect(getCalls).toEqual([{ endpoint, searchParameters: rateLimitSearch }]);
      expect(toolCompletion).toMatchObject({
        content: [{ type: 'text', text: JSON.stringify(rateLimitsDocument, null, 2) }],
      });
      expect(toolCompletion.isError).not.toBe(true);
      await mcpClient.close();
    },
  );
});

describe('Developer Analytics rate-limit MCP validation', () => {
  it('rejects camel-case filters before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls } = sellerSessionReturning<DeveloperRateLimits>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: applicationRateLimitsDocument,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      applicationRateLimitsToolName,
      { apiContext: 'sell', apiName: 'inventory' },
    );

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(getCalls).toEqual([]);
    await mcpClient.close();
  });
});

describe('Developer Analytics rate-limit MCP failures', () => {
  it.each(rateLimitFailureScenarios)(
    'translates every $ebayFailure.kind failure once',
    async ({ ebayArguments, ebayFailure, toolName }) => {
      vi.stubEnv('EBAY_MCP_UI', 'off');
      const { sellerSession } = sellerSessionReturning<DeveloperRateLimits>({
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
