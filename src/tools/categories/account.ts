import { Effect } from 'effect';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  bulkCreateOrReplaceSalesTaxInputSchema,
  createOrReplaceSalesTaxInputSchema,
  deleteSalesTaxInputSchema,
  getAdvertisingEligibilityInputSchema,
  getKycInputSchema,
  getOptedInProgramsInputSchema,
  getPaymentsProgramInputSchema,
  getPaymentsProgramOnboardingInputSchema,
  getPrivilegesInputSchema,
  getRateTablesInputSchema,
  getSalesTaxesInputSchema,
  getSalesTaxesOutputSchema,
  getSalesTaxInputSchema,
  getSubscriptionInputSchema,
  kycOutputSchema,
  optInToProgramInputSchema,
  optOutOfProgramInputSchema,
  privilegesOutputSchema,
  programsOutputSchema,
  salesTaxSchema,
} from '@/schemas/account-management/account.js';
import { defineTool } from '@/tools/defineTool.js';
import type { OutputArgs } from '@/tools/types.js';
import type { ToolEntry } from '@/tools/registry.js';

const emptyResponseSchema: OutputArgs = {
  type: 'object',
  properties: {},
  description: 'Empty response on successful operation',
};

/** Legacy Account API tools for seller tax, KYC, privileges, and programs. */
export const accountEntries: ToolEntry[] = [
  defineTool({
    name: 'ebay_get_kyc',
    description: 'Get seller KYC (Know Your Customer) status',
    inputSchema: getKycInputSchema.shape,
    outputSchema: zodToJsonSchema(kycOutputSchema, {
      name: 'KYCResponse',
      $refStrategy: 'none',
    }) as OutputArgs,
    annotations: { readOnlyHint: true },
    handler: (api, args) => Effect.runPromise(api.account.getKyc(args)),
  }),
  defineTool({
    name: 'ebay_get_payments_program',
    description:
      'Get payments program status for a marketplace. Note: This method is deprecated as all seller accounts globally have been enabled for the new eBay payment and checkout flow.\n\nRequired OAuth Scope: sell.account.readonly or sell.account',
    inputSchema: getPaymentsProgramInputSchema.shape,
    annotations: { readOnlyHint: true },
    handler: (api, args) => Effect.runPromise(api.account.getPaymentsProgram(args)),
  }),
  defineTool({
    name: 'ebay_get_payments_program_onboarding',
    description:
      'Get payments program onboarding information. Note: This method is deprecated as all seller accounts globally have been enabled for the new eBay payment and checkout flow.\n\nRequired OAuth Scope: sell.account.readonly or sell.account',
    inputSchema: getPaymentsProgramOnboardingInputSchema.shape,
    annotations: { readOnlyHint: true },
    handler: (api, args) => Effect.runPromise(api.account.getPaymentsProgramOnboarding(args)),
  }),
  defineTool({
    name: 'ebay_get_rate_tables',
    description: 'Get seller rate tables',
    inputSchema: getRateTablesInputSchema.shape,
    annotations: { readOnlyHint: true },
    handler: (api, args) => Effect.runPromise(api.account.getRateTables(args)),
  }),
  defineTool({
    name: 'ebay_create_or_replace_sales_tax',
    description: 'Create or replace sales tax table for a jurisdiction',
    inputSchema: createOrReplaceSalesTaxInputSchema.shape,
    outputSchema: emptyResponseSchema,
    annotations: { readOnlyHint: false, idempotentHint: true },
    handler: (api, args) => Effect.runPromise(api.account.createOrReplaceSalesTax(args)),
  }),
  defineTool({
    name: 'ebay_bulk_create_or_replace_sales_tax',
    description: 'Bulk create or replace sales tax tables',
    inputSchema: bulkCreateOrReplaceSalesTaxInputSchema.shape,
    outputSchema: emptyResponseSchema,
    annotations: { readOnlyHint: false, idempotentHint: true },
    handler: (api, args) => Effect.runPromise(api.account.bulkCreateOrReplaceSalesTax(args)),
  }),
  defineTool({
    name: 'ebay_delete_sales_tax',
    description: 'Delete sales tax table for a jurisdiction',
    inputSchema: deleteSalesTaxInputSchema.shape,
    outputSchema: emptyResponseSchema,
    annotations: { readOnlyHint: false, destructiveHint: true },
    handler: (api, args) => Effect.runPromise(api.account.deleteSalesTax(args)),
  }),
  defineTool({
    name: 'ebay_get_sales_tax',
    description: 'Get sales tax table for a jurisdiction',
    inputSchema: getSalesTaxInputSchema.shape,
    outputSchema: zodToJsonSchema(salesTaxSchema, {
      name: 'SalesTaxResponse',
      $refStrategy: 'none',
    }) as OutputArgs,
    annotations: { readOnlyHint: true },
    handler: (api, args) => Effect.runPromise(api.account.getSalesTax(args)),
  }),
  defineTool({
    name: 'ebay_get_sales_taxes',
    description: 'Get all sales tax tables for a country',
    inputSchema: getSalesTaxesInputSchema.shape,
    outputSchema: zodToJsonSchema(getSalesTaxesOutputSchema, {
      name: 'GetSalesTaxesResponse',
      $refStrategy: 'none',
    }) as OutputArgs,
    annotations: { readOnlyHint: true },
    handler: (api, args) => Effect.runPromise(api.account.getSalesTaxes(args)),
  }),
  defineTool({
    name: 'ebay_get_subscription',
    description: 'Get seller subscription information',
    inputSchema: getSubscriptionInputSchema.shape,
    annotations: { readOnlyHint: true },
    handler: (api, args) => Effect.runPromise(api.account.getSubscription(args)),
  }),
  defineTool({
    name: 'ebay_opt_in_to_program',
    description: 'Opt-in to a seller program',
    inputSchema: optInToProgramInputSchema.shape,
    outputSchema: emptyResponseSchema,
    annotations: { readOnlyHint: false },
    handler: (api, args) => Effect.runPromise(api.account.optInToProgram(args)),
  }),
  defineTool({
    name: 'ebay_opt_out_of_program',
    description: 'Opt-out of a seller program',
    inputSchema: optOutOfProgramInputSchema.shape,
    outputSchema: emptyResponseSchema,
    annotations: { readOnlyHint: false },
    handler: (api, args) => Effect.runPromise(api.account.optOutOfProgram(args)),
  }),
  defineTool({
    name: 'ebay_get_opted_in_programs',
    description: 'Get seller programs the account is opted into',
    inputSchema: getOptedInProgramsInputSchema.shape,
    outputSchema: zodToJsonSchema(programsOutputSchema, {
      name: 'ProgramsResponse',
      $refStrategy: 'none',
    }) as OutputArgs,
    annotations: { readOnlyHint: true },
    handler: (api, args) => Effect.runPromise(api.account.getOptedInPrograms(args)),
  }),
  defineTool({
    name: 'ebay_get_privileges',
    description:
      "Get seller's current set of privileges, including whether or not the seller's eBay registration has been completed, as well as the details of their site-wide sellingLimit (the maximum dollar value and quantity of items a seller can sell per day).\n\nRequired OAuth Scope: sell.account.readonly or sell.account",
    inputSchema: getPrivilegesInputSchema.shape,
    outputSchema: zodToJsonSchema(privilegesOutputSchema, {
      name: 'PrivilegesResponse',
      $refStrategy: 'none',
    }) as OutputArgs,
    annotations: { readOnlyHint: true },
    handler: (api, args) => Effect.runPromise(api.account.getPrivileges(args)),
  }),
  defineTool({
    name: 'ebay_get_advertising_eligibility',
    description:
      'Check the seller eligibility status for eBay advertising programs. This allows developers to determine if a seller is eligible for various advertising programs on eBay.\n\nRequired OAuth Scope: sell.account.readonly or sell.account',
    inputSchema: getAdvertisingEligibilityInputSchema.shape,
    annotations: { readOnlyHint: true },
    handler: (api, args) => Effect.runPromise(api.account.getAdvertisingEligibility(args)),
  }),
];
