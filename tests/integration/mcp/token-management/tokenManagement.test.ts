import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Effect } from 'effect';

import type { EbaySellerApi } from '@/api/index.js';
import type { EbayConfig } from '@/types/ebay.js';
import { callCredentialTool, listCredentialTools } from '@tests/fixtures/mcp.js';

const toolNames = [
  'ebay_get_oauth_url',
  'ebay_set_user_tokens',
  'ebay_set_user_tokens_with_expiry',
  'ebay_get_token_status',
  'ebay_clear_tokens',
  'ebay_validate_token_expiry',
  'ebay_convert_date_to_timestamp',
  'ebay_display_credentials',
  'ebay_refresh_access_token',
  'ebay_exchange_authorization_code',
] as const;

describe('token-management tools through MCP', () => {
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
      initialize: vi.fn().mockReturnValue(Effect.succeed(undefined)),
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
          exchangeCodeForToken: vi.fn().mockReturnValue(
            Effect.succeed({
              access_token: 'access-token-value-123456',
              refresh_token: 'refresh-token-value-123456',
              expires_in: 7200,
              refresh_token_expires_in: 47_304_000,
              token_type: 'User Access Token',
              scope: 'https://api.ebay.com/oauth/api_scope',
            }),
          ),
        }),
      }),
    } as unknown as EbaySellerApi;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('exposes each token-management tool once under static token-management gating', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'token-management');
    vi.stubEnv('EBAY_MCP_UI', 'off');

    const { mcpClient, listedTools } = await listCredentialTools(mockApi);
    const listedNames = listedTools.tools.map((listedTool) => listedTool.name).sort();
    expect(listedNames).toEqual([...toolNames].sort());
    await mcpClient.close();
  });

  it('generates an OAuth URL through the MCP boundary', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { mcpClient, toolCompletion } = await callCredentialTool(mockApi, 'ebay_get_oauth_url', {
      redirectUri: 'https://test.com/callback',
    });

    expect(toolCompletion.isError).not.toBe(true);
    if (!('content' in toolCompletion && Array.isArray(toolCompletion.content))) {
      throw new Error('Expected MCP content blocks');
    }
    const textBlock = toolCompletion.content[0];
    if (textBlock === undefined || textBlock.type !== 'text') {
      throw new Error('Expected a text content block');
    }
    const document = JSON.parse(textBlock.text) as Record<string, unknown>;
    expect(document).toHaveProperty('authorizationUrl');
    expect(document.redirectUri).toBe('https://test.com/callback');
    await mcpClient.close();
  });

  it('returns a credential failure when client ID is missing', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    mockConfig = { ...mockConfig, clientId: '' };

    const { mcpClient, toolCompletion } = await callCredentialTool(
      mockApi,
      'ebay_get_oauth_url',
      {},
    );

    expect(toolCompletion).toMatchObject({ isError: true });
    if (!('content' in toolCompletion && Array.isArray(toolCompletion.content))) {
      throw new Error('Expected MCP content blocks');
    }
    const textBlock = toolCompletion.content[0];
    if (textBlock === undefined || textBlock.type !== 'text') {
      throw new Error('Expected a text content block');
    }
    expect(textBlock.text).toContain('EBAY_CLIENT_ID environment variable is required');
    expect(textBlock.text).toContain('credentialFailure');
    await mcpClient.close();
  });

  it('sets user tokens through the MCP boundary', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { mcpClient, toolCompletion } = await callCredentialTool(
      mockApi,
      'ebay_set_user_tokens',
      {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
      },
    );

    expect(toolCompletion.isError).not.toBe(true);
    expect(mockApi.setUserTokens).toHaveBeenCalledWith('test-access-token', 'test-refresh-token');
    await mcpClient.close();
  });

  it('rejects invalid set-user-tokens arguments before the operation', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { mcpClient, toolCompletion } = await callCredentialTool(
      mockApi,
      'ebay_set_user_tokens',
      {},
    );

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(mockApi.setUserTokens).not.toHaveBeenCalled();
    await mcpClient.close();
  });

  it('returns token status through the MCP boundary', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { mcpClient, toolCompletion } = await callCredentialTool(
      mockApi,
      'ebay_get_token_status',
      {},
    );

    expect(toolCompletion.isError).not.toBe(true);
    if (!('content' in toolCompletion && Array.isArray(toolCompletion.content))) {
      throw new Error('Expected MCP content blocks');
    }
    const textBlock = toolCompletion.content[0];
    if (textBlock === undefined || textBlock.type !== 'text') {
      throw new Error('Expected a text content block');
    }
    const document = JSON.parse(textBlock.text) as Record<string, unknown>;
    expect(document).toHaveProperty('hasUserToken');
    expect(document).toHaveProperty('currentTokenType');
    await mcpClient.close();
  });

  it('clears tokens through the MCP boundary', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const mockClearTokens = vi.fn();
    vi.mocked(mockApi.getAuthClient().getOAuthClient().clearAllTokens).mockImplementation(
      mockClearTokens,
    );

    const { mcpClient, toolCompletion } = await callCredentialTool(
      mockApi,
      'ebay_clear_tokens',
      {},
    );

    expect(toolCompletion.isError).not.toBe(true);
    expect(mockClearTokens).toHaveBeenCalled();
    await mcpClient.close();
  });

  it('converts dates through the MCP boundary', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { mcpClient, toolCompletion } = await callCredentialTool(
      mockApi,
      'ebay_convert_date_to_timestamp',
      { dateInput: '2026-01-15T10:30:00Z' },
    );

    expect(toolCompletion.isError).not.toBe(true);
    if (!('content' in toolCompletion && Array.isArray(toolCompletion.content))) {
      throw new Error('Expected MCP content blocks');
    }
    const textBlock = toolCompletion.content[0];
    if (textBlock === undefined || textBlock.type !== 'text') {
      throw new Error('Expected a text content block');
    }
    const document = JSON.parse(textBlock.text) as Record<string, unknown>;
    expect(document.timestamp).toBe(Date.parse('2026-01-15T10:30:00Z'));
    await mcpClient.close();
  });

  it('exchanges authorization codes through the MCP boundary', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { mcpClient, toolCompletion } = await callCredentialTool(
      mockApi,
      'ebay_exchange_authorization_code',
      { code: 'v%5E1.1%23i%5E1' },
    );

    expect(toolCompletion.isError).not.toBe(true);
    const mockAuthClient = mockApi.getAuthClient().getOAuthClient();
    expect(mockAuthClient.exchangeCodeForToken).toHaveBeenCalledWith('v^1.1#i^1');
    await mcpClient.close();
  });

  it('returns a credential failure when refreshing without user tokens', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    vi.mocked(mockApi.hasUserTokens).mockReturnValue(false);

    const { mcpClient, toolCompletion } = await callCredentialTool(
      mockApi,
      'ebay_refresh_access_token',
      {},
    );

    expect(toolCompletion).toMatchObject({ isError: true });
    if (!('content' in toolCompletion && Array.isArray(toolCompletion.content))) {
      throw new Error('Expected MCP content blocks');
    }
    const textBlock = toolCompletion.content[0];
    if (textBlock === undefined || textBlock.type !== 'text') {
      throw new Error('Expected a text content block');
    }
    expect(textBlock.text).toContain('No user tokens available');
    await mcpClient.close();
  });
});
