import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import nock from 'nock';
import { executeTool } from '@/tools/index.js';
import { EbaySellerApi } from '@/api/index.js';
import type { EbayConfig } from '@/types/ebay.js';
import { mockEbayApiEndpoint, mockEbayApiError, cleanupMocks } from '@tests/helpers/mockHttp.js';
import process from 'node:process';
import { Effect } from 'effect';

// Mock EbayOAuthClient
const mockOAuthClient = {
  hasUserTokens: vi.fn(),
  getAccessToken: vi.fn(),
  setUserTokens: vi.fn(),
  initialize: vi.fn(),
  getTokenInfo: vi.fn(),
  isAuthenticated: vi.fn(),
};

vi.mock('../../../src/auth/oauth.js', () => ({
  EbayOAuthClient: vi.fn(function (this: unknown) {
    return mockOAuthClient;
  }),
}));

describe('Inventory Tools Integration Tests', () => {
  let api: EbaySellerApi;
  let config: EbayConfig;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(async () => {
    vi.clearAllMocks();
    cleanupMocks();

    // Enable nock and disable real HTTP requests
    nock.disableNetConnect();

    // Store and clear environment variables to prevent loading from .env
    originalEnv = process.env;
    process.env = { ...originalEnv };
    delete process.env.EBAY_USER_REFRESH_TOKEN;
    delete process.env.EBAY_USER_ACCESS_TOKEN;
    // Disable proxy to prevent axios from using it
    delete process.env.HTTP_PROXY;
    delete process.env.HTTPS_PROXY;
    delete process.env.http_proxy;
    delete process.env.https_proxy;

    config = {
      clientId: 'test_client_id',
      clientSecret: 'test_client_secret',
      environment: 'sandbox',
      redirectUri: 'https://localhost/callback',
    };

    // Setup mock OAuth client
    mockOAuthClient.hasUserTokens.mockReturnValue(true);
    mockOAuthClient.getAccessToken.mockReturnValue(Effect.succeed('mock_access_token'));
    mockOAuthClient.initialize.mockReturnValue(Effect.succeed(undefined));

    api = new EbaySellerApi(config);
    await Effect.runPromise(api.initialize());
  });

  afterEach(() => {
    cleanupMocks();
    nock.enableNetConnect();
    // Restore environment variables
    process.env = originalEnv;
  });

  describe('ebay_get_offers', () => {
    it('retrieve offers successfully', async () => {
      const mockResponse = {
        total: 1,
        limit: 25,
        offers: [
          {
            offerId: '1234567890',
            sku: 'TEST-001',
            marketplaceId: 'EBAY_US',
            format: 'FIXED_PRICE',
            pricingSummary: {
              price: { currency: 'USD', value: '99.99' },
            },
            status: 'PUBLISHED',
          },
        ],
      };

      mockEbayApiEndpoint('/sell/inventory/v1/offer?sku=TEST-001', 'get', 'sandbox', mockResponse);

      const result = (await executeTool(api, 'ebay_get_offers', {
        sku: 'TEST-001',
      })) as typeof mockResponse;

      expect(result.offers).toHaveLength(1);
      expect(result.offers[0].sku).toBe('TEST-001');
    });

    it('filter by marketplace', async () => {
      const mockResponse = {
        total: 1,
        offers: [{ offerId: '123', marketplaceId: 'EBAY_US' }],
      };

      mockEbayApiEndpoint(
        '/sell/inventory/v1/offer?marketplace_id=EBAY_US',
        'get',
        'sandbox',
        mockResponse,
      );

      const result = (await executeTool(api, 'ebay_get_offers', {
        marketplaceId: 'EBAY_US',
      })) as typeof mockResponse;

      expect(result.offers[0].marketplaceId).toBe('EBAY_US');
    });
  });

  describe('ebay_create_offer', () => {
    it('create offer successfully', async () => {
      const offerData = {
        sku: 'TEST-001',
        marketplaceId: 'EBAY_US',
        format: 'FIXED_PRICE',
        listingPolicies: {
          fulfillmentPolicyId: '12345',
          paymentPolicyId: '67890',
          returnPolicyId: '11111',
        },
        pricingSummary: {
          price: { currency: 'USD', value: '99.99' },
        },
        categoryId: '1234',
      };

      const mockResponse = { offerId: '9876543210' };

      mockEbayApiEndpoint('/sell/inventory/v1/offer', 'post', 'sandbox', mockResponse, 201);

      const result = (await executeTool(api, 'ebay_create_offer', {
        body: offerData,
      })) as typeof mockResponse;

      expect(result.offerId).toBe('9876543210');
    });
  });

  describe('ebay_publish_offer', () => {
    it('publish offer successfully', async () => {
      const mockResponse = {
        listingId: '110123456789',
        offerId: '1234567890',
        statusCode: 200,
        warnings: [],
      };

      mockEbayApiEndpoint(
        '/sell/inventory/v1/offer/1234567890/publish',
        'post',
        'sandbox',
        mockResponse,
      );

      const result = (await executeTool(api, 'ebay_publish_offer', {
        offerId: '1234567890',
      })) as typeof mockResponse;

      expect(result.listingId).toBe('110123456789');
      expect(result.statusCode).toBe(200);
    });

    it('handle publish errors', async () => {
      mockEbayApiError(
        '/sell/inventory/v1/offer/INVALID-OFFER/publish',
        'post',
        'sandbox',
        'Offer not found',
        404,
      );

      await expect(
        executeTool(api, 'ebay_publish_offer', { offerId: 'INVALID-OFFER' }),
      ).rejects.toThrow();
    });
  });

  describe('Tool Parameter Validation', () => {
    it('throw error when required fields are missing for ebay_create_offer', async () => {
      await expect(executeTool(api, 'ebay_create_offer', { body: {} })).rejects.toThrow();
    });
  });
});
