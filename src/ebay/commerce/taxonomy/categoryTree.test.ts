import { describe, expect, it } from 'vitest';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import {
  categoryAspectMetadataDocument,
  categorySuggestionPageDocument,
  ebayCategoryTreeDocument,
  marketplaceCategoryTreeDocument,
} from '@tests/fixtures/categoryTree.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

import {
  type CategoryAspectMetadata,
  type CategoryAspectSearchArguments,
  type CategorySuggestionArguments,
  type CategorySuggestionPage,
  type CategoryTreeLookupArguments,
  type DefaultCategoryTreeArguments,
  type EbayCategoryTree,
  getCategorySuggestions,
  getCategorySuggestionsArgumentsSchema,
  getCategoryTree,
  getCategoryTreeArgumentsSchema,
  getDefaultCategoryTreeId,
  getDefaultCategoryTreeIdArgumentsSchema,
  getItemAspectsForCategory,
  getItemAspectsForCategoryArgumentsSchema,
  type MarketplaceCategoryTree,
} from './categoryTree.js';

const defaultCategoryTreeLookup: DefaultCategoryTreeArguments = {
  marketplace_id: 'EBAY_US',
};
const categoryTreeLookup: CategoryTreeLookupArguments = {
  category_tree_id: '0',
};
const categorySuggestionSearch: CategorySuggestionArguments = {
  category_tree_id: '0',
  q: 'smartphone',
};
const categoryAspectSearch: CategoryAspectSearchArguments = {
  category_id: '9355',
  category_tree_id: '0',
};

describe('Commerce Taxonomy category-tree arguments', () => {
  it.each([
    [getDefaultCategoryTreeIdArgumentsSchema, defaultCategoryTreeLookup],
    [getCategoryTreeArgumentsSchema, categoryTreeLookup],
    [getCategorySuggestionsArgumentsSchema, categorySuggestionSearch],
    [getItemAspectsForCategoryArgumentsSchema, categoryAspectSearch],
  ])('accepts exact eBay wire fields', (argumentContract, acceptedArguments) => {
    expect(argumentContract.parse(acceptedArguments)).toEqual(acceptedArguments);
  });

  it.each([
    [getDefaultCategoryTreeIdArgumentsSchema, { marketplaceId: 'EBAY_US' }],
    [getCategoryTreeArgumentsSchema, { categoryTreeId: '0' }],
    [getCategorySuggestionsArgumentsSchema, { category_tree_id: '0', query: 'smartphone' }],
    [getItemAspectsForCategoryArgumentsSchema, { category_tree_id: '0', categoryId: '9355' }],
  ])('rejects renamed convenience fields', (argumentContract, renamedArguments) => {
    expect(argumentContract.safeParse(renamedArguments).success).toBe(false);
  });

  it.each([
    [getDefaultCategoryTreeIdArgumentsSchema, { marketplace_id: '' }],
    [getCategoryTreeArgumentsSchema, { category_tree_id: '', cache: true }],
    [getCategorySuggestionsArgumentsSchema, { category_tree_id: '0', q: '' }],
    [getItemAspectsForCategoryArgumentsSchema, { category_id: '', category_tree_id: '0' }],
  ])('rejects empty or unknown fields', (argumentContract, invalidArguments) => {
    expect(argumentContract.safeParse(invalidArguments).success).toBe(false);
  });
});

describe('Commerce Taxonomy category-tree operations', () => {
  it('passes the exact marketplace query and preserves the generated tree reference', async () => {
    const successfulLookup: EbayRequestCompletion<MarketplaceCategoryTree> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: marketplaceCategoryTreeDocument,
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulLookup);

    const lookupCompletion = await getDefaultCategoryTreeId(
      sellerSession,
      defaultCategoryTreeLookup,
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/commerce/taxonomy/v1/get_default_category_tree_id',
        searchParameters: defaultCategoryTreeLookup,
      },
    ]);
    expect(lookupCompletion).toBe(successfulLookup);
  });

  it('encodes the tree ID and preserves the generated category tree', async () => {
    const successfulLookup: EbayRequestCompletion<EbayCategoryTree> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: ebayCategoryTreeDocument,
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulLookup);

    const lookupCompletion = await getCategoryTree(sellerSession, {
      category_tree_id: 'US/0',
    });

    expect(getCalls).toEqual([{ endpoint: '/commerce/taxonomy/v1/category_tree/US%2F0' }]);
    expect(lookupCompletion).toBe(successfulLookup);
  });

  it('keeps q in the query and preserves generated suggestions', async () => {
    const successfulSearch: EbayRequestCompletion<CategorySuggestionPage> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: categorySuggestionPageDocument,
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulSearch);

    const searchCompletion = await getCategorySuggestions(sellerSession, {
      category_tree_id: 'US/0',
      q: 'smartphone',
    });

    expect(getCalls).toEqual([
      {
        endpoint: '/commerce/taxonomy/v1/category_tree/US%2F0/get_category_suggestions',
        searchParameters: { q: 'smartphone' },
      },
    ]);
    expect(searchCompletion).toBe(successfulSearch);
  });

  it('keeps category_id in the query and preserves generated aspect metadata', async () => {
    const successfulSearch: EbayRequestCompletion<CategoryAspectMetadata> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: categoryAspectMetadataDocument,
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulSearch);

    const searchCompletion = await getItemAspectsForCategory(sellerSession, {
      category_id: '9355/phone',
      category_tree_id: 'US/0',
    });

    expect(getCalls).toEqual([
      {
        endpoint: '/commerce/taxonomy/v1/category_tree/US%2F0/get_item_aspects_for_category',
        searchParameters: { category_id: '9355/phone' },
      },
    ]);
    expect(searchCompletion).toBe(successfulSearch);
  });
});

describe('Commerce Taxonomy category-tree failures', () => {
  it.each(ebayFailures)('passes a $kind default-tree failure through', async (ebayFailure) => {
    const failedLookup: EbayRequestCompletion<MarketplaceCategoryTree> = {
      kind: 'ebayRequestFailed',
      ebayFailure,
    };
    const { sellerSession } = sellerSessionReturning(failedLookup);

    await expect(getDefaultCategoryTreeId(sellerSession, defaultCategoryTreeLookup)).resolves.toBe(
      failedLookup,
    );
  });

  it.each(ebayFailures)('passes a $kind tree failure through', async (ebayFailure) => {
    const failedLookup: EbayRequestCompletion<EbayCategoryTree> = {
      kind: 'ebayRequestFailed',
      ebayFailure,
    };
    const { sellerSession } = sellerSessionReturning(failedLookup);

    await expect(getCategoryTree(sellerSession, categoryTreeLookup)).resolves.toBe(failedLookup);
  });

  it.each(ebayFailures)('passes a $kind suggestion failure through', async (ebayFailure) => {
    const failedSearch: EbayRequestCompletion<CategorySuggestionPage> = {
      kind: 'ebayRequestFailed',
      ebayFailure,
    };
    const { sellerSession } = sellerSessionReturning(failedSearch);

    await expect(getCategorySuggestions(sellerSession, categorySuggestionSearch)).resolves.toBe(
      failedSearch,
    );
  });

  it.each(ebayFailures)('passes a $kind aspect failure through', async (ebayFailure) => {
    const failedSearch: EbayRequestCompletion<CategoryAspectMetadata> = {
      kind: 'ebayRequestFailed',
      ebayFailure,
    };
    const { sellerSession } = sellerSessionReturning(failedSearch);

    await expect(getItemAspectsForCategory(sellerSession, categoryAspectSearch)).resolves.toBe(
      failedSearch,
    );
  });
});
