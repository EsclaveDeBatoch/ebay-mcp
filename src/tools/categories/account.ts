import { Effect } from 'effect';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  bulkCreateOrReplaceSalesTaxInputSchema,
  createOrReplaceSalesTaxInputSchema,
  deleteSalesTaxInputSchema,
  getOptedInProgramsInputSchema,
  getPaymentsProgramInputSchema,
  getPaymentsProgramOnboardingInputSchema,
  getSalesTaxesInputSchema,
  getSalesTaxesOutputSchema,
  getSalesTaxInputSchema,
  optInToProgramInputSchema,
  optOutOfProgramInputSchema,
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

/** Legacy Account API tools for seller tax and programs. */
export const accountEntries: ToolEntry[] = [
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
];
