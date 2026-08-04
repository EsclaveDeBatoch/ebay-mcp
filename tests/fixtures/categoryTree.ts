import type {
  CategoryAspectMetadata,
  CategorySuggestionPage,
  EbayCategoryTree,
  MarketplaceCategoryTree,
} from '@/ebay/commerce/taxonomy/categoryTree.js';

export const marketplaceCategoryTreeDocument: MarketplaceCategoryTree = {
  categoryTreeId: '0',
  categoryTreeVersion: '132',
};

export const ebayCategoryTreeDocument: EbayCategoryTree = {
  applicableMarketplaceIds: ['EBAY_US'],
  categoryTreeId: '0',
  categoryTreeVersion: '132',
  rootCategoryNode: {
    category: {
      categoryId: '-1',
      categoryName: 'Root',
    },
    categoryTreeNodeLevel: 0,
    childCategoryTreeNodes: [
      {
        category: {
          categoryId: '9355',
          categoryName: 'Cell Phones & Smartphones',
        },
        categoryTreeNodeLevel: 1,
        leafCategoryTreeNode: true,
      },
    ],
  },
};

export const categorySuggestionPageDocument: CategorySuggestionPage = {
  categorySuggestions: [
    {
      category: {
        categoryId: '9355',
        categoryName: 'Cell Phones & Smartphones',
      },
      categoryTreeNodeAncestors: [
        {
          categoryId: '-1',
          categoryName: 'Root',
          categoryTreeNodeLevel: 0,
        },
      ],
      categoryTreeNodeLevel: 1,
      relevancy: '0.99',
    },
  ],
  categoryTreeId: '0',
  categoryTreeVersion: '132',
};

export const categoryAspectMetadataDocument: CategoryAspectMetadata = {
  aspects: [
    {
      aspectConstraint: {
        aspectDataType: 'STRING',
        aspectMode: 'SELECTION_ONLY',
        aspectRequired: true,
        aspectUsage: 'RECOMMENDED',
        itemToAspectCardinality: 'SINGLE',
      },
      aspectValues: [{ localizedValue: 'Black' }],
      localizedAspectName: 'Color',
    },
  ],
};
