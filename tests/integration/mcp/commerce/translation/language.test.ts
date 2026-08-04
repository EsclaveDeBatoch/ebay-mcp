import { afterEach, describe, expect, it, vi } from 'vitest';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { ListingTranslation } from '@/ebay/commerce/translation/language.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import {
  listingTranslationDocument,
  translateListingTitleArguments,
} from '@tests/fixtures/listingTranslation.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';

const toolName = 'ebay_commerce_translation_translate';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Commerce Translation MCP exposure', () => {
  it('is exposed once under its official hierarchical name and namespace gate', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'commerce.translation');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<ListingTranslation>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: listingTranslationDocument,
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    expect(listedTools.tools.filter((ebayTool) => ebayTool.name === toolName)).toHaveLength(1);
    await mcpClient.close();
  });
});

describe('Commerce Translation successful MCP calls', () => {
  it('validates once, posts the exact document, and returns eBay fields unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const successfulTranslation: EbayRequestCompletion<ListingTranslation> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: listingTranslationDocument,
    };
    const { sellerSession, postCalls } = sellerSessionReturning(successfulTranslation);

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      toolName,
      translateListingTitleArguments,
    );

    expect(postCalls).toEqual([
      {
        endpoint: '/commerce/translation/v1_beta/translate',
        requestDocument: translateListingTitleArguments,
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(listingTranslationDocument, null, 2) }],
    });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });
});

describe('Commerce Translation MCP validation', () => {
  it.each([
    { ...translateListingTitleArguments, from: 'nl' },
    { ...translateListingTitleArguments, to: 'pl' },
    { ...translateListingTitleArguments, translationContext: 'PRODUCT_TITLE' },
    { ...translateListingTitleArguments, text: [] },
    { ...translateListingTitleArguments, text: ['First title', 'Second title'] },
    { ...translateListingTitleArguments, targetMarketplace: 'EBAY_ES' },
  ])('rejects invalid or unknown fields before the seller session', async (invalidTranslation) => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, postCalls } = sellerSessionReturning<ListingTranslation>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: listingTranslationDocument,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      toolName,
      invalidTranslation,
    );

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(postCalls).toEqual([]);
    await mcpClient.close();
  });
});

describe('Commerce Translation MCP failures', () => {
  it.each(ebayFailures)(
    'translates $kind exactly once at the MCP boundary',
    async (ebayFailure) => {
      vi.stubEnv('EBAY_MCP_UI', 'off');
      const { sellerSession } = sellerSessionReturning<ListingTranslation>({
        kind: 'ebayRequestFailed',
        ebayFailure,
      });

      const { mcpClient, toolCompletion } = await callEbayTool(
        sellerSession,
        toolName,
        translateListingTitleArguments,
      );

      expect(toolCompletion).toMatchObject({
        content: [{ type: 'text', text: JSON.stringify({ ebayFailure }, null, 2) }],
        isError: true,
      });
      await mcpClient.close();
    },
  );
});
