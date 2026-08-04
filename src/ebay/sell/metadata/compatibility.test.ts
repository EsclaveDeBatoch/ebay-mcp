import { describe, expect, it } from 'vitest';

import {
  compatibilityPropertyNamesArgumentsSchema,
  compatibilityPropertyValuesArgumentsSchema,
  compatibilitySpecificationArgumentsSchema,
  getCompatibilitiesBySpecification,
  getCompatibilityPropertyNames,
  getCompatibilityPropertyValues,
  getMultiCompatibilityPropertyValues,
  getProductCompatibilities,
  multiCompatibilityPropertyValuesArgumentsSchema,
  productCompatibilitiesArgumentsSchema,
} from '@/ebay/sell/metadata/compatibility.js';
import { sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

describe('Sell Metadata compatibility schemas', () => {
  it('accepts a direct specification document with the exact marketplace header', () => {
    const compatibilitySpecification = {
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_DE',
      categoryId: '6016',
      exactMatch: true,
      specifications: [{ propertyName: 'Year', propertyValue: '2024' }],
    };

    expect(compatibilitySpecificationArgumentsSchema.parse(compatibilitySpecification)).toEqual(
      compatibilitySpecification,
    );
  });

  it.each([
    {
      marketplaceId: 'EBAY_DE',
      specification: {
        categoryId: '6016',
        specifications: [{ propertyName: 'Year', propertyValue: '2024' }],
      },
    },
    { 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_DE', categoryId: '6016', specifications: [] },
    {
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_DE',
      categoryId: '6016',
      specifications: [{ propertyName: '' }],
    },
  ])('rejects wrappers and incomplete specifications', (invalidSpecificationArguments) => {
    expect(() =>
      compatibilitySpecificationArgumentsSchema.parse(invalidSpecificationArguments),
    ).toThrow();
  });

  it('requires category and property names for property searches', () => {
    expect(() =>
      compatibilityPropertyNamesArgumentsSchema.parse({
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_DE',
      }),
    ).toThrow();
    expect(() =>
      compatibilityPropertyValuesArgumentsSchema.parse({
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_DE',
        categoryId: '6016',
      }),
    ).toThrow();
  });

  it('requires filters and requested names for a multi-property search', () => {
    expect(() =>
      multiCompatibilityPropertyValuesArgumentsSchema.parse({
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_DE',
        categoryId: '6016',
        propertyFilters: [],
        propertyNames: ['Make'],
      }),
    ).toThrow();
  });

  it('requires one non-empty product identifier', () => {
    expect(() =>
      productCompatibilitiesArgumentsSchema.parse({
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_DE',
        productIdentifier: {},
      }),
    ).toThrow();
  });
});

describe('Sell Metadata compatibility operations', () => {
  it('sends a direct specification document beneath the marketplace header', async () => {
    const { sellerSession, postCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await getCompatibilitiesBySpecification(sellerSession, {
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_DE',
      categoryId: '6016',
      exactMatch: true,
      specifications: [{ propertyName: 'Year', propertyValue: '2024' }],
    });

    expect(postCalls).toEqual([
      {
        endpoint: '/sell/metadata/v1/compatibilities/get_compatibilities_by_specification',
        requestDocument: {
          categoryId: '6016',
          exactMatch: true,
          specifications: [{ propertyName: 'Year', propertyValue: '2024' }],
        },
        requestHeaders: { 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_DE' },
      },
    ]);
  });

  it('sends a direct property-name document beneath the marketplace header', async () => {
    const { sellerSession, postCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await getCompatibilityPropertyNames(sellerSession, {
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_DE',
      categoryId: '6016',
      dataset: ['Searchable'],
    });

    expect(postCalls).toEqual([
      {
        endpoint: '/sell/metadata/v1/compatibilities/get_compatibility_property_names',
        requestDocument: { categoryId: '6016', dataset: ['Searchable'] },
        requestHeaders: { 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_DE' },
      },
    ]);
  });

  it('sends a direct property-value document beneath the marketplace header', async () => {
    const { sellerSession, postCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await getCompatibilityPropertyValues(sellerSession, {
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_DE',
      categoryId: '6016',
      propertyName: 'Make',
      sortOrder: 'Ascending',
    });

    expect(postCalls).toEqual([
      {
        endpoint: '/sell/metadata/v1/compatibilities/get_compatibility_property_values',
        requestDocument: { categoryId: '6016', propertyName: 'Make', sortOrder: 'Ascending' },
        requestHeaders: { 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_DE' },
      },
    ]);
  });

  it('sends direct multi-property fields beneath the marketplace header', async () => {
    const { sellerSession, postCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await getMultiCompatibilityPropertyValues(sellerSession, {
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_DE',
      categoryId: '6016',
      propertyFilters: [{ propertyName: 'Year', propertyValue: '2024' }],
      propertyNames: ['Make', 'Model'],
    });

    expect(postCalls).toEqual([
      {
        endpoint: '/sell/metadata/v1/compatibilities/get_multi_compatibility_property_values',
        requestDocument: {
          categoryId: '6016',
          propertyFilters: [{ propertyName: 'Year', propertyValue: '2024' }],
          propertyNames: ['Make', 'Model'],
        },
        requestHeaders: { 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_DE' },
      },
    ]);
  });

  it('sends direct product fields beneath the marketplace header', async () => {
    const { sellerSession, postCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await getProductCompatibilities(sellerSession, {
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_DE',
      productIdentifier: { epid: '12345' },
    });

    expect(postCalls).toEqual([
      {
        endpoint: '/sell/metadata/v1/compatibilities/get_product_compatibilities',
        requestDocument: { productIdentifier: { epid: '12345' } },
        requestHeaders: { 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_DE' },
      },
    ]);
  });
});
