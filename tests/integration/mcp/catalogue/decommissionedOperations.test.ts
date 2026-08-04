import { afterEach, describe, expect, it, vi } from 'vitest';

import { sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { listEbayTools } from '@tests/fixtures/mcp.js';

const decommissionedToolNames = [
  'ebay_find_completed_items',
  'ebay_get_listing_violations',
  'ebay_get_listing_violations_summary',
  'ebay_launch_campaign',
  'ebay_setup_quick_campaign',
] as const;

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('decommissioned eBay operations', () => {
  it('does not advertise operations eBay no longer serves', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const sellerSession = sellerSessionReturning<void>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    }).sellerSession;
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);

    for (const decommissionedToolName of decommissionedToolNames) {
      expect(listedToolNames).not.toContain(decommissionedToolName);
    }

    await mcpClient.close();
  });
});
