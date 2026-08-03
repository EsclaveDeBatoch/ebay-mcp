import { Effect } from 'effect';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountApi } from '@/api/account-management/account.js';
import type { EbayApiClient } from '@/api/client.js';
import { MarketplaceId } from '@/types/ebayEnums.js';
import type { components } from '@/generated/ebay/sell-apps/account-management/sellAccountV1Oas3.js';

type PaymentsProgramResponse = components['schemas']['PaymentsProgramResponse'];
type PaymentsProgramOnboardingResponse = components['schemas']['PaymentsProgramOnboardingResponse'];

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
});
