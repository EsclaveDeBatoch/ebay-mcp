import type { EbayApiClient } from '@/api/client.js';
import { type EbayApiError, requestGetEffect } from '@/api/shared/request.js';
import type {
  getPaymentsProgramInputSchema,
  getPaymentsProgramOnboardingInputSchema,
} from '@/schemas/account-management/account.js';
import type { components } from '@/generated/ebay/sell-apps/account-management/sellAccountV1Oas3.js';
import type { Effect } from 'effect';
import type { InferEffectSchema } from '@/utils/effectSchemaTypes.js';

const ACCOUNT_BASE_PATH = '/sell/account/v1';

type GetPaymentsProgramInput = InferEffectSchema<typeof getPaymentsProgramInputSchema>;
type GetPaymentsProgramOnboardingInput = InferEffectSchema<
  typeof getPaymentsProgramOnboardingInputSchema
>;

type PaymentsProgramResponse = components['schemas']['PaymentsProgramResponse'];
type PaymentsProgramOnboardingResponse = components['schemas']['PaymentsProgramOnboardingResponse'];

/** Legacy Account API client for deprecated payments-program status. */
export class AccountApi {
  private readonly client: EbayApiClient;

  constructor(client: EbayApiClient) {
    this.client = client;
  }

  /**
   * Retrieves seller payments program status.
   *
   * @param input - Marketplace ID and payments program type.
   * @returns An Effect that succeeds with eBay's generated PaymentsProgramResponse.
   *
   * @example
   * ```ts
   * const status = await Effect.runPromise(
   *   accountApi.getPaymentsProgram({ marketplaceId: 'EBAY_US', paymentsProgramType: 'EBAY_PAYMENTS' }),
   * );
   * ```
   *
   * @see https://developer.ebay.com/api-docs/sell/account/resources/payments_program/methods/getPaymentsProgram
   */
  getPaymentsProgram = (
    input: GetPaymentsProgramInput,
  ): Effect.Effect<PaymentsProgramResponse, EbayApiError> =>
    requestGetEffect<PaymentsProgramResponse>(
      this.client,
      `${ACCOUNT_BASE_PATH}/payments_program/${input.marketplaceId}/${input.paymentsProgramType}`,
    );

  /**
   * Retrieves seller payments program onboarding status.
   *
   * @param input - Marketplace ID and payments program type.
   * @returns An Effect that succeeds with eBay's generated PaymentsProgramOnboardingResponse.
   *
   * @example
   * ```ts
   * const onboarding = await Effect.runPromise(
   *   accountApi.getPaymentsProgramOnboarding({
   *     marketplaceId: 'EBAY_US',
   *     paymentsProgramType: 'EBAY_PAYMENTS',
   *   }),
   * );
   * ```
   *
   * @see https://developer.ebay.com/api-docs/sell/account/resources/program/methods/payments_program/onboarding/methods/getPaymentsProgramOnboarding
   */
  getPaymentsProgramOnboarding = (
    input: GetPaymentsProgramOnboardingInput,
  ): Effect.Effect<PaymentsProgramOnboardingResponse, EbayApiError> =>
    requestGetEffect<PaymentsProgramOnboardingResponse>(
      this.client,
      `${ACCOUNT_BASE_PATH}/payments_program/${input.marketplaceId}/${input.paymentsProgramType}/onboarding`,
    );
}
