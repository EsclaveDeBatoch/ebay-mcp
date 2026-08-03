import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/listing-metadata/sellMetadataV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';

const marketplaceHeaderSchema = z.string().min(1);
const datasetSchema = z.enum([
  'DisplayableProductDetails',
  'DisplayableSearchResults',
  'Searchable',
  'Sortable',
]);

const compatibilityPropertySchema = z
  .object({
    propertyName: z.string().min(1),
    propertyValue: z.string().min(1).optional(),
    unitOfMeasurement: z.string().min(1).optional(),
    url: z.url().optional(),
  })
  .strict();

const compatibilityPageSchema = z
  .object({
    limit: z.number().int().positive().max(100).optional(),
    offset: z.number().int().nonnegative().optional(),
  })
  .strict();

const compatibilitySortSchema = z
  .object({
    sortOrder: z
      .object({
        order: z.enum(['Ascending', 'Descending']),
        propertyName: z.string().min(1),
      })
      .strict(),
    sortPriority: z.enum(['Sort1', 'Sort2', 'Sort3', 'Sort4', 'Sort5']),
  })
  .strict();

const productIdentifierSchema = z
  .object({
    ean: z.string().min(1).optional(),
    epid: z.string().min(1).optional(),
    isbn: z.string().min(1).optional(),
    productId: z.string().min(1).optional(),
    upc: z.string().min(1).optional(),
  })
  .strict()
  .superRefine((identifierSelection, validation) => {
    if (
      identifierSelection.ean === undefined &&
      identifierSelection.epid === undefined &&
      identifierSelection.isbn === undefined &&
      identifierSelection.productId === undefined &&
      identifierSelection.upc === undefined
    ) {
      validation.addIssue({
        code: 'custom',
        message: 'one product identifier is required',
      });
    }
  });

/** Exact eBay header and document fields accepted by getCompatibilitiesBySpecification. */
export const compatibilitySpecificationArgumentsSchema = z
  .object({
    categoryId: z.string().min(1),
    compatibilityPropertyFilters: z.array(compatibilityPropertySchema).min(1).optional(),
    dataset: datasetSchema.optional(),
    datasetPropertyName: z.array(z.string().min(1)).min(1).optional(),
    exactMatch: z.boolean().optional(),
    paginationInput: compatibilityPageSchema.optional(),
    sortOrders: z.array(compatibilitySortSchema).min(1).max(5).optional(),
    specifications: z.array(compatibilityPropertySchema).min(1),
    'X-EBAY-C-MARKETPLACE-ID': marketplaceHeaderSchema,
  })
  .strict();

/** Exact eBay header and document fields accepted by getCompatibilityPropertyNames. */
export const compatibilityPropertyNamesArgumentsSchema = z
  .object({
    categoryId: z.string().min(1),
    dataset: z.array(datasetSchema).min(1).optional(),
    'X-EBAY-C-MARKETPLACE-ID': marketplaceHeaderSchema,
  })
  .strict();

/** Exact eBay header and document fields accepted by getCompatibilityPropertyValues. */
export const compatibilityPropertyValuesArgumentsSchema = z
  .object({
    categoryId: z.string().min(1),
    propertyFilters: z.array(compatibilityPropertySchema).min(1).optional(),
    propertyName: z.string().min(1),
    sortOrder: z.enum(['Ascending', 'Descending']).optional(),
    'X-EBAY-C-MARKETPLACE-ID': marketplaceHeaderSchema,
  })
  .strict();

/** Exact eBay header and document fields accepted by getMultiCompatibilityPropertyValues. */
export const multiCompatibilityPropertyValuesArgumentsSchema = z
  .object({
    categoryId: z.string().min(1),
    propertyFilters: z.array(compatibilityPropertySchema).min(1),
    propertyNames: z.array(z.string().min(1)).min(1),
    'X-EBAY-C-MARKETPLACE-ID': marketplaceHeaderSchema,
  })
  .strict();

/** Exact eBay header and document fields accepted by getProductCompatibilities. */
export const productCompatibilitiesArgumentsSchema = z
  .object({
    applicationPropertyFilters: z.array(compatibilityPropertySchema).min(1).optional(),
    dataset: z.array(datasetSchema).min(1).optional(),
    datasetPropertyName: z.array(z.string().min(1)).min(1).optional(),
    disabledProductFilter: z
      .object({
        excludeForEbayReviews: z.boolean().optional(),
        excludeForEbaySelling: z.boolean().optional(),
      })
      .strict()
      .optional(),
    paginationInput: compatibilityPageSchema.optional(),
    productIdentifier: productIdentifierSchema,
    sortOrders: z.array(compatibilitySortSchema).min(1).max(5).optional(),
    'X-EBAY-C-MARKETPLACE-ID': marketplaceHeaderSchema,
  })
  .strict();

/** Validated compatibility specification fields. */
export type CompatibilitySpecificationArguments = z.infer<
  typeof compatibilitySpecificationArgumentsSchema
>;

/** Validated compatibility property-name fields. */
export type CompatibilityPropertyNamesArguments = z.infer<
  typeof compatibilityPropertyNamesArgumentsSchema
>;

/** Validated compatibility property-value fields. */
export type CompatibilityPropertyValuesArguments = z.infer<
  typeof compatibilityPropertyValuesArgumentsSchema
>;

/** Validated multi-property compatibility fields. */
export type MultiCompatibilityPropertyValuesArguments = z.infer<
  typeof multiCompatibilityPropertyValuesArgumentsSchema
>;

/** Validated product compatibility fields. */
export type ProductCompatibilitiesArguments = z.infer<typeof productCompatibilitiesArgumentsSchema>;

/** @see https://developer.ebay.com/api-docs/sell/metadata/types/api:SpecificationResponse */
export type SpecificationCompatibilities =
  | components['schemas']['SpecificationResponse']
  | undefined;

/** @see https://developer.ebay.com/api-docs/sell/metadata/types/api:PropertyNamesResponse */
export type CompatibilityPropertyNames = components['schemas']['PropertyNamesResponse'] | undefined;

/** @see https://developer.ebay.com/api-docs/sell/metadata/types/api:PropertyValuesResponse */
export type CompatibilityPropertyValues =
  | components['schemas']['PropertyValuesResponse']
  | undefined;

/** @see https://developer.ebay.com/api-docs/sell/metadata/types/api:MultiCompatibilityPropertyValuesResponse */
export type MultiCompatibilityPropertyValues =
  | components['schemas']['MultiCompatibilityPropertyValuesResponse']
  | undefined;

/** @see https://developer.ebay.com/api-docs/sell/metadata/types/api:ProductResponse */
export type ProductCompatibilities = components['schemas']['ProductResponse'] | undefined;

/**
 * Retrieves compatible applications matching part specifications.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param compatibilitySpecificationArguments - Exact eBay marketplace header and specification document.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 * @example `await getCompatibilitiesBySpecification(sellerSession, { 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_DE', categoryId: '6016', specifications: [{ propertyName: 'Year', propertyValue: '2024' }] })`
 * @see https://developer.ebay.com/api-docs/sell/metadata/resources/compatibilities/methods/getCompatibilitiesBySpecification
 */
export const getCompatibilitiesBySpecification = (
  sellerSession: EbaySellerSession,
  compatibilitySpecificationArguments: CompatibilitySpecificationArguments,
): Promise<EbayRequestCompletion<SpecificationCompatibilities>> => {
  const { 'X-EBAY-C-MARKETPLACE-ID': marketplaceId, ...compatibilitySpecification } =
    compatibilitySpecificationArguments;
  return sellerSession.post<SpecificationCompatibilities>({
    endpoint: '/sell/metadata/v1/compatibilities/get_compatibilities_by_specification',
    requestDocument: compatibilitySpecification,
    requestHeaders: { 'X-EBAY-C-MARKETPLACE-ID': marketplaceId },
  });
};

/**
 * Retrieves property names for a compatibility-enabled category.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param propertyNamesArguments - Exact eBay marketplace header and property-name document.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 * @example `await getCompatibilityPropertyNames(sellerSession, { 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_DE', categoryId: '6016' })`
 * @see https://developer.ebay.com/api-docs/sell/metadata/resources/compatibilities/methods/getCompatibilityPropertyNames
 */
export const getCompatibilityPropertyNames = (
  sellerSession: EbaySellerSession,
  propertyNamesArguments: CompatibilityPropertyNamesArguments,
): Promise<EbayRequestCompletion<CompatibilityPropertyNames>> => {
  const { 'X-EBAY-C-MARKETPLACE-ID': marketplaceId, ...propertyNameSearch } =
    propertyNamesArguments;
  return sellerSession.post<CompatibilityPropertyNames>({
    endpoint: '/sell/metadata/v1/compatibilities/get_compatibility_property_names',
    requestDocument: propertyNameSearch,
    requestHeaders: { 'X-EBAY-C-MARKETPLACE-ID': marketplaceId },
  });
};

/**
 * Retrieves possible values for one compatibility property.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param propertyValuesArguments - Exact eBay marketplace header and property-value document.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 * @example `await getCompatibilityPropertyValues(sellerSession, { 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_DE', categoryId: '6016', propertyName: 'Make' })`
 * @see https://developer.ebay.com/api-docs/sell/metadata/resources/compatibilities/methods/getCompatibilityPropertyValues
 */
export const getCompatibilityPropertyValues = (
  sellerSession: EbaySellerSession,
  propertyValuesArguments: CompatibilityPropertyValuesArguments,
): Promise<EbayRequestCompletion<CompatibilityPropertyValues>> => {
  const { 'X-EBAY-C-MARKETPLACE-ID': marketplaceId, ...propertyValueSearch } =
    propertyValuesArguments;
  return sellerSession.post<CompatibilityPropertyValues>({
    endpoint: '/sell/metadata/v1/compatibilities/get_compatibility_property_values',
    requestDocument: propertyValueSearch,
    requestHeaders: { 'X-EBAY-C-MARKETPLACE-ID': marketplaceId },
  });
};

/**
 * Retrieves possible values for multiple compatibility properties.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param multiPropertyArguments - Exact eBay marketplace header and multi-property document.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 * @example `await getMultiCompatibilityPropertyValues(sellerSession, { 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_DE', categoryId: '6016', propertyFilters: [{ propertyName: 'Year', propertyValue: '2024' }], propertyNames: ['Make', 'Model'] })`
 * @see https://developer.ebay.com/api-docs/sell/metadata/resources/compatibilities/methods/getMultiCompatibilityPropertyValues
 */
export const getMultiCompatibilityPropertyValues = (
  sellerSession: EbaySellerSession,
  multiPropertyArguments: MultiCompatibilityPropertyValuesArguments,
): Promise<EbayRequestCompletion<MultiCompatibilityPropertyValues>> => {
  const { 'X-EBAY-C-MARKETPLACE-ID': marketplaceId, ...multiPropertySearch } =
    multiPropertyArguments;
  return sellerSession.post<MultiCompatibilityPropertyValues>({
    endpoint: '/sell/metadata/v1/compatibilities/get_multi_compatibility_property_values',
    requestDocument: multiPropertySearch,
    requestHeaders: { 'X-EBAY-C-MARKETPLACE-ID': marketplaceId },
  });
};

/**
 * Retrieves compatible applications for one catalog product.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param productCompatibilitiesArguments - Exact eBay marketplace header and product document.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 * @example `await getProductCompatibilities(sellerSession, { 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_DE', productIdentifier: { epid: '12345' } })`
 * @see https://developer.ebay.com/api-docs/sell/metadata/resources/compatibilities/methods/getProductCompatibilities
 */
export const getProductCompatibilities = (
  sellerSession: EbaySellerSession,
  productCompatibilitiesArguments: ProductCompatibilitiesArguments,
): Promise<EbayRequestCompletion<ProductCompatibilities>> => {
  const { 'X-EBAY-C-MARKETPLACE-ID': marketplaceId, ...productCompatibilitySearch } =
    productCompatibilitiesArguments;
  return sellerSession.post<ProductCompatibilities>({
    endpoint: '/sell/metadata/v1/compatibilities/get_product_compatibilities',
    requestDocument: productCompatibilitySearch,
    requestHeaders: { 'X-EBAY-C-MARKETPLACE-ID': marketplaceId },
  });
};

export const getCompatibilitiesBySpecificationTool = defineTool({
  name: 'ebay_sell_metadata_get_compatibilities_by_specification',
  namespace: 'sell.metadata',
  description: 'Retrieve compatible applications matching part specifications',
  argumentsSchema: compatibilitySpecificationArgumentsSchema,
  operationKind: 'read',
  operation: getCompatibilitiesBySpecification,
});

export const getCompatibilityPropertyNamesTool = defineTool({
  name: 'ebay_sell_metadata_get_compatibility_property_names',
  namespace: 'sell.metadata',
  description: 'Retrieve property names for a compatibility-enabled category',
  argumentsSchema: compatibilityPropertyNamesArgumentsSchema,
  operationKind: 'read',
  operation: getCompatibilityPropertyNames,
});

export const getCompatibilityPropertyValuesTool = defineTool({
  name: 'ebay_sell_metadata_get_compatibility_property_values',
  namespace: 'sell.metadata',
  description: 'Retrieve possible values for one compatibility property',
  argumentsSchema: compatibilityPropertyValuesArgumentsSchema,
  operationKind: 'read',
  operation: getCompatibilityPropertyValues,
});

export const getMultiCompatibilityPropertyValuesTool = defineTool({
  name: 'ebay_sell_metadata_get_multi_compatibility_property_values',
  namespace: 'sell.metadata',
  description: 'Retrieve possible values for multiple compatibility properties',
  argumentsSchema: multiCompatibilityPropertyValuesArgumentsSchema,
  operationKind: 'read',
  operation: getMultiCompatibilityPropertyValues,
});

export const getProductCompatibilitiesTool = defineTool({
  name: 'ebay_sell_metadata_get_product_compatibilities',
  namespace: 'sell.metadata',
  description: 'Retrieve compatible applications for one catalog product',
  argumentsSchema: productCompatibilitiesArgumentsSchema,
  operationKind: 'read',
  operation: getProductCompatibilities,
});
