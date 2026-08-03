import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Effect } from 'effect';
import { executeTool, getToolDefinitions } from '@/tools/index.js';

import type { EbaySellerApi } from '@/api/index.js';
import type { EbayConfig } from '@/types/ebay.js';

type TextContentToolResult = {
  content: Array<{ text: string }>;
};

type OAuthUrlToolResult = {
  redirectUri: string;
};

type CredentialDisplayResult = {
  credentials: {
    clientId: string;
    clientSecret: string;
    environment: string;
    redirectUri: string;
  };
  tokens: {
    refreshToken: string;
    accessToken: string;
    appToken: string;
    accessTokenExpiry?: Record<string, unknown>;
  };
  status: {
    hasUserToken?: boolean;
    hasAppAccessToken?: boolean;
    currentTokenType?: string;
  };
  scopes?: string[];
};

type RefreshAccessTokenResult = {
  accessToken: string;
  accessTokenExpiry: Record<string, unknown>;
};

describe('Tools Layer', () => {
  let mockApi: EbaySellerApi;
  let mockConfig: EbayConfig;

  beforeEach(() => {
    mockConfig = {
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      environment: 'sandbox',
      redirectUri: 'https://test.com/callback',
      refreshToken: 'test-refresh-token',
    };

    // Create comprehensive mock API
    mockApi = {
      // Inventory API
      inventory: {
        getInventoryItems: vi.fn(),
        getInventoryItem: vi.fn(),
        createOrReplaceInventoryItem: vi.fn(),
        bulkCreateOrReplaceInventoryItem: vi.fn(),
        bulkGetInventoryItem: vi.fn(),
        bulkUpdatePriceQuantity: vi.fn(),
        getOffers: vi.fn(),
        getOffer: vi.fn(),
        createOffer: vi.fn(),
        updateOffer: vi.fn(),
        deleteOffer: vi.fn(),
        publishOffer: vi.fn(),
        withdrawOffer: vi.fn(),
        bulkCreateOffer: vi.fn(),
        bulkPublishOffer: vi.fn(),
        getListingFees: vi.fn(),
        bulkMigrateListing: vi.fn(),
        publishOfferByInventoryItemGroup: vi.fn(),
        withdrawOfferByInventoryItemGroup: vi.fn(),
      },
      // Marketing API
      marketing: {
        getCampaigns: vi.fn(),
        getCampaign: vi.fn(),
        pauseCampaign: vi.fn(),
        resumeCampaign: vi.fn(),
        endCampaign: vi.fn(),
        updateCampaignIdentification: vi.fn(),
        cloneCampaign: vi.fn(),
        getPromotions: vi.fn(),
      },
      setUserTokens: vi.fn().mockReturnValue(Effect.succeed(undefined)),
      getTokenInfo: vi.fn().mockReturnValue({
        hasUserToken: false,
        hasAppAccessToken: true,
      }),
      hasUserTokens: vi.fn().mockReturnValue(false),
      isAuthenticated: vi.fn().mockReturnValue(true),
      getConfig: vi.fn(() => mockConfig),
      getAuthClient: vi.fn().mockReturnValue({
        getOAuthClient: vi.fn().mockReturnValue({
          getUserTokens: vi.fn().mockReturnValue(null),
          getCachedAppAccessToken: vi.fn().mockReturnValue(null),
          getCachedAppAccessTokenExpiry: vi.fn().mockReturnValue(null),
          clearAllTokens: vi.fn(),
          getAccessToken: vi.fn().mockReturnValue(Effect.succeed('mock-access-token')),
          refreshUserToken: vi.fn().mockReturnValue(Effect.succeed(undefined)),
        }),
      }),
    } as unknown as EbaySellerApi;
  });

  describe('getToolDefinitions', () => {
    it('return all tool definitions', () => {
      const tools = getToolDefinitions();

      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);

      // Check that tools have required properties
      tools.forEach((tool) => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
      });
    });

    it('include all tool categories', () => {
      const tools = getToolDefinitions();
      const toolNames = tools.map((t) => t.name);

      // Check for tools from each category
      expect(toolNames).toContain('ebay_get_oauth_url'); // tokenManagementTools
      expect(toolNames).toContain('ebay_get_inventory_items'); // inventoryTools
      expect(toolNames).toContain('ebay_get_campaigns');
    });
  });

  describe('executeTool - ChatGPT Connector Tools', () => {
    it('execute search tool', async () => {
      const mockResponse = {
        inventoryItems: [
          { product: { title: 'Test Product' } },
          { product: { title: 'Another Product' } },
        ],
      };
      vi.mocked(mockApi.inventory.getInventoryItems).mockReturnValue(Effect.succeed(mockResponse));

      const result = await executeTool(mockApi, 'search', { query: '', limit: 10 });

      expect(mockApi.inventory.getInventoryItems).toHaveBeenCalledWith({ limit: 10, offset: 0 });
      expect(result).toHaveProperty('content');
      expect(Array.isArray((result as TextContentToolResult).content)).toBe(true);
    });

    it('execute fetch tool', async () => {
      const mockItem = {
        product: {
          title: 'Test Product',
          description: 'Test Description',
          aspects: '{"Brand":["TestBrand"]}',
        },
        condition: 'NEW',
      };
      vi.mocked(mockApi.inventory.getInventoryItem).mockReturnValue(Effect.succeed(mockItem));

      const result = await executeTool(mockApi, 'fetch', { id: 'TEST-SKU' });

      expect(mockApi.inventory.getInventoryItem).toHaveBeenCalledWith({ sku: 'TEST-SKU' });
      expect(result).toHaveProperty('content');
    });
  });

  describe('executeTool - OAuth Tools', () => {
    it('generate OAuth URL', async () => {
      const result = await executeTool(mockApi, 'ebay_get_oauth_url', {
        redirectUri: 'https://test.com/callback',
      });

      expect(result).toHaveProperty('authorizationUrl');
      expect(result).toHaveProperty('redirectUri');
      expect(result).toHaveProperty('instructions');
      expect((result as OAuthUrlToolResult).redirectUri).toBe('https://test.com/callback');
    });

    it('throw error when client ID missing', async () => {
      mockConfig = { ...mockConfig, clientId: '' };

      await expect(executeTool(mockApi, 'ebay_get_oauth_url', {})).rejects.toThrow(
        'EBAY_CLIENT_ID environment variable is required',
      );
    });

    it('throw error when redirect URI missing', async () => {
      mockConfig = { ...mockConfig, redirectUri: undefined };

      await expect(executeTool(mockApi, 'ebay_get_oauth_url', {})).rejects.toThrow(
        'Redirect URI is required',
      );
    });

    it('set user tokens', async () => {
      vi.mocked(mockApi.setUserTokens).mockReturnValue(Effect.succeed(undefined));
      vi.mocked(mockApi.getTokenInfo).mockReturnValue({
        hasUserToken: true,
        hasAppAccessToken: false,
      });

      const result = await executeTool(mockApi, 'ebay_set_user_tokens', {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
      });

      expect(mockApi.setUserTokens).toHaveBeenCalledWith('test-access-token', 'test-refresh-token');
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message');
    });

    it('throw error when tokens missing', async () => {
      // Missing required fields are now rejected by input-schema validation.
      await expect(executeTool(mockApi, 'ebay_set_user_tokens', {})).rejects.toThrow();
    });

    it('get token status', async () => {
      const result = await executeTool(mockApi, 'ebay_get_token_status', {});

      expect(result).toHaveProperty('hasUserToken');
      expect(result).toHaveProperty('hasAppAccessToken');
      expect(result).toHaveProperty('authenticated');
      expect(result).toHaveProperty('currentTokenType');
    });

    it('clear tokens', async () => {
      const mockClearTokens = vi.fn();
      vi.mocked(mockApi.getAuthClient().getOAuthClient().clearAllTokens).mockImplementation(
        mockClearTokens,
      );

      const result = await executeTool(mockApi, 'ebay_clear_tokens', {});

      expect(mockClearTokens).toHaveBeenCalled();
      expect(result).toHaveProperty('success', true);
    });

    it('display credentials and token information', async () => {
      mockConfig = {
        ...mockConfig,
        clientId: 'test-client-id-123',
        clientSecret: 'test-secret-456',
        redirectUri: 'https://test.com/callback',
        refreshToken: 'test-refresh-token-789',
      };

      // Mock the OAuth client with internal tokens
      const mockAuthClient = mockApi.getAuthClient().getOAuthClient();
      vi.mocked(mockAuthClient.getUserTokens).mockReturnValue({
        userAccessToken: 'test-access-token-abc123',
        userRefreshToken: 'test-refresh-token-def456',
        tokenType: 'User Access Token',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        userAccessTokenExpiry: Date.now() + 3_600_000, // 1 hour from now
        userRefreshTokenExpiry: Date.now() + 18 * 30 * 24 * 60 * 60 * 1000, // 18 months
        scope: 'https://api.ebay.com/oauth/api_scope/sell.inventory',
      });
      vi.mocked(mockAuthClient.getCachedAppAccessToken).mockReturnValue('test-app-token-xyz');
      vi.mocked(mockAuthClient.getCachedAppAccessTokenExpiry).mockReturnValue(
        Date.now() + 7_200_000,
      ); // 2 hours

      vi.mocked(mockApi.getTokenInfo).mockReturnValue({
        hasUserToken: true,
        hasAppAccessToken: true,
      });

      const result = await executeTool(mockApi, 'ebay_display_credentials', {});

      // Verify result structure
      expect(result).toHaveProperty('credentials');
      expect(result).toHaveProperty('tokens');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('scopes');

      const resultObj = result as CredentialDisplayResult;

      // Check credentials are masked
      expect(resultObj.credentials.clientId).toContain('...');
      expect(resultObj.credentials.clientSecret).toBe('****** (set)');
      expect(resultObj.credentials.environment).toBe('sandbox');
      expect(resultObj.credentials.redirectUri).toBe('https://test.com/callback');

      // Check tokens are masked
      expect(resultObj.tokens.refreshToken).toContain('...');
      expect(resultObj.tokens.accessToken).toContain('...');
      expect(resultObj.tokens.appToken).toContain('...');

      // Check expiry information exists
      expect(resultObj.tokens.accessTokenExpiry).toHaveProperty('timestamp');
      expect(resultObj.tokens.accessTokenExpiry).toHaveProperty('date');
      expect(resultObj.tokens.accessTokenExpiry).toHaveProperty('expired');

      // Check status
      expect(resultObj.status.hasUserToken).toBe(true);
      expect(resultObj.status.hasAppAccessToken).toBe(true);

      // Check scopes
      expect(resultObj.scopes).toEqual(['https://api.ebay.com/oauth/api_scope/sell.inventory']);
    });

    it('display credentials when tokens are not set', async () => {
      mockConfig = { ...mockConfig, refreshToken: undefined };

      // Mock the OAuth client with no tokens
      const mockAuthClient = mockApi.getAuthClient().getOAuthClient();
      vi.mocked(mockAuthClient.getUserTokens).mockReturnValue(null);
      vi.mocked(mockAuthClient.getCachedAppAccessToken).mockReturnValue(null);

      vi.mocked(mockApi.getTokenInfo).mockReturnValue({
        hasUserToken: false,
        hasAppAccessToken: false,
      });

      const result = await executeTool(mockApi, 'ebay_display_credentials', {});

      const resultObj = result as CredentialDisplayResult;

      // Check that missing tokens are indicated
      expect(resultObj.tokens.refreshToken).toBe('Not set (in .env)');
      expect(resultObj.tokens.accessToken).toBe('Not available');
      expect(resultObj.tokens.appToken).toBe('Not cached');
      expect(resultObj.status.currentTokenType).toBe('none');
    });

    it('refresh access token successfully', async () => {
      // Mock that user tokens exist
      vi.mocked(mockApi.hasUserTokens).mockReturnValue(true);

      const mockAuthClient = mockApi.getAuthClient().getOAuthClient();
      const mockRefreshToken = vi.fn().mockReturnValue(Effect.succeed(undefined));
      vi.mocked(mockAuthClient.refreshUserToken).mockImplementation(mockRefreshToken);

      // Set up post-refresh token state
      vi.mocked(mockAuthClient.getUserTokens).mockReturnValue({
        userAccessToken: 'new-access-token-123456',
        userRefreshToken: 'test-refresh-token-def456',
        tokenType: 'User Access Token',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        userAccessTokenExpiry: Date.now() + 7_200_000, // 2 hours
        userRefreshTokenExpiry: Date.now() + 18 * 30 * 24 * 60 * 60 * 1000,
      });

      vi.mocked(mockApi.getTokenInfo).mockReturnValue({
        hasUserToken: true,
        hasAppAccessToken: false,
      });

      const result = await executeTool(mockApi, 'ebay_refresh_access_token', {});

      // Verify refresh was called
      expect(mockRefreshToken).toHaveBeenCalled();

      // Verify result structure
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message', 'Access token refreshed successfully');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('accessTokenExpiry');
      expect(result).toHaveProperty('tokenInfo');

      const resultObj = result as RefreshAccessTokenResult;

      // Check token is masked
      expect(resultObj.accessToken).toContain('...');

      // Check expiry info
      expect(resultObj.accessTokenExpiry).toHaveProperty('timestamp');
      expect(resultObj.accessTokenExpiry).toHaveProperty('date');
      expect(resultObj.accessTokenExpiry).toHaveProperty('expiresInSeconds');
    });

    it('throw error when refreshing without user tokens', async () => {
      vi.mocked(mockApi.hasUserTokens).mockReturnValue(false);

      await expect(executeTool(mockApi, 'ebay_refresh_access_token', {})).rejects.toThrow(
        'No user tokens available',
      );
    });

    it('handle refresh token errors', async () => {
      vi.mocked(mockApi.hasUserTokens).mockReturnValue(true);

      const mockAuthClient = mockApi.getAuthClient().getOAuthClient();
      const mockRefreshToken = vi
        .fn()
        .mockReturnValue(Effect.fail(new Error('Refresh token expired or invalid')));
      vi.mocked(mockAuthClient.refreshUserToken).mockImplementation(mockRefreshToken);

      await expect(executeTool(mockApi, 'ebay_refresh_access_token', {})).rejects.toThrow(
        'Failed to refresh access token: Refresh token expired or invalid',
      );
    });

    it('exchange authorization code for tokens successfully', async () => {
      const mockTokenData = {
        access_token: 'v^1.1#i^1#p^3#r^1#I^3#f^0#t^Ul4xMF8xOkFBQUFBQUFBQUFBPT0',
        refresh_token: 'v^1.1#i^1#p^3#r^1#I^3#f^0#t^Ul4xMF8xOkFBQUFBQUFBQUFBPT0=REFRESH',
        expires_in: 7200,
        refresh_token_expires_in: 47_304_000,
        token_type: 'User Access Token',
        scope: 'https://api.ebay.com/oauth/api_scope/sell.inventory',
      };

      const mockExchangeCode = vi.fn().mockReturnValue(Effect.succeed(mockTokenData));
      const mockAuthClient = mockApi.getAuthClient().getOAuthClient();
      vi.mocked(mockAuthClient).exchangeCodeForToken = mockExchangeCode;

      const result = await executeTool(mockApi, 'ebay_exchange_authorization_code', {
        code: 'v^1.1#i^1#p^3#r^1#f^0#I^3#t^H4sIAAAAAA',
      });

      expect(mockExchangeCode).toHaveBeenCalledWith('v^1.1#i^1#p^3#r^1#f^0#I^3#t^H4sIAAAAAA');
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('tokenData');
      expect(result).toHaveProperty('note');

      const resultObj = result as Record<string, unknown>;
      const tokenData = resultObj.tokenData as Record<string, unknown>;
      expect(tokenData.accessToken).toContain('...');
      expect(tokenData.refreshToken).toContain('...');
      expect(tokenData.expiresIn).toBe(7200);
      expect(tokenData.refreshTokenExpiresIn).toBe(47_304_000);
      expect(tokenData.tokenType).toBe('User Access Token');
    });

    it('throw error when authorization code is missing', async () => {
      // A missing or empty code is now rejected by input-schema validation.
      await expect(executeTool(mockApi, 'ebay_exchange_authorization_code', {})).rejects.toThrow();

      await expect(
        executeTool(mockApi, 'ebay_exchange_authorization_code', { code: '' }),
      ).rejects.toThrow();
    });

    it('URL-decode authorization code when it contains encoded characters', async () => {
      const mockTokenData = {
        access_token: 'v^1.1#i^1#p^3#r^1#I^3#f^0#t^Ul4xMF8xOkFBQUFBQUFBQUFBPT0',
        refresh_token: 'v^1.1#i^1#p^3#r^1#I^3#f^0#t^Ul4xMF8xOkFBQUFBQUFBQUFBPT0=REFRESH',
        expires_in: 7200,
        refresh_token_expires_in: 47_304_000,
        token_type: 'User Access Token',
        scope: 'https://api.ebay.com/oauth/api_scope/sell.inventory',
      };

      const mockExchangeCode = vi.fn().mockReturnValue(Effect.succeed(mockTokenData));
      const mockAuthClient = mockApi.getAuthClient().getOAuthClient();
      vi.mocked(mockAuthClient).exchangeCodeForToken = mockExchangeCode;

      // URL-encoded code (contains %5E for ^)
      const urlEncodedCode = 'v%5E1.1%23i%5E1%23p%5E3%23r%5E1';
      const decodedCode = 'v^1.1#i^1#p^3#r^1';

      await executeTool(mockApi, 'ebay_exchange_authorization_code', {
        code: urlEncodedCode,
      });

      // Should be called with decoded code
      expect(mockExchangeCode).toHaveBeenCalledWith(decodedCode);
    });

    it('handle exchange code errors', async () => {
      const mockExchangeCode = vi
        .fn()
        .mockReturnValue(Effect.fail(new Error('Invalid authorization code')));
      const mockAuthClient = mockApi.getAuthClient().getOAuthClient();
      vi.mocked(mockAuthClient).exchangeCodeForToken = mockExchangeCode;

      await expect(
        executeTool(mockApi, 'ebay_exchange_authorization_code', {
          code: 'invalid-code',
        }),
      ).rejects.toThrow('Failed to exchange authorization code: Invalid authorization code');
    });

    it('handle non-Error objects in exchange code errors', async () => {
      const mockExchangeCode = vi.fn().mockReturnValue(Effect.fail('String error message'));
      const mockAuthClient = mockApi.getAuthClient().getOAuthClient();
      vi.mocked(mockAuthClient).exchangeCodeForToken = mockExchangeCode;

      await expect(
        executeTool(mockApi, 'ebay_exchange_authorization_code', {
          code: 'some-code',
        }),
      ).rejects.toThrow('Failed to exchange authorization code: String error message');
    });
  });

  describe('executeTool - Inventory Management', () => {
    it('get inventory items', async () => {
      const mockResponse = { inventoryItems: [] };
      const input = {
        limit: 10,
        offset: 5,
      };
      vi.mocked(mockApi.inventory.getInventoryItems).mockReturnValue(Effect.succeed(mockResponse));

      const result = await executeTool(mockApi, 'ebay_get_inventory_items', input);

      expect(mockApi.inventory.getInventoryItems).toHaveBeenCalledWith(input);
      expect(result).toBe(mockResponse);
    });

    it('get inventory item', async () => {
      const mockItem = { sku: 'TEST-SKU' };
      const input = {
        sku: 'TEST-SKU',
      };
      vi.mocked(mockApi.inventory.getInventoryItem).mockReturnValue(Effect.succeed(mockItem));

      const result = await executeTool(mockApi, 'ebay_get_inventory_item', input);

      expect(mockApi.inventory.getInventoryItem).toHaveBeenCalledWith(input);
      expect(result).toBe(mockItem);
    });

    it('create inventory item', async () => {
      const input = {
        sku: 'TEST-SKU',
        body: { product: { title: 'Test' } },
      };
      vi.mocked(mockApi.inventory.createOrReplaceInventoryItem).mockReturnValue(Effect.succeed({}));

      await executeTool(mockApi, 'ebay_create_or_replace_inventory_item', input);

      expect(mockApi.inventory.createOrReplaceInventoryItem).toHaveBeenCalledWith(input);
    });

    it('publish offer', async () => {
      const mockResponse = { listingId: 'LISTING123' };
      const input = {
        offerId: 'OFFER123',
      };
      vi.mocked(mockApi.inventory.publishOffer).mockReturnValue(Effect.succeed(mockResponse));

      const result = await executeTool(mockApi, 'ebay_publish_offer', input);

      expect(mockApi.inventory.publishOffer).toHaveBeenCalledWith(input);
      expect(result).toBe(mockResponse);
    });
  });

  describe('executeTool - Marketing', () => {
    it('get campaigns', async () => {
      const mockResponse = { campaigns: [] };
      vi.mocked(mockApi.marketing.getCampaigns).mockReturnValue(Effect.succeed(mockResponse));
      const input = {
        campaignStatus: 'RUNNING',
        limit: 10,
      };

      const result = await executeTool(mockApi, 'ebay_get_campaigns', input);

      expect(mockApi.marketing.getCampaigns).toHaveBeenCalledWith(input);
      expect(result).toBe(mockResponse);
    });

    it('pause campaign', async () => {
      vi.mocked(mockApi.marketing.pauseCampaign).mockReturnValue(Effect.succeed(undefined));

      const input = {
        campaignId: 'CAMP123',
      };
      await executeTool(mockApi, 'ebay_pause_campaign', input);

      expect(mockApi.marketing.pauseCampaign).toHaveBeenCalledWith(input);
    });

    it('clone campaign', async () => {
      const request = { campaignName: 'Cloned Campaign' };
      vi.mocked(mockApi.marketing.cloneCampaign).mockReturnValue(Effect.succeed({}));

      const input = {
        campaignId: 'CAMP123',
        request,
      };
      await executeTool(mockApi, 'ebay_clone_campaign', input);

      expect(mockApi.marketing.cloneCampaign).toHaveBeenCalledWith(input);
    });
  });

  describe('executeTool - Error Handling', () => {
    it('throw error for unknown tool', async () => {
      await expect(executeTool(mockApi, 'unknown_tool', {})).rejects.toThrow(
        'Unknown tool: unknown_tool',
      );
    });
  });
});
