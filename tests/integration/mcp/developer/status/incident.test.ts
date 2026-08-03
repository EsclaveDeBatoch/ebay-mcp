import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { apiStatusRssDocument } from '@tests/fixtures/apiStatusFeed.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';

const developerStatusToolName = 'ebay_developer_status_get_incidents';
const statusFeedFetch = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubGlobal('fetch', statusFeedFetch);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

const sellerSessionForStatus = () =>
  sellerSessionReturning<void>({
    kind: 'ebayRequestSucceeded',
    ebayDocument: undefined,
  }).sellerSession;

describe('Developer status-feed MCP exposure', () => {
  it('exposes the hierarchical name once without the flat compatibility name', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { mcpClient, listedTools } = await listEbayTools(sellerSessionForStatus());
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);

    expect(
      listedToolNames.filter((listedToolName) => listedToolName === developerStatusToolName),
    ).toEqual([developerStatusToolName]);
    expect(listedToolNames).not.toContain('ebay_get_api_status');
    await mcpClient.close();
  });

  it('exposes only the status-feed tool through developer.status', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'developer.status');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { mcpClient, listedTools } = await listEbayTools(sellerSessionForStatus());

    expect(listedTools.tools.map((ebayTool) => ebayTool.name)).toEqual([developerStatusToolName]);
    await mcpClient.close();
  });

  it('retains the status-feed tool in read-only mode', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'developer.status');
    vi.stubEnv('EBAY_READ_ONLY', 'true');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { mcpClient, listedTools } = await listEbayTools(sellerSessionForStatus());

    expect(listedTools.tools.map((ebayTool) => ebayTool.name)).toEqual([developerStatusToolName]);
    await mcpClient.close();
  });
});

describe('Developer status-feed MCP calls', () => {
  it('returns filtered normalized incidents', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    statusFeedFetch.mockResolvedValue(new Response(apiStatusRssDocument, { status: 200 }));

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSessionForStatus(),
      developerStatusToolName,
      { status: 'Unresolved', api: 'inventory' },
    );

    expect(toolCompletion).toMatchObject({
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              incidents: [
                {
                  title: 'Inventory API latency',
                  summary: 'Requests are taking longer than expected.',
                  link: 'https://developer.ebay.com/support/status/inventory-latency',
                  api: 'Inventory API',
                  site: 'All',
                  status: 'Unresolved',
                  lastUpdated: '2026-08-03T14:30:00Z',
                },
              ],
            },
            null,
            2,
          ),
        },
      ],
    });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });
});

describe('Developer status-feed MCP validation', () => {
  it('rejects a renamed API filter before fetching the feed', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSessionForStatus(),
      developerStatusToolName,
      { apiName: 'inventory' },
    );

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(statusFeedFetch).not.toHaveBeenCalled();
    await mcpClient.close();
  });
});

describe('Developer status-feed MCP failures', () => {
  it('translates feed unavailability once', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    statusFeedFetch.mockResolvedValue(
      new Response('Unavailable', { status: 503, statusText: 'Service Unavailable' }),
    );

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSessionForStatus(),
      developerStatusToolName,
      {},
    );

    expect(toolCompletion).toMatchObject({
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              ebayFailure: {
                kind: 'ebayUnavailable',
                message: 'eBay API status feed returned HTTP 503 Service Unavailable',
              },
            },
            null,
            2,
          ),
        },
      ],
      isError: true,
    });
    await mcpClient.close();
  });
});
