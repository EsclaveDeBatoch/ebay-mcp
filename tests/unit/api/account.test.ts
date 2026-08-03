import { Effect } from 'effect';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountApi } from '@/api/account-management/account.js';
import type { EbayApiClient } from '@/api/client.js';
import { MarketplaceId } from '@/types/ebayEnums.js';
import type { components } from '@/generated/ebay/sell-apps/account-management/sellAccountV1Oas3.js';

type ReturnPolicy = components['schemas']['ReturnPolicy'];
type ReturnPolicyResponse = components['schemas']['ReturnPolicyResponse'];
type PaymentsProgramResponse = components['schemas']['PaymentsProgramResponse'];
type PaymentsProgramOnboardingResponse = components['schemas']['PaymentsProgramOnboardingResponse'];
type SellingPrivileges = components['schemas']['SellingPrivileges'];
type Programs = components['schemas']['Programs'];
type KycResponse = components['schemas']['KycResponse'];
type RateTableResponse = components['schemas']['RateTableResponse'];
type SalesTax = components['schemas']['SalesTax'];
type SalesTaxes = components['schemas']['SalesTaxes'];
type SubscriptionResponse = components['schemas']['SubscriptionResponse'];
type SellerEligibilityMultiProgramResponse =
  components['schemas']['SellerEligibilityMultiProgramResponse'];

describe('AccountApi', () => {
  let accountApi: AccountApi;
  let mockClient: EbayApiClient;

  beforeEach(() => {
    mockClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    } as unknown as EbayApiClient;

    accountApi = new AccountApi(mockClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Return Policies', () => {
    it('gets return policies for a marketplace', async () => {
      const mockResponse: ReturnPolicyResponse = {
        returnPolicies: [
          {
            returnPolicyId: '1234567890',
            name: '30 Day Returns',
            marketplaceId: 'EBAY_US',
          },
        ],
      };

      vi.spyOn(mockClient, 'get').mockResolvedValue(mockResponse);

      const result = await Effect.runPromise(
        accountApi.getReturnPolicies({ marketplaceId: MarketplaceId.EBAY_US }),
      );

      expect(mockClient.get).toHaveBeenCalledWith('/sell/account/v1/return_policy', {
        marketplace_id: 'EBAY_US',
      });
      expect(result).toEqual(mockResponse);
    });

    it('gets a return policy by ID', async () => {
      const mockPolicy: ReturnPolicy = {
        returnPolicyId: '1234567890',
        name: 'Test Policy',
        marketplaceId: 'EBAY_US',
      };

      vi.spyOn(mockClient, 'get').mockResolvedValue(mockPolicy);

      const result = await Effect.runPromise(
        accountApi.getReturnPolicy({ returnPolicyId: '1234567890' }),
      );

      expect(mockClient.get).toHaveBeenCalledWith('/sell/account/v1/return_policy/1234567890');
      expect(result).toEqual(mockPolicy);
    });

    it('gets a return policy by name', async () => {
      const mockPolicy: ReturnPolicy = {
        returnPolicyId: '1234567890',
        name: '30 Day Returns',
        marketplaceId: 'EBAY_US',
      };

      vi.spyOn(mockClient, 'get').mockResolvedValue(mockPolicy);

      const result = await Effect.runPromise(
        accountApi.getReturnPolicyByName({
          marketplaceId: MarketplaceId.EBAY_US,
          name: '30 Day Returns',
        }),
      );

      expect(mockClient.get).toHaveBeenCalledWith(
        '/sell/account/v1/return_policy/get_by_policy_name',
        {
          marketplace_id: 'EBAY_US',
          name: '30 Day Returns',
        },
      );
      expect(result).toEqual(mockPolicy);
    });

    it('creates, updates, and deletes a return policy', async () => {
      const policy = {
        name: 'New Return Policy',
        marketplaceId: MarketplaceId.EBAY_US,
      };
      const mockResponse = {
        returnPolicyId: '9876543210',
      };

      vi.spyOn(mockClient, 'post').mockResolvedValue(mockResponse);
      vi.spyOn(mockClient, 'put').mockResolvedValue(mockResponse);
      vi.spyOn(mockClient, 'delete').mockResolvedValue(undefined);

      const created = await Effect.runPromise(accountApi.createReturnPolicy({ policy }));
      const updated = await Effect.runPromise(
        accountApi.updateReturnPolicy({ returnPolicyId: '9876543210', policy }),
      );
      await Effect.runPromise(accountApi.deleteReturnPolicy({ returnPolicyId: '9876543210' }));

      expect(mockClient.post).toHaveBeenCalledWith('/sell/account/v1/return_policy', policy);
      expect(mockClient.put).toHaveBeenCalledWith(
        '/sell/account/v1/return_policy/9876543210',
        policy,
      );
      expect(mockClient.delete).toHaveBeenCalledWith('/sell/account/v1/return_policy/9876543210');
      expect(created).toEqual(mockResponse);
      expect(updated).toEqual(mockResponse);
    });
  });

  describe('Account Information', () => {
    it('gets seller privileges, KYC, rate tables, and opted-in programs', async () => {
      const mockPrivileges: SellingPrivileges = { sellerRegistrationCompleted: true };
      const mockKyc: KycResponse = {
        kycChecks: [
          {
            dataRequired: 'BUSINESS_VERIFICATION',
          },
        ],
      };
      const mockRateTables: RateTableResponse = {
        rateTables: [{ rateTableId: '123456', name: 'Domestic Shipping' }],
      };
      const mockPrograms: Programs = {
        programs: [{ programType: 'OUT_OF_STOCK_CONTROL' }],
      };

      vi.spyOn(mockClient, 'get')
        .mockResolvedValueOnce(mockPrivileges)
        .mockResolvedValueOnce(mockKyc)
        .mockResolvedValueOnce(mockRateTables)
        .mockResolvedValueOnce(mockPrograms);

      expect(await Effect.runPromise(accountApi.getPrivileges({}))).toEqual(mockPrivileges);
      expect(await Effect.runPromise(accountApi.getKyc({}))).toEqual(mockKyc);
      expect(await Effect.runPromise(accountApi.getRateTables({}))).toEqual(mockRateTables);
      expect(await Effect.runPromise(accountApi.getOptedInPrograms({}))).toEqual(mockPrograms);

      expect(mockClient.get).toHaveBeenNthCalledWith(1, '/sell/account/v1/privilege');
      expect(mockClient.get).toHaveBeenNthCalledWith(2, '/sell/account/v1/kyc');
      expect(mockClient.get).toHaveBeenNthCalledWith(3, '/sell/account/v1/rate_table');
      expect(mockClient.get).toHaveBeenNthCalledWith(
        4,
        '/sell/account/v1/program/get_opted_in_programs',
      );
    });

    it('gets subscription information with optional pagination fields', async () => {
      const mockSubscription: SubscriptionResponse = {
        subscriptions: [
          {
            subscriptionId: 'sub_12345',
            subscriptionType: 'STORE_SUBSCRIPTION',
          },
        ],
      };

      vi.spyOn(mockClient, 'get').mockResolvedValue(mockSubscription);

      const result = await Effect.runPromise(
        accountApi.getSubscription({ limit: '10', continuationToken: 'next-page' }),
      );

      expect(mockClient.get).toHaveBeenCalledWith('/sell/account/v1/subscription', {
        limit: '10',
        continuation_token: 'next-page',
      });
      expect(result).toEqual(mockSubscription);
    });
  });

  describe('Payments Program', () => {
    it('gets payments program status', async () => {
      const mockResponse: PaymentsProgramResponse = {
        marketplaceId: 'EBAY_US',
        paymentsProgramType: 'EBAY_PAYMENTS',
        status: 'OPTED_IN',
      };

      vi.spyOn(mockClient, 'get').mockResolvedValue(mockResponse);

      const result = await Effect.runPromise(
        accountApi.getPaymentsProgram({
          marketplaceId: MarketplaceId.EBAY_US,
          paymentsProgramType: 'EBAY_PAYMENTS',
        }),
      );

      expect(mockClient.get).toHaveBeenCalledWith(
        '/sell/account/v1/payments_program/EBAY_US/EBAY_PAYMENTS',
      );
      expect(result).toEqual(mockResponse);
    });

    it('gets payments program onboarding status', async () => {
      const mockResponse: PaymentsProgramOnboardingResponse = {
        onboardingStatus: 'OPTED_IN',
      };

      vi.spyOn(mockClient, 'get').mockResolvedValue(mockResponse);

      const result = await Effect.runPromise(
        accountApi.getPaymentsProgramOnboarding({
          marketplaceId: MarketplaceId.EBAY_US,
          paymentsProgramType: 'EBAY_PAYMENTS',
        }),
      );

      expect(mockClient.get).toHaveBeenCalledWith(
        '/sell/account/v1/payments_program/EBAY_US/EBAY_PAYMENTS/onboarding',
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Sales Tax', () => {
    it('gets all sales taxes for a country', async () => {
      const mockResponse: SalesTaxes = {
        salesTaxes: [
          { countryCode: 'US', salesTaxJurisdictionId: 'CA', salesTaxPercentage: '8.25' },
        ],
      };

      vi.spyOn(mockClient, 'get').mockResolvedValue(mockResponse);

      const result = await Effect.runPromise(accountApi.getSalesTaxes({ countryCode: 'US' }));

      expect(mockClient.get).toHaveBeenCalledWith('/sell/account/v1/sales_tax', {
        country_code: 'US',
      });
      expect(result).toEqual(mockResponse);
    });

    it('gets a specific sales tax table entry', async () => {
      const mockSalesTax: SalesTax = {
        countryCode: 'US',
        salesTaxJurisdictionId: 'CA',
        salesTaxPercentage: '8.25',
      };

      vi.spyOn(mockClient, 'get').mockResolvedValue(mockSalesTax);

      const result = await Effect.runPromise(
        accountApi.getSalesTax({ countryCode: 'US', jurisdictionId: 'CA' }),
      );

      expect(mockClient.get).toHaveBeenCalledWith('/sell/account/v1/sales_tax/US/CA');
      expect(result).toEqual(mockSalesTax);
    });

    it('creates, bulk creates, and deletes sales tax entries', async () => {
      const salesTaxBase = {
        salesTaxPercentage: '8.25',
        shippingAndHandlingTaxed: false,
      };
      const requests = [
        { countryCode: 'US', jurisdictionId: 'CA', salesTaxBase },
        { countryCode: 'US', jurisdictionId: 'NY', salesTaxBase: { salesTaxPercentage: '4.0' } },
      ];

      vi.spyOn(mockClient, 'put').mockResolvedValue(undefined);
      vi.spyOn(mockClient, 'post').mockResolvedValue(undefined);
      vi.spyOn(mockClient, 'delete').mockResolvedValue(undefined);

      await Effect.runPromise(
        accountApi.createOrReplaceSalesTax({
          countryCode: 'US',
          jurisdictionId: 'CA',
          salesTaxBase,
        }),
      );
      await Effect.runPromise(accountApi.bulkCreateOrReplaceSalesTax({ requests }));
      await Effect.runPromise(
        accountApi.deleteSalesTax({ countryCode: 'US', jurisdictionId: 'CA' }),
      );

      expect(mockClient.put).toHaveBeenCalledWith('/sell/account/v1/sales_tax/US/CA', salesTaxBase);
      expect(mockClient.post).toHaveBeenCalledWith(
        '/sell/account/v1/bulk_create_or_replace_sales_tax',
        { requests },
      );
      expect(mockClient.delete).toHaveBeenCalledWith('/sell/account/v1/sales_tax/US/CA');
    });
  });

  describe('Programs', () => {
    it('opts in and out of a program', async () => {
      const request = {
        programType: 'OUT_OF_STOCK_CONTROL',
      };

      vi.spyOn(mockClient, 'post').mockResolvedValue(undefined);

      await Effect.runPromise(accountApi.optInToProgram({ request }));
      await Effect.runPromise(accountApi.optOutOfProgram({ request }));

      expect(mockClient.post).toHaveBeenNthCalledWith(
        1,
        '/sell/account/v1/program/opt_in',
        request,
      );
      expect(mockClient.post).toHaveBeenNthCalledWith(
        2,
        '/sell/account/v1/program/opt_out',
        request,
      );
    });
  });

  describe('Advertising Eligibility', () => {
    it('gets advertising eligibility with the marketplace header and program filter', async () => {
      const mockResponse: SellerEligibilityMultiProgramResponse = {
        advertisingEligibility: [],
      };

      vi.spyOn(mockClient, 'get').mockResolvedValue(mockResponse);

      const result = await Effect.runPromise(
        accountApi.getAdvertisingEligibility({
          marketplaceId: MarketplaceId.EBAY_US,
          programTypes: 'PLA',
        }),
      );

      expect(mockClient.get).toHaveBeenCalledWith(
        '/sell/account/v1/advertising_eligibility',
        { program_types: 'PLA' },
        {
          headers: {
            'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
          },
        },
      );
      expect(result).toEqual(mockResponse);
    });
  });
});
