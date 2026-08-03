import { Effect } from 'effect';
import {
  getPaymentsProgramInputSchema,
  getPaymentsProgramOnboardingInputSchema,
} from '@/schemas/account-management/account.js';
import { defineTool } from '@/tools/defineTool.js';
import type { ToolEntry } from '@/tools/registry.js';

/** Legacy Account API tools for deprecated payments-program status. */
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
];
