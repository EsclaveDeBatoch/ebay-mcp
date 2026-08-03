import type { EbayApiClient } from '@/api/client.js';
import {
  buildEndpointParams,
  type EbayApiError,
  requestDeleteEffect,
  requestGetEffect,
  requestPostEffect,
  requestPutEffect,
} from '@/api/shared/request.js';
import type {
  bulkCreateOrReplaceSalesTaxInputSchema,
  createOrReplaceSalesTaxInputSchema,
  deleteSalesTaxInputSchema,
  getPaymentsProgramInputSchema,
  getPaymentsProgramOnboardingInputSchema,
  getSalesTaxesInputSchema,
  getSalesTaxInputSchema,
} from '@/schemas/account-management/account.js';
import type { components } from '@/generated/ebay/sell-apps/account-management/sellAccountV1Oas3.js';
import type { Effect } from 'effect';
import type { InferEffectSchema } from '@/utils/effectSchemaTypes.js';

const ACCOUNT_BASE_PATH = '/sell/account/v1';

type GetPaymentsProgramInput = InferEffectSchema<typeof getPaymentsProgramInputSchema>;
type GetPaymentsProgramOnboardingInput = InferEffectSchema<
  typeof getPaymentsProgramOnboardingInputSchema
>;
type CreateOrReplaceSalesTaxInput = InferEffectSchema<typeof createOrReplaceSalesTaxInputSchema>;
type BulkCreateOrReplaceSalesTaxInput = InferEffectSchema<
  typeof bulkCreateOrReplaceSalesTaxInputSchema
>;
type GetSalesTaxInput = InferEffectSchema<typeof getSalesTaxInputSchema>;
type DeleteSalesTaxInput = InferEffectSchema<typeof deleteSalesTaxInputSchema>;
type GetSalesTaxesInput = InferEffectSchema<typeof getSalesTaxesInputSchema>;

type PaymentsProgramResponse = components['schemas']['PaymentsProgramResponse'];
type PaymentsProgramOnboardingResponse = components['schemas']['PaymentsProgramOnboardingResponse'];
type SalesTax = components['schemas']['SalesTax'];
type SalesTaxes = components['schemas']['SalesTaxes'];

/** Legacy Account API client for seller tax and deprecated payments-program status. */
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

  /**
   * Creates or replaces one sales tax table entry.
   *
   * @param input - Country, jurisdiction, and sales tax payload.
   * @returns An Effect that succeeds when eBay accepts the sales tax table entry.
   *
   * @example
   * ```ts
   * await Effect.runPromise(
   *   accountApi.createOrReplaceSalesTax({ countryCode: 'US', jurisdictionId: 'CA', salesTaxBase }),
   * );
   * ```
   *
   * @see https://developer.ebay.com/api-docs/sell/account/resources/sales_tax/methods/createOrReplaceSalesTax
   */
  createOrReplaceSalesTax = (
    input: CreateOrReplaceSalesTaxInput,
  ): Effect.Effect<void, EbayApiError> =>
    requestPutEffect<void>(
      this.client,
      `${ACCOUNT_BASE_PATH}/sales_tax/${input.countryCode}/${input.jurisdictionId}`,
      input.salesTaxBase,
    );

  /**
   * Creates or replaces multiple sales tax table entries.
   *
   * @param input - Bulk sales tax request rows.
   * @returns An Effect that succeeds when eBay accepts the bulk sales tax request.
   *
   * @example
   * ```ts
   * await Effect.runPromise(
   *   accountApi.bulkCreateOrReplaceSalesTax({ requests }),
   * );
   * ```
   *
   * @see https://developer.ebay.com/api-docs/sell/account/resources/sales_tax/methods/bulkCreateOrReplaceSalesTax
   */
  bulkCreateOrReplaceSalesTax = (
    input: BulkCreateOrReplaceSalesTaxInput,
  ): Effect.Effect<void, EbayApiError> =>
    requestPostEffect<void>(this.client, `${ACCOUNT_BASE_PATH}/bulk_create_or_replace_sales_tax`, {
      requests: input.requests,
    });

  /**
   * Deletes one sales tax table entry.
   *
   * @param input - Country and jurisdiction identifiers.
   * @returns An Effect that succeeds when eBay deletes the sales tax table entry.
   *
   * @example
   * ```ts
   * await Effect.runPromise(
   *   accountApi.deleteSalesTax({ countryCode: 'US', jurisdictionId: 'CA' }),
   * );
   * ```
   *
   * @see https://developer.ebay.com/api-docs/sell/account/resources/sales_tax/methods/deleteSalesTax
   */
  deleteSalesTax = (input: DeleteSalesTaxInput): Effect.Effect<void, EbayApiError> =>
    requestDeleteEffect<void>(
      this.client,
      `${ACCOUNT_BASE_PATH}/sales_tax/${input.countryCode}/${input.jurisdictionId}`,
    );

  /**
   * Retrieves one sales tax table entry.
   *
   * @param input - Country and jurisdiction identifiers.
   * @returns An Effect that succeeds with eBay's generated SalesTax.
   *
   * @example
   * ```ts
   * const tax = await Effect.runPromise(
   *   accountApi.getSalesTax({ countryCode: 'US', jurisdictionId: 'CA' }),
   * );
   * ```
   *
   * @see https://developer.ebay.com/api-docs/sell/account/resources/sales_tax/methods/getSalesTax
   */
  getSalesTax = (input: GetSalesTaxInput): Effect.Effect<SalesTax, EbayApiError> =>
    requestGetEffect<SalesTax>(
      this.client,
      `${ACCOUNT_BASE_PATH}/sales_tax/${input.countryCode}/${input.jurisdictionId}`,
    );

  /**
   * Retrieves all sales tax table entries for one country.
   *
   * @param input - Country code used as the `country_code` query parameter.
   * @returns An Effect that succeeds with eBay's generated SalesTaxes response.
   *
   * @example
   * ```ts
   * const taxes = await Effect.runPromise(accountApi.getSalesTaxes({ countryCode: 'US' }));
   * ```
   *
   * @see https://developer.ebay.com/api-docs/sell/account/resources/sales_tax/methods/getSalesTaxes
   */
  getSalesTaxes = (input: GetSalesTaxesInput): Effect.Effect<SalesTaxes, EbayApiError> => {
    const params = buildEndpointParams({
      countryCode: { wireName: 'country_code', value: input.countryCode },
    });

    return requestGetEffect<SalesTaxes>(this.client, `${ACCOUNT_BASE_PATH}/sales_tax`, params);
  };
}
