import { describe, expect, it } from 'vitest';
import {
  getToolGatingConfigError,
  parseToolGatingMode,
  EBAY_TOOL_EXPOSURE_PATHS,
} from '@/config/toolExposure.js';
import { toolCategories } from '@/tools/categories/index.js';

describe('toolExposure', () => {
  describe('EBAY_TOOL_EXPOSURE_PATHS', () => {
    it('contains legacy categories and migrated official exposure paths', () => {
      expect([...EBAY_TOOL_EXPOSURE_PATHS]).toEqual([
        ...toolCategories.map((category) => category.key),
        'trading',
        'commerce.feedback',
        'commerce.identity',
        'commerce.message',
        'commerce.notification',
        'commerce.taxonomy',
        'commerce.translation',
        'commerce.vero',
        'developer.analytics',
        'developer.key-management',
        'developer.status',
        'sell.account',
        'sell.analytics',
        'sell.edelivery',
        'sell.fulfillment',
        'sell.inventory',
        'sell.metadata',
        'sell.negotiation',
        'sell.recommendation',
      ]);
    });
  });

  describe('parseToolGatingMode', () => {
    it('defaults to "all" when unset', () => {
      expect(parseToolGatingMode({})).toEqual({ kind: 'all' });
    });

    it('treats "all" (any case) as all', () => {
      expect(parseToolGatingMode({ EBAY_MCP_TOOLS: 'ALL' })).toEqual({ kind: 'all' });
    });

    it('parses "dynamic"', () => {
      expect(parseToolGatingMode({ EBAY_MCP_TOOLS: 'dynamic' })).toEqual({ kind: 'dynamic' });
    });

    it('parses a comma list into trimmed, lowercased exposure paths', () => {
      expect(parseToolGatingMode({ EBAY_MCP_TOOLS: ' Inventory , sell.fulfillment ' })).toEqual({
        kind: 'static',
        exposurePaths: ['inventory', 'sell.fulfillment'],
      });
    });
  });

  describe('getToolGatingConfigError', () => {
    it('accepts unset, all, and dynamic', () => {
      expect(getToolGatingConfigError({})).toBeUndefined();
      expect(getToolGatingConfigError({ EBAY_MCP_TOOLS: 'all' })).toBeUndefined();
      expect(getToolGatingConfigError({ EBAY_MCP_TOOLS: 'dynamic' })).toBeUndefined();
    });

    it('accepts valid legacy and official exposure paths', () => {
      expect(
        getToolGatingConfigError({ EBAY_MCP_TOOLS: 'inventory,sell.fulfillment' }),
      ).toBeUndefined();
      expect(getToolGatingConfigError({ EBAY_MCP_TOOLS: 'commerce.feedback' })).toBeUndefined();
      expect(getToolGatingConfigError({ EBAY_MCP_TOOLS: 'commerce.identity' })).toBeUndefined();
      expect(getToolGatingConfigError({ EBAY_MCP_TOOLS: 'commerce.message' })).toBeUndefined();
      expect(getToolGatingConfigError({ EBAY_MCP_TOOLS: 'commerce.notification' })).toBeUndefined();
      expect(getToolGatingConfigError({ EBAY_MCP_TOOLS: 'commerce.translation' })).toBeUndefined();
      expect(getToolGatingConfigError({ EBAY_MCP_TOOLS: 'commerce.vero' })).toBeUndefined();
      expect(getToolGatingConfigError({ EBAY_MCP_TOOLS: 'developer.analytics' })).toBeUndefined();
      expect(
        getToolGatingConfigError({ EBAY_MCP_TOOLS: 'developer.key-management' }),
      ).toBeUndefined();
      expect(getToolGatingConfigError({ EBAY_MCP_TOOLS: 'developer.status' })).toBeUndefined();
      expect(getToolGatingConfigError({ EBAY_MCP_TOOLS: 'sell.account' })).toBeUndefined();
      expect(getToolGatingConfigError({ EBAY_MCP_TOOLS: 'sell.analytics' })).toBeUndefined();
      expect(getToolGatingConfigError({ EBAY_MCP_TOOLS: 'sell.edelivery' })).toBeUndefined();
      expect(getToolGatingConfigError({ EBAY_MCP_TOOLS: 'sell.inventory' })).toBeUndefined();
      expect(getToolGatingConfigError({ EBAY_MCP_TOOLS: 'sell.metadata' })).toBeUndefined();
      expect(getToolGatingConfigError({ EBAY_MCP_TOOLS: 'sell.negotiation' })).toBeUndefined();
      expect(getToolGatingConfigError({ EBAY_MCP_TOOLS: 'sell.recommendation' })).toBeUndefined();
    });

    it('rejects an unknown exposure path and lists the valid ones', () => {
      const gatingFailure = getToolGatingConfigError({
        EBAY_MCP_TOOLS: 'inventroy,sell.fulfillment',
      });
      expect(gatingFailure).toContain('inventroy');
      expect(gatingFailure).toContain('Valid paths');
      expect(gatingFailure).toContain('inventory');
    });

    it('rejects the removed account compatibility path', () => {
      const gatingFailure = getToolGatingConfigError({ EBAY_MCP_TOOLS: 'account' });

      expect(gatingFailure).toContain('account');
      expect(gatingFailure).toContain('sell.account');
    });

    it('rejects a value that contains no exposure paths', () => {
      expect(getToolGatingConfigError({ EBAY_MCP_TOOLS: ' , , ' })).toContain('no exposure paths');
    });
  });
});
