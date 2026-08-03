import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/account-management/sellAccountV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';

const salesTaxCountryCodeSchema = z.enum(['US', 'CA']);
const salesTaxJurisdictionIdSchema = z.string().min(1);
const salesTaxPercentageSchema = z
  .string()
  .regex(/^(?:0|[1-9]\d*)(?:\.\d+)?$/, 'salesTaxPercentage must be a non-negative decimal')
  .refine(
    (salesTaxPercentage) => Number(salesTaxPercentage) <= 100,
    'salesTaxPercentage cannot exceed 100',
  );

const salesTaxDocumentFields = {
  salesTaxPercentage: salesTaxPercentageSchema,
  shippingAndHandlingTaxed: z.boolean().optional(),
};

const salesTaxInputSchema = z
  .object({
    countryCode: salesTaxCountryCodeSchema,
    salesTaxJurisdictionId: salesTaxJurisdictionIdSchema,
    ...salesTaxDocumentFields,
  })
  .strict();

/** Exact eBay path accepted by getSalesTax and deleteSalesTax. */
export const salesTaxEntryArgumentsSchema = z
  .object({
    countryCode: salesTaxCountryCodeSchema,
    jurisdictionId: salesTaxJurisdictionIdSchema,
  })
  .strict();

/** Exact eBay path and direct document accepted by createOrReplaceSalesTax. */
export const createOrReplaceSalesTaxArgumentsSchema = z
  .object({
    countryCode: salesTaxCountryCodeSchema,
    jurisdictionId: salesTaxJurisdictionIdSchema,
    ...salesTaxDocumentFields,
  })
  .strict();

/** Direct eBay bulk sales-tax document accepted by bulkCreateOrReplaceSalesTax. */
export const bulkCreateOrReplaceSalesTaxArgumentsSchema = z
  .object({ salesTaxInputList: z.array(salesTaxInputSchema).min(1) })
  .strict();

/** Exact eBay query accepted by getSalesTaxes. */
export const getSalesTaxesArgumentsSchema = z
  .object({ country_code: salesTaxCountryCodeSchema })
  .strict();

/** Validated eBay sales-tax country and jurisdiction path. */
export type SalesTaxEntryArguments = z.infer<typeof salesTaxEntryArgumentsSchema>;

/** Validated path and direct document for one sales-tax replacement. */
export type CreateOrReplaceSalesTaxArguments = z.infer<
  typeof createOrReplaceSalesTaxArgumentsSchema
>;

/** Validated direct eBay document for bulk sales-tax replacement. */
export type BulkCreateOrReplaceSalesTaxArguments = z.infer<
  typeof bulkCreateOrReplaceSalesTaxArgumentsSchema
>;

/** Validated exact eBay country query for sales-tax collection reads. */
export type GetSalesTaxesArguments = z.infer<typeof getSalesTaxesArgumentsSchema>;

/** @see https://developer.ebay.com/api-docs/sell/account/types/api:SalesTax */
export type SalesTax = components['schemas']['SalesTax'];

/** @see https://developer.ebay.com/api-docs/sell/account/types/api:SalesTaxes */
export type SalesTaxCollection = components['schemas']['SalesTaxes'];

/** @see https://developer.ebay.com/api-docs/sell/account/types/api:UpdatedSalesTaxResponse */
export type UpdatedSalesTaxCollection = components['schemas']['UpdatedSalesTaxResponse'];

/**
 * Creates or replaces one sales-tax entry for a country jurisdiction.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param salesTaxReplacement - Exact eBay path and direct sales-tax document.
 * @returns Explicit completion for eBay's empty success document.
 * @example `await createOrReplaceSalesTax(sellerSession, { countryCode: 'US', jurisdictionId: 'VI', salesTaxPercentage: '7.75' })`
 * @see https://developer.ebay.com/api-docs/sell/account/resources/sales_tax/methods/createOrReplaceSalesTax
 */
export const createOrReplaceSalesTax = (
  sellerSession: EbaySellerSession,
  salesTaxReplacement: CreateOrReplaceSalesTaxArguments,
): Promise<EbayRequestCompletion<undefined>> => {
  const { countryCode, jurisdictionId, ...salesTaxDocument } = salesTaxReplacement;
  return sellerSession.put<undefined>({
    endpoint: `/sell/account/v1/sales_tax/${countryCode}/${encodeURIComponent(jurisdictionId)}`,
    requestDocument: salesTaxDocument,
  });
};

/**
 * Creates or replaces multiple sales-tax entries in one eBay call.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param bulkSalesTaxReplacement - Direct eBay bulk sales-tax document.
 * @returns Explicit completion containing eBay's unchanged update collection.
 * @example `await bulkCreateOrReplaceSalesTax(sellerSession, { salesTaxInputList: [{ countryCode: 'CA', salesTaxJurisdictionId: 'ON', salesTaxPercentage: '13' }] })`
 * @see https://developer.ebay.com/api-docs/sell/account/resources/sales_tax/methods/bulkCreateOrReplaceSalesTax
 */
export const bulkCreateOrReplaceSalesTax = (
  sellerSession: EbaySellerSession,
  bulkSalesTaxReplacement: BulkCreateOrReplaceSalesTaxArguments,
): Promise<EbayRequestCompletion<UpdatedSalesTaxCollection>> =>
  sellerSession.post<UpdatedSalesTaxCollection>({
    endpoint: '/sell/account/v1/bulk_create_or_replace_sales_tax',
    requestDocument: bulkSalesTaxReplacement,
  });

/**
 * Deletes one sales-tax entry for a country jurisdiction.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param salesTaxEntry - Exact eBay country and jurisdiction path.
 * @returns Explicit completion for eBay's empty success document.
 * @example `await deleteSalesTax(sellerSession, { countryCode: 'US', jurisdictionId: 'VI' })`
 * @see https://developer.ebay.com/api-docs/sell/account/resources/sales_tax/methods/deleteSalesTax
 */
export const deleteSalesTax = (
  sellerSession: EbaySellerSession,
  salesTaxEntry: SalesTaxEntryArguments,
): Promise<EbayRequestCompletion<undefined>> =>
  sellerSession.delete<undefined>({
    endpoint: `/sell/account/v1/sales_tax/${salesTaxEntry.countryCode}/${encodeURIComponent(salesTaxEntry.jurisdictionId)}`,
  });

/**
 * Retrieves one sales-tax entry for a country jurisdiction.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param salesTaxEntry - Exact eBay country and jurisdiction path.
 * @returns Explicit completion containing eBay's unchanged sales-tax entry.
 * @example `await getSalesTax(sellerSession, { countryCode: 'CA', jurisdictionId: 'ON' })`
 * @see https://developer.ebay.com/api-docs/sell/account/resources/sales_tax/methods/getSalesTax
 */
export const getSalesTax = (
  sellerSession: EbaySellerSession,
  salesTaxEntry: SalesTaxEntryArguments,
): Promise<EbayRequestCompletion<SalesTax>> =>
  sellerSession.get<SalesTax>({
    endpoint: `/sell/account/v1/sales_tax/${salesTaxEntry.countryCode}/${encodeURIComponent(salesTaxEntry.jurisdictionId)}`,
  });

/**
 * Retrieves all sales-tax entries for one supported country.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param countrySelection - Exact eBay country_code query.
 * @returns Explicit completion containing eBay's unchanged sales-tax collection.
 * @example `await getSalesTaxes(sellerSession, { country_code: 'CA' })`
 * @see https://developer.ebay.com/api-docs/sell/account/resources/sales_tax/methods/getSalesTaxes
 */
export const getSalesTaxes = (
  sellerSession: EbaySellerSession,
  countrySelection: GetSalesTaxesArguments,
): Promise<EbayRequestCompletion<SalesTaxCollection>> =>
  sellerSession.get<SalesTaxCollection>({
    endpoint: '/sell/account/v1/sales_tax',
    searchParameters: countrySelection,
  });

/** MCP definition for the Account API createOrReplaceSalesTax operation. */
export const createOrReplaceSalesTaxTool = defineTool({
  name: 'ebay_sell_account_create_or_replace_sales_tax',
  namespace: 'sell.account',
  description: 'Create or replace one sales-tax entry using the direct eBay document',
  argumentsSchema: createOrReplaceSalesTaxArgumentsSchema,
  operationKind: 'write',
  operation: createOrReplaceSalesTax,
});

/** MCP definition for the Account API bulkCreateOrReplaceSalesTax operation. */
export const bulkCreateOrReplaceSalesTaxTool = defineTool({
  name: 'ebay_sell_account_bulk_create_or_replace_sales_tax',
  namespace: 'sell.account',
  description: 'Create or replace multiple sales-tax entries using the direct eBay bulk document',
  argumentsSchema: bulkCreateOrReplaceSalesTaxArgumentsSchema,
  operationKind: 'write',
  operation: bulkCreateOrReplaceSalesTax,
});

/** MCP definition for the Account API deleteSalesTax operation. */
export const deleteSalesTaxTool = defineTool({
  name: 'ebay_sell_account_delete_sales_tax',
  namespace: 'sell.account',
  description: 'Delete one seller sales-tax entry by country and jurisdiction',
  argumentsSchema: salesTaxEntryArgumentsSchema,
  operationKind: 'write',
  operation: deleteSalesTax,
});

/** MCP definition for the Account API getSalesTax operation. */
export const getSalesTaxTool = defineTool({
  name: 'ebay_sell_account_get_sales_tax',
  namespace: 'sell.account',
  description: 'Retrieve one seller sales-tax entry by country and jurisdiction',
  argumentsSchema: salesTaxEntryArgumentsSchema,
  operationKind: 'read',
  operation: getSalesTax,
});

/** MCP definition for the Account API getSalesTaxes operation. */
export const getSalesTaxesTool = defineTool({
  name: 'ebay_sell_account_get_sales_taxes',
  namespace: 'sell.account',
  description: 'Retrieve all seller sales-tax entries for one supported country',
  argumentsSchema: getSalesTaxesArgumentsSchema,
  operationKind: 'read',
  operation: getSalesTaxes,
});
