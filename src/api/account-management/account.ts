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
  getAdvertisingEligibilityInputSchema,
  getPaymentsProgramInputSchema,
  getPaymentsProgramOnboardingInputSchema,
  getSalesTaxesInputSchema,
  getSalesTaxInputSchema,
  getSubscriptionInputSchema,
  optInToProgramInputSchema,
  optOutOfProgramInputSchema,
} from '@/schemas/account-management/account.js';
import type { components } from '@/generated/ebay/sell-apps/account-management/sellAccountV1Oas3.js';
import type { Effect } from 'effect';
import type { InferEffectSchema } from '@/utils/effectSchemaTypes.js';

const ACCOUNT_BASE_PATH = '/sell/account/v1';

type EmptyAccountInput = Record<string, never>;
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
type GetSubscriptionInput = InferEffectSchema<typeof getSubscriptionInputSchema>;
type OptInToProgramInput = InferEffectSchema<typeof optInToProgramInputSchema>;
type OptOutOfProgramInput = InferEffectSchema<typeof optOutOfProgramInputSchema>;
type GetAdvertisingEligibilityInput = InferEffectSchema<
  typeof getAdvertisingEligibilityInputSchema
>;

type KycResponse = components['schemas']['KycResponse'];
type PaymentsProgramResponse = components['schemas']['PaymentsProgramResponse'];
type PaymentsProgramOnboardingResponse = components['schemas']['PaymentsProgramOnboardingResponse'];
type SellerEligibilityMultiProgramResponse =
  components['schemas']['SellerEligibilityMultiProgramResponse'];
type SellingPrivileges = components['schemas']['SellingPrivileges'];
type Programs = components['schemas']['Programs'];
type RateTableResponse = components['schemas']['RateTableResponse'];
type SalesTax = components['schemas']['SalesTax'];
type SalesTaxes = components['schemas']['SalesTaxes'];
type SubscriptionResponse = components['schemas']['SubscriptionResponse'];

/** Legacy Account API client for seller programs, tax, and eligibility. */
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
   * Retrieves the seller account privileges.
   *
   * @param _input - Empty object accepted for tool/API shape consistency.
   * @returns An Effect that succeeds with eBay's generated SellingPrivileges.
   *
   * @example
   * ```ts
   * const privileges = await Effect.runPromise(accountApi.getPrivileges({}));
   * ```
   *
   * @see https://developer.ebay.com/api-docs/sell/account/resources/privilege/methods/getPrivileges
   */
  getPrivileges = (
    _input: EmptyAccountInput = {},
  ): Effect.Effect<SellingPrivileges, EbayApiError> =>
    requestGetEffect<SellingPrivileges>(this.client, `${ACCOUNT_BASE_PATH}/privilege`);

  /**
   * Retrieves seller programs the account has opted into.
   *
   * @param _input - Empty object accepted for tool/API shape consistency.
   * @returns An Effect that succeeds with eBay's generated Programs response.
   *
   * @example
   * ```ts
   * const programs = await Effect.runPromise(accountApi.getOptedInPrograms({}));
   * ```
   *
   * @see https://developer.ebay.com/api-docs/sell/account/resources/program/methods/getOptedInPrograms
   */
  getOptedInPrograms = (_input: EmptyAccountInput = {}): Effect.Effect<Programs, EbayApiError> =>
    requestGetEffect<Programs>(this.client, `${ACCOUNT_BASE_PATH}/program/get_opted_in_programs`);

  /**
   * Opts the seller into an Account API program.
   *
   * @param input - Program opt-in request body.
   * @returns An Effect that succeeds when eBay accepts the opt-in request.
   *
   * @example
   * ```ts
   * await Effect.runPromise(
   *   accountApi.optInToProgram({ request: { programType: 'OUT_OF_STOCK_CONTROL' } }),
   * );
   * ```
   *
   * @see https://developer.ebay.com/api-docs/sell/account/resources/program/methods/optInToProgram
   */
  optInToProgram = (input: OptInToProgramInput): Effect.Effect<void, EbayApiError> =>
    requestPostEffect<void>(this.client, `${ACCOUNT_BASE_PATH}/program/opt_in`, input.request);

  /**
   * Opts the seller out of an Account API program.
   *
   * @param input - Program opt-out request body.
   * @returns An Effect that succeeds when eBay accepts the opt-out request.
   *
   * @example
   * ```ts
   * await Effect.runPromise(
   *   accountApi.optOutOfProgram({ request: { programType: 'OUT_OF_STOCK_CONTROL' } }),
   * );
   * ```
   *
   * @see https://developer.ebay.com/api-docs/sell/account/resources/program/methods/optOutOfProgram
   */
  optOutOfProgram = (input: OptOutOfProgramInput): Effect.Effect<void, EbayApiError> =>
    requestPostEffect<void>(this.client, `${ACCOUNT_BASE_PATH}/program/opt_out`, input.request);

  /**
   * Retrieves seller rate tables.
   *
   * @param _input - Empty object accepted for tool/API shape consistency.
   * @returns An Effect that succeeds with eBay's generated RateTableResponse.
   *
   * @example
   * ```ts
   * const rateTables = await Effect.runPromise(accountApi.getRateTables({}));
   * ```
   *
   * @see https://developer.ebay.com/api-docs/sell/account/resources/rate_table/methods/getRateTables
   */
  getRateTables = (
    _input: EmptyAccountInput = {},
  ): Effect.Effect<RateTableResponse, EbayApiError> =>
    requestGetEffect<RateTableResponse>(this.client, `${ACCOUNT_BASE_PATH}/rate_table`);

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

  /**
   * Retrieves seller subscription information.
   *
   * @param input - Optional subscription limit and continuation token.
   * @returns An Effect that succeeds with eBay's generated SubscriptionResponse.
   *
   * @example
   * ```ts
   * const subscription = await Effect.runPromise(accountApi.getSubscription({ limit: '10' }));
   * ```
   *
   * @see https://developer.ebay.com/api-docs/sell/account/resources/subscription/methods/getSubscription
   */
  getSubscription = (
    input: GetSubscriptionInput = {},
  ): Effect.Effect<SubscriptionResponse, EbayApiError> => {
    const params = buildEndpointParams({
      limit: { wireName: 'limit', value: input.limit },
      continuationToken: { wireName: 'continuation_token', value: input.continuationToken },
    });

    return requestGetEffect<SubscriptionResponse>(
      this.client,
      `${ACCOUNT_BASE_PATH}/subscription`,
      params,
    );
  };

  /**
   * Retrieves seller KYC status.
   *
   * @param _input - Empty object accepted for tool/API shape consistency.
   * @returns An Effect that succeeds with eBay's generated KycResponse.
   *
   * @example
   * ```ts
   * const kyc = await Effect.runPromise(accountApi.getKyc({}));
   * ```
   *
   * @see https://developer.ebay.com/api-docs/sell/account/resources/kyc/methods/getKYC
   */
  getKyc = (_input: EmptyAccountInput = {}): Effect.Effect<KycResponse, EbayApiError> =>
    requestGetEffect<KycResponse>(this.client, `${ACCOUNT_BASE_PATH}/kyc`);

  /**
   * Retrieves seller advertising-program eligibility for one marketplace.
   *
   * @param input - Marketplace header and optional comma-separated program type filter.
   * @returns An Effect that succeeds with eBay's generated SellerEligibilityMultiProgramResponse.
   *
   * @example
   * ```ts
   * const eligibility = await Effect.runPromise(
   *   accountApi.getAdvertisingEligibility({ marketplaceId: 'EBAY_US', programTypes: 'PLA' }),
   * );
   * ```
   *
   * @see https://developer.ebay.com/api-docs/sell/account/resources/advertising_eligibility/methods/getAdvertisingEligibility
   */
  getAdvertisingEligibility = (
    input: GetAdvertisingEligibilityInput,
  ): Effect.Effect<SellerEligibilityMultiProgramResponse, EbayApiError> => {
    const params = buildEndpointParams({
      programTypes: { wireName: 'program_types', value: input.programTypes },
    });

    return requestGetEffect<SellerEligibilityMultiProgramResponse>(
      this.client,
      `${ACCOUNT_BASE_PATH}/advertising_eligibility`,
      params,
      {
        headers: {
          'X-EBAY-C-MARKETPLACE-ID': input.marketplaceId,
        },
      },
    );
  };
}
