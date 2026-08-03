import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/account-management/sellAccountV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';
import { MarketplaceId } from '@/types/ebayEnums.js';

/** Exact deprecated eBay payments-program path fields. */
export const paymentsProgramArgumentsSchema = z
  .object({
    marketplace_id: z.enum(MarketplaceId),
    payments_program_type: z.literal('EBAY_PAYMENTS'),
  })
  .strict();

/** Validated exact path for the deprecated payments-program reads. */
export type PaymentsProgramArguments = z.infer<typeof paymentsProgramArgumentsSchema>;

/** @see https://developer.ebay.com/api-docs/sell/account/types/api:PaymentsProgramResponse */
export type PaymentsProgramStatus = components['schemas']['PaymentsProgramResponse'];

/** @see https://developer.ebay.com/api-docs/sell/account/types/api:PaymentsProgramOnboardingResponse */
export type PaymentsProgramOnboarding = components['schemas']['PaymentsProgramOnboardingResponse'];

/**
 * Retrieves a seller's deprecated eBay payments-program status.
 *
 * This operation is no longer applicable because every seller account uses eBay's current
 * payments and checkout flow. It remains exposed only because it is still in the generated API.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param paymentsProgramSelection - Exact eBay marketplace and payments-program path.
 * @returns Explicit completion containing eBay's unchanged generated status.
 * @example `await getPaymentsProgram(sellerSession, { marketplace_id: 'EBAY_US', payments_program_type: 'EBAY_PAYMENTS' })`
 * @see https://developer.ebay.com/api-docs/sell/account/resources/payments_program/methods/getPaymentsProgram
 */
export const getPaymentsProgram = (
  sellerSession: EbaySellerSession,
  paymentsProgramSelection: PaymentsProgramArguments,
): Promise<EbayRequestCompletion<PaymentsProgramStatus>> =>
  sellerSession.get<PaymentsProgramStatus>({
    endpoint: `/sell/account/v1/payments_program/${encodeURIComponent(paymentsProgramSelection.marketplace_id)}/${paymentsProgramSelection.payments_program_type}`,
  });

/**
 * Retrieves a seller's deprecated eBay payments-program onboarding status.
 *
 * This operation is no longer applicable because every seller account uses eBay's current
 * payments and checkout flow. It remains exposed only because it is still in the generated API.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param paymentsProgramSelection - Exact eBay marketplace and payments-program path.
 * @returns Explicit completion containing eBay's unchanged generated onboarding status.
 * @example `await getPaymentsProgramOnboarding(sellerSession, { marketplace_id: 'EBAY_US', payments_program_type: 'EBAY_PAYMENTS' })`
 * @see https://developer.ebay.com/api-docs/sell/account/resources/payments_program/methods/getPaymentsProgramOnboarding
 */
export const getPaymentsProgramOnboarding = (
  sellerSession: EbaySellerSession,
  paymentsProgramSelection: PaymentsProgramArguments,
): Promise<EbayRequestCompletion<PaymentsProgramOnboarding>> =>
  sellerSession.get<PaymentsProgramOnboarding>({
    endpoint: `/sell/account/v1/payments_program/${encodeURIComponent(paymentsProgramSelection.marketplace_id)}/${paymentsProgramSelection.payments_program_type}/onboarding`,
  });

/** MCP definition for the deprecated Account API getPaymentsProgram operation. */
export const getPaymentsProgramTool = defineTool({
  name: 'ebay_sell_account_get_payments_program',
  namespace: 'sell.account',
  description:
    'Retrieve the deprecated eBay payments-program status that remains in the generated API',
  argumentsSchema: paymentsProgramArgumentsSchema,
  operationKind: 'read',
  operation: getPaymentsProgram,
});

/** MCP definition for the deprecated Account API getPaymentsProgramOnboarding operation. */
export const getPaymentsProgramOnboardingTool = defineTool({
  name: 'ebay_sell_account_get_payments_program_onboarding',
  namespace: 'sell.account',
  description:
    'Retrieve the deprecated eBay payments-program onboarding status that remains in the generated API',
  argumentsSchema: paymentsProgramArgumentsSchema,
  operationKind: 'read',
  operation: getPaymentsProgramOnboarding,
});
