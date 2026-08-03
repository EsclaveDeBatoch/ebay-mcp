import { Effect } from 'effect';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountApi } from '@/api/account-management/account.js';
import type { EbayApiClient } from '@/api/client.js';
import { MarketplaceId } from '@/types/ebayEnums.js';
import type { components } from '@/generated/ebay/sell-apps/account-management/sellAccountV1Oas3.js';

type PaymentsProgramResponse = components['schemas']['PaymentsProgramResponse'];
type PaymentsProgramOnboardingResponse = components['schemas']['PaymentsProgramOnboardingResponse'];
type SalesTax = components['schemas']['SalesTax'];
type SalesTaxes = components['schemas']['SalesTaxes'];

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
});
