import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Effect } from 'effect';

import type { EbaySellerApi } from '@/api/index.js';
import type { EbayConfig } from '@/types/ebay.js';

import {
  clearTokens,
  convertDateToTimestamp,
  convertDateToTimestampArgumentsSchema,
  displayCredentials,
  exchangeAuthorizationCode,
  exchangeAuthorizationCodeArgumentsSchema,
  getOAuthUrl,
  getTokenStatus,
  oauthUrlArgumentsSchema,
  refreshAccessToken,
  setUserTokens,
  setUserTokensArgumentsSchema,
  setUserTokensWithExpiry,
  validateTokenExpiryArgumentsSchema,
  validateTokenExpiryTimes,
} from './tokenManagement.js';

describe('token management operations', () => {
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

    mockApi = {
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
          exchangeCodeForToken: vi.fn(),
        }),
      }),
    } as unknown as EbaySellerApi;
  });

  describe('argument schemas', () => {
    it('accepts oauth url arguments and rejects unknown keys', () => {
      expect(
        oauthUrlArgumentsSchema.parse({
          redirectUri: 'https://test.com/callback',
          scopes: ['https://api.ebay.com/oauth/api_scope'],
        }),
      ).toEqual({
        redirectUri: 'https://test.com/callback',
        scopes: ['https://api.ebay.com/oauth/api_scope'],
      });
      expect(oauthUrlArgumentsSchema.safeParse({ redirectUri: 1 }).success).toBe(false);
      expect(oauthUrlArgumentsSchema.safeParse({ unknown: true }).success).toBe(false);
    });

    it('requires tokens for set user tokens', () => {
      expect(setUserTokensArgumentsSchema.safeParse({}).success).toBe(false);
      expect(
        setUserTokensArgumentsSchema.parse({
          accessToken: 'access',
          refreshToken: 'refresh',
        }),
      ).toEqual({
        accessToken: 'access',
        refreshToken: 'refresh',
      });
    });

    it('requires expiry inputs for validate token expiry', () => {
      expect(validateTokenExpiryArgumentsSchema.safeParse({}).success).toBe(false);
    });

    it('requires a non-empty authorization code', () => {
      expect(exchangeAuthorizationCodeArgumentsSchema.safeParse({}).success).toBe(false);
      expect(exchangeAuthorizationCodeArgumentsSchema.safeParse({ code: '' }).success).toBe(false);
      expect(convertDateToTimestampArgumentsSchema.safeParse({}).success).toBe(false);
    });
  });

  describe('getOAuthUrl', () => {
    it('generates an authorization URL', async () => {
      const completion = await getOAuthUrl(mockApi, {
        redirectUri: 'https://test.com/callback',
      });

      expect(completion.kind).toBe('credentialToolSucceeded');
      if (completion.kind !== 'credentialToolSucceeded') {
        throw new Error('expected success');
      }
      expect(completion.document).toMatchObject({
        redirectUri: 'https://test.com/callback',
        environment: 'sandbox',
      });
      expect(completion.document).toHaveProperty('authorizationUrl');
      expect(completion.document).toHaveProperty('instructions');
    });

    it('rejects when client ID is missing', async () => {
      mockConfig = { ...mockConfig, clientId: '' };
      const completion = await getOAuthUrl(mockApi, {});
      expect(completion).toEqual({
        kind: 'credentialToolFailed',
        failure: {
          kind: 'credentialToolRejected',
          message: 'EBAY_CLIENT_ID environment variable is required to generate OAuth URL',
        },
      });
    });

    it('rejects when redirect URI is missing', async () => {
      mockConfig = { ...mockConfig, redirectUri: undefined };
      const completion = await getOAuthUrl(mockApi, {});
      expect(completion).toEqual({
        kind: 'credentialToolFailed',
        failure: {
          kind: 'credentialToolRejected',
          message:
            'Redirect URI is required. Either provide it as a parameter or set EBAY_REDIRECT_URI in your .env file.',
        },
      });
    });
  });

  describe('setUserTokens', () => {
    it('stores user tokens', async () => {
      vi.mocked(mockApi.setUserTokens).mockReturnValue(Effect.succeed(undefined));
      vi.mocked(mockApi.getTokenInfo).mockReturnValue({
        hasUserToken: true,
        hasAppAccessToken: false,
      });

      const completion = await setUserTokens(mockApi, {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
      });

      expect(mockApi.setUserTokens).toHaveBeenCalledWith('test-access-token', 'test-refresh-token');
      expect(completion.kind).toBe('credentialToolSucceeded');
      if (completion.kind !== 'credentialToolSucceeded') {
        throw new Error('expected success');
      }
      expect(completion.document).toMatchObject({ success: true });
    });
  });

  describe('setUserTokensWithExpiry', () => {
    it('stores tokens and auto-refreshes by default', async () => {
      const completion = await setUserTokensWithExpiry(mockApi, {
        accessToken: 'access',
        refreshToken: 'refresh',
        autoRefresh: true,
      });

      expect(completion.kind).toBe('credentialToolSucceeded');
      if (completion.kind !== 'credentialToolSucceeded') {
        throw new Error('expected success');
      }
      expect(completion.document).toMatchObject({
        success: true,
        refreshed: true,
      });
    });

    it('stores tokens without auto-refresh when disabled', async () => {
      const completion = await setUserTokensWithExpiry(mockApi, {
        accessToken: 'access',
        refreshToken: 'refresh',
        autoRefresh: false,
      });

      expect(completion.kind).toBe('credentialToolSucceeded');
      if (completion.kind !== 'credentialToolSucceeded') {
        throw new Error('expected success');
      }
      expect(completion.document).toMatchObject({
        success: true,
        refreshed: false,
      });
    });
  });

  describe('getTokenStatus', () => {
    it('returns token status fields', async () => {
      const completion = await getTokenStatus(mockApi);
      expect(completion.kind).toBe('credentialToolSucceeded');
      if (completion.kind !== 'credentialToolSucceeded') {
        throw new Error('expected success');
      }
      expect(completion.document).toMatchObject({
        hasUserToken: false,
        hasAppAccessToken: true,
        authenticated: true,
      });
      expect(completion.document).toHaveProperty('currentTokenType');
    });
  });

  describe('clearTokens', () => {
    it('clears all tokens', async () => {
      const mockClearTokens = vi.fn();
      vi.mocked(mockApi.getAuthClient().getOAuthClient().clearAllTokens).mockImplementation(
        mockClearTokens,
      );

      const completion = await clearTokens(mockApi);
      expect(mockClearTokens).toHaveBeenCalled();
      expect(completion.kind).toBe('credentialToolSucceeded');
      if (completion.kind !== 'credentialToolSucceeded') {
        throw new Error('expected success');
      }
      expect(completion.document).toMatchObject({ success: true });
    });
  });

  describe('validateTokenExpiryTimes', () => {
    it('validates future expiry timestamps', async () => {
      const accessExpiryInput = '2099-01-15T10:30:00Z';
      const refreshExpiryInput = '2099-06-15T10:30:00Z';
      const completion = await validateTokenExpiryTimes(mockApi, {
        accessTokenExpiry: accessExpiryInput,
        refreshTokenExpiry: refreshExpiryInput,
      });

      expect(completion.kind).toBe('credentialToolSucceeded');
      if (completion.kind !== 'credentialToolSucceeded') {
        throw new Error('expected success');
      }
      expect(completion.document).toMatchObject({
        accessTokenExpiryTimestamp: Date.parse(accessExpiryInput),
        refreshTokenExpiryTimestamp: Date.parse(refreshExpiryInput),
      });
    });

    it('rejects invalid date input', async () => {
      const completion = await validateTokenExpiryTimes(mockApi, {
        accessTokenExpiry: 'not-a-date',
        refreshTokenExpiry: Date.now(),
      });
      expect(completion.kind).toBe('credentialToolFailed');
      if (completion.kind !== 'credentialToolFailed') {
        throw new Error('expected failure');
      }
      expect(completion.failure.message).toContain('Failed to validate token expiry');
    });
  });

  describe('convertDateToTimestamp', () => {
    it('converts an ISO date string', async () => {
      const completion = await convertDateToTimestamp(mockApi, {
        dateInput: '2026-01-15T10:30:00Z',
      });
      expect(completion.kind).toBe('credentialToolSucceeded');
      if (completion.kind !== 'credentialToolSucceeded') {
        throw new Error('expected success');
      }
      expect(completion.document).toMatchObject({
        success: true,
        timestamp: Date.parse('2026-01-15T10:30:00Z'),
      });
    });

    it('rejects invalid date input', async () => {
      const completion = await convertDateToTimestamp(mockApi, {
        dateInput: 'definitely-not-a-date',
      });
      expect(completion.kind).toBe('credentialToolFailed');
      if (completion.kind !== 'credentialToolFailed') {
        throw new Error('expected failure');
      }
      expect(completion.failure.message).toContain('Failed to convert date');
    });
  });

  describe('displayCredentials', () => {
    it('masks credentials and tokens when present', async () => {
      mockConfig = {
        ...mockConfig,
        clientId: 'test-client-id-123',
        clientSecret: 'test-secret-456',
        redirectUri: 'https://test.com/callback',
        refreshToken: 'test-refresh-token-789',
      };

      const mockAuthClient = mockApi.getAuthClient().getOAuthClient();
      vi.mocked(mockAuthClient.getUserTokens).mockReturnValue({
        userAccessToken: 'test-access-token-abc123',
        userRefreshToken: 'test-refresh-token-def456',
        tokenType: 'User Access Token',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        userAccessTokenExpiry: Date.now() + 3_600_000,
        userRefreshTokenExpiry: Date.now() + 18 * 30 * 24 * 60 * 60 * 1000,
        scope: 'https://api.ebay.com/oauth/api_scope/sell.inventory',
      });
      vi.mocked(mockAuthClient.getCachedAppAccessToken).mockReturnValue('test-app-token-xyz');
      vi.mocked(mockAuthClient.getCachedAppAccessTokenExpiry).mockReturnValue(
        Date.now() + 7_200_000,
      );
      vi.mocked(mockApi.getTokenInfo).mockReturnValue({
        hasUserToken: true,
        hasAppAccessToken: true,
      });

      const completion = await displayCredentials(mockApi);
      expect(completion.kind).toBe('credentialToolSucceeded');
      if (completion.kind !== 'credentialToolSucceeded') {
        throw new Error('expected success');
      }
      expect(completion.document.credentials.clientId).toContain('...');
      expect(completion.document.credentials.clientSecret).toBe('****** (set)');
      expect(completion.document.credentials.environment).toBe('sandbox');
      expect(completion.document.tokens.accessToken).toContain('...');
      expect(completion.document.status.hasUserToken).toBe(true);
      expect(completion.document.scopes).toEqual([
        'https://api.ebay.com/oauth/api_scope/sell.inventory',
      ]);
    });

    it('indicates missing tokens', async () => {
      mockConfig = { ...mockConfig, refreshToken: undefined };
      const mockAuthClient = mockApi.getAuthClient().getOAuthClient();
      vi.mocked(mockAuthClient.getUserTokens).mockReturnValue(null);
      vi.mocked(mockAuthClient.getCachedAppAccessToken).mockReturnValue(null);
      vi.mocked(mockApi.getTokenInfo).mockReturnValue({
        hasUserToken: false,
        hasAppAccessToken: false,
      });

      const completion = await displayCredentials(mockApi);
      expect(completion.kind).toBe('credentialToolSucceeded');
      if (completion.kind !== 'credentialToolSucceeded') {
        throw new Error('expected success');
      }
      expect(completion.document.tokens.refreshToken).toBe('Not set (in .env)');
      expect(completion.document.tokens.accessToken).toBe('Not available');
      expect(completion.document.tokens.appToken).toBe('Not cached');
      expect(completion.document.status.currentTokenType).toBe('none');
    });
  });

  describe('refreshAccessToken', () => {
    it('refreshes when user tokens are present', async () => {
      vi.mocked(mockApi.hasUserTokens).mockReturnValue(true);
      const mockAuthClient = mockApi.getAuthClient().getOAuthClient();
      const mockRefreshToken = vi.fn().mockReturnValue(Effect.succeed(undefined));
      vi.mocked(mockAuthClient.refreshUserToken).mockImplementation(mockRefreshToken);
      vi.mocked(mockAuthClient.getUserTokens).mockReturnValue({
        userAccessToken: 'new-access-token-123456',
        userRefreshToken: 'test-refresh-token-def456',
        tokenType: 'User Access Token',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        userAccessTokenExpiry: Date.now() + 7_200_000,
        userRefreshTokenExpiry: Date.now() + 18 * 30 * 24 * 60 * 60 * 1000,
      });
      vi.mocked(mockApi.getTokenInfo).mockReturnValue({
        hasUserToken: true,
        hasAppAccessToken: false,
      });

      const completion = await refreshAccessToken(mockApi);
      expect(mockRefreshToken).toHaveBeenCalled();
      expect(completion.kind).toBe('credentialToolSucceeded');
      if (completion.kind !== 'credentialToolSucceeded') {
        throw new Error('expected success');
      }
      expect(completion.document).toMatchObject({
        success: true,
        message: 'Access token refreshed successfully',
      });
      expect(String(completion.document.accessToken)).toContain('...');
    });

    it('rejects when user tokens are missing', async () => {
      vi.mocked(mockApi.hasUserTokens).mockReturnValue(false);
      const completion = await refreshAccessToken(mockApi);
      expect(completion.kind).toBe('credentialToolFailed');
      if (completion.kind !== 'credentialToolFailed') {
        throw new Error('expected failure');
      }
      expect(completion.failure.message).toContain('No user tokens available');
    });

    it('maps refresh failures', async () => {
      vi.mocked(mockApi.hasUserTokens).mockReturnValue(true);
      const mockAuthClient = mockApi.getAuthClient().getOAuthClient();
      vi.mocked(mockAuthClient.refreshUserToken).mockReturnValue(
        Effect.fail(new Error('Refresh token expired or invalid')) as never,
      );

      const completion = await refreshAccessToken(mockApi);
      expect(completion.kind).toBe('credentialToolFailed');
      if (completion.kind !== 'credentialToolFailed') {
        throw new Error('expected failure');
      }
      expect(completion.failure.message).toBe(
        'Failed to refresh access token: Refresh token expired or invalid',
      );
    });
  });

  describe('exchangeAuthorizationCode', () => {
    it('exchanges a code for tokens', async () => {
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

      const completion = await exchangeAuthorizationCode(mockApi, {
        code: 'v^1.1#i^1#p^3#r^1#f^0#I^3#t^H4sIAAAAAA',
      });

      expect(mockExchangeCode).toHaveBeenCalledWith('v^1.1#i^1#p^3#r^1#f^0#I^3#t^H4sIAAAAAA');
      expect(completion.kind).toBe('credentialToolSucceeded');
      if (completion.kind !== 'credentialToolSucceeded') {
        throw new Error('expected success');
      }
      expect(completion.document).toMatchObject({ success: true });
      const tokenData = completion.document.tokenData as Record<string, unknown>;
      expect(String(tokenData.accessToken)).toContain('...');
      expect(tokenData.expiresIn).toBe(7200);
    });

    it('URL-decodes authorization codes', async () => {
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

      await exchangeAuthorizationCode(mockApi, {
        code: 'v%5E1.1%23i%5E1%23p%5E3%23r%5E1',
      });
      expect(mockExchangeCode).toHaveBeenCalledWith('v^1.1#i^1#p^3#r^1');
    });

    it('maps exchange failures including non-Error values', async () => {
      const mockAuthClient = mockApi.getAuthClient().getOAuthClient();
      vi.mocked(mockAuthClient).exchangeCodeForToken = vi
        .fn()
        .mockReturnValue(Effect.fail(new Error('Invalid authorization code')));

      const errorCompletion = await exchangeAuthorizationCode(mockApi, {
        code: 'invalid-code',
      });
      expect(errorCompletion.kind).toBe('credentialToolFailed');
      if (errorCompletion.kind !== 'credentialToolFailed') {
        throw new Error('expected failure');
      }
      expect(errorCompletion.failure.message).toBe(
        'Failed to exchange authorization code: Invalid authorization code',
      );

      vi.mocked(mockAuthClient).exchangeCodeForToken = vi
        .fn()
        .mockReturnValue(Effect.fail('String error message'));
      const stringCompletion = await exchangeAuthorizationCode(mockApi, {
        code: 'some-code',
      });
      expect(stringCompletion.kind).toBe('credentialToolFailed');
      if (stringCompletion.kind !== 'credentialToolFailed') {
        throw new Error('expected failure');
      }
      expect(stringCompletion.failure.message).toBe(
        'Failed to exchange authorization code: String error message',
      );
    });
  });
});
