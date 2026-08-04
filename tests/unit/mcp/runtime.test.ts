import { describe, expect, it, vi } from 'vitest';
import { Effect } from 'effect';
import { getToolDefinitions } from '@/tools/index.js';
import { ebayToolCatalogue } from '@/mcp/ebayToolCatalogue.js';
import { sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

const mcpMock = vi.hoisted(() => ({
  close: vi.fn(),
  connect: vi.fn(),
  constructor: vi.fn(),
  registerTool: vi.fn(() => ({ update: vi.fn() })),
  registerResource: vi.fn(),
  getClientCapabilities: vi.fn(() => ({})),
}));

vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => ({
  McpServer: vi.fn(function (this: unknown, config) {
    mcpMock.constructor(config);
    // Mirror the McpServer surface the UI bridge touches: `registerResource` for
    // `ui://` views and the underlying `.server` for the capability gate.
    return {
      close: mcpMock.close,
      connect: mcpMock.connect,
      registerTool: mcpMock.registerTool,
      registerResource: mcpMock.registerResource,
      server: {
        oninitialized: undefined,
        getClientCapabilities: mcpMock.getClientCapabilities,
      },
    };
  }),
}));

describe('MCP runtime', () => {
  it('registers the shared tool registry on server construction', async () => {
    const { createEbayMcpRuntime } = await import('@/mcp/runtime.js');
    const fakeEbaySellerApi = {
      initialize: vi.fn(() => Effect.succeed(undefined)),
    };
    const { sellerSession } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    const runtime = createEbayMcpRuntime({
      ebaySellerApi: fakeEbaySellerApi as never,
      sellerSession,
      serverConfig: { name: 'test-mcp', version: '0.0.0' },
    });

    expect(runtime.ebaySellerApi).toBe(fakeEbaySellerApi);
    expect(mcpMock.constructor).toHaveBeenCalledWith({ name: 'test-mcp', version: '0.0.0' });
    expect(mcpMock.registerTool).toHaveBeenCalledTimes(
      getToolDefinitions().length + ebayToolCatalogue.length,
    );

    await runtime.initializeEbaySellerApi();
    expect(fakeEbaySellerApi.initialize).toHaveBeenCalledOnce();
  });
});
