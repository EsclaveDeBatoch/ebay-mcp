import { beforeEach, describe, expect, it, vi } from 'vitest';
import { executeTool, getToolDefinitions } from '@/tools/index.js';

import type { EbaySellerApi } from '@/api/index.js';
import type { EbayConfig } from '@/types/ebay.js';

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

    mockApi = {
      setUserTokens: vi.fn(),
      getTokenInfo: vi.fn().mockReturnValue({
        hasUserToken: false,
        hasAppAccessToken: true,
      }),
      hasUserTokens: vi.fn().mockReturnValue(false),
      isAuthenticated: vi.fn().mockReturnValue(true),
      getConfig: vi.fn(() => mockConfig),
      getAuthClient: vi.fn().mockReturnValue({
        get: vi.fn(),
        getConfig: vi.fn(() => mockConfig),
        getOAuthClient: vi.fn().mockReturnValue({
          getUserTokens: vi.fn().mockReturnValue(null),
          getCachedAppAccessToken: vi.fn().mockReturnValue(null),
          getCachedAppAccessTokenExpiry: vi.fn().mockReturnValue(null),
          clearAllTokens: vi.fn(),
        }),
      }),
    } as unknown as EbaySellerApi;
  });

  describe('getToolDefinitions', () => {
    it('returns an empty legacy registry after connector and token-management migration', () => {
      const tools = getToolDefinitions();

      expect(Array.isArray(tools)).toBe(true);
      expect(tools).toEqual([]);
    });

    it('does not keep connector or token-management tools in the legacy registry', () => {
      const tools = getToolDefinitions();
      const toolNames = tools.map((toolDefinition) => toolDefinition.name);

      expect(toolNames).not.toContain('search');
      expect(toolNames).not.toContain('fetch');
      expect(toolNames).not.toContain('ebay_get_oauth_url');
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
