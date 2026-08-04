import { beforeEach, describe, expect, it, vi } from 'vitest';
import { executeTool, getToolDefinitions } from '@/tools/index.js';

import type { EbaySellerApi } from '@/api/index.js';
import type { EbayConfig } from '@/types/ebay.js';

type TextContentToolResult = {
  content: Array<{ text: string }>;
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
    it('return all tool definitions', () => {
      const tools = getToolDefinitions();

      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);

      for (const tool of tools) {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
      }
    });

    it('include remaining legacy connector tools only', () => {
      const tools = getToolDefinitions();
      const toolNames = tools.map((toolDefinition) => toolDefinition.name);

      expect(toolNames).toContain('search');
      expect(toolNames).toContain('fetch');
      expect(toolNames).not.toContain('ebay_get_oauth_url');
    });
  });

  describe('executeTool - ChatGPT Connector Tools', () => {
    it('execute search tool', async () => {
      const inventoryItemCollection = {
        inventoryItems: [
          { sku: 'SKU-1', product: { title: 'Test Product' } },
          { sku: 'SKU-2', product: { title: 'Another Product' } },
        ],
      };
      vi.mocked(mockApi.getAuthClient().get).mockResolvedValue(inventoryItemCollection);

      const result = await executeTool(mockApi, 'search', { query: '', limit: 10 });

      expect(mockApi.getAuthClient().get).toHaveBeenCalledWith(
        '/sell/inventory/v1/inventory_item',
        {
          limit: '10',
          offset: '0',
        },
      );
      expect(result).toHaveProperty('content');
      expect(Array.isArray((result as TextContentToolResult).content)).toBe(true);
    });

    it('execute fetch tool', async () => {
      const inventoryItem = {
        sku: 'TEST-SKU',
        product: {
          title: 'Test Product',
          description: 'Test Description',
          aspects: '{"Brand":["TestBrand"]}',
        },
        condition: 'NEW',
      };
      vi.mocked(mockApi.getAuthClient().get).mockResolvedValue(inventoryItem);

      const result = await executeTool(mockApi, 'fetch', { id: 'TEST-SKU' });

      expect(mockApi.getAuthClient().get).toHaveBeenCalledWith(
        '/sell/inventory/v1/inventory_item/TEST-SKU',
        undefined,
      );
      expect(result).toHaveProperty('content');
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
