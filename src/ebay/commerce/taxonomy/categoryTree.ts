import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/listing-metadata/commerceTaxonomyV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';

const marketplaceIdSchema = z.string().min(1);
const categoryTreeIdSchema = z.string().min(1);
const categoryIdSchema = z.string().min(1);

/** Exact eBay query field accepted by getDefaultCategoryTreeId. */
export const getDefaultCategoryTreeIdArgumentsSchema = z
  .object({
    marketplace_id: marketplaceIdSchema,
  })
  .strict();

/** Validated eBay marketplace query used to retrieve its default category tree. */
export type DefaultCategoryTreeArguments = z.infer<typeof getDefaultCategoryTreeIdArgumentsSchema>;

/** Exact eBay path field accepted by getCategoryTree. */
export const getCategoryTreeArgumentsSchema = z
  .object({
    category_tree_id: categoryTreeIdSchema,
  })
  .strict();

/** Validated eBay path used to retrieve one category tree. */
export type CategoryTreeLookupArguments = z.infer<typeof getCategoryTreeArgumentsSchema>;

/** Exact eBay path and query fields accepted by getCategorySuggestions. */
export const getCategorySuggestionsArgumentsSchema = z
  .object({
    category_tree_id: categoryTreeIdSchema,
    q: z.string().min(1),
  })
  .strict();

/** Validated eBay fields used to retrieve category suggestions. */
export type CategorySuggestionArguments = z.infer<typeof getCategorySuggestionsArgumentsSchema>;

/** Exact eBay path and query fields accepted by getItemAspectsForCategory. */
export const getItemAspectsForCategoryArgumentsSchema = z
  .object({
    category_id: categoryIdSchema,
    category_tree_id: categoryTreeIdSchema,
  })
  .strict();

/** Validated eBay fields used to retrieve the aspects for one leaf category. */
export type CategoryAspectSearchArguments = z.infer<
  typeof getItemAspectsForCategoryArgumentsSchema
>;

/**
 * Marketplace category-tree reference generated from the official Commerce Taxonomy specification.
 *
 * @see https://developer.ebay.com/api-docs/commerce/taxonomy/types/txn:BaseCategoryTree
 */
export type MarketplaceCategoryTree = components['schemas']['BaseCategoryTree'];

/**
 * Complete category tree generated from the official Commerce Taxonomy specification.
 *
 * @see https://developer.ebay.com/api-docs/commerce/taxonomy/types/txn:CategoryTree
 */
export type EbayCategoryTree = components['schemas']['CategoryTree'];

/**
 * Suggested categories generated from the official Commerce Taxonomy specification.
 *
 * @see https://developer.ebay.com/api-docs/commerce/taxonomy/types/txn:CategorySuggestionResponse
 */
export type CategorySuggestionPage = components['schemas']['CategorySuggestionResponse'];

/**
 * Category aspect metadata generated from the official Commerce Taxonomy specification.
 *
 * @see https://developer.ebay.com/api-docs/commerce/taxonomy/types/txn:AspectMetadata
 */
export type CategoryAspectMetadata = components['schemas']['AspectMetadata'];

/**
 * Retrieves the default category-tree reference for one marketplace.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param defaultCategoryTreeLookup - Exact eBay marketplace query field.
 * @returns Explicit completion containing the unchanged generated tree reference or failure.
 *
 * @example
 * ```ts
 * const completion = await getDefaultCategoryTreeId(sellerSession, {
 *   marketplace_id: 'EBAY_US',
 * });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/commerce/taxonomy/resources/category_tree/methods/getDefaultCategoryTreeId
 */
export const getDefaultCategoryTreeId = (
  sellerSession: EbaySellerSession,
  defaultCategoryTreeLookup: DefaultCategoryTreeArguments,
): Promise<EbayRequestCompletion<MarketplaceCategoryTree>> =>
  sellerSession.get<MarketplaceCategoryTree>({
    endpoint: '/commerce/taxonomy/v1/get_default_category_tree_id',
    searchParameters: defaultCategoryTreeLookup,
  });

/**
 * Retrieves one complete eBay category tree.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param categoryTreeLookup - Exact eBay category-tree path field.
 * @returns Explicit completion containing the unchanged generated category tree or failure.
 *
 * @example
 * ```ts
 * const completion = await getCategoryTree(sellerSession, { category_tree_id: '0' });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/commerce/taxonomy/resources/category_tree/methods/getCategoryTree
 */
export const getCategoryTree = (
  sellerSession: EbaySellerSession,
  categoryTreeLookup: CategoryTreeLookupArguments,
): Promise<EbayRequestCompletion<EbayCategoryTree>> =>
  sellerSession.get<EbayCategoryTree>({
    endpoint: `/commerce/taxonomy/v1/category_tree/${encodeURIComponent(categoryTreeLookup.category_tree_id)}`,
  });

/**
 * Retrieves leaf-category suggestions for listing text.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param categorySuggestionSearch - Exact eBay category-tree path and q fields.
 * @returns Explicit completion containing unchanged generated category suggestions or failure.
 *
 * @example
 * ```ts
 * const completion = await getCategorySuggestions(sellerSession, {
 *   category_tree_id: '0',
 *   q: 'smartphone',
 * });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/commerce/taxonomy/resources/category_tree/methods/getCategorySuggestions
 */
export const getCategorySuggestions = (
  sellerSession: EbaySellerSession,
  categorySuggestionSearch: CategorySuggestionArguments,
): Promise<EbayRequestCompletion<CategorySuggestionPage>> => {
  const { category_tree_id: categoryTreeId, ...suggestionSearch } = categorySuggestionSearch;

  return sellerSession.get<CategorySuggestionPage>({
    endpoint: `/commerce/taxonomy/v1/category_tree/${encodeURIComponent(categoryTreeId)}/get_category_suggestions`,
    searchParameters: suggestionSearch,
  });
};

/**
 * Retrieves the listing aspects for one leaf category.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param categoryAspectSearch - Exact eBay category-tree path and category query fields.
 * @returns Explicit completion containing unchanged generated aspect metadata or failure.
 *
 * @example
 * ```ts
 * const completion = await getItemAspectsForCategory(sellerSession, {
 *   category_tree_id: '0',
 *   category_id: '9355',
 * });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/commerce/taxonomy/resources/category_tree/methods/getItemAspectsForCategory
 */
export const getItemAspectsForCategory = (
  sellerSession: EbaySellerSession,
  categoryAspectSearch: CategoryAspectSearchArguments,
): Promise<EbayRequestCompletion<CategoryAspectMetadata>> => {
  const { category_tree_id: categoryTreeId, ...aspectSearch } = categoryAspectSearch;

  return sellerSession.get<CategoryAspectMetadata>({
    endpoint: `/commerce/taxonomy/v1/category_tree/${encodeURIComponent(categoryTreeId)}/get_item_aspects_for_category`,
    searchParameters: aspectSearch,
  });
};

/** MCP definition for Commerce Taxonomy getDefaultCategoryTreeId. */
export const getDefaultCategoryTreeIdTool = defineTool({
  name: 'ebay_commerce_taxonomy_get_default_category_tree_id',
  namespace: 'commerce.taxonomy',
  description: 'Retrieve the default category-tree reference for one marketplace',
  argumentsSchema: getDefaultCategoryTreeIdArgumentsSchema,
  operationKind: 'read',
  operation: getDefaultCategoryTreeId,
});

/** MCP definition for Commerce Taxonomy getCategoryTree. */
export const getCategoryTreeTool = defineTool({
  name: 'ebay_commerce_taxonomy_get_category_tree',
  namespace: 'commerce.taxonomy',
  description: 'Retrieve one complete eBay category tree',
  argumentsSchema: getCategoryTreeArgumentsSchema,
  operationKind: 'read',
  operation: getCategoryTree,
});

/** MCP definition for Commerce Taxonomy getCategorySuggestions. */
export const getCategorySuggestionsTool = defineTool({
  name: 'ebay_commerce_taxonomy_get_category_suggestions',
  namespace: 'commerce.taxonomy',
  description: 'Retrieve eBay leaf-category suggestions for listing text',
  argumentsSchema: getCategorySuggestionsArgumentsSchema,
  operationKind: 'read',
  operation: getCategorySuggestions,
});

/** MCP definition for Commerce Taxonomy getItemAspectsForCategory. */
export const getItemAspectsForCategoryTool = defineTool({
  name: 'ebay_commerce_taxonomy_get_item_aspects_for_category',
  namespace: 'commerce.taxonomy',
  description: 'Retrieve the listing aspects for one leaf category',
  argumentsSchema: getItemAspectsForCategoryArgumentsSchema,
  operationKind: 'read',
  operation: getItemAspectsForCategory,
});
