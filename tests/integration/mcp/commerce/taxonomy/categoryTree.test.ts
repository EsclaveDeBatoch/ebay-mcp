import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  CategoryAspectMetadata,
  CategorySuggestionPage,
  EbayCategoryTree,
  MarketplaceCategoryTree,
} from '@/ebay/commerce/taxonomy/categoryTree.js';
import {
  categoryAspectMetadataDocument,
  categorySuggestionPageDocument,
  ebayCategoryTreeDocument,
  marketplaceCategoryTreeDocument,
} from '@tests/fixtures/categoryTree.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';

const defaultCategoryTreeToolName = 'ebay_commerce_taxonomy_get_default_category_tree_id';
const categoryTreeToolName = 'ebay_commerce_taxonomy_get_category_tree';
const categorySuggestionToolName = 'ebay_commerce_taxonomy_get_category_suggestions';
const categoryAspectToolName = 'ebay_commerce_taxonomy_get_item_aspects_for_category';
const taxonomyFailureScenarios = [
  { ebayArguments: { marketplace_id: 'EBAY_US' }, toolName: defaultCategoryTreeToolName },
  { ebayArguments: { category_tree_id: '0' }, toolName: categoryTreeToolName },
  {
    ebayArguments: { category_tree_id: '0', q: 'smartphone' },
    toolName: categorySuggestionToolName,
  },
  {
    ebayArguments: { category_id: '9355', category_tree_id: '0' },
    toolName: categoryAspectToolName,
  },
].flatMap((taxonomyOperation) =>
  ebayFailures.map((ebayFailure) => ({ ebayFailure, ...taxonomyOperation })),
);

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Commerce Taxonomy category-tree MCP exposure', () => {
  it('exposes four official names once without flat compatibility names', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<MarketplaceCategoryTree>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: marketplaceCategoryTreeDocument,
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);
    const categoryTreeToolNames = [
      defaultCategoryTreeToolName,
      categoryTreeToolName,
      categorySuggestionToolName,
      categoryAspectToolName,
    ];

    for (const categoryTreeTool of categoryTreeToolNames) {
      expect(
        listedToolNames.filter((listedToolName) => listedToolName === categoryTreeTool),
      ).toEqual([categoryTreeTool]);
    }
    expect(listedToolNames).not.toContain('ebay_get_default_category_tree_id');
    expect(listedToolNames).not.toContain('ebay_get_category_tree');
    expect(listedToolNames).not.toContain('ebay_get_category_suggestions');
    expect(listedToolNames).not.toContain('ebay_get_item_aspects_for_category');
    await mcpClient.close();
  });

  it('exposes only the four Taxonomy tools through commerce.taxonomy', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'commerce.taxonomy');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<MarketplaceCategoryTree>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: marketplaceCategoryTreeDocument,
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    expect(listedTools.tools.map((ebayTool) => ebayTool.name)).toEqual([
      defaultCategoryTreeToolName,
      categoryTreeToolName,
      categorySuggestionToolName,
      categoryAspectToolName,
    ]);
    await mcpClient.close();
  });
});

describe('Commerce Taxonomy category-tree MCP calls', () => {
  it('returns the generated default tree reference unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls } = sellerSessionReturning<MarketplaceCategoryTree>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: marketplaceCategoryTreeDocument,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      defaultCategoryTreeToolName,
      { marketplace_id: 'EBAY_US' },
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/commerce/taxonomy/v1/get_default_category_tree_id',
        searchParameters: { marketplace_id: 'EBAY_US' },
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(marketplaceCategoryTreeDocument, null, 2) }],
    });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });

  it('returns the generated category tree unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls } = sellerSessionReturning<EbayCategoryTree>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: ebayCategoryTreeDocument,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(sellerSession, categoryTreeToolName, {
      category_tree_id: '0',
    });

    expect(getCalls).toEqual([{ endpoint: '/commerce/taxonomy/v1/category_tree/0' }]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(ebayCategoryTreeDocument, null, 2) }],
    });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });

  it('passes q and returns generated category suggestions unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls } = sellerSessionReturning<CategorySuggestionPage>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: categorySuggestionPageDocument,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      categorySuggestionToolName,
      { category_tree_id: '0', q: 'smartphone' },
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/commerce/taxonomy/v1/category_tree/0/get_category_suggestions',
        searchParameters: { q: 'smartphone' },
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(categorySuggestionPageDocument, null, 2) }],
    });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });

  it('passes category_id and returns generated aspect metadata unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls } = sellerSessionReturning<CategoryAspectMetadata>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: categoryAspectMetadataDocument,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      categoryAspectToolName,
      { category_id: '9355', category_tree_id: '0' },
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/commerce/taxonomy/v1/category_tree/0/get_item_aspects_for_category',
        searchParameters: { category_id: '9355' },
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(categoryAspectMetadataDocument, null, 2) }],
    });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });
});

describe('Commerce Taxonomy category-tree MCP validation', () => {
  it.each([
    [defaultCategoryTreeToolName, { marketplaceId: 'EBAY_US' }],
    [categoryTreeToolName, { categoryTreeId: '0' }],
    [categorySuggestionToolName, { category_tree_id: '0', query: 'smartphone' }],
    [categoryAspectToolName, { category_tree_id: '0', categoryId: '9355' }],
  ])('rejects renamed fields before the seller session', async (toolName, renamedArguments) => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls } = sellerSessionReturning<MarketplaceCategoryTree>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: marketplaceCategoryTreeDocument,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      toolName,
      renamedArguments,
    );

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(getCalls).toEqual([]);
    await mcpClient.close();
  });
});

describe('Commerce Taxonomy category-tree MCP failures', () => {
  it.each(taxonomyFailureScenarios)(
    'translates every $ebayFailure.kind failure once',
    async ({ ebayArguments, ebayFailure, toolName }) => {
      vi.stubEnv('EBAY_MCP_UI', 'off');
      const { sellerSession } = sellerSessionReturning<MarketplaceCategoryTree>({
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
