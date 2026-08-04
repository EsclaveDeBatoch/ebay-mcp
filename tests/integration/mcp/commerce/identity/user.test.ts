import { afterEach, describe, expect, it, vi } from 'vitest';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbayUser } from '@/ebay/commerce/identity/user.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { ebayUserDocument } from '@tests/fixtures/ebayUser.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';

const toolName = 'ebay_commerce_identity_get_user';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Commerce Identity MCP exposure', () => {
  it('is exposed once under its official hierarchical name and namespace gate', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'commerce.identity');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<EbayUser>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: ebayUserDocument,
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    expect(listedTools.tools.filter((ebayTool) => ebayTool.name === toolName)).toHaveLength(1);
    await mcpClient.close();
  });
});

describe('Commerce Identity successful MCP calls', () => {
  it('uses the Identity host and returns every generated eBay field unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const successfulIdentityLookup: EbayRequestCompletion<EbayUser> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: ebayUserDocument,
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulIdentityLookup);

    const { mcpClient, toolCompletion } = await callEbayTool(sellerSession, toolName, {});

    expect(getCalls).toEqual([
      {
        apiHost: 'apiz',
        endpoint: '/commerce/identity/v1/user/',
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(ebayUserDocument, null, 2) }],
    });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });
});

describe('Commerce Identity MCP validation', () => {
  it('rejects unknown fields before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls } = sellerSessionReturning<EbayUser>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: ebayUserDocument,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(sellerSession, toolName, {
      userId: 'another-user',
    });

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(getCalls).toEqual([]);
    await mcpClient.close();
  });
});

describe('Commerce Identity MCP failures', () => {
  it.each(ebayFailures)(
    'translates $kind exactly once at the MCP boundary',
    async (ebayFailure) => {
      vi.stubEnv('EBAY_MCP_UI', 'off');
      const { sellerSession } = sellerSessionReturning<EbayUser>({
        kind: 'ebayRequestFailed',
        ebayFailure,
      });

      const { mcpClient, toolCompletion } = await callEbayTool(sellerSession, toolName, {});

      expect(toolCompletion).toMatchObject({
        content: [{ type: 'text', text: JSON.stringify({ ebayFailure }, null, 2) }],
        isError: true,
      });
      await mcpClient.close();
    },
  );
});
